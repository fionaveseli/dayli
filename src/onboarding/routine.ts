import type {
  Category,
  DayIndex,
  Fixed,
  PlanData,
  Reminder,
  ReminderWithAt,
  Settings,
  Task,
} from '../data/types';
import { SAMPLE_PLAN } from '../data/sample';
import { cutFixed, freeFor, fixedOn } from '../rules/rules';

export type RoutineFixed = Omit<Fixed, 'cutBy'>;
export type RoutineFlex = { id: string; title: string; cat: Category; freq: number; dur: number };
export type RoutineReminder = Omit<Reminder, 'doneDays' | 'snooze'>;

/** What Dayli understood from the user's words, before anything is saved. */
export type Routine = {
  text: string;
  fixed: RoutineFixed[];
  flex: RoutineFlex[];
  reminders: RoutineReminder[];
  dismissed: string[];
};

export const EMPTY_ROUTINE: Routine = {
  text: '',
  fixed: [],
  flex: [],
  reminders: [],
  dismissed: [],
};

export const EXAMPLE =
  'I work 9 to 5, Monday to Friday, and I have Pilates on Tuesdays at 6. I do client work for Blue Bamboo about three times a week. I want to go to the gym four times a week, work on my portfolio twice a week, and prepare for interviews once a week. On Mondays and Wednesdays I pick up the kids from school at 5, so I have to leave work an hour early.';

const CATS: Category[] = ['work', 'client', 'portfolio', 'interview', 'fitness', 'personal'];

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object';
const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v.trim() : fallback);
const num = (v: unknown, lo: number, hi: number, fallback: number) => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.round(v) : fallback;
  return Math.min(hi, Math.max(lo, n));
};
const cat = (v: unknown): Category => (CATS.includes(v as Category) ? (v as Category) : 'personal');
const days = (v: unknown): DayIndex[] =>
  Array.isArray(v)
    ? [...new Set(v.filter((d): d is number => Number.isInteger(d) && d >= 0 && d <= 6))].sort(
        (a, b) => a - b,
      )
    : [];

/**
 * Turns the answer of the Edge Function into a routine the app can show.
 * Anything malformed is dropped, so a bad answer can never break the review screen.
 */
export function normalizeRoutine(raw: unknown, text: string, seed = 'r'): Routine {
  const o = isObj(raw) ? raw : {};
  const list = (k: string): unknown[] => (Array.isArray(o[k]) ? (o[k] as unknown[]) : []);
  const fixed: RoutineFixed[] = [];
  list('fixed').forEach((x, i) => {
    if (!isObj(x) || !str(x.title)) return;
    const d = days(x.days);
    const start = num(x.start, 0, 1439, 540);
    const end = num(x.end, 1, 1440, start + 60);
    if (!d.length || end <= start) return;
    fixed.push({
      id: `${seed}f${i}`,
      title: str(x.title),
      cat: cat(x.cat),
      days: d,
      start,
      end,
      where: str(x.where),
    });
  });
  const flex: RoutineFlex[] = [];
  list('flex').forEach((x, i) => {
    if (!isObj(x) || !str(x.title)) return;
    flex.push({
      id: `${seed}x${i}`,
      title: str(x.title),
      cat: cat(x.cat),
      freq: num(x.freq, 1, 7, 1),
      dur: num(x.dur, 15, 480, 60),
    });
  });
  const reminders: RoutineReminder[] = [];
  list('reminders').forEach((x, i) => {
    if (!isObj(x) || !str(x.title)) return;
    const d = days(x.days);
    if (!d.length) return;
    reminders.push({
      id: `${seed}m${i}`,
      title: str(x.title),
      days: d,
      time: num(x.time, 0, 1439, 540),
      lead: num(x.lead, 0, 180, 0),
      leave: x.leave === true,
      note: str(x.note),
      cat: cat(x.cat),
      nag: true,
    });
  });
  return { text, fixed, flex, reminders, dismissed: [] };
}

type SpreadReminder = ReminderWithAt;

