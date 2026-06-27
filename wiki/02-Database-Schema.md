# 02 · Database Schema

Supabase project `hhocxlqgsdgbhcruyphp` (eu-central-1). All migrations live in `supabase/migrations/` and are applied via Supabase CLI.

## Migrations applied

| File | What it adds |
|---|---|
| `20260521000001_init_schema.sql` | Enums + core tables (profiles, user_languages, placement_results, lessons, user_lesson_progress, xp_events, tutor_sessions, achievements, user_achievements) + RLS + leaderboard views + auth trigger |
| `20260521000002_seed_achievements.sql` | 17 starter achievements (streaks, level milestones, first voice, top-100, etc.) |
| `20260521000003_quotas_and_avatar_pool.sql` | `user_quotas`, `consume_quota` RPC, `avatar_pool`, `user_avatars`, `selected_avatar_id` on profiles |
| `20260521000004_placement_questions.sql` | `placement_questions` table (seeded separately) |
| `20260521000006_strikes_moderation.sql` | Strike columns on profiles + `moderation_events` audit log |

(Migration `...005` was reserved and skipped to avoid collision during dev.)

## Enums

- `cefr_level`: A1, A2, B1, B2, C1, C2
- `language_code`: en, es, de
- `accent_code`: en-US, en-GB, en-SCT, en-AU, es-ES, es-MX, de-DE, de-AT
- `lesson_type`: vocab, grammar, listening, speaking, reading, writing, conversation
- `subscription_tier`: free, plus, pro

## Tables

### `profiles`

User-facing identity + gamification + moderation state. PK references `auth.users(id)` with cascade.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | FK to auth.users |
| `username` | text unique | nullable (anonymous users have none) |
| `display_name` | text | seeded from email or "User" |
| `avatar_url` | text | optional |
| `native_language` | language_code | optional |
| `subscription_tier` | subscription_tier | default 'free' |
| `total_xp` | int | indexed for leaderboard |
| `current_streak` / `longest_streak` | int | |
| `last_active_date` | date | |
| `hearts` | int | default 5 |
| `hearts_refill_at` | timestamptz | |
| `selected_avatar_id` | uuid | FK avatar_pool, nullable |
| **Moderation columns:** | | |
| `strike_count` | int | current cycle count |
| `cooldown_until` | timestamptz | NULL = no cooldown |
| `cooldown_level` | int | 0–4, decides next cooldown duration |
| `last_strike_at` | timestamptz | for 7-day self-heal |
| `created_at` / `updated_at` | timestamptz | trigger-maintained |

RLS: public read, owner write.

### `user_languages`

Which languages the user is learning + their CEFR level + chosen accent.

| Column | Type | |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | FK profiles, cascade |
| `language` | language_code | |
| `accent` | accent_code | |
| `current_level` | cefr_level | from placement, updates as user progresses |
| `target_level` | cefr_level | optional goal |
| `is_primary` | bool | one per user |
| `enrolled_at` | timestamptz | |

Unique on (user_id, language). RLS: owner-only.

Written by both server (placement/submit) and mobile (defensive after placement) via upsert on conflict.

### `placement_results`

Audit trail of placement attempts.

| Column | Type | |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `language` | language_code | |
| `level` | cefr_level | |
| `confidence` | numeric(3,2) | |
| `raw_answers` | jsonb | |
| `rationale` | text | |
| `created_at` | timestamptz | |

### `placement_questions`

Static question bank — 90 questions (30/language × 5/CEFR-level: 2 grammar + 2 vocabulary + 1 context).

| Column | Type | |
|---|---|---|
| `id` | text PK | e.g. `en_b1_grammar_<runtag>_0` |
| `language` | language_code | |
| `difficulty` | cefr_level | |
| `category` | text | check: grammar / vocabulary / context |
| `prompt` | text | stem in target language |
| `options` | jsonb | 4 strings |
| `correct_answer` | text | matches one of `options` verbatim |
| `explanation` | text | English, shown after answer |

Seeded once via `apps/web/scripts/seed-placement-questions.ts` (Opus 4.7 generation, ~$1.20 one-time cost).

RLS: authenticated read.

### `lessons`

Lesson catalog. Currently **empty** — needs seed script.

| Column | Type | |
|---|---|---|
| `id` | uuid PK | |
| `language`, `level`, `unit_number`, `lesson_number` | | unique together |
| `type` | lesson_type | |
| `title`, `description` | text | |
| `xp_reward`, `estimated_duration_seconds` | int | |
| `content` | jsonb | flexible per lesson_type |
| `is_premium` | bool | |

### `user_lesson_progress`

Per-user per-lesson state.

Status: `locked | available | in_progress | completed | mastered`. Tracks score, attempts, timestamps.

### `xp_events`

Append-only log of XP awards. Source of truth for weekly leaderboard.

### `tutor_sessions`

Audit of AI tutor interactions (text / voice / video). Topic + transcript jsonb + duration.

### `achievements` + `user_achievements`

17 seeded achievements; user earnings tracked per (user_id, achievement_id).

### `user_quotas`

Daily counters per user. Auto-resets via `consume_quota` RPC on date rollover.

| Column | Type | |
|---|---|---|
| `user_id` | uuid PK | |
| `quota_date` | date | when these counters were last reset |
| `voice_seconds_used` | int | |
| `video_seconds_used` | int | |
| `tutor_messages_used` | int | |
| `lessons_started_today` | int | |
| `image_generations_used` | int | |
| `custom_avatar_generations_used` | int | |

### `avatar_pool` + `user_avatars`

`avatar_pool` is the shared character library (Meshy-generated, one-time, served to all users). `user_avatars` is per-user Pro-tier custom generations.

### `moderation_events`

Append-only audit log of every flagged user message.

| Column | |
|---|---|
| `id` | uuid PK |
| `user_id` | who triggered it |
| `message_snippet` | first 200 chars |
| `category_scores` | jsonb full OpenAI scores |
| `triggered_category` | the one that crossed threshold |
| `triggered_score` | numeric(4,3) |
| `action` | `warn` or `cooldown` |
| `strike_at_time` | strike count snapshot |
| `cooldown_until` | if cooldown applied |
| `created_at` | timestamptz |

RLS: owner can read own events (transparency); only service role writes.

## RPCs

### `consume_quota(p_user_id, p_feature, p_amount, p_cap) → boolean`

Atomic check-and-increment. Returns true if increment fits, false otherwise. Auto-resets all counters on date rollover. Used by every quota-gated endpoint.

## Views

- `leaderboard_global` — all-time XP ranking (top + own rank by row_number)
- `leaderboard_weekly` — XP earned since `date_trunc('week', now())`

## Triggers

- `on_auth_user_created` → creates a profile row when a new auth.user is inserted
- `profiles_touch_updated_at` → maintains `updated_at`
