# 01 · Architecture

## Monorepo layout

```
AI-LTeacher/
├── apps/
│   ├── mobile/      ← Expo React Native iOS app (com.suno.app)
│   └── web/         ← Next.js 16 app — landing + AI orchestration API
├── packages/
│   └── shared/      ← Zod types: languages, accents, CEFR, brand, quotas
├── supabase/
│   ├── config.toml
│   ├── migrations/  ← 6 SQL files, applied via supabase CLI
│   └── functions/   ← (empty, reserved for Edge Functions)
├── wiki/            ← this documentation
└── turbo.json
```

Tooling:
- **pnpm 10** with workspace
- **Turborepo 2** orchestrates `dev`, `build`, `type-check`
- **TypeScript 5.7** everywhere, strict on
- **Sora** font for mobile, Tailwind for web landing

## Service map

```
┌─────────────────┐         HTTPS         ┌──────────────────────┐
│  iOS Simulator  │ ────────────────────► │  Next.js (Vercel)    │
│  Suno.app       │ ◄──────────────────── │  apps/web            │
│  RN + Expo 54   │   stream + JSON       │  Port 3000 (dev)     │
└────────┬────────┘                       └──────┬───────────────┘
         │                                       │
         │ supabase-js (Bearer JWT)              │ service_role
         ▼                                       ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase (eu-central-1, project hhocxlqgsdgbhcruyphp)          │
│  Auth · Postgres · Storage · Realtime                           │
└─────────────────────────────────────────────────────────────────┘
                                                 │
                                                 ▼  (server only)
                          ┌─────────────────────────────────┐
                          │  AI providers                   │
                          │  • OpenAI    gpt-4o-mini + mod  │
                          │  • Anthropic Haiku 4.5 / Opus   │
                          │  • ElevenLabs (planned)         │
                          │  • Meshy     (planned)          │
                          │  • FAL       flux-pro images    │
                          └─────────────────────────────────┘
```

**Why this split:**
- Mobile never holds AI provider keys; all AI calls go through Vercel as a proxy. Keys can rotate without app updates.
- Supabase Anon key is shipped in mobile (public by design); service role stays server-side.
- Mobile and web share `@ailt/shared` for type-safe contracts.

## Request flow examples

### Placement quiz submit

```
mobile (result.tsx)
  ── POST /api/placement/submit { language, answers } + Bearer JWT ──►
                                                  Next.js route
                                                    ├─ requireUser() validates JWT
                                                    ├─ Anthropic Haiku → CEFR level
                                                    ├─ insert placement_results
                                                    └─ upsert user_languages
                                                  ◄── { result: { level, confidence, rationale } }
mobile
  ── defensive upsert user_languages (covers API failures) ──► Supabase
  ── router.replace("/(tabs)/learn") ──►
```

### Tutor chat message

```
mobile (chat.tsx, useChat hook)
  ── POST /api/tutor/chat { language, accent, level, messages } ──►
                                                  Next.js route
                                                    ├─ requireUser
                                                    ├─ checkChatGate (cooldown gate)
                                                    ├─ rate limit + quota consume
                                                    ├─ OpenAI moderation on last user msg
                                                    │   ├─ if flagged → recordStrike
                                                    │   │     ├─ 3rd strike → canned cooldown msg
                                                    │   │     └─ else → LLM with strike tone
                                                    │   └─ if clean → normal tutor flow
                                                    └─ streamText(gpt-4o-mini) → SSE
                                                  ◄── streaming UI message chunks
mobile (expo/fetch reads stream)
  ── on finish: refresh quota status ──►
```

See [[06-Moderation-Strikes]] for moderation detail and [[07-Quotas-Pricing]] for quota detail.

## Environment surfaces

| Surface | Source | Owns |
|---|---|---|
| Mobile bundle (public) | `apps/mobile/.env.local` `EXPO_PUBLIC_*` | Supabase URL, anon key, API base URL |
| Web runtime (server) | `apps/web/.env.local` | Service role, AI provider keys, DB URL |
| Web public (client) | `NEXT_PUBLIC_*` in `apps/web/.env.local` | Only Supabase URL/anon (currently unused — web has no signed-in UI) |

`.env.example` ships in git with placeholders only. Real `.env.local` files are gitignored.

## Shared package

`packages/shared/src/`:
- `languages.ts` — `LanguageCode`, `AccentCode`, `LANGUAGES` map
- `cefr.ts` — `CefrLevel`, descriptions, `PlacementAnswer`, `PlacementResult`
- `brand.ts` — `BRAND`, `COLORS` (light + dark coral palette)
- `quotas.ts` — `SubscriptionTier`, `QUOTAS` limits
- `api.ts` — request/response zod schemas for API endpoints

Both web and mobile import `@ailt/shared` for compile-time enforcement of contracts.
