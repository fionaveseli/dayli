import { SAMPLE_PLAN } from '../data/sample';
import type { PlanData, Task } from '../data/types';
import { planNudgeNotifications } from '../notifications/nudges';
import { freeLabel, nudgeNow, nudgesFrom, nudgeText } from './nudges';

const task = (id: string, dur: number, o: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  cat: 'personal',
  dur,
  day: 0,
  time: null,
  done: false,
  notes: '',
  goal: null,
  ms: null,
  pri: 2,
  repeat: false,
  ...o,
});

// Monday: work 09:00–17:00, then a placed task 17:00–18:00.
const plan = (tasks: Task[], settings: Partial<PlanData['settings']> = {}): PlanData => ({
  ...SAMPLE_PLAN,
  fixed: [{ id: 'w', title: 'Work', cat: 'work', days: [0], start: 540, end: 1020, where: '' }],
  reminders: [],
  tasks: [task('placed', 60, { time: 1020 }), ...tasks],
  settings: { ...SAMPLE_PLAN.settings, ...settings },
});

describe('nudgeNow', () => {
  it('offers the most important task that fits the open stretch', () => {
    const p = plan([task('a', 45), task('b', 60, { pri: 3 }), task('c', 120, { pri: 3 })]);
    // 08:00, free until work at 09:00
    const n = nudgeNow(p, 0, 480)!;
    expect(n.task.id).toBe('b');
    expect([n.s, n.e]).toEqual([480, 540]);
    expect(nudgeText(n)).toEqual({ title: 'You have a free hour now', body: 'Task b fits (1h).' });
  });

  it('stays quiet during fixed time, when nothing fits, and when switched off', () => {
    const p = plan([task('a', 45)]);
    expect(nudgeNow(p, 0, 600)).toBeNull();
    expect(nudgeNow(plan([task('a', 90)]), 0, 480)).toBeNull();
    expect(nudgeNow(plan([task('a', 45)], { nNudge: false }), 0, 480)).toBeNull();
  });

  it('skips done and placed tasks', () => {
    const p = plan([task('a', 45, { done: true }), task('b', 30, { time: 1200 })]);
    expect(nudgeNow(p, 0, 480)).toBeNull();
  });

  it('never nudges in protected evenings', () => {
    const p = plan([task('a', 30)]);
    expect(nudgeNow(p, 0, 21 * 60)).toBeNull();
    // 20:45 leaves only 15 minutes before 21:00
    expect(nudgeNow(p, 0, 20 * 60 + 45)).toBeNull();
    expect(nudgeNow(plan([task('a', 30)], { protectEvening: false }), 0, 21 * 60)?.task.id).toBe(
      'a',
    );
  });
});

describe('nudgesFrom', () => {
  it('gives each stretch a different task, at most two a day, ending at 21:00', () => {
    const p = plan([task('a', 60), task('b', 30), task('c', 30)]);
    const out = nudgesFrom(p, 0, 420);
    expect(out.map((n) => [n.task.id, n.s, n.e])).toEqual([
      ['a', 420, 540],
      ['b', 1080, 1260],
    ]);
  });
});

describe('planNudgeNotifications', () => {
  it('schedules today’s later stretches only', () => {
    const p = plan([task('a', 60), task('b', 30)]);
    // Monday 2 November 2026, 08:00: the stretch now is left to the Today card.
    const out = planNudgeNotifications(p, new Date(2026, 10, 2, 8, 0));
    expect(out).toHaveLength(1);
    expect(out[0].at.getHours()).toBe(18);
    expect(out[0].key).toBe('nudge:2026-11-02:b');
    expect(out[0].title).toBe('You have 3h free now');
  });
});

it('labels free time plainly', () => {
  expect(freeLabel(45)).toBe('45 free minutes');
  expect(freeLabel(90)).toBe('1h 30m free');
});
