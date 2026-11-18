import type { Category, DayIndex, Fixed } from '../data/types';
import { DAYS, daysLabel, fmtT } from '../rules/format';
import type { RoutineFixed } from '../onboarding/routine';
import type { DatedFixed, DatedPlan } from '../sync/dated';
import { keyOf, parseKey, type DateKey } from '../sync/dates';

/** A commitment read from a file. Calendar exports carry the dates it runs between. */
export type ImportedFixed = RoutineFixed & { startsOn: DateKey | null; endsOn: DateKey | null };
export type Skipped = { line: number; title: string; why: string };
export type ImportResult = {
  kind: 'timetable' | 'calendar';
  rows: number;
  fixed: ImportedFixed[];
  skipped: Skipped[];
};

export class ImportError extends Error {}

/** Splits CSV text into rows of cells. Handles quotes, and commas, semicolons or tabs. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const first = src.split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => first.split(ch).length;
  const sep = [',', ';', '\t'].reduce((a, b) => (count(b) > count(a) ? b : a));
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell.trim() === '') {
      quoted = true;
      cell = '';
    } else if (ch === sep) {
      row.push(cell.trim());
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c !== ''));
}

const DAY_WORDS: [RegExp, DayIndex][] = [
  [/^mo(n(day)?)?$/, 0],
  [/^tu(e(s(day)?)?)?$/, 1],
  [/^we(d(nesday)?)?$/, 2],
  [/^th(u(r(s(day)?)?)?)?$/, 3],
  [/^fr(i(day)?)?$/, 4],
  [/^sa(t(urday)?)?$/, 5],
  [/^su(n(day)?)?$/, 6],
];
const dayOf = (w: string): DayIndex | null => {
  const s = w.trim().toLowerCase().replace(/\.$/, '');
  for (const [re, d] of DAY_WORDS) if (re.test(s)) return d;
  return null;
};

/** "Mon–Fri", "Tue, Thu", "Mon/Wed/Fri", "weekdays", "daily" → day indexes. */
export function parseDays(text: string): DayIndex[] {
  const s = text.trim().toLowerCase();
  if (!s) return [];
  if (/^(every ?day|daily|all week)$/.test(s)) return [0, 1, 2, 3, 4, 5, 6];
  if (/^(week ?days|mon(day)?s? to fri(day)?s?)$/.test(s)) return [0, 1, 2, 3, 4];
  if (/^week ?ends?$/.test(s)) return [5, 6];
  const out = new Set<DayIndex>();
  const joined = s.replace(/\s*(?:–|—|-|\bto\b|\bthrough\b)\s*/g, '–');
  for (const part of joined.split(/\s*(?:,|\/|&|\+|;|\band\b|\s)\s*/).filter(Boolean)) {
    const range = part.split('–');
    if (range.length > 2) return [];
    if (range.length === 2) {
      const a = dayOf(range[0]);
      const b = dayOf(range[1]);
      if (a == null || b == null) return [];
      for (let d = a; ; d = (d + 1) % 7) {
        out.add(d);
        if (d === b) break;
      }
    } else {
      const d = dayOf(part.replace(/s$/, ''));
      if (d == null) return [];
      out.add(d);
    }
  }
  return [...out].sort((a, b) => a - b);
}

/** "09:00", "9:30 am", "5pm", "17.30", "1730" → minutes since midnight, or null. */
export function parseTime(text: string): number | null {
  const m = text
    .trim()
    .toLowerCase()
    .match(/^(\d{1,2})(?:[:.h]?(\d{2}))?(?::\d{2})?\s*(a\.?m\.?|p\.?m\.?)?$/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = m[2] ? Number(m[2]) : 0;
  const ap = m[3]?.[0];
  if (ap) {
    if (h < 1 || h > 12) return null;
    h = (h % 12) + (ap === 'p' ? 12 : 0);
  }
  if (h === 24 && min === 0) return 1440;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** "2026-11-16", "11/16/2026", "16.11.2026" → a date key. Slashes read month first unless that can't be. */
export function parseDate(text: string): DateKey | null {
  const s = text.trim();
  let y: number, mo: number, d: number;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = s.match(/^(\d{1,2})([/.])(\d{1,2})\2(\d{2}|\d{4})$/))) {
    const a = Number(m[1]);
    const b = Number(m[3]);
    y = Number(m[4]) + (m[4].length === 2 ? 2000 : 0);
    const dayFirst = m[2] === '.' || a > 12;
    [mo, d] = dayFirst ? [b, a] : [a, b];
  } else return null;
  const date = new Date(y, mo - 1, d);
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return keyOf(date);
}

