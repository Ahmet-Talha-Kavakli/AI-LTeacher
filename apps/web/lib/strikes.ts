import { supabaseAdmin } from "./supabase/admin";
import type { ModerationResult } from "./moderation";

// Cooldown durations in seconds, indexed by cooldown_level.
// Level 0: first cooldown ever. Each subsequent cooldown lengthens.
// Capped at level 4 (24h); higher levels flag for manual review but stay at 24h.
const COOLDOWN_DURATIONS_SEC = [
  15 * 60,        // 15 min
  60 * 60,        // 1 hour
  6 * 60 * 60,    // 6 hours
  24 * 60 * 60,   // 24 hours
  24 * 60 * 60,   // cap
];

const STRIKES_PER_COOLDOWN = 3;
// Days of clean behavior before strike + cooldown_level reset to 0.
const SELF_HEAL_DAYS = 7;

type StrikeState = {
  strikeCount: number;
  cooldownLevel: number;
  cooldownUntil: Date | null;
  lastStrikeAt: Date | null;
};

export type ChatGate =
  | { allowed: true }
  | { allowed: false; reason: "cooldown"; cooldownUntil: Date };

export type StrikeOutcome =
  | { type: "warn"; strikeCount: number; category: string; score: number }
  | { type: "cooldown"; cooldownUntil: Date; category: string; score: number };

async function loadState(userId: string): Promise<StrikeState> {
  const { data } = await supabaseAdmin()
    .from("profiles")
    .select("strike_count, cooldown_level, cooldown_until, last_strike_at")
    .eq("id", userId)
    .single();

  return {
    strikeCount: data?.strike_count ?? 0,
    cooldownLevel: data?.cooldown_level ?? 0,
    cooldownUntil: data?.cooldown_until ? new Date(data.cooldown_until) : null,
    lastStrikeAt: data?.last_strike_at ? new Date(data.last_strike_at) : null,
  };
}

/**
 * Gate check before allowing a chat message. Self-heals expired cooldowns
 * and old strikes (≥7d clean → reset). Call BEFORE moderation.
 */
export async function checkChatGate(userId: string): Promise<ChatGate> {
  const state = await loadState(userId);
  const now = new Date();

  // Active cooldown?
  if (state.cooldownUntil && state.cooldownUntil > now) {
    return { allowed: false, reason: "cooldown", cooldownUntil: state.cooldownUntil };
  }

  // Cooldown expired but DB hasn't been cleared yet — clear it and start fresh.
  if (state.cooldownUntil && state.cooldownUntil <= now) {
    await supabaseAdmin()
      .from("profiles")
      .update({ cooldown_until: null, strike_count: 0 })
      .eq("id", userId);
  }

  // 7-day self-healing — reset strike count and cooldown level after a
  // sustained clean period. Avoids punishing users for an old bad day.
  if (state.lastStrikeAt) {
    const daysSince = (now.getTime() - state.lastStrikeAt.getTime()) / 86_400_000;
    if (daysSince >= SELF_HEAL_DAYS && (state.strikeCount > 0 || state.cooldownLevel > 0)) {
      await supabaseAdmin()
        .from("profiles")
        .update({ strike_count: 0, cooldown_level: 0 })
        .eq("id", userId);
    }
  }

  return { allowed: true };
}

/**
 * Record a moderation hit. Increments strike count, escalates to cooldown
 * on the 3rd strike. Returns what happened so the caller can craft the
 * response.
 */
export async function recordStrike(
  userId: string,
  result: ModerationResult,
  messageSnippet: string,
): Promise<StrikeOutcome> {
  if (!result.triggered) throw new Error("recordStrike called without triggered category");

  const state = await loadState(userId);
  const now = new Date();
  const nextStrikeCount = state.strikeCount + 1;
  const triggeredCooldown = nextStrikeCount >= STRIKES_PER_COOLDOWN;

  let cooldownUntil: Date | null = null;
  let nextCooldownLevel = state.cooldownLevel;
  let nextStrikeCountToStore = nextStrikeCount;

  if (triggeredCooldown) {
    const durationSec = COOLDOWN_DURATIONS_SEC[Math.min(state.cooldownLevel, COOLDOWN_DURATIONS_SEC.length - 1)];
    cooldownUntil = new Date(now.getTime() + durationSec * 1000);
    nextCooldownLevel = Math.min(state.cooldownLevel + 1, COOLDOWN_DURATIONS_SEC.length - 1);
    nextStrikeCountToStore = 0; // Reset strike count once cooldown triggers
  }

  await supabaseAdmin()
    .from("profiles")
    .update({
      strike_count: nextStrikeCountToStore,
      cooldown_level: nextCooldownLevel,
      cooldown_until: cooldownUntil?.toISOString() ?? null,
      last_strike_at: now.toISOString(),
    })
    .eq("id", userId);

  await supabaseAdmin().from("moderation_events").insert({
    user_id: userId,
    message_snippet: messageSnippet.slice(0, 200),
    category_scores: result.scores,
    triggered_category: result.triggered.category,
    triggered_score: result.triggered.score,
    action: triggeredCooldown ? "cooldown" : "warn",
    strike_at_time: nextStrikeCount,
    cooldown_until: cooldownUntil?.toISOString() ?? null,
  });

  if (triggeredCooldown) {
    return { type: "cooldown", cooldownUntil: cooldownUntil!, category: result.triggered.category, score: result.triggered.score };
  }
  return { type: "warn", strikeCount: nextStrikeCount, category: result.triggered.category, score: result.triggered.score };
}

// Pre-canned final messages per language. Sent when 3rd strike triggers
// the cooldown — no LLM call (saves cost when user is misbehaving) and
// guaranteed deterministic wording.
export const COOLDOWN_MESSAGES: Record<string, string> = {
  en: "I'm ending our session here. Take a break and come back later — I'll be ready when you are.",
  es: "Voy a terminar nuestra sesión aquí. Tómate un descanso y vuelve más tarde — estaré listo cuando tú lo estés.",
  de: "Ich beende unsere Sitzung an dieser Stelle. Mach eine Pause und komm später wieder — ich bin bereit, wenn du es bist.",
};

// Instruction added to system prompt when the user has been warned but not
// yet cooled down. Tone escalates: 1 → playful, 2 → firm.
export function strikeToneInstruction(strikeCount: number, category: string): string {
  const cat = category.replace(/\/.*$/, ""); // "sexual/minors" → "sexual"
  if (strikeCount === 1) {
    return `[MODERATION ALERT — this is the user's first warning today, category: ${cat}]
The user just sent something off-topic and inappropriate. Respond with a SHORT (1–2 sentences) playful redirect IN THE TARGET LANGUAGE. Do not quote, repeat, or engage with the inappropriate content. Suggest a safe, related vocabulary topic appropriate to their CEFR level. Stay warm and non-judgmental — assume they're testing the limits, not malicious.`;
  }
  return `[MODERATION ALERT — this is the user's second warning today, category: ${cat}]
The user persists with inappropriate content. Respond with a SHORT (1–2 sentences) firm but respectful message IN THE TARGET LANGUAGE. Make it clear you want the conversation to stay on-topic. No humor this time. Mention that further off-topic messages will end the session. Suggest one specific learning activity.`;
}
