import type { Category, DayIndex, PlanData } from '../data/types';
import type { Tone } from '../theme/colors';
import { fmtD, fmtT } from './format';
import { remOn, dayInfo } from './rules';
import { CATS } from './today';

/** One line on a widget: already worded, so the native side only lays it out. */
export type WidgetItem = {
  kind: 'fixed' | 'task' | 'reminder';
  title: string;
  /** "16:00", or "16:00–17:00" for a block. */
  time: string;
  /** "Office", "1h", "Time to leave". */
  sub: string;
  tone: Tone;
  /** Solid pastel for fixed, paper note for flexible, bell for reminders. */
  style: 'solid' | 'paper' | 'bell';
};

export type WidgetReminder = {
  title: string;
  time: string;
  leave: boolean;
  /** Its time has passed and it is not ticked. */
  missed: boolean;
  /** The first one still to come. */
  next: boolean;
  tone: Tone;
};

/** What the widgets show at one moment. */
export type WidgetView = {
  /** What is happening right now (a fixed block or placed task), if anything. */
  now: WidgetItem | null;
  /** The next thing to start today, if anything. */
  next: WidgetItem | null;
  /** Shown when nothing timed is left: "2 flexible tasks left · 1h 30m". */
  rest: string;
  /** Unticked reminders for today, earliest first, at most four. */
  dontForget: WidgetReminder[];
  /** "2 left today", "All done" or "". */
  dontForgetNote: string;
};

type Span = WidgetItem & { s: number; e: number };

const toneOf = (c: Category): Tone => CATS[c].tone;

function spansOn(S: PlanData, d: DayIndex): Span[] {
  const info = dayInfo(S, d);
  const fixed = info.fixed.map((f): Span => ({
    kind: 'fixed',
    title: f.title,
    time: `${fmtT(f.start)}–${fmtT(f.end)}`,
    sub: f.cutBy ? `Until ${fmtT(f.end)}, then leave` : f.where,
    tone: toneOf(f.cat),
    style: 'solid',
    s: f.start,
    e: f.end,
  }));
  const tasks = info.flex
    .filter((t) => !t.done && t.time != null)
    .map((t): Span => ({
      kind: 'task',
      title: t.title,
      time: fmtT(t.time!),
      sub: fmtD(t.dur),
      tone: toneOf(t.cat),
      style: 'paper',
      s: t.time!,
      e: t.time! + t.dur,
    }));
  const rems = remOn(S, d)
    .filter((r) => !r.done)
    .map((r): Span => ({
      kind: 'reminder',
      title: r.title,
      time: fmtT(r.at),
      sub: r.leave ? 'Time to leave' : r.note,
      tone: toneOf(r.cat),
      style: 'bell',
      s: r.at,
      e: r.at,
    }));
  return [...fixed, ...tasks, ...rems].sort((a, b) => a.s - b.s || a.e - b.e);
}

const strip = ({ s: _s, e: _e, ...item }: Span): WidgetItem => item;

/** The widgets' view of day `d` at minute `now`. */
export function widgetView(S: PlanData, d: DayIndex, now: number): WidgetView {
  const spans = spansOn(S, d);
  const cur = spans.find((x) => x.e > x.s && x.s <= now && now < x.e);
  const nxt = spans.find((x) => x.s > now || (x.kind === 'reminder' && x.s === now));
  const anytime = S.tasks.filter((t) => t.day === d && !t.done && t.time == null);
  const mins = anytime.reduce((a, t) => a + t.dur, 0);
  const rest = anytime.length
    ? `${anytime.length} flexible ${anytime.length === 1 ? 'task' : 'tasks'} left · ${fmtD(mins)}`
    : 'Nothing left today.';
  const rems = remOn(S, d);
  const open = rems.filter((r) => !r.done);
  const firstNext = open.find((r) => r.at >= now);
  return {
    now: cur ? strip(cur) : null,
    next: nxt ? strip(nxt) : null,
    rest,
    dontForget: open.slice(0, 4).map((r) => ({
      title: r.title,
      time: fmtT(r.at),
      leave: r.leave,
      missed: r.at < now,
      next: r.id === firstNext?.id,
      tone: toneOf(r.cat),
    })),
    dontForgetNote: open.length ? `${open.length} left today` : rems.length ? 'All done' : '',
  };
}

/**
 * The rest of day `d` as a timeline: one view from `now`, and a new one each time something starts
 * or ends, so a widget stays right without the app running. `from` is minutes since midnight.
 */
export function widgetTimeline(
  S: PlanData,
  d: DayIndex,
  now: number,
): { from: number; view: WidgetView }[] {
  const marks = new Set<number>([now]);
  for (const x of spansOn(S, d)) {
    if (x.s > now) marks.add(x.s);
    if (x.e > now) marks.add(x.e);
    // A reminder turns from next to missed one minute after it is due.
    if (x.kind === 'reminder' && x.s + 1 > now) marks.add(x.s + 1);
  }
  return [...marks]
    .filter((m) => m < 24 * 60)
    .sort((a, b) => a - b)
    .map((from) => ({ from, view: widgetView(S, d, from) }));
}
