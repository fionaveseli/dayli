import { SAMPLE_PLAN } from '../data/sample';
import { quickAdd } from './quickAdd';

describe('quickAdd', () => {
  it('ignores empty text', () => {
    expect(quickAdd(SAMPLE_PLAN, '   ', { day: 0 })).toBeNull();
  });

  it('turns "remind me at 4 to…" into a reminder on that day', () => {
    const r = quickAdd(SAMPLE_PLAN, 'remind me at 4 to call mum', { day: 2 })!;
    const added = r.plan.reminders[r.plan.reminders.length - 1];
    expect(added).toMatchObject({ title: 'Call mum', time: 960, days: [2], lead: 0 });
    expect(r.plan.tasks).toHaveLength(SAMPLE_PLAN.tasks.length);
    expect(r.message).toBe('Reminder set for 16:00.');
  });

  it('marks "leave" reminders as time to leave', () => {
    const r = quickAdd(SAMPLE_PLAN, 'remind me to leave for pickup at 4.45pm', { day: 0 })!;
    expect(r.plan.reminders[r.plan.reminders.length - 1].leave).toBe(true);
    expect(r.message).toContain('free time is updated');
  });

  it('adds other text as a 30 minute flexible task', () => {
    const r = quickAdd(SAMPLE_PLAN, 'Buy milk', { day: 1 })!;
    expect(r.plan.tasks[r.plan.tasks.length - 1]).toMatchObject({
      title: 'Buy milk',
      dur: 30,
      day: 1,
      done: false,
    });
    expect(r.message).toBe('Added to today.');
  });

  it('puts a task in the brain dump when there is no day', () => {
    const r = quickAdd(SAMPLE_PLAN, 'Think about the garden', { day: null })!;
    expect(r.plan.tasks[r.plan.tasks.length - 1].day).toBeNull();
    expect(r.message).toBe('Added to your brain dump.');
  });

  it('makes any text a reminder at 18:00 when remOnly', () => {
    const r = quickAdd(SAMPLE_PLAN, 'water plants', { day: 0, remOnly: true })!;
    expect(r.plan.reminders[r.plan.reminders.length - 1]).toMatchObject({
      title: 'Water plants',
      time: 1080,
      lead: SAMPLE_PLAN.settings.defLead,
    });
  });
});