/** Free minutes on each day once fixed hours and "time to leave" cuts are taken out. */
export function dayCapacity(r: Routine, settings: Settings): number[] {
  return Array.from({ length: 7 }, (_, d) => {
    const rs: SpreadReminder[] = r.reminders
      .filter((m) => m.days.includes(d))
      .map((m) => ({ ...m, doneDays: [], at: m.time - m.lead, done: false }));
    return freeFor(cutFixed(fixedOn(r.fixed as Fixed[], d), rs), settings);
  });
}

/**
 * Spreads each activity's weekly sessions over the lightest days, weekends last
 * (same scoring as the prototype's spreadPlan).
 */
export function spreadPlan(r: Routine, settings: Settings) {
  const cap = dayCapacity(r, settings);
  const plan: RoutineFlex[][] = Array.from({ length: 7 }, () => []);
  const sessions = r.flex
    .flatMap((a) => Array.from({ length: a.freq }, () => a))
    .sort((x, y) => y.dur - x.dur);
  for (const a of sessions) {
    let best = 0;
    let bestScore = Infinity;
    for (let d = 0; d < 7; d++) {
      const used = plan[d].reduce((s, x) => s + x.dur, 0);
      const score =
        (used + a.dur) / Math.max(cap[d], 1) +
        (d >= 5 ? 0.45 : 0) +
        (d === 6 ? 0.25 : 0) +
        (plan[d].some((x) => x.id === a.id) ? 1.5 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = d;
      }
    }
    plan[best].push(a);
  }
  return { cap, plan, used: plan.map((p) => p.reduce((s, x) => s + x.dur, 0)) };
}

export type RoutineIssue = { id: string; tone: 'warn' | 'over'; title: string; body: string };

/** Things worth a look before approving: a crowded day, a nearly full week. */
export function routineIssues(
  r: Routine,
  settings: Settings,
  fmtD: (m: number) => string,
  dayNames: string[],
) {
  const sp = spreadPlan(r, settings);
  const issues: RoutineIssue[] = [];
  sp.used.forEach((u, d) => {
    if (u > sp.cap[d])
      issues.push({
        id: `over${d}`,
        tone: 'over',
        title: `${dayNames[d]} is over capacity`,
        body: `${fmtD(u)} planned with ${fmtD(sp.cap[d])} free after fixed hours and breathing room.`,
      });
  });
  const free = sp.cap.reduce((a, b) => a + b, 0);
  const planned = sp.used.reduce((a, b) => a + b, 0);
  if (planned > free * 0.75 && !issues.length)
    issues.push({
      id: 'full',
      tone: 'warn',
      title: 'Your week is almost full',
      body: `${fmtD(planned)} of ${fmtD(free)} free time is planned. Leave some room for rest and surprises.`,
    });
  return issues;
}

const newId = (p: string) =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/**
 * Puts the approved routine into the plan. The demo items are replaced, anything
 * the user added themselves stays. Flexible activities become this week's tasks
 * from `today` on (a day index, 0 = Monday).
 */
export function applyRoutine(plan: PlanData, r: Routine, today: DayIndex): PlanData {
  const demoFixed = new Set(SAMPLE_PLAN.fixed.map((x) => x.id));
  const demoTasks = new Set(SAMPLE_PLAN.tasks.map((x) => x.id));
  const demoRems = new Set(SAMPLE_PLAN.reminders.map((x) => x.id));
  const sp = spreadPlan(r, plan.settings);
  const tasks: Task[] = [];
  sp.plan.forEach((acts, d) => {
    if (d < today) return;
    for (const a of acts)
      tasks.push({
        id: newId('t'),
        title: a.title,
        cat: a.cat,
        dur: a.dur,
        day: d,
        time: null,
        done: false,
        notes: '',
        goal: null,
        ms: null,
        pri: 2,
        repeat: false,
      });
  });
  return {
    ...plan,
    fixed: [
      ...r.fixed.map((x) => ({ ...x, id: newId('f') })),
      ...plan.fixed.filter((x) => !demoFixed.has(x.id)),
    ],
    reminders: [
      ...r.reminders.map((x) => ({ ...x, id: newId('r'), doneDays: [] })),
      ...plan.reminders.filter((x) => !demoRems.has(x.id)),
    ],
    tasks: [...tasks, ...plan.tasks.filter((x) => !demoTasks.has(x.id))],
  };
}
