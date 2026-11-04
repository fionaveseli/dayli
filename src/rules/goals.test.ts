import { GOALS0, MILESTONES0, TASKS0 } from '../data/sample';
import { fmtDue, goalInfo, validDue } from './goals';

describe('goalInfo', () => {
  const info = (id: string, tasks = TASKS0) =>
    goalInfo(
      GOALS0.find((g) => g.id === id)!,
      MILESTONES0,
      tasks,
    );

  it('marks the first unreached milestone as current', () => {
    const g = info('g1');
    expect(g.milestones.map((m) => m.state)).toEqual([
      'current',
      'upcoming',
      'upcoming',
      'upcoming',
    ]);
    expect(g.next?.id).toBe('m1');
  });

  it('counts done milestones without tasks and linked steps', () => {
    const g = info('g3');
    expect(g.milestones[0].state).toBe('done');
    expect(g.next?.id).toBe('h2');
    expect(g.steps).toBe(TASKS0.filter((t) => t.goal === 'g3').length);
  });

  it('moves progress when a linked task is ticked', () => {
    const before = info('g1');
    const done = TASKS0.map((t) => (t.ms === 'm1' ? { ...t, done: true } : t));
    const after = info('g1', done);
    expect(after.p).toBeGreaterThan(before.p);
    expect(after.milestones[0].state).toBe('done');
    expect(after.next?.id).toBe('m2');
  });

  it('has no progress and no next milestone without milestones', () => {
    const g = goalInfo(GOALS0[0], [], []);
    expect(g.p).toBe(0);
    expect(g.next).toBeUndefined();
  });
});

describe('dates', () => {
  it('formats due dates', () => {
    expect(fmtDue('2026-11-15')).toBe('15 Nov');
    expect(fmtDue(null)).toBe('Ongoing');
  });
  it('validates typed dates', () => {
    expect(validDue('2026-11-15')).toBe(true);
    expect(validDue('2026-02-31')).toBe(false);
    expect(validDue('15 Nov')).toBe(false);
  });
});
