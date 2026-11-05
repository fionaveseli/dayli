-- Life chapters (task 21). A goal points at its chapter with a plain chapter_id column;
-- the app clears it when a chapter is deleted.

create table public.chapters (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  starts_on date not null,
  ends_on date not null,
  color text not null default 'lav',
  descr text not null default '',
  -- how a closed chapter went
  summary text not null default '',
  -- weekly rhythm: [{ title, cat, freq, dur }]
  rhythm jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  check (ends_on >= starts_on)
);

alter table public.goals add column chapter_id text;

create trigger touch_chapters before update on public.chapters
  for each row execute function public.touch_updated_at();
alter table public.chapters enable row level security;
create policy "own rows" on public.chapters
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
