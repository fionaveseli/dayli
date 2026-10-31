import type {
  DayInfo,
  DayIndex,
  Fixed,
  Gap,
  Load,
  LoadKind,
  ParsedReminder,
  PlanData,
  ReminderWithAt,
  RolloverMove,
  Settings,
} from '../data/types';
import { DAYF, fmtD } from './format';

export function fixedOn(fixed: Fixed[], d: DayIndex): Fixed[] {
  return fixed.filter((f) => f.days.includes(d)).sort((a, b) => a.start - b.start);
}

const overlap = (a1: number, a2: number, b1: number, b2: number) =>
  Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

/** Minutes inside wake–sleep covered by at least one fixed block (overlaps count once). */
function busyMinutes(fixedList: Fixed[], wake: number, sleep: number): number {
  const spans = fixedList
    .map((f): [number, number] => [Math.max(f.start, wake), Math.min(f.end, sleep)])
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);
  let busy = 0;
  let cur = wake;
  for (const [s, e] of spans) {
    busy += overlap(s, e, cur, sleep);
    cur = Math.max(cur, e);
  }
  return busy;
}

/** Minutes of the waking day not taken by fixed blocks or breathing room. */
export function freeFor(fixedList: Fixed[], settings: Settings): number {
  const busy = busyMinutes(fixedList, settings.wake, settings.sleep);
  return Math.max(0, settings.sleep - settings.wake - busy - settings.buffer);
}

const LOAD_LABEL = {
  none: 'Open',
  light: 'Light',
  balanced: 'Balanced',
  full: 'Full',
  over: 'Over capacity',
};

export function loadOf(planned: number, free: number): Load {
  const r = free > 0 ? planned / free : planned > 0 ? 2 : 0;
  const k =
    planned === 0 ? 'none' : r < 0.5 ? 'light' : r < 0.85 ? 'balanced' : r <= 1 ? 'full' : 'over';
  return {
    r,
    k: (k === 'none' ? 'light' : k) as LoadKind,
    empty: planned === 0,
    label: LOAD_LABEL[k],
  };
}

/** Reminders for a day with their alert time (`at`, including snooze) and done state. */
export function remOn(S: PlanData, d: DayIndex, wk = 0): ReminderWithAt[] {
  return (S.reminders || [])
    .filter((r) => r.days.includes(d))
    .map((r) => {
      const sn = wk === 0 ? (r.snooze || {})[d] || 0 : 0;
      return {
        ...r,
        at: r.time - r.lead + sn,
        done: wk === 0 && (r.doneDays || []).includes(d),
      };
    })
    .sort((a, b) => a.at - b.at);
}

/** A "time to leave" reminder ends any fixed block it falls inside (leaving work early). */
export function cutFixed(fx: Fixed[], rs: ReminderWithAt[]): Fixed[] {
  return fx.map((f) => {
    const r = rs.find((x) => x.leave && x.at > f.start && x.at < f.end);
    return r ? { ...f, end: r.at, cutBy: r } : f;
  });
}

export function dayInfo(S: PlanData, d: DayIndex, wk = 0): DayInfo {
  const fixed = cutFixed(fixedOn(S.fixed, d), remOn(S, d, wk));
  const flex = wk === 0 ? S.tasks.filter((t) => t.day === d) : [];
  const free = freeFor(fixed, S.settings);
  const planned = flex.reduce((a, t) => a + t.dur, 0);
  const left = flex.filter((t) => !t.done).reduce((a, t) => a + t.dur, 0);
  return { fixed, flex, free, planned, left, load: loadOf(planned, free) };
}

/** Open stretches of at least 30 minutes between fixed blocks and placed tasks. */
export function gapsOn(S: PlanData, d: DayIndex, wk = 0): Gap[] {
  const { fixed, flex } = dayInfo(S, d, wk);
  const occ: [number, number][] = [
    ...fixed.map((f): [number, number] => [f.start, f.end]),
    ...flex.filter((t) => t.time != null).map((t): [number, number] => [t.time!, t.time! + t.dur]),
  ].sort((a, b) => a[0] - b[0]);
  const out: Gap[] = [];
  let cur = S.settings.wake;
  const end = S.settings.sleep;
  for (const [s, e] of occ) {
    const ss = Math.min(s, end);
    if (ss - cur >= 30) out.push({ s: cur, e: ss });
    cur = Math.max(cur, e);
  }
  if (end - cur >= 30) out.push({ s: cur, e: end });
  return out;
}

/**
 * Overnight rollover: each unfinished task of day `from` goes to the first later day that still has room.
 * `firstOpen` is the earliest day a task may land on (defaults to the day after `from`).
 */
export function rolloverPlan(
  S: PlanData,
  from: DayIndex = 0,
  firstOpen = from + 1,
): RolloverMove[] {
  const extra = [0, 0, 0, 0, 0, 0, 0];
  return S.tasks
    .filter((t) => t.day === from && !t.done)
    .sort((a, b) => b.pri - a.pri)
    .map((t) => {
      for (let d = firstOpen; d < 7; d++) {
        const i = dayInfo(S, d, 0);
        const room = i.free - i.planned - extra[d];
        if (t.dur <= room) {
          extra[d] += t.dur;
          return { t, to: d, why: `${DAYF[d]} still has ${fmtD(room)} free` };
        }
      }
      return { t, to: null, why: 'No day has room yet' };
    });
}

/** "Remind me at 4 to call mum" or "remind me to call mum at 4pm". */
export function parseReminder(v: string): ParsedReminder | null {
  const t = v.trim();
  let h: string | number;
  let mi: string | number | undefined;
  let ap: string | undefined;
  let title: string;
  let m = t.match(
    /^remind me (?:at|by) (\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?\s*(?:to |that |about )?(.+)$/i,
  );
  if (m) {
    [, h, mi, ap, title] = m;
  } else {
    m = t.match(
      /^remind me (?:to |about |that )?(.+?) (?:at|by) (\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)?$/i,
    );
    if (!m) return null;
    [, title, h, mi, ap] = m;
  }
  let hour = +h;
  const min = +(mi || 0);
  if (ap) {
    const a = ap.toLowerCase();
    if (a === 'pm' && hour < 12) hour += 12;
    if (a === 'am' && hour === 12) hour = 0;
  } else if (hour < 7) hour += 12;
  if (hour > 23 || min > 59 || !title) return null;
  title = title.trim().replace(/\.$/, '');
  title = title.charAt(0).toUpperCase() + title.slice(1);
  return { title, time: hour * 60 + min, lead: 0, leave: /^leave\b/i.test(title) };
}
