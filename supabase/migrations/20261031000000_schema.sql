-- Dayli schema. Every row belongs to one user; row-level security enforces it.
-- Run with `supabase db push`, or paste into the Supabase SQL editor.

create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.settings (
  id text not null default gen_random_uuid()::text,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  time_zone text not null default 'UTC',
  data jsonb not null default '{}',
  autopilot jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  unique (user_id)
);

create table public.tasks (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  cat text not null,
  dur integer not null,
  -- null = brain dump
  date date,
  start_min integer,
  done boolean not null default false,
  notes text not null default '',
  -- plain columns for now; the goals and milestones tables arrive with task 20
  goal_id text,
  milestone_id text,
  pri integer not null default 2,
  repeat boolean not null default false,
  rolled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.fixed_commitments (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  cat text not null,
  -- 0 = Monday … 6 = Sunday
  weekdays smallint[] not null,
  start_min integer not null,
  end_min integer not null,
  place text not null default '',
  starts_on date not null,
  -- null = repeats until removed; a one-off has starts_on = ends_on
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.reminders (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  cat text not null,
  weekdays smallint[] not null,
  time_min integer not null,
  lead integer not null default 10,
  leave boolean not null default false,
  note text not null default '',
  nag boolean not null default false,
  starts_on date not null,
  ends_on date,
  -- dates ticked off, and snoozed dates mapped to the minute they come back
  done_on date[] not null default '{}',
  snooze jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index tasks_user_date on public.tasks (user_id, date);
create index fixed_user_start on public.fixed_commitments (user_id, starts_on);
create index reminders_user_start on public.reminders (user_id, starts_on);

do $$
declare t text;
begin
  foreach t in array array['settings', 'tasks', 'fixed_commitments', 'reminders'] loop
    execute format('create trigger touch_%1$s before update on public.%1$s
                    for each row execute function public.touch_updated_at()', t);
    execute format('alter table public.%1$s enable row level security', t);
    execute format('create policy "own rows" on public.%1$s
                    for all to authenticated
                    using (user_id = (select auth.uid()))
                    with check (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;
