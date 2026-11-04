-- Goals and milestones (task 20). Tasks keep their plain goal_id and milestone_id columns;
-- the app clears them when a goal or milestone is deleted.

create table public.goals (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null,
  short text not null default '',
  why text not null default '',
  cat text not null,
  -- null = ongoing
  due_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

create table public.milestones (
  id text not null,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id text not null,
  title text not null,
  -- the soft target date
  due_on date,
  -- reached by hand, for a milestone with no tasks to count
  done boolean not null default false,
  pos integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, goal_id) references public.goals (user_id, id) on delete cascade
);

create index milestones_user_goal on public.milestones (user_id, goal_id);

do $$
declare t text;
begin
  foreach t in array array['goals', 'milestones'] loop
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
