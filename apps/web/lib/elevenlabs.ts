import type { AccentCode, LanguageCode } from "@ailt/shared";

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

// Per-accent voice id mapping. Replace with curated ElevenLabs voice ids in production.
// The mobile app never sees the API key — it gets a signed conversation URL instead.
export const ACCENT_VOICE_IDS: Record<AccentCode, string | undefined> = {
  "en-US": process.env.ELEVENLABS_VOICE_EN_US,
  "en-GB": process.env.ELEVENLABS_VOICE_EN_GB,
  "en-SCT": process.env.ELEVENLABS_VOICE_EN_SCT,
  "en-AU": process.env.ELEVENLABS_VOICE_EN_AU,
  "es-ES": process.env.ELEVENLABS_VOICE_ES_ES,
  "es-MX": process.env.ELEVENLABS_VOICE_ES_MX,
  "de-DE": process.env.ELEVENLABS_VOICE_DE_DE,
  "de-AT": process.env.ELEVENLABS_VOICE_DE_AT,
};

export const AGENT_IDS: Partial<Record<LanguageCode, string>> = {
  en: process.env.ELEVENLABS_AGENT_EN,
  es: process.env.ELEVENLABS_AGENT_ES,
  de: process.env.ELEVENLABS_AGENT_DE,
};

/**
 * Mint a short-lived signed URL that lets the mobile client connect to an
 * ElevenLabs Conversational AI agent without ever seeing the API key.
 */
export async function getSignedConversationUrl(agentId: string): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY missing");

  const res = await fetch(
    `${ELEVENLABS_API}/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey } },
  );

  if (!res.ok) {
    throw new Error(`elevenlabs sign url failed: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { signed_url: string };
  return data.signed_url;
}
