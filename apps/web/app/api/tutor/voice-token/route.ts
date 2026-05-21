import { NextRequest } from "next/server";
import { VoiceSessionTokenRequest, type VoiceSessionTokenResponse, QUOTAS } from "@ailt/shared";
import { requireUser } from "@/lib/auth";
import { checkLimit } from "@/lib/rate-limit";
import { AGENT_IDS, getSignedConversationUrl } from "@/lib/elevenlabs";
import { getQuotaStatus, quotaExceededResponse } from "@/lib/quota";

export const runtime = "nodejs";
export const maxDuration = 30;

const MIN_REQUIRED_SECONDS = 30; // refuse a session if user has under 30s left

export async function POST(req: NextRequest) {
  const user = await requireUser(req);
  if (user instanceof Response) return user;

  const burst = await checkLimit("voice_token", user.id, 20, 60);
  if (!burst.success) {
    return Response.json({ error: "rate_limited" }, { status: 429 });
  }

  // Voice consumption is reported by the mobile client at session end via
  // /api/tutor/voice-end. Here we just gate by remaining budget so abusers
  // can't open sessions when they're already out.
  const status = await getQuotaStatus(user.id);
  const remaining = QUOTAS[status.tier].voiceSeconds - status.usage.voiceSeconds;
  if (remaining < MIN_REQUIRED_SECONDS) {
    return quotaExceededResponse(status.tier, "voiceSeconds", QUOTAS[status.tier].voiceSeconds);
  }

  const parsed = VoiceSessionTokenRequest.safeParse(await req.json());
  if (!parsed.success) {
    return Response.json({ error: "bad_request", details: parsed.error.format() }, { status: 400 });
  }

  const { language } = parsed.data;
  const agentId = AGENT_IDS[language];
  if (!agentId) {
    return Response.json({ error: "agent_not_configured", language }, { status: 501 });
  }

  try {
    const signedUrl = await getSignedConversationUrl(agentId);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const payload: VoiceSessionTokenResponse & { remainingSeconds: number } = {
      signedUrl,
      expiresAt,
      agentId,
      remainingSeconds: remaining,
    };
    return Response.json(payload);
  } catch (err) {
    console.error("voice token error", err);
    return Response.json({ error: "elevenlabs_failed" }, { status: 502 });
  }
}
