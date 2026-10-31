import { SAMPLE_PLAN } from '../data/sample';
import type { PlanData } from '../data/types';
import { groupTasks, openByCategory } from './groups';

const task = (id: string, day: number | null, done = false, cat = 'personal' as const) => ({
  id,
  title: id,
  cat,
  dur: 30,
  day,
  time: null,
  done,
  notes: '',
  goal: null,
  ms: null,
  pri: 1,
  repeat: false,
});
const plan: PlanData = {
  ...SAMPLE_PLAN,
  tasks: [
    task('a', 0),
    task('b', 2),
    task('c', 1, false, 'fitness' as never),
    task('d', null),
    task('e', 0, true),
    task('f', -1, true),
  ],
};

describe('groupTasks', () => {
  it('splits open tasks by day and keeps done ones apart', () => {
    const g = groupTasks(plan, 0);
    expect(g.today.map((t) => t.id)).toEqual(['a']);
    expect(g.week.map((t) => t.id)).toEqual(['c', 'b']);
    expect(g.dump.map((t) => t.id)).toEqual(['d']);
    expect(g.done.map((t) => t.id)).toEqual(['e', 'f']);
  });
  it('filters by category', () => {
    const g = groupTasks(plan, 0, 'fitness');
    expect(g.week.map((t) => t.id)).toEqual(['c']);
    expect(g.today).toEqual([]);
  });
  it('lists reminders by their alert time', () => {
    const g = groupTasks(SAMPLE_PLAN, 0);
    const ats = g.rem.map((r) => r.at);
    expect(ats).toEqual([...ats].sort((x, y) => x - y));
  });
  it('totals open work per category', () => {
    expect(openByCategory(plan).personal).toEqual({ n: 3, mins: 90 });
  });
});
