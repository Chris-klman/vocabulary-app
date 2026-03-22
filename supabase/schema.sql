-- Vocabulary App — Supabase Schema
-- Run this once in the Supabase SQL editor for your project.

-- ── words ─────────────────────────────────────────────────────────────────────

create table public.words (
  id                text        primary key,
  user_id           uuid        not null references auth.users(id) on delete cascade,

  word              text        not null,
  language          text        not null check (language in ('en', 'de')),
  translation       text[]      not null default '{}',
  definition        text        not null default '',
  part_of_speech    text[]      not null default '{}',
  ipa               text        not null default '',
  examples          jsonb       not null default '[]',
  synonyms          text[]      not null default '{}',
  related_words     text[]      not null default '{}',
  usage_hints       text[]      not null default '{}',

  difficulty        integer     not null default 3 check (difficulty between 1 and 5),
  ease_factor       numeric     not null default 2.5,
  interval          integer     not null default 1,
  repetitions       integer     not null default 0,
  next_review_date  timestamptz not null default now(),

  source            text        not null check (source in ('user-added', 'curated', 'assessment')),
  date_added        timestamptz not null default now(),
  last_reviewed     timestamptz,
  review_count      integer     not null default 0,
  correct_count     integer     not null default 0,
  incorrect_count   integer     not null default 0,
  status            text        not null default 'learning'
                      check (status in ('learning', 'mastered', 'difficult')),

  cached_response   text,
  cache_timestamp   timestamptz,
  updated_at        timestamptz not null default now()
);

create index words_user_id_idx      on public.words (user_id);
create index words_status_idx       on public.words (user_id, status);
create index words_next_review_idx  on public.words (user_id, next_review_date);
create index words_source_idx       on public.words (user_id, source);

alter table public.words enable row level security;

create policy "Users can view own words"   on public.words for select using (auth.uid() = user_id);
create policy "Users can insert own words" on public.words for insert with check (auth.uid() = user_id);
create policy "Users can update own words" on public.words for update using (auth.uid() = user_id);
create policy "Users can delete own words" on public.words for delete using (auth.uid() = user_id);

-- ── assessment_words ──────────────────────────────────────────────────────────

create table public.assessment_words (
  id              text        primary key,
  user_id         uuid        not null references auth.users(id) on delete cascade,

  word            text        not null,
  translation     text        not null,
  part_of_speech  text        not null default '',
  batch_id        text        not null,
  created_at      timestamptz not null default now(),
  status          text        not null default 'pending'
                    check (status in ('pending', 'known', 'added')),
  updated_at      timestamptz not null default now()
);

create index assessment_words_user_id_idx on public.assessment_words (user_id);
create index assessment_words_status_idx  on public.assessment_words (user_id, status);

alter table public.assessment_words enable row level security;

create policy "Users can view own assessment words"
  on public.assessment_words for select using (auth.uid() = user_id);
create policy "Users can insert own assessment words"
  on public.assessment_words for insert with check (auth.uid() = user_id);
create policy "Users can update own assessment words"
  on public.assessment_words for update using (auth.uid() = user_id);
create policy "Users can delete own assessment words"
  on public.assessment_words for delete using (auth.uid() = user_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_words_updated_at
  before update on public.words
  for each row execute function public.set_updated_at();

create trigger set_assessment_words_updated_at
  before update on public.assessment_words
  for each row execute function public.set_updated_at();
