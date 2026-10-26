import { SAMPLE_PLAN } from '../data/sample';
import type { PlanData } from '../data/types';
import { fmtD, fmtT } from './format';
import { cutFixed, dayInfo, gapsOn, loadOf, parseReminder, remOn, rolloverPlan } from './rules';

const plan = (over: Partial<PlanData> = {}): PlanData => ({ ...SAMPLE_PLAN, ...over });

describe('format', () => {
  it('formats times and durations', () => {
    expect(fmtT(545)).toBe('09:05');
    expect(fmtD(45)).toBe('45 min');
    expect(fmtD(90)).toBe('1h 30m');
    expect(fmtD(120)).toBe('2h');
  });
});

describe('loadOf', () => {
  it('names the load', () => {
    expect(loadOf(0, 300).label).toBe('Open');
    expect(loadOf(100, 300).k).toBe('light');
    expect(loadOf(200, 300).k).toBe('balanced');
    expect(loadOf(300, 300).k).toBe('full');
    expect(loadOf(301, 300).k).toBe('over');
    expect(loadOf(30, 0).k).toBe('over');
  });
});

describe('remOn', () => {
  it('applies the heads-up, done state and snooze for this week only', () => {
    const [pickup] = remOn(plan(), 0);
    expect(pickup.title).toMatch(/vitamins/);
    const leave = remOn(plan(), 0).find((r) => r.id === 'm1')!;
    expect(leave.at).toBe(960);
    expect(remOn(plan(), 0).find((r) => r.id === 'm2')!.done).toBe(true);
    expect(remOn(plan(), 0, 1).find((r) => r.id === 'm2')!.done).toBe(false);
    const snoozed = plan({
      reminders: SAMPLE_PLAN.reminders.map((r) =>
        r.id === 'm3' ? { ...r, snooze: { 0: 10 } } : r,
      ),
    });
    expect(remOn(snoozed, 0).find((r) => r.id === 'm3')!.at).toBe(760);
  });
});

describe('cutFixed', () => {
  it('ends work at the time to leave', () => {
    const [work] = cutFixed(SAMPLE_PLAN.fixed.slice(0, 1), remOn(plan(), 0));
    expect(work.end).toBe(960);
    expect(work.cutBy?.id).toBe('m1');
  });
  it('leaves other days alone', () => {
    const [work] = cutFixed(SAMPLE_PLAN.fixed.slice(0, 1), remOn(plan(), 1));
    expect(work.end).toBe(1020);
  });
});

describe('dayInfo', () => {
  it('computes free time and load for Monday', () => {
    const i = dayInfo(plan(), 0);
    // 07:00–22:30 = 930, work 09:00–16:00 = 420, buffer 60
    expect(i.free).toBe(450);
    expect(i.planned).toBe(290);
    expect(i.left).toBe(270);
    expect(i.flex).toHaveLength(4);
    expect(i.load.k).toBe('balanced');
  });
  it('has no flexible tasks in other weeks', () => {
    expect(dayInfo(plan(), 0, 1).flex).toEqual([]);
  });
});

describe('gapsOn', () => {
  it('finds open stretches around fixed blocks and placed tasks', () => {
    expect(gapsOn(plan(), 0)).toEqual([
      { s: 420, e: 540 },
      { s: 960, e: 1065 },
      { s: 1125, e: 1350 },
    ]);
  });
  it('drops gaps under 30 minutes', () => {
    const p = plan({ settings: { ...SAMPLE_PLAN.settings, wake: 520 } });
    expect(gapsOn(p, 0)[0]).toEqual({ s: 960, e: 1065 });
  });
});

describe('rolloverPlan', () => {
  it('moves unfinished tasks to the first day with room, biggest priority first', () => {
    const moves = rolloverPlan(plan());
    expect(moves.map((m) => m.t.id)).toEqual(['a2', 'a3', 'a4']);
    expect(moves.every((m) => m.to !== null)).toBe(true);
    expect(moves[0].to).toBe(1);
    expect(moves[0].why).toMatch(/^Tuesday still has/);
  });
  it('says so when nothing has room', () => {
    const p = plan({ settings: { ...SAMPLE_PLAN.settings, buffer: 900 } });
    const moves = rolloverPlan(p);
    expect(moves.every((m) => m.to === null)).toBe(true);
    expect(moves[0].why).toBe('No day has room yet');
  });
});

describe('parseReminder', () => {
  it('reads "remind me at 4 to …"', () => {
    expect(parseReminder('remind me at 4 to call mum')).toEqual({
      title: 'Call mum',
      time: 960,
      lead: 0,
      leave: false,
    });
  });
  it('reads am/pm and minutes', () => {
    expect(parseReminder('Remind me at 7:30am to stretch')?.time).toBe(450);
    expect(parseReminder('remind me at 12am to sleep')?.time).toBe(0);
  });
  it('reads the time at the end', () => {
    expect(parseReminder('remind me to leave for pickup at 4.45pm')).toEqual({
      title: 'Leave for pickup',
      time: 1005,
      lead: 0,
      leave: true,
    });
  });
  it('ignores anything else', () => {
    expect(parseReminder('buy milk')).toBeNull();
    expect(parseReminder('remind me at 25 to x')).toBeNull();
  });
});
