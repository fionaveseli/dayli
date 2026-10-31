import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fixedClock } from '../src/core/clock';
import { readError } from '../src/core/errors';
import { MemorySource, type PlanSource } from '../src/data/source';
import { SAMPLE_PLAN, gapsOn, type PlanData } from '../src/dayli';
import { getAvailableTime } from '../src/tools/getAvailableTime';
import { AvailableTimeSchema } from '../src/tools/schemas';

const TZ = 'Europe/Belgrade';
const MONDAY = fixedClock('2026-10-26T07:00:00Z', TZ);
const SATURDAY = fixedClock('2026-10-31T14:07:00Z', TZ);
const plan = (over: Partial<PlanData> = {}) => new MemorySource({ ...SAMPLE_PLAN, ...over });

async function ok(source: PlanSource, clock: typeof MONDAY, input = {}) {
  const result = await getAvailableTime({ source, clock }, input);
  assert.ok(!('isError' in result), result.content[0].text);
  const output = AvailableTimeSchema.parse(result.structuredContent);
  assert.deepEqual(JSON.parse(result.content[0].text), output);
  return output;
}

async function err(source: PlanSource, clock: typeof MONDAY, input = {}) {
  const result = await getAvailableTime({ source, clock }, input);
  assert.ok('isError' in result && result.isError);
  assert.equal('structuredContent' in result, false);
  return readError(result);
}

describe('get_available_time', () => {
  it('defaults to today, 30 minutes and from_now=true', async () => {
    const output = await ok(plan(), MONDAY);
    assert.equal(output.day.date, '2026-10-26');
    assert.equal(output.now, '08:00');
    assert.equal(output.data_source, 'in-memory plan');
    assert.ok(output.slots.every((slot) => slot.minutes >= 30));
  });

  it('uses gapsOn for another day and returns HH:MM slots', async () => {
    const output = await ok(plan(), MONDAY, { day: 'wednesday' });
    assert.equal(output.now, null);
    const expected = gapsOn(SAMPLE_PLAN, 2).map((g) => ({
      start: `${String(Math.floor(g.s / 60)).padStart(2, '0')}:${String(g.s % 60).padStart(2, '0')}`,
      end: `${String(Math.floor(g.e / 60)).padStart(2, '0')}:${String(g.e % 60).padStart(2, '0')}`,
      minutes: g.e - g.s,
    }));
    assert.deepEqual(output.slots, expected);
    assert.equal(output.total_open_minutes, expected.reduce((s, g) => s + g.minutes, 0));
    assert.equal(output.buffer_minutes, SAMPLE_PLAN.settings.buffer);
  });

  it('rounds from now to the next 15-minute boundary', async () => {
    const output = await ok(plan({ fixed: [], tasks: [], reminders: [] }), SATURDAY);
    assert.equal(output.slots[0].start, '15:15');
  });

  it('can include earlier slots when from_now=false', async () => {
    const output = await ok(plan({ fixed: [], tasks: [], reminders: [] }), SATURDAY, { from_now: false });
    assert.equal(output.slots[0].start, '07:00');
  });

  it('filters out gaps shorter than min_minutes', async () => {
    const output = await ok(plan(), MONDAY, { day: 'wednesday', min_minutes: 120 });
    assert.ok(output.slots.every((slot) => slot.minutes >= 120));
  });

  it('returns no slots when the waking day is over', async () => {
    const late = fixedClock('2026-10-31T22:40:00+01:00', TZ);
    const output = await ok(plan({ fixed: [], tasks: [], reminders: [] }), late);
    assert.deepEqual(output.slots, []);
    assert.equal(output.total_open_minutes, 0);
  });

  it('refuses dates outside this week', async () => {
    assert.equal((await err(plan(), SATURDAY, { day: 'next monday' })).code, 'DAY_OUT_OF_RANGE');
  });

  it('rejects invalid minimum durations', async () => {
    assert.equal((await err(plan(), MONDAY, { min_minutes: 15 })).code, 'INVALID_INPUT');
    assert.equal((await err(plan(), MONDAY, { min_minutes: 30.5 })).code, 'INVALID_INPUT');
  });

  it('does not leak storage errors', async () => {
    const source: PlanSource = { name: 'broken', load: async () => { throw new Error('private db credentials'); } };
    const result = await err(source, MONDAY);
    assert.equal(result.code, 'DATA_UNAVAILABLE');
    assert.doesNotMatch(JSON.stringify(result), /private db credentials/);
  });

  it('does not mutate source data', async () => {
    const before = structuredClone(SAMPLE_PLAN);
    await ok(plan(), MONDAY);
    assert.deepEqual(SAMPLE_PLAN, before);
  });
});