/** A cell holding a date, a time, or both ("2026-11-16 09:00", "2026-11-16T09:00:00"). */
const splitStamp = (text: string): { date: DateKey | null; time: number | null } => {
  const s = text.trim();
  const m = s.match(/^(\S+?)(?:[T\s]+(.+))?$/);
  const date = m ? parseDate(m[1]) : null;
  if (date)
    return { date, time: m?.[2] ? parseTime(m[2].replace(/(z|[+-]\d{2}:?\d{2})$/i, '')) : null };
  return { date: null, time: parseTime(s) };
};

const CAT_WORDS: [RegExp, Category][] = [
  [/gym|yoga|pilates|run|swim|fitness|training|sport|football|tennis|climb/, 'fitness'],
  [/interview/, 'interview'],
  [/client/, 'client'],
  [/portfolio/, 'portfolio'],
  [
    /work|shift|meeting|stand-?up|lecture|class|seminar|lab\b|tutorial|lesson|course|exam|module|school|office/,
    'work',
  ],
];
export const guessCat = (title: string): Category => {
  const t = title.toLowerCase();
  return CAT_WORDS.find(([re]) => re.test(t))?.[1] ?? 'personal';
};

const HEADERS = {
  title: ['title', 'subject', 'name', 'event', 'summary', 'course', 'module', 'class', 'activity'],
  days: ['days', 'day', 'weekday', 'weekdays', 'day of week', 'repeat', 'repeats'],
  time: ['time', 'times', 'hours'],
  start: ['start', 'start time', 'from', 'begin', 'begins', 'starts', 'start date'],
  end: ['end', 'end time', 'to', 'until', 'finish', 'ends', 'end date'],
  startDate: ['start date', 'date', 'start day'],
  endDate: ['end date', 'end day'],
  startTime: ['start time'],
  endTime: ['end time'],
  where: ['where', 'location', 'room', 'place', 'venue'],
  type: ['type', 'kind'],
  allDay: ['all day event', 'all day', 'all-day'],
};
type Col = keyof typeof HEADERS;
const norm = (h: string) => h.toLowerCase().replace(/[_]/g, ' ').replace(/\s+/g, ' ').trim();

/**
 * Reads a timetable (title, days, start, end) or a calendar export (subject, start date,
 * start time, end time) into fixed commitments. Rows it can't use are listed with a reason.
 * `today` drops calendar events that are already over.
 */
