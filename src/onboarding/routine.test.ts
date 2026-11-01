import { SAMPLE_PLAN } from '../data/sample';
import { DAYF, fmtD } from '../rules';
import { applyRoutine, normalizeRoutine, routineIssues, spreadPlan, type Routine } from './routine';

const answer = {
  fixed: [
    { title: 'Work', cat: 'work', days: [4, 0, 1, 2, 3, 3], start: 540, end: 1020 },
    { title: 'Broken', cat: 'work', days: [1], start: 600, end: 500 },
    { title: '', cat: 'work', days: [1], start: 1, end: 2 },
  ],
  flex: [
    { title: 'Gym', cat: 'fitness', freq: 4, dur: 60 },
    { title: 'Reading', cat: 'nonsense', freq: 99, dur: 5 },
  ],
  reminders: [
    { title: 'Pick up the kids', cat: 'personal', days: [0, 2], time: 1020, lead: 60, leave: true },
    { title: 'No days', days: [], time: 100 },
  ],
};

describe('normalizeRoutine', () => {
  const r = normalizeRoutine(answer, 'my week');
  it('keeps good items and drops broken ones', () => {
    expect(r.fixed.map((f) => f.title)).toEqual(['Work']);
    expect(r.flex).toHaveLength(2);
    expect(r.reminders).toHaveLength(1);
  });
  it('sorts and dedupes days', () => {
    expect(r.fixed[0].days).toEqual([0, 1, 2, 3, 4]);
  });
  it('clamps numbers and falls back on unknown categories', () => {
    expect(r.flex[1]).toMatchObject({ cat: 'personal', freq: 7, dur: 15 });
  });
  it('survives nonsense', () => {
    expect(normalizeRoutine(null, 'x')).toMatchObject({ fixed: [], flex: [], reminders: [] });
    expect(normalizeRoutine({ fixed: 'no' }, 'x').fixed).toEqual([]);
  });
});

describe('spreadPlan', () => {
  const r = normalizeRoutine(answer, 'x');
  it('places every session and keeps Sunday lightest', () => {
    const sp = spreadPlan(r, SAMPLE_PLAN.settings);
    expect(sp.plan.flat()).toHaveLength(4 + 7);
    expect(sp.used[6]).toBeLessThanOrEqual(Math.min(...sp.used.slice(0, 5)));
  });
  it('flags a crowded day', () => {
    const crowded: Routine = {
      ...r,
      flex: [{ id: 'a', title: 'Big', cat: 'work', freq: 7, dur: 480 }],
    };
    const issues = routineIssues(crowded, SAMPLE_PLAN.settings, fmtD, DAYF);
    expect(issues.some((i) => i.tone === 'over')).toBe(true);
  });
});

describe('applyRoutine', () => {
  const r = normalizeRoutine(answer, 'x');
  const mine = { ...SAMPLE_PLAN.tasks[0], id: 'mine' };
  const out = applyRoutine({ ...SAMPLE_PLAN, tasks: [...SAMPLE_PLAN.tasks, mine] }, r, 2);
  it('replaces the demo items and keeps the user’s own', () => {
    expect(out.fixed.map((f) => f.title)).toEqual(['Work']);
    expect(out.reminders.map((m) => m.title)).toEqual(['Pick up the kids']);
    expect(out.tasks.some((t) => t.id === 'mine')).toBe(true);
    expect(out.tasks.some((t) => t.id === SAMPLE_PLAN.tasks[0].id)).toBe(false);
  });
  it('only adds tasks from today on', () => {
    const added = out.tasks.filter((t) => t.id !== 'mine');
    expect(added.length).toBeGreaterThan(0);
    expect(added.every((t) => (t.day ?? 0) >= 2)).toBe(true);
  });
});
