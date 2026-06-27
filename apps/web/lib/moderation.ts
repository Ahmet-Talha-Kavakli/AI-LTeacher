/**
 * OpenAI Moderation API wrapper. Free, ~100ms, returns granular per-category
 * scores. We use score thresholds (not the binary `flagged` field) so we can
 * tune sensitivity per category and avoid blocking dual-meaning words like
 * "sex" when used innocuously.
 *
 * Docs: https://platform.openai.com/docs/guides/moderation
 */

const MODEL = "omni-moderation-latest";

export type CategoryScores = Record<string, number>;

export type ModerationResult = {
  // Raw scores from OpenAI for all categories (0..1)
  scores: CategoryScores;
  // The category that has the highest score above its threshold, if any.
  // null when nothing crossed a threshold.
  triggered: { category: string; score: number } | null;
};

// Per-category thresholds. Lower = stricter.
// - "sex" can mean gender; only block at strong signal (0.7+).
// - Anything involving minors / self-harm intent / graphic violence: zero
//   tolerance, fire even at moderate signal.
const THRESHOLDS: Record<string, number> = {
  sexual: 0.7,
  "sexual/minors": 0.3,
  violence: 0.7,
  "violence/graphic": 0.4,
  hate: 0.7,
  "hate/threatening": 0.5,
  harassment: 0.7,
  "harassment/threatening": 0.5,
  "self-harm": 0.5,
  "self-harm/intent": 0.3,
  "self-harm/instructions": 0.3,
};
const DEFAULT_THRESHOLD = 0.7;

export async function moderate(text: string): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("moderation: OPENAI_API_KEY missing, failing open");
    return { scores: {}, triggered: null };
  }

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: MODEL, input: text }),
    });
    if (!res.ok) {
      console.warn("moderation: API non-200", res.status);
      return { scores: {}, triggered: null };
    }
    const data = (await res.json()) as {
      results: Array<{ category_scores: Record<string, number> }>;
    };
    const scores = data.results?.[0]?.category_scores ?? {};

    // Find the category with the highest score that exceeds its threshold.
    let triggered: ModerationResult["triggered"] = null;
    for (const [category, score] of Object.entries(scores)) {
      const threshold = THRESHOLDS[category] ?? DEFAULT_THRESHOLD;
      if (score >= threshold) {
        if (!triggered || score > triggered.score) {
          triggered = { category, score };
        }
      }
    }

    return { scores, triggered };
  } catch (err) {
    console.warn("moderation: call failed", err);
    return { scores: {}, triggered: null };
  }
}
