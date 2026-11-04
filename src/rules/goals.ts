import type { Goal, Milestone, Task } from '../data/types';
import { parseKey } from '../sync/dates';

export type MilestoneState = 'done' | 'current' | 'upcoming';

export type MilestoneInfo = Milestone & {
  tasks: Task[];
  done: boolean;
  total: number;
  doneCount: number;
  /** 0 … 1 */
  p: number;
  state: MilestoneState;
};

export type GoalInfo = Goal & {
  milestones: MilestoneInfo[];
  steps: number;
  stepsDone: number;
  /** 0 … 1, the average of its milestones. */
  p: number;
  next?: MilestoneInfo;
};

/** A milestone is as far along as the share of its tasks that are done. */
function milestoneInfo(m: Milestone, tasks: Task[]): Omit<MilestoneInfo, 'state'> {
  const mine = tasks.filter((t) => t.ms === m.id);
  const doneCount = mine.filter((t) => t.done).length;
  const p = mine.length ? doneCount / mine.length : m.done ? 1 : 0;
  return { ...m, tasks: mine, total: mine.length, doneCount, p };
}

/** Progress for one goal. The first milestone not yet reached is the current one. */
export function goalInfo(goal: Goal, milestones: Milestone[], tasks: Task[]): GoalInfo {
  const ms = milestones
    .filter((m) => m.goalId === goal.id)
    .sort((a, b) => a.pos - b.pos)
    .map((m) => milestoneInfo(m, tasks));
  let found = false;
  const list: MilestoneInfo[] = ms.map((m) => {
    if (m.p >= 1 && (m.total > 0 || m.done)) return { ...m, state: 'done' };
    if (!found) {
      found = true;
      return { ...m, state: 'current' };
    }
    return { ...m, state: 'upcoming' };
  });
  const mine = tasks.filter((t) => t.goal === goal.id);
  return {
    ...goal,
    milestones: list,
    steps: mine.length,
    stepsDone: mine.filter((t) => t.done).length,
    p: list.length ? list.reduce((a, m) => a + m.p, 0) / list.length : 0,
    next: list.find((m) => m.state === 'current'),
  };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** `2026-11-15` → `15 Nov`; no date reads as "Ongoing". */
export function fmtDue(due: string | null): string {
  if (!due) return 'Ongoing';
  const d = parseKey(due);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** Accepts `YYYY-MM-DD` that is a real calendar date. */
export function validDue(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const d = parseKey(text);
  const [y, m, day] = text.split('-').map(Number);
  return d.getFullYear() === y && d.getMonth() === m - 1 && d.getDate() === day;
}
