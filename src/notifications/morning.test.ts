import { SAMPLE_PLAN } from '../data/sample';
import { planMorningNotifications } from './morning';
import type { PlanData } from '../data/types';

// Monday 2026-10-26, 07:00 local: before the 08:00 plan time.
const mon = new Date(2026, 9, 26, 7, 0, 0);

describe('planMorningNotifications', () => {
  it('schedules the plan at plan time for each coming day', () => {
    const out = planMorningNotifications(SAMPLE_PLAN, mon);
    expect(out).toHaveLength(7);
    expect(out[0].at.getHours()).toBe(8);
    expect(out[0].title).toBe('Your Monday is ready');
    expect(out[0].body).toMatch(/Looks good\?$/);
  });

  it('skips today once the plan time has passed, and an approved day', () => {
    const late = new Date(2026, 9, 26, 9, 0, 0);
    expect(planMorningNotifications(SAMPLE_PLAN, late)).toHaveLength(6);
    const approved: PlanData = {
      ...SAMPLE_PLAN,
      autopilot: { approved: { date: '2026-10-26', at: 400 } },
    };
    expect(planMorningNotifications(approved, mon)).toHaveLength(6);
  });

  it('is silent when the morning plan is off', () => {
    const off = { ...SAMPLE_PLAN, settings: { ...SAMPLE_PLAN.settings, nMorning: false } };
    expect(planMorningNotifications(off, mon)).toHaveLength(0);
  });

  it('gives next week a plain nudge', () => {
    const sun = new Date(2026, 10, 1, 7, 0, 0);
    const out = planMorningNotifications(SAMPLE_PLAN, sun);
    expect(out[1].title).toBe('Your day is ready');
  });
});
