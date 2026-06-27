# 00 · Overview

## What Suno is

Mobile-first AI language tutor that beats Duolingo on conversational quality and Praktika.ai on price/quality of voice tutoring.

Target users learn English, Spanish, or German. They get a CEFR placement quiz on sign-up, a daily lesson path, an AI tutor for chat/voice/video, and gamified progression (streak, XP, hearts).

## V1 scope (8–12 weeks)

| | V1 | V1.1 | V2 |
|---|---|---|---|
| Languages | EN, ES, DE | + JA, AR (RTL) | + 5 more |
| Accents | US/GB/SCT/AU, ES/MX, DE/AT | — | — |
| AI tutor — text | ✅ gpt-4o-mini streaming | — | — |
| AI tutor — voice | iOS Speech + ElevenLabs Turbo | + custom accents | — |
| AI tutor — video | Meshy avatar pool (Pixar) | + custom char (Pro) | Photoreal (Tavus/HeyGen) |
| Placement quiz | 15 questions, Haiku scoring | + adaptive routing | + listening, free translation |
| Lessons | Generated once via Opus seed | + branching dialogs | — |
| Gamification | Streak, XP, hearts, leaderboard | + leagues | + multiplayer quiz |
| Auth | Anonymous, email | + Apple Sign-In | + Google |
| Payments | RevenueCat Free/Plus/Pro | — | — |

## Status snapshot (2026-05-22)

Working end-to-end:
- Anonymous sign-up flow
- Onboarding (language → accent → placement → result)
- Native iOS tabs
- Text tutor chat (gpt-4o-mini streaming)
- Moderation pipeline (3-strike escalating cooldowns)
- Quota system (per-feature, per-tier, daily reset)

Stubbed but not user-facing yet:
- Voice tutor (ElevenLabs)
- Video avatar (Meshy)
- Lessons (catalog empty)
- Leaderboard (UI sample data only)

See [[09-Roadmap]] for the punch list.

## Brand

- Name: **Suno**
- Tagline: "Konuş, gül, öğren."
- Accent color: `#FF5A5F` (coral)
- Surface: `#FFF1E6` (warm cream)
- Font: Sora (Google Fonts)
- Logo: filled coral speech bubble (SF Symbol `quote.bubble.fill` placeholder; custom SVG / mascot in v2)

Decisions documented in `packages/shared/src/brand.ts`.

## Owner / Stack at a glance

- Founder: Ahmet Talha Kavakli ([github.com/Ahmet-Talha-Kavakli/AI-LTeacher](https://github.com/Ahmet-Talha-Kavakli/AI-LTeacher))
- Monorepo: pnpm + Turborepo
- iOS: React Native (Expo SDK 54), bundle `com.suno.app`
- Web/API: Next.js 16 on Vercel
- Data: Supabase (Postgres + Auth + Storage + Realtime)
- AI: OpenAI gpt-4o-mini (chat), Anthropic Haiku 4.5 (placement), Anthropic Opus 4.7 (dev-only content)
- Voice (planned): ElevenLabs Conversational AI + iOS SFSpeechRecognizer
- Avatar (planned): Meshy text-to-3D

Details: [[01-Architecture]] · [[05-AI-Models]].
