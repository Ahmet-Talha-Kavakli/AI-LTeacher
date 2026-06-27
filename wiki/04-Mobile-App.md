# 04 · Mobile App

`apps/mobile/` — Expo SDK 54, React Native 0.81, bundle `com.suno.app`, Metro on port **8082** (parallel to Lyra on 8081).

## Routing tree (expo-router)

```
app/
├── _layout.tsx                  ← Root: providers (QueryClient, Theme), fonts, Stack
├── (onboarding)/
│   ├── _layout.tsx
│   ├── index.tsx                ← Welcome (anonymous + email sign-in)
│   ├── sign-up.tsx              ← Email/password modal
│   ├── language.tsx             ← Pick EN/ES/DE
│   ├── accent.tsx               ← Pick US/GB/SCT/AU etc.
│   ├── placement.tsx            ← 15-question quiz, fetched from /api/placement/start
│   └── result.tsx               ← CEFR result + defensive user_languages write
├── (tabs)/
│   ├── _layout.tsx              ← NativeBottomTabs (UITabBarController)
│   ├── learn.tsx                ← Daily lesson path
│   ├── practice.tsx             ← Quick practice options + Online Düello stub
│   ├── tutor.tsx                ← Mode picker: Yazılı / Sesli / Video
│   ├── leaderboard.tsx          ← Top 100 + my rank (sample data only)
│   └── profile.tsx              ← Avatar, stats, settings, sign-out
├── lesson/[id].tsx              ← Lesson modal (placeholder)
└── tutor/
    ├── chat.tsx                 ← Yazılı sohbet — streaming gpt-4o-mini
    └── voice.tsx                ← Sesli sohbet (stub)
```

Stack screen options registered in root `_layout.tsx`:
- `(onboarding)` and `(tabs)` as default groups
- `lesson/[id]` and `tutor/chat` as `modal`
- `tutor/voice` as `fullScreenModal`

## Native iOS UI (no JS imitations)

| | Library | Wraps |
|---|---|---|
| Tab bar | `react-native-bottom-tabs` + `@bottom-tabs/react-navigation` | UITabBarController |
| Nav stack | `react-native-screens` native stack | UINavigationController |
| Icons | `expo-symbols` | SF Symbols |
| Alerts | `react-native` Alert | UIAlertController |
| Audio | `expo-audio` | AVAudioPlayer/Recorder |
| Video | `expo-video` | AVPlayer |
| Storage | `expo-secure-store` | Keychain |
| Auth | `expo-apple-authentication` | ASAuthorizationAppleIDProvider |
| Subscriptions | `react-native-purchases` (RevenueCat) | StoreKit |

Apple Native UI Requirement is a [[10-Security|locked decision]] — see also `feedback_apple_native` memory.

## Brand system

`apps/mobile/theme/index.ts`:
- `FONT`: Sora_400/500/600/700/800 (loaded via `@expo-google-fonts/sora`)
- `SPACING`: xs..xxxl scale
- `RADIUS`: sm..pill
- `TEXT`: display, title, heading, body, bodyMedium, callout, caption, button
- Colors imported from `@ailt/shared/brand`

Theme accessed via `useTheme()` hook ([apps/mobile/hooks/use-theme.ts](../apps/mobile/hooks/use-theme.ts)).

## UI primitives

Under `components/ui/`:
- `Screen` — SafeAreaView wrapper with optional scroll/padded
- `Text` — Sora-typed variant + color + align
- `Button` — primary/secondary/ghost, lg/md/sm, haptics
- `Card` — surface/accent variants
- `IconSymbol` — SF Symbol via expo-symbols (iOS) / vector-icons fallback

## State and data

| Concern | Approach |
|---|---|
| Auth session | `hooks/use-session.ts` — wraps `supabase.auth.onAuthStateChange` |
| Onboarding draft | `state/onboarding.ts` — Zustand store (language, accent, answers) |
| Primary language | `hooks/use-primary-language.ts` — queries `user_languages` |
| Quota + cooldown | `hooks/use-quota-status.ts` — fetches `/api/quota/status` |
| Server queries | TanStack Query (`QueryClientProvider` at root) — currently underused, available for future caching |
| API calls | `lib/api.ts` — wraps fetch, auto-attaches Bearer JWT, 401 handler |
| AI streaming | `@ai-sdk/react` `useChat` + custom `DefaultChatTransport` using `expo/fetch` |

## Chat screen specifics

`app/tutor/chat.tsx` is two components:
1. **Outer** — loads session + primary language. Renders splash/empty states.
2. **Inner `ChatBody`** — only mounts once both are loaded. Owns the `useChat` hook so transport is guaranteed configured.

Why this split: `useChat` initialized with a null transport silently falls back to `localhost/api/chat` and 404s. Lazy mount avoids it.

Other implementation notes:
- `expo/fetch` is mandatory for streaming (RN's default fetch doesn't expose `response.body` as a ReadableStream).
- KeyboardAvoidingView with iOS `padding` behavior.
- Suggestion chips on empty state.
- Typing indicator while `status === 'submitted' | 'streaming'`.
- `onFinish` refreshes quota status (catches strikes that just landed).
- Cooldown card replaces the entire chat UI when `quota.moderation.cooldownUntil` is set.

## Sign-out flow

`lib/auth-actions.ts` `signOut()`:
1. If `session.user.is_anonymous` → POST `/api/account/delete-if-anonymous` (best-effort)
2. `supabase.auth.signOut()` (clears SecureStore)

Result: anonymous users don't accumulate ghost rows; registered users sign out normally.

## Environment

`apps/mobile/.env.local` (gitignored):
```
EXPO_PUBLIC_SUPABASE_URL=https://hhocxlqgsdgbhcruyphp.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc…
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000   # change for LAN device testing
```

Only `EXPO_PUBLIC_*` values are baked into the bundle. Never put AI provider keys here.

## Build artifacts

- `ios/` regenerated by `npx expo prebuild --clean` — do not hand-edit
- iOS app installed via `npx expo run:ios --device "iPhone 17" --port 8082`
- `expo-dev-client` is required; without it the deeplink to Metro is ignored

See [[08-Dev-Workflow]] for full setup commands.
