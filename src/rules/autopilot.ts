import type { DayIndex, PlanData, RolloverMove, Task } from '../data/types';
import { DAYF, fmtD, fmtT } from './format';
import { dayInfo, remOn, rolloverPlan } from './rules';
import { toLine } from './today';

const dayIdx = (d: Date): DayIndex => (d.getDay() + 6) % 7;

/** Local calendar date as `YYYY-MM-DD`. */
export function dateKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export type PlanSummary = {
  open: Task[];
  left: number;
  free: number;
  reminders: number;
  leave: { at: number; title: string } | null;
  over: boolean;
  /** The task to offer moving when the day holds more than fits. */
  suggest: Task | null;
  /** The day it would move to, or null for the brain dump. */
  target: DayIndex | null;
};

/** Everything the morning plan card and notification say about a day. */
export function planSummary(S: PlanData, d: DayIndex): PlanSummary {
  const i = dayInfo(S, d, 0);
  const open = i.flex.filter((t) => !t.done);
  const rs = remOn(S, d, 0).filter((r) => !r.done);
  const lv = rs.find((r) => r.leave);
  const over = i.left > i.free;
  const suggest = over
    ? ([...open].sort((a, b) => a.pri - b.pri || b.dur - a.dur)[0] ?? null)
    : null;
  let target: DayIndex | null = null;
  if (suggest) {
    for (let x = d + 1; x < 7; x++) {
      const y = dayInfo(S, x, 0);
      if (y.free - y.planned >= suggest.dur) {
        target = x;
        break;
      }
    }
  }
  return {
    open,
    left: i.left,
    free: i.free,
    reminders: rs.length,
    leave: lv ? { at: lv.at, title: lv.title } : null,
    over,
    suggest,
    target,
  };
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** One line for the card and the morning notification. */
export function planLine(s: PlanSummary): string {
  const lead = s.leave ? `Leave work at ${fmtT(s.leave.at)} to ${toLine(s.leave.title)}. ` : '';
  const rem = s.reminders ? `, and ${plural(s.reminders, 'reminder', 'reminders')}` : '';
  return `${lead}${plural(s.open.length, 'flexible task', 'flexible tasks')} (${fmtD(s.left)}) in ${fmtD(s.free)} of free time${rem}.`;
}

export function planNotificationText(s: PlanSummary, d: DayIndex) {
  const lead = s.leave ? `Leave work at ${fmtT(s.leave.at)}. ` : '';
  return {
    title: `Your ${DAYF[d]} is ready`,
    body: `${lead}${plural(s.open.length, 'task', 'tasks')} (${fmtD(s.left)}) and ${fmtD(s.free)} free. Looks good?`,
  };
}

export type RolloverResult = {
  tasks: Task[];
  moves: RolloverMove[];
  /** The last day covered, to remember so it is not done twice. */
  through: string | null;
};

/** Days of this week (Monday first) that have ended since the last rollover, oldest first. */
function endedDays(plan: PlanData, now: Date): { date: string; day: DayIndex }[] {
  const todayIdx = dayIdx(now);
  const mins = now.getHours() * 60 + now.getMinutes();
  const todayEnded = mins >= plan.settings.sleep;
  const yesterday = dateKey(addDays(now, -1));
  const since = plan.autopilot?.rolledThrough ?? yesterday;
  const out: { date: string; day: DayIndex }[] = [];
  for (let back = todayIdx; back >= 0; back--) {
    if (back === 0 && !todayEnded) continue;
    const date = addDays(now, -back);
    const key = dateKey(date);
    if (key <= since) continue;
    out.push({ date: key, day: dayIdx(date) });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

/**
 * Unfinished tasks of every day that has ended move to the first later day with room,
 * most important first. Tasks never land on a day that has already ended.
 */
export function rolloverFor(plan: PlanData, now: Date): RolloverResult {
  const ended = endedDays(plan, now);
  if (!ended.length) return { tasks: plan.tasks, moves: [], through: null };
  const todayIdx = dayIdx(now);
  const firstOpen =
    plan.settings.sleep <= now.getHours() * 60 + now.getMinutes() ? todayIdx + 1 : todayIdx;
  let cur: PlanData = plan;
  const moves: RolloverMove[] = [];
  for (const { day } of ended) {
    const ms = rolloverPlan(cur, day, Math.max(day + 1, firstOpen));
    moves.push(...ms);
    cur = { ...cur, tasks: applyMoves(cur.tasks, ms) };
  }
  return { tasks: cur.tasks, moves, through: ended[ended.length - 1].date };
}

export function applyMoves(tasks: Task[], moves: RolloverMove[]): Task[] {
  return tasks.map((t) => {
    const m = moves.find((x) => x.t.id === t.id);
    return m ? { ...t, day: m.to, time: null, rolled: true } : t;
  });
}
