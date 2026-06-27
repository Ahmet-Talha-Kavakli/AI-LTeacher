# 09 · Roadmap

Living checklist. Updated 2026-05-22.

## ✅ Done

### Infrastructure
- Monorepo (pnpm + Turborepo) with `apps/web`, `apps/mobile`, `packages/shared`
- TypeScript strict everywhere
- Git repo pushed to [github.com/Ahmet-Talha-Kavakli/AI-LTeacher](https://github.com/Ahmet-Talha-Kavakli/AI-LTeacher)
- `.env.local` gitignored, `.env.example` committed with placeholders

### Backend
- Next.js 16 (Turbopack) on Vercel-ready setup
- Supabase wired (project hhocxlqgsdgbhcruyphp, eu-central-1)
- 6 migrations applied
- Atomic `consume_quota` RPC
- RLS on all user-owned tables
- Leaderboard views (global, weekly)
- Auth trigger creates profile on signup
- 17 achievement rows seeded
- 90 placement questions seeded via Opus

### Mobile app
- Bundle `com.suno.app`, Metro port 8082, `expo-dev-client` baked
- Brand: Suno + coral palette + speech-bubble logo + Sora font
- Native iOS tabs via `react-native-bottom-tabs` (real UITabBarController)
- 5 tabs: Öğren, Pratik, Öğretmen, Lider, Profil
- Welcome screen with anonymous + email sign-in
- Onboarding flow: language → accent → 15-question placement → result
- Profile screen with sign-out
- Anonymous user auto-deletion on sign-out

### Tutor — text
- gpt-4o-mini streaming chat
- AI SDK v6 `useChat` with `expo/fetch` for proper RN streaming
- Suggestion chips on empty state
- Typing indicator, message bubbles
- Defensive user_languages write covers placement API failures
- Global 401 handler auto-recovers stale sessions

### Cost + safety
- Model tiering locked: gpt-4o-mini (tutor), Haiku 4.5 (placement/grading), Opus 4.7 (dev-only)
- Anthropic prompt caching on Opus calls
- OpenAI moderation API with per-category thresholds
- 3-strike escalating tone (playful → firm → cooldown)
- Progressive cooldown 15m → 1h → 6h → 24h
- 7-day self-heal
- Cooldown card UI with countdown + alternative-nav CTAs
- moderation_events audit log
- Quota system: tier limits in shared package, server enforcement via RPC, mobile fetches `/api/quota/status`

### Docs
- Full wiki at `wiki/` (this folder)
- Memory system at `~/.claude/projects/.../memory/`

## 🚧 In progress / next session

### (f) Voice tutor — ElevenLabs
- [ ] Founder creates 3 ElevenLabs Conversational AI agents (EN, ES, DE)
- [ ] Founder selects per-accent voice IDs (US, GB, SCT, AU, ES-ES, ES-MX, DE-DE, DE-AT)
- [ ] Fill `ELEVENLABS_*` env vars
- [ ] Wire mobile voice screen: signed URL fetch → ElevenLabs Conversational SDK → mic permissions → session timer → report duration on disconnect
- [ ] Add OpenAI moderation to ElevenLabs transcripts (post-session)

## 📋 Backlog — short-term

### Lessons content
- [ ] Design lesson schema variants (vocab card, grammar drill, listening comprehension, etc.)
- [ ] Opus seed script for lesson catalog (per language × CEFR × unit)
- [ ] Mobile lesson player (currently `app/lesson/[id].tsx` is placeholder)
- [ ] Per-lesson XP award + write to xp_events
- [ ] Update `user_lesson_progress` on completion

### Leaderboard
- [ ] Replace mobile sample data with real `/api/leaderboard` endpoint
- [ ] Computed views are in place (`leaderboard_global`, `leaderboard_weekly`)
- [ ] Mobile shows top 100 + own rank

### Quota UI polish
- [ ] Inline indicators ("5/30 mesaj kaldı") on chat/practice screens
- [ ] Paywall card when quota exceeded with "Yarın yenilenir / Plus'a geç"

### Streak + hearts
- [ ] Daily streak increment on first activity
- [ ] Hearts deduction on wrong answers
- [ ] Hearts refill timer (1 heart per 30 min)

## 📋 Backlog — medium-term

### Avatar (Meshy)
- [ ] Generate 8–12 Pixar characters via Meshy, manually curate
- [ ] Upload GLBs to Supabase Storage
- [ ] Insert into `avatar_pool`
- [ ] Mobile avatar picker in onboarding (after placement) and in Profil
- [ ] Pro tier: custom Meshy generation via `/api/avatar/generate`

### Apple Sign-In + monetization
- [ ] Founder opens Apple Developer account
- [ ] Bundle ID negotiated with Apple (likely keep `com.suno.app`)
- [ ] Wire `expo-apple-authentication` → Supabase `signInWithIdToken`
- [ ] RevenueCat integration: paywall, webhook → `subscription_tier` update

### Image generation (FAL)
- [ ] Surface lesson scene illustrations in lesson player
- [ ] Generate-on-demand for free-form vocabulary

### V1.1 — adaptive placement
- [ ] Move placement to adaptive routing (A2 → harder/easier next)
- [ ] Include C2 questions in adaptive pool
- [ ] Confidence interval estimation

## 📋 Backlog — long-term (v2)

- Japanese + Arabic (RTL + non-Latin scripts)
- Multiplayer real-time quiz battles (Supabase Realtime)
- Push notifications (streak reminders, leaderboard)
- Friends + social feed
- Photoreal video avatars (Tavus/HeyGen) for Pro
- Web dashboard for content authors
- Admin panel for moderation review
- Self-hosted Whisper for on-device pronunciation scoring at scale

## 🐞 Known issues

| Issue | Severity | Plan |
|---|---|---|
| Placement rationale shown in English, UI in Turkish | Low | Have model return Turkish rationale (instruction tweak) |
| "Suno ile Açılsın mı?" dialog on fresh install | Low | iOS 17+ system behavior; one tap then remembered |
| 0 mobile UI for image generation | Low | Wait until lessons need it |
| AI keys exposed in chat | High (pre-prod) | See [[10-Security]] rotation plan |
