import type { Chapter, DayIndex, PlanData, RhythmItem, Task } from '../data/types';
import { chapterStatus } from './chapters';
import { dayInfo } from './rules';

const weekIndexOf = (now: Date): DayIndex => (now.getDay() + 6) % 7;
const pad = (n: number) => String(n).padStart(2, '0');
const keyOf = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** A session made by a rhythm: same title and category, and it repeats weekly. */
const isSession = (t: Task, r: RhythmItem) =>
  t.repeat && t.title === r.title && t.cat === r.cat && t.day != null && t.day >= 0;

/**
 * The sessions still missing from this week for one rhythm item. Each goes on the day
 * (today or later, never the rest day, never twice on one day) where the load after adding
 * it is lightest and it fits. Sessions already in the week, done or moved, count.
 * Existing sessions are never touched, so moving one leaves the others where they are.
 */
export function rhythmSessions(
  plan: PlanData,
  item: RhythmItem,
  fromDay: DayIndex,
  newId: () => string,
): Task[] {
  const made = plan.tasks.filter((t) => isSession(t, item));
  const taken = new Set(made.map((t) => t.day as DayIndex));
  const out: Task[] = [];
  let tasks = plan.tasks;
  for (let n = made.length; n < item.freq; n++) {
    let best: { day: DayIndex; r: number } | null = null;
    for (let day = Math.max(0, fromDay); day < 7; day++) {
      if (day === plan.settings.restDay || taken.has(day)) continue;
      const i = dayInfo({ ...plan, tasks }, day);
      if (i.free - i.planned < item.dur) continue;
      const r = (i.planned + item.dur) / i.free;
      if (!best || r < best.r) best = { day, r };
    }
    if (!best) break;
    taken.add(best.day);
    const t: Task = {
      id: newId(),
      title: item.title,
      cat: item.cat,
      dur: item.dur,
      day: best.day,
      time: null,
      done: false,
      notes: '',
      goal: null,
      ms: null,
      pri: 2,
      repeat: true,
    };
    out.push(t);
    tasks = [...tasks, t];
  }
  return out;
}

/**
 * Add this week's missing sessions for every rhythm of the chapters running today.
 * Returns null when this week was already done, so deleted sessions do not come back.
 */
export function rhythmFor(
  plan: PlanData,
  chapters: Chapter[],
  now: Date,
  monday: string,
  newId: () => string = () =>
    `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
): { tasks: Task[] } | null {
  if (plan.autopilot?.rhythmWeek === monday) return null;
  const today = keyOf(now);
  const fromDay = weekIndexOf(now);
  let tasks = plan.tasks;
  for (const c of chapters) {
    if (chapterStatus(c, today) !== 'now') continue;
    for (const item of c.rhythm) {
      const add = rhythmSessions({ ...plan, tasks }, item, fromDay, newId);
      tasks = [...tasks, ...add];
    }
  }
  return { tasks };
}
