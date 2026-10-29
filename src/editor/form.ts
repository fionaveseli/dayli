import type { Category, DayIndex, Fixed, PlanData, Reminder, Task } from '../data/types';

export type Kind = 'flex' | 'fixed' | 'rem';

export type EditorTarget = { kind: Kind; id: string } | null;

export type Form = {
  kind: Kind;
  title: string;
  notes: string;
  cat: Category;
  dur: number;
  /** Flexible: a day, or null for the brain dump. */
  day: DayIndex | null;
  repeat: boolean;
  pri: number;
  /** Fixed and reminder: the days it happens on. */
  days: DayIndex[];
  start: number;
  end: number;
  time: number;
  lead: number;
  leave: boolean;
  nag: boolean;
};

export function blankForm(plan: PlanData, defaults: Partial<Form> = {}): Form {
  return {
    kind: 'flex',
    title: '',
    notes: '',
    cat: 'personal',
    dur: 30,
    day: 0,
    repeat: false,
    pri: 2,
    days: [0],
    start: 1080,
    end: 1140,
    time: 1020,
    lead: plan.settings.defLead,
    leave: false,
    nag: plan.settings.nNag,
    ...defaults,
  };
}

/** The form for an existing item, or a blank one when `target` is null. */
export function formFor(plan: PlanData, target: EditorTarget): Form {
  const blank = blankForm(plan);
  if (!target) return blank;
  if (target.kind === 'flex') {
    const t = plan.tasks.find((x) => x.id === target.id);
    if (!t) return blank;
    const start = t.time ?? blank.start;
    return {
      ...blank,
      kind: 'flex',
      title: t.title,
      notes: t.notes,
      cat: t.cat,
      dur: t.dur,
      day: t.day,
      repeat: t.repeat,
      pri: t.pri,
      days: [t.day != null && t.day >= 0 ? t.day : 0],
      start,
      end: start + t.dur,
    };
  }
  if (target.kind === 'fixed') {
    const f = plan.fixed.find((x) => x.id === target.id);
    if (!f) return blank;
    return {
      ...blank,
      kind: 'fixed',
      title: f.title,
      notes: f.where,
      cat: f.cat,
      days: f.days,
      day: f.days[0] ?? 0,
      start: f.start,
      end: f.end,
      dur: f.end - f.start,
      time: f.start,
    };
  }
  const r = plan.reminders.find((x) => x.id === target.id);
  if (!r) return blank;
  return {
    ...blank,
    kind: 'rem',
    title: r.title,
    notes: r.note,
    cat: r.cat,
    days: r.days,
    day: r.days[0] ?? 0,
    time: r.time,
    lead: r.lead,
    leave: r.leave,
    nag: r.nag,
  };
}

export const canSave = (f: Form) =>
  f.title.trim() !== '' && (f.kind === 'flex' || f.days.length > 0);

const newId = (p: string) =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const sortDays = (d: DayIndex[]) => [...d].sort((a, b) => a - b);

/**
 * Applies the form to the plan. Same type updates in place; a different type
 * removes the original and adds the new one, like the prototype.
 */
export function saveForm(plan: PlanData, target: EditorTarget, f: Form): PlanData {
  const title = f.title.trim();
  const same = target?.kind === f.kind;
  let { tasks, fixed, reminders } = plan;
  if (target && !same) {
    tasks = tasks.filter((x) => !(target.kind === 'flex' && x.id === target.id));
    fixed = fixed.filter((x) => !(target.kind === 'fixed' && x.id === target.id));
    reminders = reminders.filter((x) => !(target.kind === 'rem' && x.id === target.id));
  }
  const days = f.days.length ? sortDays(f.days) : [0];

  if (f.kind === 'flex') {
    const patch = {
      title,
      notes: f.notes,
      cat: f.cat,
      dur: f.dur,
      day: f.day,
      repeat: f.repeat,
      pri: f.pri,
    };
    if (same) {
      tasks = tasks.map((t) =>
        t.id === target!.id ? { ...t, ...patch, time: f.day !== t.day ? null : t.time } : t,
      );
    } else {
      const t: Task = { id: newId('t'), done: false, time: null, goal: null, ms: null, ...patch };
      tasks = [...tasks, t];
    }
  } else if (f.kind === 'fixed') {
    const patch = {
      title,
      cat: f.cat,
      days,
      start: f.start,
      end: Math.max(f.end, f.start + 15),
      where: f.notes,
    };
    fixed = same
      ? fixed.map((x) => (x.id === target!.id ? { ...x, ...patch } : x))
      : [...fixed, { id: newId('f'), ...patch } as Fixed];
  } else {
    const patch = {
      title,
      cat: f.cat,
      days,
      time: f.time,
      lead: f.lead,
      leave: f.leave,
      note: f.notes,
      nag: f.nag,
    };
    reminders = same
      ? reminders.map((x) => (x.id === target!.id ? { ...x, ...patch, snooze: {} } : x))
      : [...reminders, { id: newId('r'), doneDays: [], ...patch } as Reminder];
  }
  return { ...plan, tasks, fixed, reminders };
}

export function deleteTarget(plan: PlanData, target: NonNullable<EditorTarget>): PlanData {
  return {
    ...plan,
    tasks: target.kind === 'flex' ? plan.tasks.filter((x) => x.id !== target.id) : plan.tasks,
    fixed: target.kind === 'fixed' ? plan.fixed.filter((x) => x.id !== target.id) : plan.fixed,
    reminders:
      target.kind === 'rem' ? plan.reminders.filter((x) => x.id !== target.id) : plan.reminders,
  };
}
