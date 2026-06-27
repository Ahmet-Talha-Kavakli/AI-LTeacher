# 03 · API Endpoints

All endpoints live in `apps/web/app/api/`. Run on Vercel Fluid Compute (`runtime = "nodejs"`). Auth via Supabase Bearer JWT extracted by `requireUser()` in [lib/auth.ts](../apps/web/lib/auth.ts).

## Public

### `GET /api/health`
Returns `{ ok, service, timestamp }`. No auth.

## Placement quiz

### `POST /api/placement/start`
Body: `{ language: 'en' | 'es' | 'de' }`
Returns: `{ questions: PlacementQuestion[] }` — 15 questions, 3 randomly sampled per CEFR band A1–C1. C2 questions exist in DB but not served (reserved for adaptive v1.1).

### `POST /api/placement/submit`
Body: `{ userId, language, answers: PlacementAnswer[] }`
Returns: `{ result: { level, confidence, rationale } }`

Pipeline:
1. Anthropic Haiku 4.5 grades the answers (cached system prompt for cost discount).
2. `placement_results` insert.
3. `user_languages` upsert with `is_primary: true`.

Mobile also performs a defensive `user_languages` upsert after this call so the user can never be stranded with no primary language if the API fails.

## Tutor chat

### `POST /api/tutor/chat`
Body:
```ts
{
  language: 'en' | 'es' | 'de',
  accent: AccentCode,
  level: CefrLevel,
  nativeLanguage?: string,
  messages: UIMessage[]  // AI SDK v6 format
}
```
Returns: AI SDK v6 UIMessage streaming response (SSE).

Pipeline:
1. **Cooldown gate** ([lib/strikes.ts](../apps/web/lib/strikes.ts) `checkChatGate`) — if `cooldown_until > now`, returns 403 `{ error: "cooldown", cooldownUntil }`.
2. **Rate limit** — Upstash sliding window: 30 req / 60s per user.
3. **Quota consume** — `consume_quota('tutor_messages', 1)`.
4. **Moderation** — OpenAI moderation API on last user message.
   - If category score ≥ threshold (see [[06-Moderation-Strikes]]):
     - `recordStrike()` inserts event, increments counter
     - 3rd strike: returns a manually-streamed canned cooldown message in target language (no LLM cost)
     - 1st/2nd strike: streamText with strike tone instruction prepended to system prompt
   - Else: normal flow.
5. **LLM** — `streamText` with `openai/gpt-4o-mini` + tutor system prompt.

System prompt: tutor character "Suno" with tone, level calibration, accent awareness, safety guardrails. See [lib/ai.ts](../apps/web/lib/ai.ts) `tutorSystemPrompt`.

### `POST /api/tutor/voice-token`
Body: `{ language, accent, userId, level, lessonId? }`
Returns: `{ signedUrl, expiresAt, agentId, remainingSeconds }`

Mints a short-lived ElevenLabs Conversational AI signed URL for the mobile client to connect directly. Backend never sees the audio.

**Gating:** refuses if remaining voice budget < 30 seconds (no point starting a session that immediately ends).

**Status: 501** until `ELEVENLABS_API_KEY` + `ELEVENLABS_AGENT_<LANG>` env vars are configured.

### `POST /api/tutor/voice-end`
Body: `{ durationSeconds, mode: 'voice' | 'video' }`
Bookkeeping endpoint — mobile reports actual session duration on disconnect, server consumes quota accordingly (over-cap allowed; the session already happened).

## Avatar

### `GET /api/avatar/pool`
Returns curated shared characters: `{ characters: [...] }`. Empty until populated.

### `POST /api/avatar/generate`
Pro-only. Body: `{ prompt, artStyle }`. Consumes `customAvatarGenerations` quota. Starts a Meshy text-to-3D preview task, returns `{ taskId }`. Inserts into `user_avatars` with status='pending'.

### `GET /api/avatar/status/[id]`
Polls Meshy for task progress.

**Status: 501** until `MESHY_API_KEY` is configured.

## Images

### `POST /api/images/generate`
Body: `{ prompt, style: 'pixar' | 'watercolor' | 'flat' | 'photoreal' }`. Consumes `imageGenerations` quota. Calls FAL `flux-pro/v1.1`.

Used for lesson cards / scenes. Currently no mobile UI consumes it.

## Quota / account

### `GET /api/quota/status`
Returns `{ tier, date, usage, limits, moderation: { strikeCount, cooldownLevel, cooldownUntil } }`. Mobile chat screen polls this on mount.

### `POST /api/account/delete-if-anonymous`
Called by mobile right before `supabase.auth.signOut()`. If the user is anonymous, permanently deletes them (and all cascaded data). No-op for registered users.

Keeps the DB clean from "try-it-free" tap accumulation.

## Common patterns

- **All authenticated endpoints** start with `await requireUser(req)`. On 401, mobile's API client auto-signs-out and redirects to welcome ([lib/api.ts](../apps/mobile/lib/api.ts) `handle401`).
- **Rate limiting** uses Upstash Redis if `UPSTASH_REDIS_REST_URL` is set; otherwise no-op (dev convenience). See [lib/rate-limit.ts](../apps/web/lib/rate-limit.ts).
- **Quota response shape on exceed**: 402 status with `{ error: "quota_exceeded", tier, feature, cap, suggestion: "upgrade_plus" | "upgrade_pro" | "wait_tomorrow" }`.
