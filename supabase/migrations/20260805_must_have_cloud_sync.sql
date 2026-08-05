-- Optional cloud tables for Vizag Jobs Android must-have features.
-- Apply against the production Vizag Jobs Supabase project when ready.
-- The app already falls back to private storage + local AsyncStorage if these
-- tables are missing.

-- Saved jobs synced to the student account
create table if not exists public.student_saved_jobs (
  user_id uuid not null references auth.users (id) on delete cascade,
  job_id text not null,
  job_snapshot jsonb not null default '{}'::jsonb,
  saved_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, job_id)
);

create index if not exists student_saved_jobs_user_saved_at_idx
  on public.student_saved_jobs (user_id, saved_at desc);

alter table public.student_saved_jobs enable row level security;

drop policy if exists "Students manage own saved jobs" on public.student_saved_jobs;
create policy "Students manage own saved jobs"
on public.student_saved_jobs
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Job alert preferences
create table if not exists public.job_alert_subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  categories text[] not null default '{}',
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.job_alert_subscriptions enable row level security;

drop policy if exists "Students manage own job alerts" on public.job_alert_subscriptions;
create policy "Students manage own job alerts"
on public.job_alert_subscriptions
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Expo / device push tokens
create table if not exists public.device_push_tokens (
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null,
  platform text not null default 'unknown',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, token)
);

create index if not exists device_push_tokens_user_idx
  on public.device_push_tokens (user_id);

alter table public.device_push_tokens enable row level security;

drop policy if exists "Students manage own push tokens" on public.device_push_tokens;
create policy "Students manage own push tokens"
on public.device_push_tokens
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