export function readSchedule(text: string, today: DateKey, seed = 'i'): ImportResult {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new ImportError('That file has no rows to import.');
  const head = rows[0].map(norm);
  const col = (k: Col, skip: number[] = []) => {
    const i = head.findIndex((h, j) => !skip.includes(j) && HEADERS[k].includes(h));
    return i < 0 ? null : i;
  };
  const title = col('title');
  if (title == null)
    throw new ImportError('I couldn’t find a title column. Name the first column “Title”.');
  const days = col('days');
  const startDate = col('startDate');
  const startTime = col('startTime');
  const used = [startDate, startTime].filter((x): x is number => x != null);
  const start = startTime ?? col('start', used);
  const endDate = col('endDate');
  const endTime = col('endTime');
  const end =
    endTime ??
    col(
      'end',
      [endDate].filter((x): x is number => x != null),
    );
  const time = col('time');
  const where = col('where');
  const type = col('type');
  const allDay = col('allDay');
  const cell = (r: string[], i: number | null) => (i == null ? '' : (r[i] ?? '').trim());

  const skipped: Skipped[] = [];
  type Group = {
    t: string;
    s: number;
    e: number;
    w: string;
    days: Set<DayIndex>;
    dates: DateKey[];
  };
  const groups = new Map<string, Group>();

  rows.slice(1).forEach((r, i) => {
    const line = i + 2;
    const t = cell(r, title);
    if (!t) return skipped.push({ line, title: '(no title)', why: 'No title' });
    const kindCell = cell(r, type).toLowerCase();
    if (kindCell && /flex/.test(kindCell))
      return skipped.push({ line, title: t, why: 'Flexible, not fixed' });
    if (/^(true|yes|1)$/i.test(cell(r, allDay)))
      return skipped.push({ line, title: t, why: 'All-day event' });

    let s: number | null = null;
    let e: number | null = null;
    let date: DateKey | null = null;
    const range = cell(r, time).match(/^(.+?)\s*(?:–|—|-|\bto\b)\s*(.+)$/i);
    if (range) {
      s = parseTime(range[1]);
      e = parseTime(range[2]);
    }
    if (start != null && s == null) {
      const a = splitStamp(cell(r, start));
      s = a.time;
      date = a.date;
    }
    if (end != null && e == null) e = splitStamp(cell(r, end)).time;
    if (startDate != null && startDate !== start) date = date ?? parseDate(cell(r, startDate));
    if (s == null || e == null)
      return skipped.push({ line, title: t, why: 'No start or end time' });
    if (e <= s) return skipped.push({ line, title: t, why: 'Ends before it starts' });

    let ds: DayIndex[] = [];
    if (days != null && cell(r, days)) {
      ds = parseDays(cell(r, days));
      if (!ds.length)
        return skipped.push({ line, title: t, why: `Days “${cell(r, days)}” not clear` });
    } else if (date) {
      if (date < today) return skipped.push({ line, title: t, why: 'Already over' });
      ds = [(parseKey(date).getDay() + 6) % 7];
    } else return skipped.push({ line, title: t, why: 'No days or date' });

    const w = cell(r, where);
    const key = [t.toLowerCase(), s, e, w.toLowerCase(), date ? 'd' : '', ds.join('')].join('|');
    const g = groups.get(key) ?? { t, s, e, w, days: new Set<DayIndex>(), dates: [] };
    ds.forEach((d) => g.days.add(d));
    if (date) g.dates.push(date);
    groups.set(key, g);
  });

  // A series on several weekdays (Mon and Wed lectures) becomes one commitment.
  const merged: Group[] = [];
  for (const g of groups.values()) {
    const twin =
      g.dates.length > 0 &&
      merged.find(
        (m) =>
          m.dates.length > 0 &&
          m.dates.length + g.dates.length > 2 &&
          m.t.toLowerCase() === g.t.toLowerCase() &&
          m.s === g.s &&
          m.e === g.e &&
          m.w.toLowerCase() === g.w.toLowerCase(),
      );
    if (twin) {
      g.days.forEach((d) => twin.days.add(d));
      twin.dates.push(...g.dates);
    } else merged.push(g);
  }

  const fixed: ImportedFixed[] = merged.map((g, i) => {
    const dates = [...g.dates].sort();
    return {
      id: `${seed}${i}`,
      title: g.t,
      cat: guessCat(g.t),
      days: [...g.days].sort((a, b) => a - b),
      start: g.s,
      end: g.e,
      where: g.w,
      startsOn: dates[0] ?? null,
      endsOn: dates[dates.length - 1] ?? null,
    };
  });
  const kind = fixed.some((f) => f.startsOn) ? 'calendar' : 'timetable';
  return { kind, rows: rows.length - 1, fixed, skipped };
}

/** "Mon–Fri · 09:00–17:00", plus the dates for a calendar event. */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const whenLabel = (f: ImportedFixed) => {
  const t = `${fmtT(f.start)}–${fmtT(f.end)}`;
  const short = (k: DateKey) => {
    const d = parseKey(k);
    return `${DAYS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  };
  if (f.startsOn && f.startsOn === f.endsOn) return `${short(f.startsOn)} · ${t}`;
  const span = f.startsOn && f.endsOn ? ` · ${short(f.startsOn)} to ${short(f.endsOn)}` : '';
  return `${daysLabel(f.days)} · ${t}${span}`;
};

/** The sample in the prototype: a small weekly timetable. */
export const SAMPLE_CSV = `Title,Days,Start,End,Location
Work,Mon–Fri,09:00,17:00,Office
Pilates,Tue,18:00,19:00,Studio Nord
Spanish class,Thu,19:00,20:30,Language school
Kids' swimming,Sat,10:00,11:00,City pool
`;

const newId = () => `f${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
const same = (a: Omit<Fixed, 'cutBy'>, b: Omit<Fixed, 'cutBy'>) =>
  a.title.toLowerCase() === b.title.toLowerCase() &&
  a.start === b.start &&
  a.end === b.end &&
  a.days.join() === b.days.join();

/**
 * Adds imported commitments to the saved plan. Weekly ones start this week (`monday`) and
 * keep going; calendar events keep their own dates. One already in the plan is not added twice.
 */
export function addImported(
  d: DatedPlan,
  items: ImportedFixed[],
  monday: DateKey,
): { plan: DatedPlan; added: number } {
  const fresh = items.filter(
    (x) =>
      !d.fixed.some(
        (f) => same(f, x) && f.startsOn === (x.startsOn ?? f.startsOn) && f.endsOn === x.endsOn,
      ),
  );
  const fixed: DatedFixed[] = fresh.map((x) => ({
    ...x,
    id: newId(),
    startsOn: x.startsOn ?? monday,
    endsOn: x.endsOn,
  }));
  return { plan: { ...d, fixed: [...d.fixed, ...fixed] }, added: fixed.length };
}
