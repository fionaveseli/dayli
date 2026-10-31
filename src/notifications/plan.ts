import { remOn } from '../rules/rules';
import { fmtT } from '../rules/format';
import type { DayIndex, PlanData, Reminder } from '../data/types';

export const HORIZON_DAYS = 7;
export const NAG_EVERY = 10;
export const NAG_TIMES = 3;
export const SNOOZE_MIN = 10;

export type PlannedNotification = {
  key: string;
  reminderId: string;
  day: DayIndex;
  at: Date;
  title: string;
  body: string;
  leave: boolean;
  nag: boolean;
};

/** Monday = 0 … Sunday = 6 */
export const dayIndexOf = (d: Date): DayIndex => (d.getDay() + 6) % 7;
export const minutesOf = (d: Date): number => d.getHours() * 60 + d.getMinutes();

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function at(date: Date, minutes: number): Date {
  const x = new Date(date);
  x.setHours(0, minutes, 0, 0);
  return x;
}

function texts(r: Reminder, alertAt: number) {
  const title = r.leave ? `Time to leave · ${fmtT(alertAt)}` : `Reminder · ${fmtT(alertAt)}`;
  const tail = r.leave || r.lead ? ` at ${fmtT(r.time)}` : '';
  const body = `${r.title}${tail}.${r.note ? ' ' + r.note + '.' : ''}`;
  return { title, body };
}

/**
 * Every notification that should be scheduled from `now` over the next week.
 * Done reminders and past times are skipped. Nag reminders repeat a few times
 * until they are ticked. Snoozes only exist for the current week.
 */
export function planNotifications(plan: PlanData, now: Date): PlannedNotification[] {
  const out: PlannedNotification[] = [];
  const todayIdx = dayIndexOf(now);
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const date = addDays(now, i);
    const d = dayIndexOf(date);
    const wk = i > 6 - todayIdx ? 1 : 0;
    for (const r of remOn(plan, d, wk)) {
      if (r.done) continue;
      const times = [r.at];
      if (r.nag) for (let n = 1; n <= NAG_TIMES; n++) times.push(r.at + n * NAG_EVERY);
      times.forEach((m, n) => {
        if (m >= 24 * 60) return;
        const when = at(date, m);
        if (when.getTime() <= now.getTime()) return;
        const { title, body } = texts(r, r.at);
        out.push({
          key: `${r.id}:${i}:${n}`,
          reminderId: r.id,
          day: d,
          at: when,
          title: n ? `Still to do · ${r.title}` : title,
          body: n ? 'Tap Done when it is finished, or snooze it.' : body,
          leave: r.leave,
          nag: !!r.nag,
        });
      });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

/** Snooze a reminder on a day: its alert moves `min` minutes after now (or after its current time). */
export function snoozeReminder(
  r: Reminder,
  day: DayIndex,
  nowMin: number,
  min = SNOOZE_MIN,
): Reminder {
  const cur = (r.snooze || {})[day] || 0;
  const base = r.time - r.lead + cur;
  const next = Math.max(base, nowMin) + min;
  return { ...r, snooze: { ...(r.snooze || {}), [day]: next - (r.time - r.lead) } };
}
