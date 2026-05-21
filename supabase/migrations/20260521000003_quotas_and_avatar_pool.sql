-- =============================================================================
-- Daily usage counters per user. Reset implicitly via quota_date check.
-- =============================================================================

create table public.user_quotas (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  quota_date date not null default current_date,
  voice_seconds_used integer not null default 0,
  video_seconds_used integer not null default 0,
  tutor_messages_used integer not null default 0,
  lessons_started_today integer not null default 0,
  image_generations_used integer not null default 0,
  custom_avatar_generations_used integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_quotas enable row level security;

create policy "owner_read" on public.user_quotas
  for select using (auth.uid() = user_id);

-- =============================================================================
-- Atomic "check & consume" RPC.
--
-- Returns true if the increment fits under the cap, and bumps the counter in
-- the same transaction. Returns false if it would exceed the cap (caller can
-- then route the user to a quieter feature or upsell). Auto-resets the day's
-- row when quota_date < today.
-- =============================================================================

create or replace function public.consume_quota(
  p_user_id uuid,
  p_feature text,
  p_amount integer,
  p_cap integer
) returns boolean
language plpgsql
security definer
as $$
declare
  v_row public.user_quotas%rowtype;
  v_used integer;
begin
  -- Lock the row (or create it) for this user.
  insert into public.user_quotas (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

  select * into v_row from public.user_quotas where user_id = p_user_id for update;

  -- Reset all counters on date rollover.
  if v_row.quota_date < current_date then
    update public.user_quotas set
      quota_date = current_date,
      voice_seconds_used = 0,
      video_seconds_used = 0,
      tutor_messages_used = 0,
      lessons_started_today = 0,
      image_generations_used = 0,
      custom_avatar_generations_used = 0,
      updated_at = now()
    where user_id = p_user_id;
    v_row.voice_seconds_used = 0;
    v_row.video_seconds_used = 0;
    v_row.tutor_messages_used = 0;
    v_row.lessons_started_today = 0;
    v_row.image_generations_used = 0;
    v_row.custom_avatar_generations_used = 0;
  end if;

  v_used := case p_feature
    when 'voice_seconds' then v_row.voice_seconds_used
    when 'video_seconds' then v_row.video_seconds_used
    when 'tutor_messages' then v_row.tutor_messages_used
    when 'lessons_started' then v_row.lessons_started_today
    when 'image_generations' then v_row.image_generations_used
    when 'custom_avatar_generations' then v_row.custom_avatar_generations_used
    else null
  end;

  if v_used is null then
    raise exception 'unknown quota feature: %', p_feature;
  end if;

  if (v_used + p_amount) > p_cap then
    return false;
  end if;

  update public.user_quotas set
    voice_seconds_used = voice_seconds_used + case when p_feature = 'voice_seconds' then p_amount else 0 end,
    video_seconds_used = video_seconds_used + case when p_feature = 'video_seconds' then p_amount else 0 end,
    tutor_messages_used = tutor_messages_used + case when p_feature = 'tutor_messages' then p_amount else 0 end,
    lessons_started_today = lessons_started_today + case when p_feature = 'lessons_started' then p_amount else 0 end,
    image_generations_used = image_generations_used + case when p_feature = 'image_generations' then p_amount else 0 end,
    custom_avatar_generations_used = custom_avatar_generations_used + case when p_feature = 'custom_avatar_generations' then p_amount else 0 end,
    updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$;

-- =============================================================================
-- Global Meshy character pool — shared across all users.
-- Pro users can additionally generate their own (capped by quota).
-- =============================================================================

create table public.avatar_pool (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  art_style text not null default 'pixar',
  preview_image_url text not null,
  glb_url text not null,
  meshy_task_id text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.avatar_pool enable row level security;
create policy "auth_read_active" on public.avatar_pool
  for select using (auth.role() = 'authenticated' and is_active = true);

create index avatar_pool_active_order_idx on public.avatar_pool (is_active, display_order);

-- Each user can pick one pool character as their tutor avatar.
alter table public.profiles
  add column selected_avatar_id uuid references public.avatar_pool(id) on delete set null;

-- Per-user generated avatars (Pro only).
create table public.user_avatars (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  meshy_task_id text not null,
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  prompt text not null,
  preview_image_url text,
  glb_url text,
  created_at timestamptz not null default now()
);

alter table public.user_avatars enable row level security;
create policy "owner_all" on public.user_avatars
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index user_avatars_user_idx on public.user_avatars (user_id, created_at desc);
