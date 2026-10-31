import { SAMPLE_PLAN } from '../data/sample';
import { dateKey, planLine, planSummary, rolloverFor } from './autopilot';
import type { PlanData } from '../data/types';

const unfinishedToday = SAMPLE_PLAN.tasks.filter((t) => t.day === 0 && !t.done);

describe('dateKey', () => {
  it('formats the local date', () =>
    expect(dateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05'));
});

describe('planSummary', () => {
  it('counts open tasks and fits the sample Monday', () => {
    const s = planSummary(SAMPLE_PLAN, 0);
    expect(s.open).toHaveLength(unfinishedToday.length);
    expect(s.over).toBe(false);
    expect(planLine(s)).toMatch(/flexible task/);
  });

  it('offers to move the least important task when the day overflows', () => {
    const tight: PlanData = {
      ...SAMPLE_PLAN,
      settings: { ...SAMPLE_PLAN.settings, wake: 480, sleep: 540 },
    };
    const s = planSummary(tight, 0);
    expect(s.over).toBe(true);
    expect(s.suggest).not.toBeNull();
  });
});

describe('rolloverFor', () => {
  it('does nothing before the day has ended', () => {
    const r = rolloverFor(SAMPLE_PLAN, new Date(2026, 9, 26, 20, 0));
    expect(r.through).toBeNull();
    expect(r.tasks).toBe(SAMPLE_PLAN.tasks);
  });

  it('moves Monday’s unfinished tasks after bedtime, marked as rolled', () => {
    const r = rolloverFor(SAMPLE_PLAN, new Date(2026, 9, 26, 23, 45));
    expect(r.through).toBe('2026-10-26');
    expect(r.moves).toHaveLength(unfinishedToday.length);
    const moved = r.tasks.filter((t) => t.rolled);
    expect(moved.length).toBe(unfinishedToday.length);
    expect(r.tasks.filter((t) => t.day === 0 && !t.done)).toHaveLength(0);
    moved.forEach((t) => expect(t.day === null || t.day > 0).toBe(true));
  });

  it('catches up on days missed, but never lands a task on a day already over', () => {
    // Wednesday morning; Monday's leftovers must not go to Tuesday.
    const r = rolloverFor(
      { ...SAMPLE_PLAN, autopilot: { rolledThrough: '2026-10-25' } },
      new Date(2026, 9, 28, 9, 0),
    );
    expect(r.through).toBe('2026-10-27');
    r.tasks.filter((t) => t.rolled).forEach((t) => expect(t.day === null || t.day >= 2).toBe(true));
  });

  it('does not repeat a day it has already handled', () => {
    const r = rolloverFor(
      { ...SAMPLE_PLAN, autopilot: { rolledThrough: '2026-10-26' } },
      new Date(2026, 9, 26, 23, 45),
    );
    expect(r.through).toBeNull();
  });
});
