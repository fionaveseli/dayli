import { SAMPLE_PLAN } from '../data/sample';
import type { PlanData } from '../data/types';
import { fromView, migrateWeekPlan, stripMeta, toView } from './dated';
import { diffRows, snapshot } from './engine';
import { applyMeta, fromRows, toRows, type DbRow, type Table } from './rows';

// Monday 2026-11-02; the week before ends on 2026-11-01.
const MON = '2026-11-02';
const NEXT_MON = '2026-11-09';

describe('dated plan', () => {
  it('turns this week into dates and back without changing the screens', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    expect(dated.tasks.some((t) => t.date === null)).toBe(true);
    const view = toView(dated, MON);
    expect(view.tasks).toEqual(SAMPLE_PLAN.tasks);
    expect(view.fixed).toEqual(SAMPLE_PLAN.fixed);
    expect(view.reminders.map((r) => r.days)).toEqual(SAMPLE_PLAN.reminders.map((r) => r.days));
  });

  it('stores yesterday and the brain dump as dates', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    const y = SAMPLE_PLAN.tasks.find((t) => t.day === -1);
    if (y) expect(dated.tasks.find((t) => t.id === y.id)?.date).toBe('2026-11-01');
    for (const t of SAMPLE_PLAN.tasks.filter((t) => t.day === 2))
      expect(dated.tasks.find((x) => x.id === t.id)?.date).toBe('2026-11-04');
    for (const t of SAMPLE_PLAN.tasks.filter((t) => t.day == null))
      expect(dated.tasks.find((x) => x.id === t.id)?.date).toBeNull();
  });

  it('keeps other weeks when the week on screen changes', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    // A week later, the old tasks are out of view but not lost.
    expect(toView(dated, NEXT_MON).tasks.every((t) => t.day == null)).toBe(true);
    const edited = fromView(dated, toView(dated, NEXT_MON), NEXT_MON);
    expect(edited.tasks.map((t) => t.id).sort()).toEqual(dated.tasks.map((t) => t.id).sort());
  });

  it('removes a deleted task and moves a task by date', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    const view = toView(dated, MON);
    const [a, b, ...rest] = view.tasks.filter((t) => t.day != null && t.day >= 0);
    const next: PlanData = {
      ...view,
      tasks: [
        ...view.tasks
          .filter((t) => t.id !== a.id)
          .map((t) => (t.id === b.id ? { ...t, day: 6 } : t)),
      ],
    };
    const out = fromView(dated, next, MON);
    expect(out.tasks.find((t) => t.id === a.id)).toBeUndefined();
    expect(out.tasks.find((t) => t.id === b.id)?.date).toBe('2026-11-08');
    expect(out.tasks.length).toBe(dated.tasks.length - 1);
    expect(rest.length).toBeGreaterThanOrEqual(0);
  });

  it('ends a repeating commitment on its end date', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    const f = { ...dated.fixed[0], days: [0, 1, 2, 3, 4], endsOn: '2026-11-04' };
    const p = { ...dated, fixed: [f] };
    expect(toView(p, MON).fixed[0].days).toEqual([0, 1, 2]);
    expect(toView(p, NEXT_MON).fixed).toEqual([]);
    // Saving the shorter week must not drop Thursday and Friday for good.
    expect(fromView(p, toView(p, MON), MON).fixed[0].days).toEqual([0, 1, 2, 3, 4]);
  });

  it('stores reminder done and snooze per date', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    const view = toView(dated, MON);
    const r = view.reminders[0];
    const next = {
      ...view,
      reminders: [
        { ...r, doneDays: [r.days[0]], snooze: { [r.days[0]]: 600 } },
        ...view.reminders.slice(1),
      ],
    };
    const out = fromView(dated, next, MON).reminders[0];
    expect(out.doneOn).toEqual([`2026-11-0${2 + r.days[0]}`.replace('2026-11-010', '2026-11-10')]);
    expect(Object.values(out.snoozeOn)).toEqual([600]);
    const back = toView(fromView(dated, next, MON), MON).reminders[0];
    expect(back.doneDays).toEqual([r.days[0]]);
    expect(back.snooze).toEqual({ [r.days[0]]: 600 });
  });
});

describe('rows and sync', () => {
  const server = (plan: ReturnType<typeof migrateWeekPlan>): Record<Table, DbRow[]> => {
    const db: Record<Table, DbRow[]> = {
      tasks: [],
      fixed_commitments: [],
      reminders: [],
      settings: [],
    };
    for (const r of toRows(plan)) {
      db[r.table].push({
        ...r.content,
        id: r.id || 'settings-1',
        user_id: 'u1',
        created_at: '2026-11-02T08:00:00.000000+00:00',
        updated_at: '2026-11-02T08:00:00.000000+00:00',
      } as DbRow);
    }
    return db;
  };

  it('round-trips the plan through database rows', () => {
    const dated = migrateWeekPlan(SAMPLE_PLAN, MON);
    const back = fromRows(server(dated));
    expect(toView(back, MON).tasks).toEqual(SAMPLE_PLAN.tasks);
    expect(toView(back, MON).fixed).toEqual(SAMPLE_PLAN.fixed);
    expect(back.tasks[0].updatedAt).toBe('2026-11-02T08:00:00.000000+00:00');
  });

  it('sends everything as new on first sync, then only what changed', () => {
    const local = stripMeta(migrateWeekPlan(SAMPLE_PLAN, MON));
    const first = diffRows(toRows(local), {});
    expect(first.add.length).toBe(toRows(local).length);

    const remote = fromRows(server(local));
    const synced = snapshot(toRows(remote));
    expect(diffRows(toRows(remote), synced)).toEqual({ add: [], change: [], remove: [] });

    const edited = {
      ...remote,
      tasks: remote.tasks.slice(1).map((t, i) => (i === 0 ? { ...t, done: !t.done } : t)),
    };
    const d = diffRows(toRows(edited), synced);
    expect(d.change.map((r) => r.id)).toEqual([edited.tasks[0].id]);
    expect(d.remove).toEqual([`tasks:${remote.tasks[0].id}`]);
    expect(d.add).toEqual([]);
  });

  it('sends the updated_at it last read and takes new server fields', () => {
    const remote = fromRows(server(migrateWeekPlan(SAMPLE_PLAN, MON)));
    const row = toRows(remote).find((r) => r.table === 'tasks')!;
    expect(row.meta.updatedAt).toBe('2026-11-02T08:00:00.000000+00:00');
    const metas = new Map([[`tasks:${row.id}`, { ...row.meta, updatedAt: 'later' }]]);
    expect(applyMeta(remote, metas).tasks.find((t) => t.id === row.id)?.updatedAt).toBe('later');
  });
});
