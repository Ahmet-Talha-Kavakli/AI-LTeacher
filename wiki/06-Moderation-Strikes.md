# 06 · Moderation + Strikes

A user-friendly content safety system. Designed in conversation with the founder around the principle: **don't lose users, don't burn reputation**.

## High-level behavior

1. AI tutor is patient. First inappropriate message gets a playful redirect.
2. Second inappropriate message gets a firm but respectful warning.
3. Third inappropriate message ends the session. Cooldown starts.
4. Repeat offenders get progressively longer cooldowns. After a week of clean behavior, slate is wiped.

No permanent bans, no error pages, no shaming language. The user keeps access to lessons + leaderboard during a tutor cooldown.

## Detection — OpenAI moderation API

`omni-moderation-latest`, free, ~100ms latency. Returns per-category scores in [0, 1].

We use **scores with thresholds**, not the binary `flagged` field. This is critical for dual-meaning words — "What's your sex?" scores ~0.2 in `sexual` (= safe), "Let's have sex" scores ~0.9 (= triggers).

Thresholds (defined in [lib/moderation.ts](../apps/web/lib/moderation.ts)):

| Category | Threshold | Rationale |
|---|---|---|
| `sexual` | 0.7 | dual-meaning, only fire on strong signal |
| `sexual/minors` | 0.3 | zero tolerance — App Store requirement |
| `violence` | 0.7 | allow idioms like "kill time" |
| `violence/graphic` | 0.4 | low tolerance |
| `hate` | 0.7 | |
| `hate/threatening` | 0.5 | |
| `harassment` | 0.7 | |
| `harassment/threatening` | 0.5 | |
| `self-harm` | 0.5 | |
| `self-harm/intent` | 0.3 | redirect to professional help (TODO) |
| `self-harm/instructions` | 0.3 | |
| default (unknown category) | 0.7 | |

`moderate()` returns `{ scores, triggered }` where `triggered` is the single category with the highest score above its threshold (or null if clean).

## Escalation — strike state machine

Each `profiles` row carries:
- `strike_count` (int) — strikes in the current cycle. Resets to 0 after a cooldown is triggered.
- `cooldown_until` (timestamptz) — null when no cooldown.
- `cooldown_level` (int 0–4) — which tier of cooldown is next applied. Doesn't reset on cooldown end.
- `last_strike_at` — for 7-day self-heal.

Cooldown durations, by `cooldown_level`:

| Level | Duration |
|---|---|
| 0 (first ever) | 15 minutes |
| 1 | 1 hour |
| 2 | 6 hours |
| 3 | 24 hours |
| 4+ | 24 hours (cap), flagged for review |

Logic ([lib/strikes.ts](../apps/web/lib/strikes.ts)):

```
checkChatGate(userId):
  if cooldown_until > now → BLOCK
  if cooldown_until expired → clear it, strike_count = 0
  if last_strike_at older than 7 days → self-heal: strike_count = 0, cooldown_level = 0
  → ALLOW

recordStrike(userId, modResult, snippet):
  strike_count++
  last_strike_at = now
  if strike_count >= 3:
    cooldown_until = now + DURATIONS[min(cooldown_level, 4)]
    cooldown_level = min(cooldown_level + 1, 4)
    strike_count = 0   // next cycle starts fresh
    → return { type: "cooldown" }
  else:
    → return { type: "warn", strikeCount }
  always: insert into moderation_events
```

## Response — escalating tone

### Strike 1 (playful redirect)

The chat route calls `streamText` with the base tutor system prompt **plus** this instruction (returned by `strikeToneInstruction(1, category)`):

```
[MODERATION ALERT — this is the user's first warning today, category: <cat>]
The user just sent something off-topic and inappropriate. Respond with a SHORT (1–2 sentences) playful redirect IN THE TARGET LANGUAGE. Do not quote, repeat, or engage with the inappropriate content. Suggest a safe, related vocabulary topic appropriate to their CEFR level. Stay warm and non-judgmental — assume they're testing the limits, not malicious.
```

Result example (B2 English, sexual flag): *"Hmm, let's keep our chat classroom-friendly 😄 — how about we practice ordering at a café instead?"*

### Strike 2 (firm)

Same flow, different tone instruction:
```
[MODERATION ALERT — this is the user's second warning today …]
… Respond with a SHORT firm but respectful message … No humor this time. Mention that further off-topic messages will end the session. Suggest one specific learning activity.
```

### Strike 3 (cooldown)

No LLM call. Pre-canned message in the target language is streamed via `createUIMessageStream`:

```ts
COOLDOWN_MESSAGES = {
  en: "I'm ending our session here. Take a break and come back later — I'll be ready when you are.",
  es: "Voy a terminar nuestra sesión aquí …",
  de: "Ich beende unsere Sitzung an dieser Stelle …",
}
```

Mobile then sees a 403 on the next message attempt (cooldown gate) and shows the cooldown card.

## Mobile UX — cooldown card

`components/cooldown-card.tsx` replaces the chat UI:
- Pause icon, "Bir mola verelim" heading
- Countdown timer (HH:MM:SS, ticks every second)
- Two CTAs: "Derslerime dön" / "Lider tablosuna bak" — keep the user inside the app
- Auto-refresh `/api/quota/status` when countdown hits zero → chat reappears

This routes the user to other valuable features instead of pushing them out of Suno.

## Audit log

`moderation_events` table — every strike recorded with full category scores, message snippet (first 200 chars), action taken, strike count at time, and cooldown if applied.

Used for:
- **Threshold tuning** — review false positives in production
- **GDPR transparency** — users can `SELECT` their own events (RLS owner-read policy)
- **App Store / policy compliance** — proof we proactively moderate
- **Future ML** — if we later want to train a custom classifier, this is the seed data

## What this protects against

- Off-topic prompts that pollute the tutor experience for legitimate users
- Sustained abuse driving up our OpenAI bill
- Reputation damage from screenshots of AI engaging with inappropriate content
- App Store rejection for inadequate content moderation

## What this does NOT do (deliberate)

- No automatic permanent ban — users always have a recovery path
- No removal of access to lessons/leaderboard during a chat cooldown
- No moderation on voice tutor (yet — ElevenLabs has its own safety controls; we'll layer ours when voice ships)
- No moderation on placement quiz answers (multiple-choice; nothing to moderate)
