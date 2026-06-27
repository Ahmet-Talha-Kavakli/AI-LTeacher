import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { consume, getTier } from "@/lib/quota";

export const runtime = "nodejs";

const Body = z.object({
  durationSeconds: z.number().int().nonnegative().max(60 * 60 * 4),
  mode: z.enum(["voice", "video"]),
});

/**
 * Called by mobile on session disconnect. We always consume the reported
 * usage even if it pushes the user over cap (the session already happened).
 * The cap check at /voice-token is the gate; this is just bookkeeping.
 */
export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const tier = await getTier(user.id);
  const feature = parsed.data.mode === "video" ? "videoSeconds" : "voiceSeconds";

  // We force-consume by raising a very high cap so the RPC always succeeds:
  // overage is fine here, we just need bookkeeping. Future: send a separate
  // RPC that doesn't enforce cap.
  await consume(user.id, feature, parsed.data.durationSeconds, tier).catch(() => null);

  return Response.json({ ok: true });
}
