# 05 · AI Models

Model selection is the single biggest cost lever in this product. The rules below are locked.

## Tiering

Defined in [apps/web/lib/ai.ts](../apps/web/lib/ai.ts):

| Constant | Model | Used for | Per-call cost (typical) |
|---|---|---|---|
| `TUTOR_MODEL` | `openai/gpt-4o-mini` | Text tutor chat (every user message) | $0.0001–0.001 |
| `LIGHT_MODEL` | `anthropic/claude-haiku-4-5` | Placement scoring, open-ended grading | $0.0013/placement |
| `CONTENT_MODEL` | `anthropic/claude-opus-4-7` | **Dev-only** content generation seed scripts | $0.07/batch, runs ~18× total |

`GRADING_MODEL` is an alias of `LIGHT_MODEL` for back-compat.

**Important invariant:** `CONTENT_MODEL` must never be called from a user-facing API route. If a feature is tempted to use Opus at request time, push back: route to `LIGHT_MODEL` or pre-generate via script.

## Why these choices

- **gpt-4o-mini for chat:** 20× cheaper than Sonnet, conversational quality is more than enough for language tutoring at A1–C1. Auto prompt caching kicks in when the system prompt exceeds ~1024 tokens (we're well over).
- **Haiku 4.5 for placement:** the task is "count correct answers per CEFR band → assign level + write one sentence". This is a formula, not reasoning. Haiku is overkill for the input but its structured-output reliability and Anthropic prompt caching (90% discount on system) make it cheap and dependable.
- **Opus 4.7 for content gen:** one-time-cost work where quality matters. Generating 90 placement questions, lesson content seed, etc. Output is persisted to Postgres and served forever.

History: started with Sonnet 4.6 for placement, downgraded to Haiku 4.5 on 2026-05-21 after estimating it would cost ~5× more for no measurable quality gain on multiple-choice grading.

## Prompt caching

### Anthropic
We wrap the placement system prompt in `cachedSystemMessage()` (see `lib/ai.ts`):
```ts
{
  role: "system",
  content: SYSTEM,
  providerOptions: {
    anthropic: { cacheControl: { type: "ephemeral" } }
  }
}
```
Subsequent placement calls within 5 minutes read 90% off the system tokens. Single-user impact is small (only one placement per user); cross-user impact is meaningful when traffic surges.

### OpenAI
Automatic for stable prompts > 1024 tokens. The tutor system prompt is intentionally long and stable per (language, accent, level) tuple so caching engages.

## Direct providers vs AI Gateway

We currently call OpenAI and Anthropic directly via `@ai-sdk/openai` and `@ai-sdk/anthropic`. Vercel AI Gateway is installed (`@ai-sdk/gateway`) but unused.

Decision (2026-05-21): user already loaded credit on each platform's billing, no benefit from Gateway proxy. If we later want unified observability, model A/B testing, or fallback routing, swap each `openai("...")` / `anthropic("...")` for `gateway("provider/model")` and set `AI_GATEWAY_API_KEY`.

## Moderation

OpenAI moderation API (`omni-moderation-latest`) — free, ~100ms, called on every tutor chat user message. Returns granular category scores; our thresholds live in [lib/moderation.ts](../apps/web/lib/moderation.ts).

Full system: [[06-Moderation-Strikes]].

## Voice (planned)

Pipeline when ElevenLabs is configured:
- **STT:** iOS `SFSpeechRecognizer` (on-device, **free**, 50+ languages)
- **LLM:** gpt-4o-mini (same as text chat, with moderation)
- **TTS:** ElevenLabs Turbo v2.5 with accent-specific voice IDs
- **Real-time orchestration:** ElevenLabs Conversational AI signed URLs (the mobile client connects directly; backend mints the URL via `/api/tutor/voice-token`)

Estimated cost: ~$0.08–0.10/minute, ~3× cheaper than ElevenLabs Conversational AI's bundled experience would have been.

Status: routes scaffolded, API key + agents not configured.

## Content generation seed scripts

`apps/web/scripts/seed-placement-questions.ts` — generates 90 placement questions via Opus. Ran once on 2026-05-21.

Pattern for future seeds:
- Load env via `loadEnvConfig` from `@next/env`
- `generateObject` with `CONTENT_MODEL` and a strict zod schema
- Insert via `supabaseAdmin()` (service role)
- Idempotent — safe to re-run; uses unique IDs with a run-timestamp suffix

Coming seeds:
- Lesson content for each (language, CEFR level, unit) tuple
- Lesson XP rewards and durations
- Achievement copy variations
