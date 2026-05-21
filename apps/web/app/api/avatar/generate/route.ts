import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { consume, getTier, quotaExceededResponse } from "@/lib/quota";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

const Body = z.object({
  prompt: z.string().min(3).max(500),
  artStyle: z.enum(["pixar", "stylized", "anime"]).default("pixar"),
});

/**
 * Pro-tier only. Kicks off a Meshy text-to-3d preview task. Most users
 * should pick from /api/avatar/pool — this is the "create your own"
 * upsell. Capped via customAvatarGenerations quota.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const tier = await getTier(user.id);
  const quota = await consume(user.id, "customAvatarGenerations", 1, tier);
  if (!quota.ok) return quotaExceededResponse(quota.tier, quota.feature, quota.cap);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) return Response.json({ error: "meshy_not_configured" }, { status: 501 });

  const res = await fetch("https://api.meshy.ai/openapi/v2/text-to-3d", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "preview",
      prompt: parsed.data.prompt,
      art_style: parsed.data.artStyle === "pixar" ? "realistic" : parsed.data.artStyle,
      negative_prompt: "low quality, low poly, ugly",
    }),
  });

  if (!res.ok) {
    return Response.json({ error: "meshy_failed", status: res.status }, { status: 502 });
  }

  const data = (await res.json()) as { result: string };

  await supabaseAdmin().from("user_avatars").insert({
    user_id: user.id,
    meshy_task_id: data.result,
    status: "pending",
    prompt: parsed.data.prompt,
  });

  return Response.json({ taskId: data.result });
}
