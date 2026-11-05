import type { Chapter, Goal, Milestone, Task } from '../data/types';
import { addKey, parseKey } from '../sync/dates';
import { goalInfo, validDue, type GoalInfo } from './goals';

export type ChapterStatus = 'now' | 'next' | 'past';

export type ChapterInfo = Chapter & {
  status: ChapterStatus;
  /** Length in days, both ends counted. */
  total: number;
  /** Days of the chapter that have begun, today included; 0 before it starts. */
  elapsed: number;
  left: number;
  /** Share of the time that has passed, 0 … 1. */
  tp: number;
  startsIn: number;
  goals: GoalInfo[];
  /** Average progress of its goals, 0 … 1. */
  gp: number;
  milestonesDone: number;
  milestonesTotal: number;
};

const DAY = 86400000;
/** Whole days from `a` to `b` (local dates, so daylight saving does not skew it). */
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.UTC(...ymd(b)) - Date.UTC(...ymd(a))) / DAY);
function ymd(k: string): [number, number, number] {
  const [y, m, d] = k.split('-').map(Number);
  return [y, m - 1, d];
}

export function chapterStatus(c: Pick<Chapter, 'start' | 'end'>, today: string): ChapterStatus {
  if (c.end < today) return 'past';
  if (c.start > today) return 'next';
  return 'now';
}

export function chapterInfo(
  c: Chapter,
  goals: Goal[],
  milestones: Milestone[],
  tasks: Task[],
  today: string,
): ChapterInfo {
  const status = chapterStatus(c, today);
  const total = daysBetween(c.start, c.end) + 1;
  const elapsed = Math.max(0, Math.min(total, daysBetween(c.start, today) + 1));
  const mine = goals.filter((g) => g.chapterId === c.id).map((g) => goalInfo(g, milestones, tasks));
  const ms = mine.flatMap((g) => g.milestones);
  return {
    ...c,
    status,
    total,
    elapsed,
    left: total - elapsed,
    tp: status === 'past' ? 1 : status === 'next' ? 0 : elapsed / total,
    startsIn: Math.max(0, daysBetween(today, c.start)),
    goals: mine,
    gp: status === 'past' ? 1 : mine.length ? mine.reduce((a, g) => a + g.p, 0) / mine.length : 0,
    milestonesDone: ms.filter((m) => m.state === 'done').length,
    milestonesTotal: ms.length,
  };
}

/** Current chapters first, then upcoming (soonest first), then closed (latest first). */
export function groupChapters<T extends Pick<Chapter, 'start' | 'end'>>(list: T[], today: string) {
  const by = (s: ChapterStatus) => list.filter((c) => chapterStatus(c, today) === s);
  return {
    now: by('now').sort((a, b) => a.start.localeCompare(b.start)),
    next: by('next').sort((a, b) => a.start.localeCompare(b.start)),
    past: by('past').sort((a, b) => b.end.localeCompare(a.end)),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDay = (k: string) => {
  const d = parseKey(k);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};
/** `1 Sep – 31 Jan`; the year is added when the range leaves the given year. */
export function fmtRange(start: string, end: string, today: string) {
  const y = today.slice(0, 4);
  const a = start.slice(0, 4) === y ? fmtDay(start) : `${fmtDay(start)} ${start.slice(0, 4)}`;
  const b = end.slice(0, 4) === y ? fmtDay(end) : `${fmtDay(end)} ${end.slice(0, 4)}`;
  return `${a} – ${b}`;
}

export function chapterMeta(c: ChapterInfo): string {
  if (c.status === 'now') return `Day ${c.elapsed} of ${c.total} · ${c.left} days left`;
  if (c.status === 'next') return `Starts in ${c.startsIn} days`;
  return c.summary || 'Closed';
}

export type ChapterTemplate = {
  key: string;
  label: string;
  hint: string;
  color: Chapter['color'];
  name: string;
  /** Months from the start. */
  months: number;
  desc: string;
};

export const CHAPTER_TEMPLATES: ChapterTemplate[] = [
  {
    key: 'semester',
    label: 'University semester',
    hint: '4–5 months · classes around work',
    color: 'powder',
    name: 'University Semester',
    months: 5,
    desc: 'Evening classes after work and one big project.',
  },
  {
    key: 'sprint',
    label: 'Career sprint',
    hint: '3 months · one clear outcome',
    color: 'blush',
    name: 'Career Sprint',
    months: 3,
    desc: 'Apply widely, practise weekly, and keep energy up.',
  },
  {
    key: 'fitness',
    label: 'Fitness journey',
    hint: '6 months · build a habit',
    color: 'sage',
    name: 'Six Months Stronger',
    months: 6,
    desc: 'Four sessions a week and a 10K in spring.',
  },
  {
    key: 'custom',
    label: 'Something else',
    hint: 'Any stretch of life',
    color: 'lav',
    name: '',
    months: 3,
    desc: '',
  },
];

/** The day before the same day `months` later: 1 Feb + 5 months ends on 30 Jun. */
export function endAfterMonths(start: string, months: number): string {
  const d = parseKey(start);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months, 1);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  const p = (n: number) => String(n).padStart(2, '0');
  return addKey(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, -1);
}

/** Name and dates must make sense before a chapter can be made. */
export function chapterFormOk(f: { name: string; start: string; end: string }) {
  return !!f.name.trim() && validDue(f.start) && validDue(f.end) && f.end > f.start;
}
