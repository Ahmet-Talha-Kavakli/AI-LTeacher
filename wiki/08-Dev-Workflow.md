# 08 · Dev Workflow

## Prerequisites

- macOS with Xcode 26+ (CLT installed, `xcodebuild -version` works)
- Node 22+ (`node -v`)
- pnpm 10+ (`pnpm -v`)
- CocoaPods (`pod --version`)
- iOS Simulator with iPhone 17 (or any iPhone 15+)
- Supabase CLI via `npx -y supabase` (no global install needed)

Optional but useful:
- `cliclick` (`brew install cliclick`) — for scripted UI taps during automation
- Obsidian to read this wiki ergonomically

## First-time setup

```bash
cd /Users/talha/Desktop/AI-LTeacher
pnpm install                              # installs all workspace deps
```

Copy env templates and fill in:
```bash
cp .env.example apps/web/.env.local
cp .env.example apps/mobile/.env.local
# edit values — see envs list below
```

Push migrations to Supabase (one-time per env):
```bash
DB_URL='postgresql://postgres.<ref>:<password>@aws-1-eu-central-1.pooler.supabase.com:5432/postgres'
npx supabase db push --db-url "$DB_URL" --include-all
```

Seed placement questions (one-time):
```bash
cd apps/web && pnpm tsx scripts/seed-placement-questions.ts
```

Build + install iOS app:
```bash
cd apps/mobile && pnpm ios   # runs: expo run:ios --port 8082
```

(First build ~6–10 min, subsequent rebuilds ~3 min.)

## Daily run

```bash
# terminal 1 — backend
cd apps/web && pnpm dev      # port 3000

# terminal 2 — mobile Metro
cd apps/mobile && pnpm start  # port 8082, --dev-client mode
```

Then tap the Suno icon on iPhone 17 simulator. Hot reload picks up JS changes automatically.

## Dual-Metro setup (Suno + Lyra side-by-side)

The founder runs another Expo project (Lyra at `/Users/talha/Desktop/Lyra-DB`) in the same simulator. Both must coexist.

| | Suno | Lyra |
|---|---|---|
| Bundle ID | `com.suno.app` | (Lyra's own) |
| Metro port | **8082** | 8081 (default) |
| Deeplink scheme | `suno://` | (Lyra's) |

Suno scripts in `apps/mobile/package.json` hard-code `--port 8082`, so as long as both projects use their own commands they never collide.

`expo-dev-client` is **required** on Suno — without it, the dev client ignores the deeplink URL and falls back to `localhost:8081`, which is Lyra's Metro, which serves Lyra's bundle, which breaks because Suno's native modules don't match. This was a costly debug session on 2026-05-21; never remove `expo-dev-client` from `apps/mobile/package.json`.

When `simctl openurl` is used to launch Suno on a fresh install, iOS 17+ shows a "Suno ile Açılsın mı?" confirmation. Tap "Aç" once; the URL is then remembered for subsequent launches.

## Useful commands

| Command | What it does |
|---|---|
| `pnpm type-check` | Type-check every workspace package |
| `pnpm --filter web dev` | Run only the web dev server |
| `pnpm --filter mobile start` | Run only Metro |
| `pnpm --filter web build` | Production build of web app |
| `pnpm --filter mobile exec tsc --noEmit` | Mobile-only type-check |
| `cd apps/mobile && pnpm ios` | Build + install + launch iOS app |
| `cd apps/mobile && npx expo prebuild --platform ios --clean` | Regenerate native iOS project (after app.json or plugin changes) |
| `npx supabase db push --db-url "$DB_URL" --include-all` | Apply pending migrations |
| `pnpm --filter web tsx scripts/seed-placement-questions.ts` | Re-seed placement questions |

## Env vars

### `apps/web/.env.local` (server-side; never committed)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_DB_URL=postgresql://...

# AI providers
OPENAI_API_KEY=sk-proj-...           # tutor chat + moderation
ANTHROPIC_API_KEY=sk-ant-api03-...   # placement scoring + content gen
FAL_API_KEY=...                      # image generation
ELEVENLABS_API_KEY=                  # (not yet configured)
MESHY_API_KEY=                       # (not yet configured)

# ElevenLabs per-language agents (not yet configured)
ELEVENLABS_AGENT_EN=
ELEVENLABS_AGENT_ES=
ELEVENLABS_AGENT_DE=

# ElevenLabs per-accent voice IDs (not yet configured)
ELEVENLABS_VOICE_EN_US=
... (full list in .env.example)

# Optional — Upstash (rate limit). No-op if absent.
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional — Vercel AI Gateway (alternative to direct provider keys)
AI_GATEWAY_API_KEY=
```

### `apps/mobile/.env.local` (baked into bundle — public)

```
EXPO_PUBLIC_SUPABASE_URL=https://hhocxlqgsdgbhcruyphp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000   # or LAN IP for physical device
```

Never put service-role or AI provider keys in the mobile env — they ship in the bundle and can be extracted.

## Resetting the database

If you need a clean slate (e.g., to delete all test users and start fresh):

```bash
# delete all anonymous users (cascades to profiles + all owned rows)
PGPASSWORD='<db-password>' psql '$SUPABASE_DB_URL' -c "
  DELETE FROM auth.users WHERE is_anonymous = true;
"
```

Be aware: this includes any *active* anonymous session you might have on a simulator. Force-quit and re-launch the app, the 401 handler will auto-sign-out + redirect to welcome.

## Troubleshooting

| Symptom | Diagnosis | Fix |
|---|---|---|
| Suno opens with Lyra's screens / `ExpoGlassEffect` error | Suno's dev client hit port 8081 (Lyra's Metro) | Kill Lyra Metro temporarily; verify Suno's `expo-dev-client` is installed; relaunch via deeplink to 8082 |
| "Sorular yüklenemedi (HTTP 401)" | Stale JWT — backend deleted the user | The mobile API client now auto-handles this; if not, force-quit + relaunch |
| Chat shows "Önce dil seçimini tamamla" but you finished onboarding | Placement API failed during onboarding (likely bad AI key) | Mobile's defensive `user_languages` upsert was added on 2026-05-22 to prevent this; if you're seeing it, tap "Dil seçimine git" to re-do onboarding |
| OpenAI returns 401 | Key revoked (often automatic detection of leaked keys) | Generate new key at platform.openai.com, paste into `apps/web/.env.local`, restart `pnpm dev` |
| Metro on 8082 not picked up after rebuild | iOS confirmation dialog blocking | Tap "Aç" in simulator (once per fresh install; remembered after) |
| "Cannot find native module" for any expo-* package | Native side out of sync with JS | `npx expo prebuild --platform ios --clean` then rebuild |
