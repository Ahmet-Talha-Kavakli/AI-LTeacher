-- =============================================================================
-- AI Language Teacher — Initial schema
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- --- Enums ------------------------------------------------------------------

create type cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');

create type language_code as enum ('en', 'es', 'de');

create type accent_code as enum (
  'en-US', 'en-GB', 'en-SCT', 'en-AU',
  'es-ES', 'es-MX',
  'de-DE', 'de-AT'
);

create type lesson_type as enum (
  'vocab', 'grammar', 'listening', 'speaking', 'reading', 'writing', 'conversation'
);

create type subscription_tier as enum ('free', 'plus', 'pro');

-- --- Profiles ---------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  native_language language_code,
  subscription_tier subscription_tier not null default 'free',
  total_xp integer not null default 0,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_active_date date,
  hearts integer not null default 5,
  hearts_refill_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_xp_idx on public.profiles (total_xp desc);
create index profiles_streak_idx on public.profiles (current_streak desc);

-- --- User language enrollment ----------------------------------------------

create table public.user_languages (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language language_code not null,
  accent accent_code not null,
  current_level cefr_level not null default 'A1',
  target_level cefr_level,
  is_primary boolean not null default false,
  enrolled_at timestamptz not null default now(),
  unique (user_id, language)
);

create index user_languages_user_idx on public.user_languages (user_id);

-- --- Placement quiz results -------------------------------------------------

create table public.placement_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language language_code not null,
  level cefr_level not null,
  confidence numeric(3, 2) not null,
  raw_answers jsonb not null,
  rationale text,
  created_at timestamptz not null default now()
);

create index placement_results_user_idx on public.placement_results (user_id, language);

-- --- Lesson catalog ---------------------------------------------------------

create table public.lessons (
  id uuid primary key default uuid_generate_v4(),
  language language_code not null,
  level cefr_level not null,
  unit_number integer not null,
  lesson_number integer not null,
  type lesson_type not null,
  title text not null,
  description text,
  xp_reward integer not null default 10,
  estimated_duration_seconds integer not null default 300,
  content jsonb not null,
  is_premium boolean not null default false,
  created_at timestamptz not null default now(),
  unique (language, level, unit_number, lesson_number)
);

create index lessons_path_idx on public.lessons (language, level, unit_number, lesson_number);

-- --- User lesson progress ---------------------------------------------------

create table public.user_lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  status text not null check (status in ('locked', 'available', 'in_progress', 'completed', 'mastered')),
  score numeric(5, 2),
  attempts integer not null default 0,
  started_at timestamptz,
  completed_at timestamptz,
  last_seen_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index user_lesson_progress_user_idx on public.user_lesson_progress (user_id, status);

-- --- XP / activity events ---------------------------------------------------

create table public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  source text not null,
  amount integer not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

-- --- Conversation sessions (AI tutor) ---------------------------------------

create table public.tutor_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  language language_code not null,
  accent accent_code not null,
  mode text not null check (mode in ('text', 'voice', 'video')),
  duration_seconds integer not null default 0,
  topic text,
  transcript jsonb,
  created_at timestamptz not null default now()
);

create index tutor_sessions_user_idx on public.tutor_sessions (user_id, created_at desc);

-- --- Achievements / trophies ------------------------------------------------

create table public.achievements (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  title text not null,
  description text not null,
  icon text not null,
  xp_reward integer not null default 0
);

create table public.user_achievements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- --- Leaderboard view (global, all-time, weekly) ---------------------------

create or replace view public.leaderboard_global as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.total_xp,
  p.current_streak,
  row_number() over (order by p.total_xp desc) as rank
from public.profiles p
where p.username is not null;

create or replace view public.leaderboard_weekly as
select
  p.id as user_id,
  p.username,
  p.display_name,
  p.avatar_url,
  coalesce(sum(xe.amount), 0)::int as weekly_xp,
  row_number() over (order by coalesce(sum(xe.amount), 0) desc) as rank
from public.profiles p
left join public.xp_events xe
  on xe.user_id = p.id
  and xe.created_at >= date_trunc('week', now())
where p.username is not null
group by p.id;

-- --- Row Level Security -----------------------------------------------------

alter table public.profiles enable row level security;
alter table public.user_languages enable row level security;
alter table public.placement_results enable row level security;
alter table public.user_lesson_progress enable row level security;
alter table public.xp_events enable row level security;
alter table public.tutor_sessions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.lessons enable row level security;
alter table public.achievements enable row level security;

-- Profiles: anyone reads, only owner writes (username/avatar may be public).
create policy "profiles_public_read" on public.profiles for select using (true);
create policy "profiles_owner_update" on public.profiles for update using (auth.uid() = id);
create policy "profiles_owner_insert" on public.profiles for insert with check (auth.uid() = id);

-- User-owned tables.
create policy "owner_all" on public.user_languages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_all" on public.placement_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_all" on public.user_lesson_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_all" on public.xp_events for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_all" on public.tutor_sessions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner_read" on public.user_achievements for select using (auth.uid() = user_id);
create policy "owner_insert" on public.user_achievements for insert with check (auth.uid() = user_id);

-- Catalog tables: read-only for authenticated users.
create policy "auth_read" on public.lessons for select using (auth.role() = 'authenticated');
create policy "auth_read" on public.achievements for select using (auth.role() = 'authenticated');

-- --- Triggers ---------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();
