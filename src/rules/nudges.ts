import type { DayIndex, PlanData, Task } from '../data/types';
import { fmtD } from './format';
import { gapsOn } from './rules';

/** "Protect my evenings": no nudges from 21:00. */
export const EVENING = 21 * 60;
/** A stretch shorter than this is not worth a nudge. */
export const MIN_NUDGE = 30;
/** At most this many nudges are scheduled for one day. */
export const NUDGES_PER_DAY = 2;

export type Nudge = { task: Task; s: number; e: number };

/** The latest minute a nudge may cover today. */
export const nudgeEnd = (S: PlanData): number =>
  S.settings.protectEvening ? Math.min(S.settings.sleep, EVENING) : S.settings.sleep;

/** Open stretches of the day from `from` on, cut at the evening line. */
function openFrom(S: PlanData, d: DayIndex, from: number) {
  const end = nudgeEnd(S);
  return gapsOn(S, d)
    .map((g) => ({ s: Math.max(g.s, from), e: Math.min(g.e, end) }))
    .filter((g) => g.e - g.s >= MIN_NUDGE);
}

/** The most important unplaced task of the day that fits `len` minutes (the longer one on a tie). */
function pick(S: PlanData, d: DayIndex, len: number, skip: Set<string>): Task | undefined {
  return S.tasks
    .filter((t) => t.day === d && !t.done && t.time == null && t.dur <= len && !skip.has(t.id))
    .sort((a, b) => b.pri - a.pri || b.dur - a.dur)[0];
}

/** "You have a free hour now and the case study fits": the open stretch at `now`, if a task fits it. */
export function nudgeNow(S: PlanData, d: DayIndex, now: number): Nudge | null {
  if (!S.settings.nNudge) return null;
  const g = openFrom(S, d, now).find((x) => x.s === now);
  if (!g) return null;
  const task = pick(S, d, g.e - g.s, new Set());
  return task ? { task, ...g } : null;
}

/** Nudges for the open stretches still to come today, one task each, never in protected evenings. */
export function nudgesFrom(S: PlanData, d: DayIndex, from: number): Nudge[] {
  if (!S.settings.nNudge) return [];
  const used = new Set<string>();
  const out: Nudge[] = [];
  for (const g of openFrom(S, d, from)) {
    if (out.length >= NUDGES_PER_DAY) break;
    const task = pick(S, d, g.e - g.s, used);
    if (!task) continue;
    used.add(task.id);
    out.push({ task, ...g });
  }
  return out;
}

/** "a free hour", "45 free minutes", "2h free". */
export const freeLabel = (m: number): string =>
  m === 60 ? 'a free hour' : m < 60 ? `${m} free minutes` : `${fmtD(m)} free`;

export const nudgeText = (n: Nudge) => ({
  title: `You have ${freeLabel(n.e - n.s)} now`,
  body: `${n.task.title} fits (${fmtD(n.task.dur)}).`,
});
