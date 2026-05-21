import { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const { id } = await ctx.params;
  const apiKey = process.env.MESHY_API_KEY;
  if (!apiKey) return Response.json({ error: "meshy_not_configured" }, { status: 501 });

  const res = await fetch(`https://api.meshy.ai/openapi/v2/text-to-3d/${id}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  if (!res.ok) {
    return Response.json({ error: "meshy_failed" }, { status: 502 });
  }

  return Response.json(await res.json());
}
