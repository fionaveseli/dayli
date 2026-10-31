import { SAMPLE_PLAN } from '../data/sample';
import {
  dateOfDay,
  fitGaps,
  loadAfter,
  moveTask,
  placeTask,
  unplaceTask,
  weekStart,
} from './calendar';

const task = SAMPLE_PLAN.tasks.find((t) => t.day === 0 && t.time == null)!;

describe('calendar rules', () => {
  it('moves a task to another day and drops its clock', () => {
    const placed = placeTask(SAMPLE_PLAN.tasks, task.id, 0, 600);
    const moved = moveTask(placed, task.id, 2).find((t) => t.id === task.id)!;
    expect(moved.day).toBe(2);
    expect(moved.time).toBeNull();
  });

  it('moves to the brain dump with null', () => {
    expect(
      moveTask(SAMPLE_PLAN.tasks, task.id, null).find((t) => t.id === task.id)!.day,
    ).toBeNull();
  });

  it('places and unplaces without changing the day', () => {
    const p = placeTask(SAMPLE_PLAN.tasks, task.id, 3, 780);
    const t = p.find((x) => x.id === task.id)!;
    expect([t.day, t.time]).toEqual([3, 780]);
    expect(unplaceTask(p, task.id).find((x) => x.id === task.id)!.time).toBeNull();
  });

  it('only offers gaps that fit, and not before now on today', () => {
    const all = fitGaps(SAMPLE_PLAN, 0, 30, { taskId: task.id });
    expect(all.length).toBeGreaterThan(0);
    const late = fitGaps(SAMPLE_PLAN, 0, 30, { taskId: task.id, today: 0, now: 1000 });
    expect(late.every((g) => g.s >= 1000 && g.e - g.s >= 30)).toBe(true);
    expect(fitGaps(SAMPLE_PLAN, 0, 24 * 60)).toEqual([]);
  });

  it('frees the task’s own slot when looking for a new time', () => {
    const placed = { ...SAMPLE_PLAN, tasks: placeTask(SAMPLE_PLAN.tasks, task.id, 0, 1080) };
    expect(fitGaps(placed, 0, task.dur, { taskId: task.id })).toEqual(
      fitGaps(SAMPLE_PLAN, 0, task.dur, { taskId: task.id }),
    );
  });

  it('counts the task in the load of a day it is not on yet', () => {
    const light = loadAfter(SAMPLE_PLAN, 6, { ...task, day: 0, dur: 24 * 60 });
    expect(light.k).toBe('over');
  });

  it('finds the Monday of a week and the date of each day', () => {
    const mon = weekStart(new Date(2026, 9, 31));
    expect([mon.getMonth(), mon.getDate()]).toEqual([9, 26]);
    expect(dateOfDay(mon, 6).getDate()).toBe(1);
    expect(dateOfDay(mon, 6).getMonth()).toBe(10);
  });
});
