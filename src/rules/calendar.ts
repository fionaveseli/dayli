import type { DayIndex, Gap, PlanData, Task } from '../data/types';
import { dayInfo, gapsOn, loadOf } from './rules';

/** Move a task to another day (or the brain dump with `null`). It stays flexible: no clock. */
export const moveTask = (tasks: Task[], id: string, day: DayIndex | null): Task[] =>
  tasks.map((t) => (t.id === id ? { ...t, day, time: null } : t));

/** Put a task at a time on a day. */
export const placeTask = (tasks: Task[], id: string, day: DayIndex, time: number): Task[] =>
  tasks.map((t) => (t.id === id ? { ...t, day, time } : t));

/** Remove the clock from a task but keep its day. */
export const unplaceTask = (tasks: Task[], id: string): Task[] =>
  tasks.map((t) => (t.id === id ? { ...t, time: null } : t));

const ceil15 = (m: number) => Math.ceil(m / 15) * 15;

/** Open stretches on a day (from `now` onwards when it is today) that can hold `dur` minutes. */
export function fitGaps(
  plan: PlanData,
  day: DayIndex,
  dur: number,
  opts: { taskId?: string; today?: DayIndex; now?: number } = {},
): Gap[] {
  const rest: PlanData = {
    ...plan,
    tasks: plan.tasks.map((t) => (t.id === opts.taskId ? { ...t, time: null } : t)),
  };
  return gapsOn(rest, day)
    .map((g) => ({
      s: day === opts.today && opts.now != null ? Math.max(g.s, ceil15(opts.now)) : g.s,
      e: g.e,
    }))
    .filter((g) => g.e - g.s >= dur);
}

/** What a day would look like if `task` joined it. */
export function loadAfter(plan: PlanData, day: DayIndex, task: Task) {
  const i = dayInfo(plan, day);
  return loadOf(i.planned + (task.day === day ? 0 : task.dur), i.free);
}

/** The Monday of the week containing `d`, at midnight. */
export function weekStart(d: Date): Date {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return m;
}

export function dateOfDay(monday: Date, day: DayIndex): Date {
  return new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + day);
}
