import { SAMPLE_PLAN } from '../data/sample';
import { blankForm, canSave, deleteTarget, formFor, saveForm } from './form';

const plan = SAMPLE_PLAN;

describe('editor form', () => {
  it('needs a title, and days for fixed and reminders', () => {
    const f = blankForm(plan);
    expect(canSave(f)).toBe(false);
    expect(canSave({ ...f, title: 'Call mum' })).toBe(true);
    expect(canSave({ ...f, title: 'Call mum', kind: 'fixed', days: [] })).toBe(false);
  });

  it('adds a flexible task', () => {
    const next = saveForm(plan, null, { ...blankForm(plan), title: ' Write ', dur: 45 });
    const t = next.tasks[next.tasks.length - 1];
    expect(t).toMatchObject({ title: 'Write', dur: 45, done: false, time: null });
  });

  it('edits in place and clears the clock when the day changes', () => {
    const t = plan.tasks.find((x) => x.time != null && x.day != null && x.day >= 0)!;
    const f = formFor(plan, { kind: 'flex', id: t.id });
    const same = saveForm(plan, { kind: 'flex', id: t.id }, { ...f, title: 'Renamed' });
    expect(same.tasks.find((x) => x.id === t.id)).toMatchObject({ title: 'Renamed', time: t.time });
    const moved = saveForm(plan, { kind: 'flex', id: t.id }, { ...f, day: (t.day! + 1) % 7 });
    expect(moved.tasks.find((x) => x.id === t.id)!.time).toBeNull();
  });

  it('switches type by replacing the original', () => {
    const t = plan.tasks[0];
    const f = { ...formFor(plan, { kind: 'flex', id: t.id }), kind: 'rem' as const, days: [2] };
    const next = saveForm(plan, { kind: 'flex', id: t.id }, f);
    expect(next.tasks.find((x) => x.id === t.id)).toBeUndefined();
    expect(next.reminders).toHaveLength(plan.reminders.length + 1);
    expect(next.reminders[next.reminders.length - 1]).toMatchObject({ title: t.title, days: [2] });
  });

  it('keeps a fixed block at least 15 minutes long', () => {
    const f = { ...blankForm(plan), kind: 'fixed' as const, title: 'Class', start: 600, end: 600 };
    const next = saveForm(plan, null, f);
    const x = next.fixed[next.fixed.length - 1];
    expect(x.end - x.start).toBe(15);
  });

  it('deletes', () => {
    const r = plan.reminders[0];
    const next = deleteTarget(plan, { kind: 'rem', id: r.id });
    expect(next.reminders.find((x) => x.id === r.id)).toBeUndefined();
  });
});
