import { SAMPLE_PLAN } from '../data/sample';
import type { PlanData } from '../data/types';
import { widgetTimeline, widgetView } from './widget';

const MON = 0;

describe('widgetView', () => {
  it('shows the block you are in and the next thing', () => {
    const v = widgetView(SAMPLE_PLAN, MON, 600);
    expect(v.now).toMatchObject({ kind: 'fixed', title: 'Work', time: '09:00–16:00' });
    expect(v.now?.sub).toBe('Until 16:00, then leave');
    expect(v.next).toMatchObject({
      kind: 'reminder',
      title: 'Call the dentist to book a check-up',
    });
  });

  it('lists unticked reminders, marking missed and next', () => {
    const v = widgetView(SAMPLE_PLAN, MON, 800);
    expect(v.dontForget.map((r) => r.title)).toEqual([
      'Call the dentist to book a check-up',
      'Pick up the kids from school',
    ]);
    expect(v.dontForget[0]).toMatchObject({ missed: true, next: false });
    expect(v.dontForget[1]).toMatchObject({
      missed: false,
      next: true,
      leave: true,
      time: '16:00',
    });
    expect(v.dontForgetNote).toBe('2 left today');
  });

  it('moves on to a placed task after the leave time', () => {
    const v = widgetView(SAMPLE_PLAN, MON, 990);
    expect(v.now).toBeNull();
    expect(v.next).toMatchObject({ kind: 'task', title: 'Complete gym workout', time: '17:45' });
    expect(v.rest).toBe('2 flexible tasks left · 3h 30m');
  });

  it('has nothing next once the day is through', () => {
    const v = widgetView(SAMPLE_PLAN, MON, 1200);
    expect(v.now).toBeNull();
    expect(v.next).toBeNull();
  });

  it('says all done when every reminder is ticked', () => {
    const plan: PlanData = {
      ...SAMPLE_PLAN,
      reminders: SAMPLE_PLAN.reminders.map((r) => ({ ...r, doneDays: [0, 1, 2, 3, 4, 5, 6] })),
      tasks: SAMPLE_PLAN.tasks.map((t) => ({ ...t, done: true })),
    };
    const v = widgetView(plan, MON, 600);
    expect(v.dontForget).toHaveLength(0);
    expect(v.dontForgetNote).toBe('All done');
    expect(v.rest).toBe('Nothing left today.');
  });
});

describe('widgetTimeline', () => {
  it('starts now and changes when things start and end', () => {
    const tl = widgetTimeline(SAMPLE_PLAN, MON, 600);
    expect(tl[0].from).toBe(600);
    const froms = tl.map((e) => e.from);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
    expect(froms).toEqual(expect.arrayContaining([750, 960, 1065, 1125]));
    const atGym = tl.find((e) => e.from === 1065)!;
    expect(atGym.view.now).toMatchObject({ title: 'Complete gym workout' });
  });
});
