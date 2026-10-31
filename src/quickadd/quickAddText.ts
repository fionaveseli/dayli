import type { DayIndex, PlanData, Reminder, Task } from '../data/types';
import { fmtT, parseReminder } from '../rules';

export type QuickAddOptions = {
  /** Day the item lands on; null puts a task in the brain dump. */
  day: DayIndex | null;
  /** Treat any text as a reminder (the Reminders list). */
  remOnly?: boolean;
};

export type QuickAddResult = { plan: PlanData; message: string } | null;

const newId = (p: string) =>
  `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** One line becomes a reminder ("remind me at 4 to…") or a 30 minute flexible task. */
export function quickAdd(plan: PlanData, text: string, opts: QuickAddOptions): QuickAddResult {
  const v = text.trim();
  if (!v) return null;
  const parsed = parseReminder(v);
  if (parsed || opts.remOnly) {
    const base = parsed ?? { title: cap(v), time: 1080, lead: 0, leave: false };
    const reminder: Reminder = {
      id: newId('r'),
      title: base.title,
      days: [opts.day ?? 0],
      time: base.time,
      lead: base.leave || parsed ? 0 : plan.settings.defLead,
      leave: base.leave,
      note: '',
      cat: 'personal',
      doneDays: [],
      nag: plan.settings.nNag,
    };
    const message = parsed
      ? `Reminder set for ${fmtT(base.time)}${
          base.leave ? '. Anything fixed ends then, so your free time is updated.' : '.'
        }`
      : 'Reminder set for 18:00. Tap it to change the time.';
    return { plan: { ...plan, reminders: [...plan.reminders, reminder] }, message };
  }
  const task: Task = {
    id: newId('t'),
    title: v,
    cat: 'personal',
    dur: 30,
    day: opts.day,
    time: null,
    done: false,
    notes: '',
    goal: null,
    ms: null,
    pri: 2,
    repeat: false,
  };
  return {
    plan: { ...plan, tasks: [...plan.tasks, task] },
    message: opts.day == null ? 'Added to your brain dump.' : 'Added to today.',
  };
}
