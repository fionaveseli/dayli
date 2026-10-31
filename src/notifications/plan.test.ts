import { SAMPLE_PLAN } from '../data/sample';
import { planNotifications, snoozeReminder, dayIndexOf } from './plan';
import type { PlanData } from '../data/types';

// Monday 2026-11-02, 08:00 local
const mon = new Date(2026, 10, 2, 8, 0, 0);

const withReminders = (reminders: PlanData['reminders']): PlanData => ({
  ...SAMPLE_PLAN,
  reminders,
});
const base = SAMPLE_PLAN.reminders[0];

describe('planNotifications', () => {
  it('maps Monday to day 0', () => expect(dayIndexOf(mon)).toBe(0));

  it('skips past times and done reminders', () => {
    const r = { ...base, days: [0], time: 7 * 60, lead: 0, nag: false };
    expect(planNotifications(withReminders([r]), mon)).toHaveLength(0);
    const done = { ...r, time: 9 * 60, doneDays: [0] };
    expect(planNotifications(withReminders([done]), mon)).toHaveLength(0);
  });

  it('schedules the heads-up time for a time-to-leave reminder', () => {
    const r = { ...base, days: [0], time: 17 * 60, lead: 60, leave: true, nag: false, note: '' };
    const [n] = planNotifications(withReminders([r]), mon);
    expect(n.at.getHours()).toBe(16);
    expect(n.title).toBe('Time to leave · 16:00');
    expect(n.body).toBe(`${r.title} at 17:00.`);
  });

  it('repeats a nag reminder until ticked', () => {
    const r = { ...base, days: [0], time: 9 * 60, lead: 0, nag: true };
    expect(planNotifications(withReminders([r]), mon)).toHaveLength(4);
    expect(planNotifications(withReminders([{ ...r, doneDays: [0] }]), mon)).toHaveLength(0);
  });

  it('honours a snooze today and looks a week ahead', () => {
    const r = { ...base, days: [0], time: 9 * 60, lead: 0, nag: false, snooze: { 0: 30 } };
    const out = planNotifications(withReminders([r]), mon);
    expect(out.map((n) => n.at.getHours() * 60 + n.at.getMinutes())).toEqual([9 * 60 + 30]);
    const daily = { ...r, days: [0, 1, 2, 3, 4, 5, 6], snooze: {} };
    expect(planNotifications(withReminders([daily]), mon)).toHaveLength(7);
  });
});

describe('snoozeReminder', () => {
  it('pushes the alert 10 minutes past now', () => {
    const r = { ...base, time: 600, lead: 0, snooze: undefined };
    expect(snoozeReminder(r, 0, 605).snooze).toEqual({ 0: 15 });
    expect(snoozeReminder(r, 0, 500).snooze).toEqual({ 0: 10 });
  });
});
