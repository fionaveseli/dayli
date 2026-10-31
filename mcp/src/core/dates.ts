import { DAYF } from '../dayli';
import type { LocalNow } from './clock';
import { ToolError } from './errors';

/**
 * Dayli stores days as 0–6 (Monday–Sunday) with no week attached, so it can only
 * describe the current week. Every day a tool receives goes through `resolveDay`,
 * which either maps it to a day in this week or refuses with a clear error.
 */
export type DayRef = {
  dayIndex: number;
  dayName: string;
  date: string;
  isToday: boolean;
  isPast: boolean;
  week: { start: string; end: string };
};

export const ACCEPTED_DAYS =
  'Use "today", "tomorrow", a weekday name such as "friday", or a date as YYYY-MM-DD within this week.';

const NAMES = DAYF.map((d) => d.toLowerCase());

/** Adds days to a YYYY-MM-DD date without time zone surprises. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function weekOf(now: LocalNow) {
  const start = addDays(now.date, -now.dayIndex);
  return { start, end: addDays(start, 6) };
}

function weekdayIndex(word: string): number | null {
  const i = NAMES.findIndex((n) => n === word || n.slice(0, 3) === word);
  return i === -1 ? null : i;
}

function isRealDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  return addDays(s, 0) === s;
}

function ref(now: LocalNow, dayIndex: number): DayRef {
  const week = weekOf(now);
  return {
    dayIndex,
    dayName: DAYF[dayIndex],
    date: addDays(week.start, dayIndex),
    isToday: dayIndex === now.dayIndex,
    isPast: dayIndex < now.dayIndex,
    week,
  };
}

function outOfRange(label: string, date: string, now: LocalNow): ToolError {
  const { start, end } = weekOf(now);
  return new ToolError(
    'DAY_OUT_OF_RANGE',
    `${label} (${date}) is outside the week Dayli can plan (${start} to ${end}).`,
    'Dayli only stores the current week. Tell the user this day cannot be shown yet rather than using another day.',
  );
}

function fromIndex(now: LocalNow, dayIndex: number, label: string): DayRef {
  const date = addDays(weekOf(now).start, dayIndex);
  if (dayIndex < 0 || dayIndex > 6) throw outOfRange(label, date, now);
  return ref(now, dayIndex);
}

export function resolveDay(input: string | undefined, now: LocalNow): DayRef {
  const raw = (input ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

  if (raw === '' || raw === 'today') return ref(now, now.dayIndex);
  if (raw === 'tomorrow') return fromIndex(now, now.dayIndex + 1, 'Tomorrow');
  if (raw === 'yesterday') return fromIndex(now, now.dayIndex - 1, 'Yesterday');

  if (isRealDate(raw)) {
    const { start, end } = weekOf(now);
    if (raw < start || raw > end) throw outOfRange(raw, raw, now);
    const i = Math.round(
      (Date.parse(`${raw}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`)) / 86_400_000,
    );
    return ref(now, i);
  }

  const next = raw.match(/^next (\w+)$/);
  if (next && weekdayIndex(next[1]) !== null) {
    const i = weekdayIndex(next[1])!;
    throw outOfRange(`Next ${DAYF[i]}`, addDays(weekOf(now).start, 7 + i), now);
  }

  const i = weekdayIndex(raw.replace(/^this /, ''));
  if (i !== null) {
    if (i >= now.dayIndex) return ref(now, i);
    const thisOne = addDays(weekOf(now).start, i);
    const nextOne = addDays(thisOne, 7);
    throw new ToolError(
      'AMBIGUOUS_DAY',
      `${DAYF[i]} could mean ${thisOne}, which has passed, or ${nextOne}, which is outside the week Dayli can plan.`,
      `Ask the user which one they mean. To look back at this week, pass "${thisOne}".`,
    );
  }

  throw new ToolError(
    'INVALID_DAY',
    `"${(input ?? '').trim()}" is not a day Dayli understands.`,
    ACCEPTED_DAYS,
  );
}
