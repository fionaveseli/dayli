import { SAMPLE_PLAN } from '../data/sample';
import type { Chapter, PlanData, Task } from '../data/types';
import { planResetNotification } from '../notifications/morning';
import { migrateWeekPlan, toView } from '../sync/dated';
import { addKey } from '../sync/dates';
import { applyReset, proposeWeek, resetDue, resetPreview, weekRange, weekReview } from './reset';
import { dayInfo } from './rules';

const MON = '2026-11-09';
const NEXT = '2026-11-16';
const SUN = new Date(2026, 10, 15, 18, 30);
let n = 0;
const id = () => `n${n++}`;

const task = (over: Partial<Task>): Task => ({
  id: 't',
  title: 'Task',
  cat: 'personal',
  dur: 60,
  day: 0,
  time: null,
  done: false,
  notes: '',
  goal: null,
  ms: null,
  pri: 2,
  repeat: false,
  ...over,
});

const week: PlanData = {
  ...SAMPLE_PLAN,
  tasks: [
    task({ id: 'a', title: 'Done thing', day: 0, done: true, dur: 30 }),
    task({ id: 'b', title: 'Slipped', day: 2, time: 1100 }),
    task({ id: 'c', title: 'Important', day: 4, pri: 3, dur: 90 }),
    task({ id: 'd', title: 'Later', day: 6 }),
    task({ id: 'e', title: 'Idea', day: null }),
  ],
};

const gym: Chapter = {
  id: 'ch',
  name: 'Fit',
  start: '2026-01-01',
  end: '2027-01-01',
  color: 'sage',
  desc: '',
  summary: '',
  rhythm: [{ title: 'Gym', cat: 'fitness', freq: 2, dur: 60 }],
};

describe('weekReview', () => {
  it('counts what got done and what slipped up to today', () => {
    const r = weekReview(week, 6);
    expect(r.done.map((t) => t.id)).toEqual(['a']);
    expect(r.doneMin).toBe(30);
    expect(r.slipped.map((t) => t.id)).toEqual(['b', 'c', 'd']);
    expect(weekReview(week, 3).slipped.map((t) => t.id)).toEqual(['b']);
  });
});

describe('proposeWeek', () => {
  const next: PlanData = { ...SAMPLE_PLAN, tasks: [] };
  const slipped = weekReview(week, 6).slipped;

  it('moves kept tasks to the lightest days, never the rest day, and drops their time', () => {
    const p = proposeWeek(next, slipped, { d: 'dump' }, [], NEXT, id);
    expect(p.moves.map((m) => m.t.id)).toEqual(['c', 'b']);
    for (const m of p.moves) {
      expect(m.to).not.toBe(SAMPLE_PLAN.settings.restDay);
      expect(m.to).not.toBeNull();
    }
    expect(p.next.tasks.every((t) => t.time === null && t.rolled)).toBe(true);
    expect(p.next.tasks.find((t) => t.id === 'd')).toBeUndefined();
    // The lightest day is the weekend Saturday (more free time than workdays).
    expect(p.moves[0].to).toBe(5);
    expect(p.moves[0].why).toMatch(/^Saturday is the lightest day/);
  });

  it('adds the rhythm sessions of chapters running next week', () => {
    const p = proposeWeek(next, [], {}, [gym], NEXT, id);
    expect(p.sessions).toHaveLength(2);
    expect(p.sessions.every((t) => t.title === 'Gym' && t.repeat)).toBe(true);
    const ended = { ...gym, end: '2026-11-15' };
    expect(proposeWeek(next, [], {}, [ended], NEXT, id).sessions).toHaveLength(0);
  });

  it('sends a task to the brain dump when no day has room', () => {
    const huge = task({ id: 'h', dur: 2000, day: 1 });
    const p = proposeWeek(next, [huge], {}, [], NEXT, id);
    expect(p.moves[0].to).toBeNull();
    expect(p.moves[0].why).toMatch(/brain dump/);
  });

  it('keeps every day within its free time', () => {
    const many = Array.from({ length: 20 }, (_, i) => task({ id: `m${i}`, dur: 120, day: 0 }));
    const p = proposeWeek(next, many, {}, [], NEXT, id);
    for (let d = 0; d < 7; d++) {
      const i = dayInfo(p.next, d);
      expect(i.planned).toBeLessThanOrEqual(i.free);
    }
  });
});

describe('applyReset', () => {
  const dated = { ...migrateWeekPlan(week, MON), chapters: [gym] };

  it('moves, dumps and lets go, adds sessions, and remembers the week', () => {
    const out = applyReset(dated, MON, SUN, { b: 'dump', d: 'drop' }, id);
    const byId = (x: string) => out.tasks.find((t) => t.id === x);
    expect(byId('b')).toMatchObject({ date: null, time: null });
    expect(byId('d')).toBeUndefined();
    expect(byId('c')!.date! >= NEXT).toBe(true);
    expect(byId('a')!.date).toBe(MON);
    expect(byId('e')!.date).toBeNull();
    const nextView = toView(out, NEXT);
    expect(nextView.tasks.filter((t) => t.title === 'Gym')).toHaveLength(2);
    expect(out.autopilot).toMatchObject({ resetWeek: NEXT, rhythmWeek: NEXT });
  });

  it('matches what the preview showed', () => {
    const pv = resetPreview(dated, MON, SUN, {}, id);
    const out = applyReset(dated, MON, SUN, {}, id);
    for (const m of pv.proposal.moves) {
      const t = out.tasks.find((x) => x.id === m.t.id)!;
      expect(t.date).toBe(m.to == null ? null : addKey(NEXT, m.to));
    }
    expect(toView(out, NEXT).tasks.filter((t) => t.rolled)).toHaveLength(3);
  });
});

describe('when to offer it', () => {
  it('is due on Sundays until next week is set up', () => {
    expect(resetDue(week, SUN, MON)).toBe(true);
    expect(resetDue(week, new Date(2026, 10, 14, 18), MON)).toBe(false);
    expect(resetDue({ ...week, autopilot: { resetWeek: NEXT } }, SUN, MON)).toBe(false);
    const off = { ...week, settings: { ...week.settings, nWeekly: false } };
    expect(resetDue(off, SUN, MON)).toBe(false);
  });

  it('schedules the Sunday notification at 18:00', () => {
    const wed = new Date(2026, 10, 11, 9);
    const n1 = planResetNotification(week, wed)!;
    expect(n1.date).toBe('2026-11-15');
    expect(n1.at.getHours()).toBe(18);
    expect(planResetNotification(week, SUN)).toBeNull();
    expect(planResetNotification({ ...week, autopilot: { resetWeek: NEXT } }, wed)).toBeNull();
  });

  it('names the week', () => {
    expect(weekRange(NEXT)).toBe('16–22 Nov');
    expect(weekRange('2026-11-30')).toBe('30 Nov – 6 Dec');
  });
});
