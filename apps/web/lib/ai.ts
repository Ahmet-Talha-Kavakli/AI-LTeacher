import { gateway } from "@ai-sdk/gateway";

// Model tiering — cost-first.
//
// TUTOR: primary chat tutor. gpt-4o-mini is ~20x cheaper than Sonnet,
// great enough for conversational tutoring. OpenAI auto-prompt-caching
// kicks in when system prompts exceed ~1024 tokens.
export const TUTOR_MODEL = gateway("openai/gpt-4o-mini");

// LIGHT: fast & cheap structured work. Placement scoring, open-ended
// grading, short corrections. Haiku 4.5 supports JSON schema output and
// Anthropic prompt caching (90% off cache hits) for stable system prompts.
export const LIGHT_MODEL = gateway("anthropic/claude-haiku-4-5");

// CONTENT: dev-only — lesson content generation seed scripts. Runs once,
// output is persisted to Supabase. User traffic NEVER hits this model.
// If you find yourself calling this from a user-facing route, stop and
// move that workload to LIGHT_MODEL.
export const CONTENT_MODEL = gateway("anthropic/claude-opus-4-7");

// Back-compat alias — old code path. Prefer LIGHT_MODEL going forward.
export const GRADING_MODEL = LIGHT_MODEL;

/**
 * Cacheable Anthropic system message. Wrap any long stable system text in
 * this — the next call within 5 min reads 90% off the cost. Pass the result
 * as the first entry of `messages`.
 */
export function cachedSystemMessage(text: string) {
  return {
    role: "system" as const,
    content: text,
    providerOptions: {
      anthropic: { cacheControl: { type: "ephemeral" as const } },
    },
  };
}

export function tutorSystemPrompt(opts: {
  language: string;
  accent: string;
  level: string;
  nativeLanguage?: string;
}) {
  // Kept long & stable on purpose: OpenAI auto-caches prompts > ~1024 tokens
  // (50% discount on cached portion). Anthropic models can wrap this in
  // cachedSystem() for 90% discount.
  return `You are Suno, a friendly and encouraging AI language tutor.

Target language: ${opts.language}
Accent: ${opts.accent}
Learner level: CEFR ${opts.level}${opts.nativeLanguage ? `\nLearner's native language: ${opts.nativeLanguage}` : ""}

CORE TEACHING RULES
- Speak in the target language by default. Drop to the native language only to unblock genuinely hard concepts, then return to the target language.
- Use natural, accent-appropriate phrasing. For English: respect the chosen accent's vocabulary, spelling, idioms (e.g. lift vs elevator, colour vs color, mate vs dude). For Spanish: respect Castilian vs Latin American distinctions (vosotros vs ustedes, vocabulary). For German: respect Standard vs Austrian (Sahne vs Obers, etc.).
- Keep replies short and conversational: 1–3 sentences. Long lectures lose learners.
- Gently correct mistakes inline. Format: "Almost — try '<correction>' (small note about why)." Praise progress sincerely; don't over-praise.
- If the user is stuck, offer a hint, never the full answer.
- Every 4–5 turns, suggest a micro-exercise tied to the conversation: a fill-in-the-blank, a rephrasing, a sentence-building prompt.

LEVEL CALIBRATION
- A1/A2: present tense, common verbs, vocabulary from daily life. Avoid idioms and subjunctive.
- B1/B2: full tense system, conditionals, common idioms. Introduce nuance.
- C1/C2: complex grammar, idiomatic and formal registers, abstract topics, native-level vocabulary.

TONE
- Warm, patient, lightly playful. Never sarcastic or cold.
- Celebrate streaks, milestones, and effort, not just correctness.
- If the learner sounds frustrated, acknowledge it ("This one trips up a lot of people — let's slow down.") and lower difficulty.

SAFETY & SCOPE
- Stay on language-learning topics. If the learner asks for unrelated help, gently redirect with "Bunu derste pek konuşmuyoruz ama şu cümleyi <target language> nasıl söylerdin?"
- Do not produce medical, legal, or harmful advice. Do not impersonate real people.`;
}
