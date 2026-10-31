import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fixedClock, localNow } from '../src/core/clock';
import { addDays, resolveDay, weekOf } from '../src/core/dates';
import { ToolError, type ErrorCode } from '../src/core/errors';

const TZ = 'Europe/Belgrade';
/** Saturday 31 October 2026, 15:07 in Prishtina/Belgrade (UTC+1). */
const SAT = localNow(fixedClock('2026-10-31T14:07:00Z', TZ));
const MON = localNow(fixedClock('2026-10-26T08:00:00Z', TZ));
const SUN = localNow(fixedClock('2026-11-01T10:00:00Z', TZ));

const fails = (fn: () => unknown, code: ErrorCode, message?: RegExp) =>
  assert.throws(fn, (e: unknown) => {
    assert.ok(e instanceof ToolError);
    assert.equal(e.code, code);
    if (message) assert.match(e.message, message);
    assert.ok(e.hint, 'every day error tells the agent what to do next');
    return true;
  });

describe('localNow', () => {
  it('reads the date, weekday and minutes in the given time zone', () => {
    assert.deepEqual(SAT, { date: '2026-10-31', dayIndex: 5, minutes: 907, timeZone: TZ });
  });
  it('uses the local calendar day near midnight', () => {
    const late = '2026-10-31T23:30:00Z';
    assert.equal(localNow(fixedClock(late, TZ)).date, '2026-11-01');
    assert.equal(localNow(fixedClock(late, TZ)).dayIndex, 6);
    assert.equal(localNow(fixedClock(late, 'UTC')).dayIndex, 5);
  });
  it('rejects a bad instant or time zone', () => {
    fails(() => fixedClock('not a date', TZ), 'INVALID_INPUT');
    fails(() => fixedClock('2026-10-31T10:00:00Z', 'Mars/Olympus'), 'INVALID_INPUT');
  });
});

describe('weekOf and addDays', () => {
  it('finds Monday to Sunday of the current week', () => {
    assert.deepEqual(weekOf(SAT), { start: '2026-10-26', end: '2026-11-01' });
    assert.deepEqual(weekOf(MON), { start: '2026-10-26', end: '2026-11-01' });
    assert.deepEqual(weekOf(SUN), { start: '2026-10-26', end: '2026-11-01' });
  });
  it('crosses month and year ends', () => {
    assert.equal(addDays('2026-10-31', 1), '2026-11-01');
    assert.equal(addDays('2026-12-31', 1), '2027-01-01');
    assert.equal(addDays('2028-03-01', -1), '2028-02-29');
  });
});

describe('resolveDay', () => {
  it('defaults to today', () => {
    for (const input of [undefined, '', 'today', ' Today ']) {
      const d = resolveDay(input, SAT);
      assert.equal(d.dayIndex, 5);
      assert.equal(d.date, '2026-10-31');
      assert.equal(d.isToday, true);
    }
  });
  it('resolves tomorrow and yesterday inside the week', () => {
    assert.equal(resolveDay('tomorrow', SAT).date, '2026-11-01');
    const y = resolveDay('yesterday', SAT);
    assert.equal(y.dayName, 'Friday');
    assert.equal(y.isPast, true);
  });
  it('refuses tomorrow on Sunday and yesterday on Monday', () => {
    fails(() => resolveDay('tomorrow', SUN), 'DAY_OUT_OF_RANGE', /2026-11-02/);
    fails(() => resolveDay('yesterday', MON), 'DAY_OUT_OF_RANGE', /2026-10-25/);
  });
  it('resolves weekday names that are today or still ahead', () => {
    assert.equal(resolveDay('sunday', SAT).date, '2026-11-01');
    assert.equal(resolveDay('Sun', SAT).date, '2026-11-01');
    assert.equal(resolveDay('saturday', SAT).isToday, true);
    assert.equal(resolveDay('this friday', MON).date, '2026-10-30');
  });
  it('calls a weekday that has passed ambiguous instead of guessing', () => {
    fails(() => resolveDay('monday', SAT), 'AMBIGUOUS_DAY', /2026-10-26.*2026-11-02/);
  });
  it('accepts dates in this week, including past ones', () => {
    const d = resolveDay('2026-10-27', SAT);
    assert.equal(d.dayName, 'Tuesday');
    assert.equal(d.isPast, true);
    assert.equal(resolveDay('2026-11-01', SAT).dayIndex, 6);
  });
  it('refuses dates outside this week', () => {
    fails(() => resolveDay('2026-11-02', SAT), 'DAY_OUT_OF_RANGE');
    fails(() => resolveDay('2026-10-25', SAT), 'DAY_OUT_OF_RANGE');
    fails(() => resolveDay('2027-01-05', SAT), 'DAY_OUT_OF_RANGE');
  });
  it('refuses next week by name', () => {
    fails(() => resolveDay('next tuesday', SAT), 'DAY_OUT_OF_RANGE', /2026-11-03/);
  });
  it('refuses things it cannot read', () => {
    fails(() => resolveDay('2026-02-30', SAT), 'INVALID_DAY');
    fails(() => resolveDay('nov 3', SAT), 'INVALID_DAY');
    fails(() => resolveDay('someday', SAT), 'INVALID_DAY');
  });
});
