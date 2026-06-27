-- =============================================================================
-- Placement question bank. Seeded once via apps/web/scripts/seed-placement-questions.ts
-- using Claude Opus, then served read-only at runtime via /api/placement/start.
-- =============================================================================

create table public.placement_questions (
  id text primary key,
  language language_code not null,
  difficulty cefr_level not null,
  category text not null check (category in ('grammar', 'vocabulary', 'context')),
  prompt text not null,
  options jsonb not null,
  correct_answer text not null,
  explanation text,
  created_at timestamptz not null default now()
);

create index placement_questions_lookup_idx
  on public.placement_questions (language, difficulty, category);

alter table public.placement_questions enable row level security;

create policy "auth_read" on public.placement_questions
  for select using (auth.role() = 'authenticated');
