-- =============================================================================
-- Content moderation strike system. Tracks per-user strikes from OpenAI
-- moderation flags, applies escalating cooldowns, and logs every event for
-- post-hoc auditing and threshold tuning.
-- =============================================================================

alter table public.profiles
  add column strike_count integer not null default 0,
  add column cooldown_until timestamptz,
  add column cooldown_level integer not null default 0,
  add column last_strike_at timestamptz;

-- Moderation event log — every flagged message, even if it didn't trigger a
-- cooldown. Used to audit false positives, tune thresholds, and respond to
-- App Store / GDPR inquiries.
create table public.moderation_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  -- First 200 chars of the offending message. Truncated to limit storage and
  -- reduce sensitivity. NULL if user has requested data minimization.
  message_snippet text,
  -- Raw category scores from OpenAI moderation API. Keys are category names
  -- ("sexual", "violence/graphic", etc.), values are floats in [0, 1].
  category_scores jsonb not null,
  -- The category that crossed our threshold first (max score among flagged).
  triggered_category text not null,
  triggered_score numeric(4, 3) not null,
  -- 'warn' = strike recorded, chat continues. 'cooldown' = session ended.
  action text not null check (action in ('warn', 'cooldown')),
  -- Strike count after this event was processed.
  strike_at_time integer not null,
  -- If cooldown was applied, when it ends.
  cooldown_until timestamptz,
  created_at timestamptz not null default now()
);

create index moderation_events_user_idx
  on public.moderation_events (user_id, created_at desc);

alter table public.moderation_events enable row level security;

-- Users can read their own events (transparency); only the service role
-- writes them (no INSERT/UPDATE policy → blocked for normal clients).
create policy "owner_read" on public.moderation_events
  for select using (auth.uid() = user_id);
