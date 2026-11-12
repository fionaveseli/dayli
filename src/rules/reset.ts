import type { Chapter, DayIndex, PlanData, Task } from '../data/types';
import { addKey, parseKey, type DateKey } from '../sync/dates';
import { toView, type DatedPlan, type DatedTask } from '../sync/dated';
import { DAYF, fmtD } from './format';
import { rhythmFor } from './rhythm';
import { dayInfo } from './rules';

/** The time of the Sunday reset notification (minutes since midnight). */
export const RESET_TIME = 18 * 60;

/** What happens to a task that slipped: on to next week, back to the brain dump, or let go. */
export type SlipChoice = 'next' | 'dump' | 'drop';

export type WeekReview = {
  done: Task[];
  /** Unfinished tasks of the days up to and including today. */
  slipped: Task[];
  doneMin: number;
};

export function weekReview(week: PlanData, today: DayIndex): WeekReview {
  const inWeek = week.tasks.filter((t) => t.day != null && t.day >= 0 && t.day <= 6);
  const done = inWeek.filter((t) => t.done);
  const slipped = inWeek
    .filter((t) => !t.done && (t.day as number) <= today)
    .sort((a, b) => (a.day as number) - (b.day as number) || b.pri - a.pri);
  return { done, slipped, doneMin: done.reduce((a, t) => a + t.dur, 0) };
}

export type ResetMove = { t: Task; to: DayIndex | null; why: string };

export type WeekProposal = {
  /** Next week's tasks (day indexes of next week) after the proposal. */
  next: PlanData;
  moves: ResetMove[];
  /** New rhythm sessions for next week. */
  sessions: Task[];
};

/**
 * Next week, proposed: slipped tasks the user keeps go to the lightest day with room
 * (never the rest day), most important first; then the rhythms of the chapters running
 * next week fill their sessions on the lightest days that are left.
 */
export function proposeWeek(
  next: PlanData,
  slipped: Task[],
  choices: Record<string, SlipChoice>,
  chapters: Chapter[],
  nextMonday: DateKey,
  newId: () => string,
): WeekProposal {
  let tasks = next.tasks.filter((t) => !slipped.some((s) => s.id === t.id));
  const moves: ResetMove[] = [];
  const keep = slipped
    .filter((t) => (choices[t.id] ?? 'next') === 'next')
    .sort((a, b) => b.pri - a.pri);
  for (const t of keep) {
    let best: { day: DayIndex; r: number; room: number } | null = null;
    for (let day = 0; day < 7; day++) {
      if (day === next.settings.restDay) continue;
      const i = dayInfo({ ...next, tasks }, day);
      const room = i.free - i.planned;
      if (room < t.dur) continue;
      const r = (i.planned + t.dur) / i.free;
      if (!best || r < best.r) best = { day, r, room };
    }
    const moved: Task = { ...t, day: best ? best.day : null, time: null, rolled: true };
    tasks = [...tasks, moved];
    moves.push({
      t,
      to: best ? best.day : null,
      why: best
        ? `${DAYF[best.day]} is the lightest day, with ${fmtD(best.room)} free`
        : 'No day next week has room, so it waits in the brain dump',
    });
  }
  const withMoves = { ...next, tasks };
  const r = rhythmFor(withMoves, chapters, parseKey(nextMonday), nextMonday, newId);
  const all = r ? r.tasks : tasks;
  const known = new Set(tasks.map((t) => t.id));
  return { next: { ...next, tasks: all }, moves, sessions: all.filter((t) => !known.has(t.id)) };
}

export type ResetPreview = {
  thisMonday: DateKey;
  nextMonday: DateKey;
  review: WeekReview;
  proposal: WeekProposal;
};

const dayOf = (now: Date): DayIndex => (now.getDay() + 6) % 7;

/** The review of this week and the proposal for the next one, from the saved plan. */
export function resetPreview(
  d: DatedPlan,
  thisMonday: DateKey,
  now: Date,
  choices: Record<string, SlipChoice>,
  newId: () => string,
): ResetPreview {
  const nextMonday = addKey(thisMonday, 7);
  const review = weekReview(toView(d, thisMonday), dayOf(now));
  const proposal = proposeWeek(
    toView(d, nextMonday),
    review.slipped,
    choices,
    d.chapters ?? [],
    nextMonday,
    newId,
  );
  return { thisMonday, nextMonday, review, proposal };
}

/**
 * Approve the reset: slipped tasks move, go to the brain dump or are let go; next week's
 * rhythm sessions are added; and the week is remembered so neither happens twice.
 */
export function applyReset(
  d: DatedPlan,
  thisMonday: DateKey,
  now: Date,
  choices: Record<string, SlipChoice>,
  newId: () => string,
): DatedPlan {
  const { nextMonday, review, proposal } = resetPreview(d, thisMonday, now, choices, newId);
  const moved = new Map(proposal.moves.map((m) => [m.t.id, m.to]));
  const slipped = new Set(review.slipped.map((t) => t.id));
  const tasks: DatedTask[] = [];
  for (const t of d.tasks) {
    const c = slipped.has(t.id) ? (choices[t.id] ?? 'next') : null;
    if (c === 'drop') continue;
    if (c === 'dump') tasks.push({ ...t, date: null, time: null });
    else if (moved.has(t.id)) {
      const to = moved.get(t.id)!;
      const date = to == null ? null : addKey(nextMonday, to);
      tasks.push({ ...t, date, time: null, rolled: true });
    } else tasks.push(t);
  }
  for (const s of proposal.sessions) {
    const { day, ...rest } = s;
    tasks.push({ ...rest, date: addKey(nextMonday, day as number) });
  }
  return {
    ...d,
    tasks,
    autopilot: { ...d.autopilot, resetWeek: nextMonday, rhythmWeek: nextMonday },
  };
}

/** Whether to offer the reset now: on Sundays, when it is on and next week is not set up yet. */
export function resetDue(plan: PlanData, now: Date, thisMonday: DateKey): boolean {
  return (
    plan.settings.nWeekly && dayOf(now) === 6 && plan.autopilot?.resetWeek !== addKey(thisMonday, 7)
  );
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "16–22 Nov", or "30 Nov – 6 Dec" across months. */
export function weekRange(monday: DateKey): string {
  const a = parseKey(monday);
  const b = parseKey(addKey(monday, 6));
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MON[b.getMonth()]}`
    : `${a.getDate()} ${MON[a.getMonth()]} – ${b.getDate()} ${MON[b.getMonth()]}`;
}
