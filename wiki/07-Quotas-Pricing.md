# 07 · Quotas + Pricing

## Pricing philosophy

**No feature is unlimited at any tier.** Free is a "taste" (founder's words: *ağıza parmak bal*). Paid tiers are cost-capped so that AI spend stays under ~50% of subscription revenue.

This is the core defense against power-user abuse and runaway costs.

## Tier limits (current)

Defined in [packages/shared/src/quotas.ts](../packages/shared/src/quotas.ts):

| Feature | Free | Plus | Pro |
|---|---|---|---|
| Sesli tutor (saniye/gün) | 5 dk (300) | 30 dk (1800) | 120 dk (7200) |
| Video avatar (saniye/gün) | 0 | 5 dk (300) | 30 dk (1800) |
| Yazılı mesaj (gün) | 30 | 500 | 5000 |
| Ders başlatma (gün) | 3 | 25 | 100 |
| Görsel üretim (gün) | 0 | 10 | 50 |
| Özel karakter üretimi (gün) | 0 | 0 | 3 |

These will tune based on observed cost-per-user once we have real traffic.

## Expected per-tier economics

| Tier | Subscription | AI cost (typical user) | Margin |
|---|---|---|---|
| Free | $0 | ~$0.50/month | viral investment |
| Plus | $9.99 | ~$3–4/month | ~$6 |
| Pro | $19.99 | ~$10–12/month | ~$8 |

Power users will push the upper bounds, but daily caps prevent any single user from blowing through more than the tier budget allows.

## Enforcement — `consume_quota` RPC

PostgreSQL function in `supabase/migrations/20260521000003_quotas_and_avatar_pool.sql`:

```sql
consume_quota(p_user_id, p_feature, p_amount, p_cap) RETURNS boolean
```

Behavior:
1. Locks the user's `user_quotas` row (creates one if absent).
2. If `quota_date < current_date` → resets all counters.
3. Returns false if `current + amount > cap`. No mutation in this branch.
4. Otherwise increments the relevant counter, returns true.

All atomic in a single transaction. No race conditions even under concurrent requests.

## Server wrapper — [lib/quota.ts](../apps/web/lib/quota.ts)

`consume(userId, feature, amount = 1, tier?)` — calls the RPC. On false, returns `{ ok: false, tier, feature, cap }`.

`quotaExceededResponse(tier, feature, cap)` — returns 402 with:
```json
{
  "error": "quota_exceeded",
  "tier": "free",
  "feature": "tutorMessages",
  "cap": 30,
  "suggestion": "upgrade_plus"
}
```

`getQuotaStatus(userId)` — returns the user's tier, today's usage, and the full limits map. Used by `/api/quota/status`.

## Endpoint coverage

| Endpoint | Quota consumed |
|---|---|
| `POST /api/tutor/chat` | `tutorMessages` += 1 per message |
| `POST /api/tutor/voice-token` | none upfront; gates only if `remaining < 30s` |
| `POST /api/tutor/voice-end` | `voiceSeconds` or `videoSeconds` += reported duration |
| `POST /api/images/generate` | `imageGenerations` += 1 |
| `POST /api/avatar/generate` | `customAvatarGenerations` += 1 (Pro only — Free/Plus get cap=0 short-circuit) |
| `POST /api/placement/start` / `/submit` | not gated (one-time per language enrollment) |

## Mobile awareness

`hooks/use-quota-status.ts` fetches `/api/quota/status` and exposes:
- `data.usage` — current day's counters
- `data.limits` — tier's caps
- `data.moderation` — strike count, cooldown level, cooldown_until
- `refresh()` — manual reload

The chat screen polls this on mount and after each `onFinish` from `useChat`. Future: surface "5/30 mesaj kaldı" indicators on every quota-gated screen.

## Cooldown vs quota — distinct systems

| | Quota exceeded | Moderation cooldown |
|---|---|---|
| Trigger | Daily counter hits cap | 3 strikes in current cycle |
| HTTP status | 402 | 403 |
| User can resume | Tomorrow (auto-reset) or upgrade tier | After cooldown_until |
| Mobile UX | Inline error + upsell card (TODO) | Full-screen cooldown card with timer |
| Scope | Per-feature | Whole tutor chat (lessons/leaderboard still work) |

Both check happen at the start of `/api/tutor/chat`: cooldown first (cheap DB read), then quota (RPC), then moderation (network call to OpenAI).

## RevenueCat integration (planned)

`react-native-purchases` is installed but not wired. The flow when ready:

1. User opens `Profil → Abonelik` → RevenueCat paywall
2. On purchase, RevenueCat webhook updates `profiles.subscription_tier`
3. Next API call: `getTier()` returns the new tier → new caps apply immediately

Apple Developer account is the blocker.
