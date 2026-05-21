import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { checkLimit } from "@/lib/rate-limit";
import { consume, getTier, quotaExceededResponse } from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  prompt: z.string().min(3).max(500),
  style: z.enum(["pixar", "watercolor", "flat", "photoreal"]).default("pixar"),
});

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const burst = await checkLimit("image_gen", user.id, 10, 60);
  if (!burst.success) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  const tier = await getTier(user.id);
  const quota = await consume(user.id, "imageGenerations", 1, tier);
  if (!quota.ok) return quotaExceededResponse(quota.tier, quota.feature, quota.cap);

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) return Response.json({ error: "fal_not_configured" }, { status: 501 });

  const stylePrefix: Record<string, string> = {
    pixar: "pixar style, 3d render, soft lighting, cinematic, vibrant colors",
    watercolor: "watercolor illustration, soft, hand-painted",
    flat: "flat vector illustration, minimalist, geometric",
    photoreal: "photorealistic, high detail, studio lighting",
  };

  const res = await fetch("https://fal.run/fal-ai/flux-pro/v1.1", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: `${stylePrefix[parsed.data.style]}, ${parsed.data.prompt}`,
      image_size: "square_hd",
      num_images: 1,
    }),
  });

  if (!res.ok) {
    return Response.json({ error: "fal_failed", status: res.status }, { status: 502 });
  }

  const data = (await res.json()) as { images?: Array<{ url: string }> };
  const url = data.images?.[0]?.url;
  if (!url) return Response.json({ error: "no_image" }, { status: 502 });

  return Response.json({ url });
}
