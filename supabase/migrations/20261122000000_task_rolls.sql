-- Stuck tasks (task 27): how many times a task has moved forward unfinished
-- since the user last decided on it. At 3 the app asks whether it still matters.
alter table public.tasks add column rolls integer not null default 0;
