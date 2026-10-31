import type { Autopilot, DayIndex, Fixed, PlanData, Reminder, Settings, Task } from '../data/types';
import { addKey, type DateKey } from './dates';

/** What the server tells us about a row; the screens never see it. */
export type Meta = { userId?: string; createdAt?: string; updatedAt?: string };

export type DatedTask = Omit<Task, 'day'> & { date: DateKey | null } & Meta;
export type DatedFixed = Omit<Fixed, 'cutBy'> & {
  startsOn: DateKey;
  endsOn: DateKey | null;
} & Meta;
export type DatedReminder = Omit<Reminder, 'doneDays' | 'snooze'> & {
  startsOn: DateKey;
  endsOn: DateKey | null;
  doneOn: DateKey[];
  snoozeOn: Record<DateKey, number>;
} & Meta;

/** The plan as it is stored and synced: real dates, no week-relative day indexes. */
export type DatedPlan = {
  fixed: DatedFixed[];
  tasks: DatedTask[];
  reminders: DatedReminder[];
  settings: Settings;
  settingsId?: string;
  settingsMeta?: Meta;
  autopilot?: Autopilot;
};

export const EMPTY_DATED: Omit<DatedPlan, 'settings'> = { fixed: [], tasks: [], reminders: [] };

const META_KEYS = ['userId', 'createdAt', 'updatedAt'] as const;

/** Tasks show from the day before Monday (completed history) to Sunday. */
const idxOf = (monday: DateKey, date: DateKey): DayIndex | null => {
  for (let i = -1; i < 7; i++) if (addKey(monday, i) === date) return i;
  return null;
};
const dateOf = (monday: DateKey, day: DayIndex): DateKey => addKey(monday, day);

const activeOn = (x: { startsOn: DateKey; endsOn: DateKey | null }, date: DateKey) =>
  x.startsOn <= date && (x.endsOn == null || date <= x.endsOn);

/** The weekdays of the week at `monday` on which a repeating item is in force. */
const weekDaysOf = (
  x: { days: DayIndex[]; startsOn: DateKey; endsOn: DateKey | null },
  monday: DateKey,
) => x.days.filter((d) => activeOn(x, dateOf(monday, d)));

const sameSet = (a: number[], b: number[]) =>
  a.length === b.length && a.every((x) => b.includes(x));

function withoutMeta<T extends Meta>(x: T): Omit<T, keyof Meta> {
  const c = { ...x };
  for (const k of META_KEYS) delete c[k];
  return c;
}

export function stripMeta(p: DatedPlan): DatedPlan {
  return {
    ...p,
    settingsId: undefined,
    settingsMeta: undefined,
    fixed: p.fixed.map((x) => ({ ...x, ...blankMeta })),
    tasks: p.tasks.map((x) => ({ ...x, ...blankMeta })),
    reminders: p.reminders.map((x) => ({ ...x, ...blankMeta })),
  };
}
const blankMeta: Meta = { userId: undefined, createdAt: undefined, updatedAt: undefined };

/** The current week as the screens know it: day indexes, doneDays by index. */
export function toView(d: DatedPlan, monday: DateKey): PlanData {
  const tasks: Task[] = [];
  for (const t of d.tasks) {
    const day = t.date == null ? null : idxOf(monday, t.date);
    if (t.date != null && day == null) continue;
    const { date: _d, ...rest } = withoutMeta(t);
    tasks.push({ ...rest, day });
  }
  const fixed: Fixed[] = [];
  for (const f of d.fixed) {
    const days = weekDaysOf(f, monday);
    if (!days.length) continue;
    const { startsOn: _s, endsOn: _e, ...rest } = withoutMeta(f);
    fixed.push({ ...rest, days });
  }
  const reminders: Reminder[] = [];
  for (const r of d.reminders) {
    const days = weekDaysOf(r, monday);
    if (!days.length) continue;
    const { startsOn: _s, endsOn: _e, doneOn, snoozeOn, ...rest } = withoutMeta(r);
    const doneDays: DayIndex[] = [];
    for (const k of doneOn) {
      const i = idxOf(monday, k);
      if (i != null && i >= 0) doneDays.push(i);
    }
    const snooze: Record<number, number> = {};
    for (const [k, v] of Object.entries(snoozeOn)) {
      const i = idxOf(monday, k);
      if (i != null && i >= 0) snooze[i] = v;
    }
    reminders.push({ ...rest, days, doneDays, ...(Object.keys(snooze).length ? { snooze } : {}) });
  }
  return { fixed, tasks, reminders, settings: d.settings, autopilot: d.autopilot };
}

/**
 * Write the screens' changes back. Whatever is outside the current week is kept as it was;
 * what is inside it is replaced by `next`, so deletions in the view are deletions here too.
 */
export function fromView(prev: DatedPlan, next: PlanData, monday: DateKey): DatedPlan {
  const shown = toView(prev, monday);
  const shownTasks = new Set(shown.tasks.map((t) => t.id));
  const shownFixed = new Set(shown.fixed.map((f) => f.id));
  const shownRem = new Set(shown.reminders.map((r) => r.id));
  const old = <T extends { id: string }>(xs: T[], id: string) => xs.find((x) => x.id === id);

  const tasks: DatedTask[] = [
    ...prev.tasks.filter((t) => !shownTasks.has(t.id)),
    ...next.tasks.map((t): DatedTask => {
      const { day, ...rest } = t;
      const before = old(prev.tasks, t.id);
      return { ...before, ...rest, date: day == null ? null : dateOf(monday, day) };
    }),
  ];

  const fixed: DatedFixed[] = [
    ...prev.fixed.filter((f) => !shownFixed.has(f.id)),
    ...next.fixed.map((f): DatedFixed => {
      const { cutBy: _c, ...rest } = f;
      const before = old(prev.fixed, f.id);
      const days = before && sameSet(f.days, weekDaysOf(before, monday)) ? before.days : f.days;
      return { startsOn: monday, endsOn: null, ...before, ...rest, days };
    }),
  ];

  const reminders: DatedReminder[] = [
    ...prev.reminders.filter((r) => !shownRem.has(r.id)),
    ...next.reminders.map((r): DatedReminder => {
      const { doneDays, snooze, ...rest } = r;
      const before = old(prev.reminders, r.id);
      const days = before && sameSet(r.days, weekDaysOf(before, monday)) ? before.days : r.days;
      const outside = <V>(m: Record<DateKey, V> | undefined) =>
        Object.fromEntries(
          Object.entries(m ?? {}).filter(([k]) => {
            const i = idxOf(monday, k);
            return i == null || i < 0;
          }),
        );
      const doneOn = [
        ...(before?.doneOn ?? []).filter((k) => {
          const i = idxOf(monday, k);
          return i == null || i < 0;
        }),
        ...doneDays.map((i) => dateOf(monday, i)),
      ];
      const snoozeOn: Record<DateKey, number> = {
        ...outside(before?.snoozeOn),
        ...Object.fromEntries(
          Object.entries(snooze ?? {}).map(([i, v]) => [dateOf(monday, Number(i)), v]),
        ),
      };
      return { startsOn: monday, endsOn: null, ...before, ...rest, days, doneOn, snoozeOn };
    }),
  ];

  return { ...prev, fixed, tasks, reminders, settings: next.settings, autopilot: next.autopilot };
}

/** Move a plan saved in the old shape (day indexes of this week) to the dated shape. */
export function migrateWeekPlan(old: PlanData, monday: DateKey): DatedPlan {
  return fromView({ ...EMPTY_DATED, settings: old.settings }, old, monday);
}
