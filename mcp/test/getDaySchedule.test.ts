import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fixedClock } from '../src/core/clock';
import { readError } from '../src/core/errors';
import { MemorySource, SampleSource, type PlanSource } from '../src/data/source';
import { SAMPLE_PLAN, type PlanData } from '../src/dayli';
import { getDaySchedule } from '../src/tools/getDaySchedule';
import { DayScheduleSchema } from '../src/tools/schemas';

const TZ = 'Europe/Belgrade';
/** Monday 26 October 2026, 08:00 local. Sample data puts most of its tasks on Monday. */
const MONDAY = fixedClock('2026-10-26T07:00:00Z', TZ);
/** Saturday 31 October 2026, 15:07 local. */
const SATURDAY = fixedClock('2026-10-31T14:07:00Z', TZ);

async function ok(source: PlanSource, clock: typeof MONDAY, day?: string) {
  const r = await getDaySchedule({ source, clock }, { day });
  assert.ok(!('isError' in r), `expected a schedule, got ${r.content[0].text}`);
  DayScheduleSchema.parse(r.structuredContent); // matches the advertised output schema
  return r;
}

async function err(source: PlanSource, clock: typeof MONDAY, day?: string) {
  const r = await getDaySchedule({ source, clock }, { day });
  assert.ok('isError' in r && r.isError, 'expected an error');
  assert.equal(
    'structuredContent' in r,
    false,
    'errors must not be checked against the output schema',
  );
  return readError(r);
}

const sample = new SampleSource();
const plan = (over: Partial<PlanData>) => new MemorySource({ ...SAMPLE_PLAN, ...over });

describe('get_day_schedule', () => {
  it('describes today from the sample plan', async () => {
    const { structuredContent: s } = await ok(sample, MONDAY);
    assert.deepEqual(s.day, {
      date: '2026-10-26',
      day_name: 'Monday',
      is_today: true,
      is_past: false,
      week_start: '2026-10-26',
      week_end: '2026-11-01',
    });
    assert.equal(s.now, '08:00');
    assert.equal(s.time_zone, TZ);
    assert.equal(s.data_source, 'sample data');
    assert.deepEqual(s.summary, {
      free_minutes: 450,
      planned_minutes: 290,
      remaining_minutes: 270,
      load: 'Balanced',
    });
  });

  it('shows work ending early for a time-to-leave reminder', async () => {
    const { structuredContent: s } = await ok(sample, MONDAY);
    const work = s.fixed.find((f) => f.id === 'f1')!;
    assert.equal(work.start, '09:00');
    assert.equal(work.end, '16:00');
    assert.deepEqual(work.cut_short_by, {
      reminder_id: 'm1',
      reminder_title: 'Pick up the kids from school',
      planned_end: '17:00',
    });
    const leave = s.reminders.find((r) => r.id === 'm1')!;
    assert.equal(leave.time, '17:00');
    assert.equal(leave.alert_at, '16:00');
    assert.equal(leave.time_to_leave, true);
  });

  it('lists timed tasks first, then flexible ones by priority', async () => {
    const { structuredContent: s } = await ok(sample, MONDAY);
    assert.deepEqual(
      s.tasks.map((t) => [t.id, t.start]),
      [
        ['a4', '17:45'],
        ['a2', null],
        ['a3', null],
        ['a1', null],
      ],
    );
    assert.equal(s.tasks.find((t) => t.id === 'a1')!.done, true);
  });

  it('orders reminders by when they alert', async () => {
    const { structuredContent: s } = await ok(sample, MONDAY);
    assert.deepEqual(
      s.reminders.map((r) => r.alert_at),
      ['08:00', '12:30', '16:00'],
    );
  });

  it('describes another day this week without a current time', async () => {
    const { structuredContent: s } = await ok(sample, MONDAY, 'saturday');
    assert.equal(s.day.date, '2026-10-31');
    assert.equal(s.day.is_today, false);
    assert.equal(s.now, null);
    assert.deepEqual(
      s.fixed.map((f) => [f.title, f.start, f.end]),
      [['Morning hike', '10:00', '12:00']],
    );
    assert.equal(s.summary.load, 'Light');
  });

  it('marks a past day of this week', async () => {
    const { structuredContent: s } = await ok(sample, SATURDAY, '2026-10-26');
    assert.equal(s.day.is_past, true);
    assert.match(s.notes.join(' '), /already passed/);
  });

  it('counts overlapping commitments once', async () => {
    const block = { ...SAMPLE_PLAN.fixed[0], days: [2] };
    const { structuredContent: s } = await ok(
      plan({
        fixed: [
          { ...block, id: 'x1', title: 'Class', start: 540, end: 660 },
          { ...block, id: 'x2', title: 'Shift', start: 600, end: 720 },
        ],
        tasks: [],
        reminders: [],
      }),
      MONDAY,
      'wednesday',
    );
    // 07:00–22:30 = 930, busy 09:00–12:00 = 180, breathing room 60
    assert.equal(s.summary.free_minutes, 690);
    assert.equal(s.fixed.length, 2);
  });

  it('returns an empty, valid schedule for a day with nothing on it', async () => {
    const { structuredContent: s } = await ok(
      plan({ fixed: [], tasks: [], reminders: [] }),
      MONDAY,
    );
    assert.deepEqual([s.fixed, s.tasks, s.reminders], [[], [], []]);
    assert.equal(s.summary.load, 'Open');
    assert.equal(s.summary.free_minutes, 930 - 60);
  });

  it('sends the data as JSON text first, then a readable summary', async () => {
    const r = await ok(sample, MONDAY);
    assert.deepEqual(JSON.parse(r.content[0].text), r.structuredContent);
    assert.match(r.content[1].text, /^Monday 2026-10-26 \(today, now 08:00\)/);
    assert.match(r.content[1].text, /Source: sample data\.$/);
  });

  it('refuses days outside this week instead of answering for another day', async () => {
    const out = await err(sample, SATURDAY, 'next monday');
    assert.equal(out.code, 'DAY_OUT_OF_RANGE');
    assert.match(out.message, /2026-11-02/);
    assert.equal((await err(sample, SATURDAY, '2026-11-05')).code, 'DAY_OUT_OF_RANGE');
    const sunday = fixedClock('2026-11-01T09:00:00Z', TZ);
    assert.equal((await err(sample, sunday, 'tomorrow')).code, 'DAY_OUT_OF_RANGE');
  });

  it('asks rather than guesses when a weekday has passed', async () => {
    const out = await err(sample, SATURDAY, 'monday');
    assert.equal(out.code, 'AMBIGUOUS_DAY');
    assert.ok(out.hint);
  });

  it('reports unreadable days with the accepted forms', async () => {
    const out = await err(sample, SATURDAY, 'the 3rd');
    assert.equal(out.code, 'INVALID_DAY');
    assert.match(out.hint!, /YYYY-MM-DD/);
  });

  it('hides storage failures behind DATA_UNAVAILABLE', async () => {
    const broken: PlanSource = {
      name: 'broken',
      load: async () => {
        throw new Error('connect ECONNREFUSED db.internal:5432');
      },
    };
    const out = await err(broken, MONDAY);
    assert.equal(out.code, 'DATA_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(out), /ECONNREFUSED|db\.internal/);
  });

  it('does not change the plan it reads', async () => {
    const before = structuredClone(SAMPLE_PLAN);
    await ok(sample, MONDAY);
    assert.deepEqual(SAMPLE_PLAN, before);
  });
});
