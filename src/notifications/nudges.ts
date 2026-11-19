import { dateKey } from '../rules/autopilot';
import { nudgesFrom, nudgeText } from '../rules/nudges';
import { dayIndexOf, minutesOf } from './plan';
import type { PlanData } from '../data/types';

export type NudgeNotification = {
  key: string;
  taskId: string;
  at: Date;
  title: string;
  body: string;
};

/**
 * Gentle nudges for the open stretches still to come today, at the start of each one.
 * Only today: the plan is rescheduled on every change and whenever the app opens.
 */
export function planNudgeNotifications(plan: PlanData, now: Date): NudgeNotification[] {
  const nowMin = minutesOf(now);
  return nudgesFrom(plan, dayIndexOf(now), nowMin)
    .filter((n) => n.s > nowMin)
    .map((n) => {
      const at = new Date(now);
      at.setHours(0, n.s, 0, 0);
      return { key: `nudge:${dateKey(now)}:${n.task.id}`, taskId: n.task.id, at, ...nudgeText(n) };
    });
}
