import { dateKey, planNotificationText, planSummary } from '../rules/autopilot';
import { dayIndexOf, HORIZON_DAYS } from './plan';
import type { PlanData } from '../data/types';

export type MorningNotification = {
  key: string;
  date: string;
  at: Date;
  title: string;
  body: string;
};

/**
 * The "your day is ready" notification at the plan time, for each of the next days.
 * Days already approved and times already past are skipped. Only this week's days
 * know their tasks, so later days get a plain nudge.
 */
export function planMorningNotifications(plan: PlanData, now: Date): MorningNotification[] {
  if (!plan.settings.nMorning) return [];
  const out: MorningNotification[] = [];
  const todayIdx = dayIndexOf(now);
  for (let i = 0; i < HORIZON_DAYS; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    date.setHours(0, plan.settings.planTime, 0, 0);
    if (date.getTime() <= now.getTime()) continue;
    const key = dateKey(date);
    if (plan.autopilot?.approved?.date === key) continue;
    const d = dayIndexOf(date);
    const thisWeek = i <= 6 - todayIdx;
    const text = thisWeek
      ? planNotificationText(planSummary(plan, d), d)
      : { title: 'Your day is ready', body: 'Open Dayli to look over today and approve it.' };
    out.push({ key: `plan:${key}`, date: key, at: date, ...text });
  }
  return out;
}
