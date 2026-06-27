# Suno Wiki

Project knowledge base. Updated 2026-05-22.

Suno is an AI-powered language learning app — iOS-first (React Native via Expo), Next.js backend on Vercel, Supabase data layer, OpenAI + Anthropic models for tutoring.

## Reading order

If new to the project, follow this order:

1. [[00-Overview]] — what Suno is, the V1 scope, current state
2. [[01-Architecture]] — monorepo, services, request flow
3. [[02-Database-Schema]] — Supabase tables, RLS, RPCs
4. [[03-API-Endpoints]] — backend routes and contracts
5. [[04-Mobile-App]] — screen tree, native iOS integration, hooks
6. [[05-AI-Models]] — model tiering and cost philosophy
7. [[06-Moderation-Strikes]] — content safety + escalating cooldown system
8. [[07-Quotas-Pricing]] — tier limits and quota enforcement
9. [[08-Dev-Workflow]] — how to run, dual-Metro setup with Lyra
10. [[09-Roadmap]] — built vs stubbed, what's next
11. [[10-Security]] — key rotation, GDPR, exposure log

## Operating principles (non-negotiable)

- **No purple in UI** — coral palette only (`#FF5A5F` accent, `#FFF1E6` surface).
- **Real native iOS components** — `react-native-bottom-tabs` (UITabBarController), not JS imitations.
- **Sora font** everywhere.
- **No unlimited features at any tier** — free is a "taste", every paid tier is cost-capped.
- **Opus 4.7 is dev-only** — never call from a user-facing route.
- **Anonymous users auto-delete on sign-out** — DB stays clean.
- **Communicate in Turkish** with the founder; AI tutor speaks the target language.
