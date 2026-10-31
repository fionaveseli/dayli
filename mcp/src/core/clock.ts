import { ToolError } from './errors';

/** Where "now" comes from. Injected everywhere so tests and demos can pin it. */
export type Clock = { now(): Date; timeZone: string };

/** Now, as Dayli sees it: a calendar date, a day index (0 = Monday) and minutes since midnight. */
export type LocalNow = { date: string; dayIndex: number; minutes: number; timeZone: string };

export const systemClock = (timeZone = defaultTimeZone()): Clock => ({
  now: () => new Date(),
  timeZone: checkTimeZone(timeZone),
});

/** A clock stuck at one instant, e.g. `2026-10-31T14:07:00+01:00`. */
export function fixedClock(iso: string, timeZone = defaultTimeZone()): Clock {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) {
    throw new ToolError(
      'INVALID_INPUT',
      `"${iso}" is not a valid date and time.`,
      'Use ISO 8601 with an offset, e.g. 2026-10-31T15:00:00+01:00.',
    );
  }
  return { now: () => new Date(at), timeZone: checkTimeZone(timeZone) };
}

export const defaultTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

function checkTimeZone(tz: string): string {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return tz;
  } catch {
    throw new ToolError(
      'INVALID_INPUT',
      `"${tz}" is not a known time zone.`,
      'Use an IANA name such as Europe/Belgrade.',
    );
  }
}

const WEEKDAY: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function localNow(clock: Clock): LocalNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: clock.timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }).formatToParts(clock.now());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    dayIndex: WEEKDAY[get('weekday')],
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
    timeZone: clock.timeZone,
  };
}
