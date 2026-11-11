import { SAMPLE_PLAN } from '../data/sample';
import type { Chapter, PlanData } from '../data/types';
import { rhythmFor, rhythmSessions } from './rhythm';

let n = 0;
const id = () => `x${n++}`;
const item = { title: 'Gym', cat: 'fitness' as const, freq: 3, dur: 60 };
const plan: PlanData = { ...SAMPLE_PLAN, tasks: [] };
const chapter = (over: Partial<Chapter> = {}): Chapter => ({
  id: 'c',
  name: 'C',
  start: '2026-01-01',
  end: '2027-01-01',
  color: 'sage',
  desc: '',
  summary: '',
  rhythm: [item],
  ...over,
});

describe('rhythmSessions', () => {
  it('makes freq sessions on different days, never on the rest day', () => {
    const out = rhythmSessions(plan, item, 0, id);
    expect(out).toHaveLength(3);
    const days = out.map((t) => t.day);
    expect(new Set(days).size).toBe(3);
    expect(days).not.toContain(plan.settings.restDay);
    expect(out.every((t) => t.repeat && t.time === null && t.dur === 60)).toBe(true);
  });

  it('skips days that have already passed', () => {
    const out = rhythmSessions(plan, item, 4, id);
    expect(out.every((t) => (t.day as number) >= 4)).toBe(true);
  });

  it('prefers the lighter day', () => {
    const busy = {
      ...plan,
      tasks: [
        {
          ...rhythmSessions(plan, { ...item, freq: 1 }, 0, id)[0],
          title: 'Other',
          repeat: false,
          dur: 240,
        },
      ],
    };
    const day = busy.tasks[0].day;
    const out = rhythmSessions(busy, { ...item, freq: 1 }, 0, id);
    expect(out[0].day).not.toBe(day);
  });

  it('only tops up: sessions already there, moved or done, stay', () => {
    const [a, b, c] = rhythmSessions(plan, item, 0, id);
    const moved = { ...a, day: 6 === a.day ? 5 : 6 };
    const have = { ...plan, tasks: [moved, { ...b, done: true }, c] };
    expect(rhythmSessions(have, item, 0, id)).toEqual([]);
    const fewer = { ...plan, tasks: [moved] };
    const add = rhythmSessions(fewer, item, 0, id);
    expect(add).toHaveLength(2);
    expect(add.map((t) => t.day)).not.toContain(moved.day);
  });
});

describe('rhythmFor', () => {
  const now = new Date(2026, 10, 10); // Tuesday
  it('adds sessions for current chapters only', () => {
    const r = rhythmFor(
      plan,
      [chapter(), chapter({ id: 'p', end: '2026-02-01' })],
      now,
      '2026-11-09',
      id,
    );
    expect(r?.tasks).toHaveLength(3);
  });

  it('does nothing twice in a week', () => {
    const done = { ...plan, autopilot: { rhythmWeek: '2026-11-09' } };
    expect(rhythmFor(done, [chapter()], now, '2026-11-09', id)).toBeNull();
  });
});
