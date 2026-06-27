# 10 · Security

## Key rotation — MUST DO BEFORE PRODUCTION

The following credentials were shared in plaintext during early-dev chat sessions (2026-05-21 and 2026-05-22). They MUST be rotated before any public deployment, App Store submission, or marketing launch:

| Credential | Where | Status |
|---|---|---|
| Supabase service role JWT | apps/web/.env.local | needs rotation |
| Supabase `sb_secret_...` API key | (now unused) | needs rotation |
| Supabase database password | apps/web/.env.local SUPABASE_DB_URL | needs rotation |
| Anthropic Claude API key (original) | apps/web/.env.local | still valid; rotate before prod |
| OpenAI API key (original `sk-proj-2ia8nkM...`) | revoked | already auto-revoked by OpenAI leak scanner |
| OpenAI API key (replacement `sk-proj-Dl9X0ZV...`) | apps/web/.env.local | active; treat as exposed, rotate before prod |
| FAL API key | apps/web/.env.local | needs rotation |

**Anon / publishable Supabase keys are PUBLIC by design** — they ship in the mobile bundle. Rotating them is optional and only useful if anti-abuse posture demands it.

## Rotation process (when ready)

For each provider:

1. Generate a new key in the provider's dashboard.
2. **Do not paste it into chat.** Edit `apps/web/.env.local` directly in your editor.
3. Save → restart `pnpm dev` to pick up new env.
4. Revoke the old key in the provider's dashboard.

For Supabase service role / DB password rotation, also update:
- Vercel project env vars (production + preview)
- Any GitHub Actions / CI env secrets

## Why OpenAI auto-revoked the first key

OpenAI scans GitHub commits, Discord channels, and other text platforms for leaked API keys. When detected, they automatically revoke the key and email the account owner. The first key (`sk-proj-2ia8nkM...`) was revoked within ~12 hours of being shared in chat.

This is good behavior on OpenAI's part — but it means if you paste a fresh key in chat again, expect it to die overnight. Use editor-side updates from now on.

## Defense in depth in the codebase

### Server-side only secrets
All AI provider keys live in `apps/web/.env.local`, never in `apps/mobile`. The mobile app calls our backend; the backend calls the AI providers. The mobile bundle, if extracted (decompiled), contains nothing more dangerous than the Supabase anon key (already public).

### Supabase RLS
Every user-owned table has Row Level Security policies that restrict reads/writes to the row owner (`auth.uid() = user_id`). The anon key cannot read another user's data even with full DB API access.

### Service-role usage
The service-role key bypasses RLS. It's only used in API routes (`supabaseAdmin()`) for actions that must operate cross-user or perform admin tasks (e.g. inserting moderation events, deleting anonymous users).

### Bearer JWT validation
Every protected API route starts with `requireUser(req)` which validates the Supabase JWT and extracts the user. A forged or expired JWT returns 401.

### 401 auto-recovery on mobile
If the mobile API client receives a 401, it locally signs out and redirects to the welcome screen. Prevents users from getting stuck with a dead session.

### Rate limiting
Upstash sliding window per user, per endpoint. 30 req/min on tutor chat. Returns 429 with backoff hint.

### Content moderation
OpenAI moderation API on every tutor chat user message. See [[06-Moderation-Strikes]]. Protects against:
- Reputation damage from screenshots of AI engaging with bad content
- AI bill bloat from sustained abuse
- App Store rejection for inadequate moderation

### Anonymous user cleanup
Anonymous users get permanently deleted on sign-out (`/api/account/delete-if-anonymous`). Stops accumulation of ghost rows and limits the lifetime of unaccountable identities.

## GDPR posture

| Right | How we comply |
|---|---|
| Access | User can `SELECT` their own profiles, user_languages, placement_results, tutor_sessions, xp_events, user_lesson_progress, user_achievements, moderation_events via RLS owner-read policies |
| Deletion | Delete `auth.users` row → cascades to all owned rows. Anonymous users auto-deleted on sign-out. Registered: TODO add "Delete account" button in Profil |
| Portability | TODO: export endpoint (later) |
| Logs | `moderation_events` retains message snippets (first 200 chars). User can read their own. Consider sanitizing or shortening if privacy review pushes back. |

## App Store / Apple compliance

When we reach App Store submission:
- Bundle ID `com.suno.app` (already locked)
- iOS Info.plist permission strings already in `apps/mobile/app.json`:
  - NSMicrophoneUsageDescription (voice tutor)
  - NSCameraUsageDescription (profile photo)
  - NSPhotoLibraryUsageDescription (profile photo upload)
  - NSSpeechRecognitionUsageDescription (pronunciation)
- Content moderation system is in place — reviewers will ask
- Account deletion: ensure registered users can delete their own account in-app (currently only sign-out exists)
- Privacy policy + Terms must be live URLs

## Incident response (template)

If a key is suspected leaked:
1. Revoke the key in the provider dashboard immediately
2. Check provider's usage logs for anomalous calls
3. Generate new key, update `.env.local`, restart dev server
4. If production deploy uses the key, update Vercel env vars + redeploy
5. Log the incident with date and rotation outcome in this file
