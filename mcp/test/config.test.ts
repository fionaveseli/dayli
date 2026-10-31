import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadConfig } from '../src/config';
import { localNow } from '../src/core/clock';
import { ToolError } from '../src/core/errors';

describe('loadConfig', () => {
  it('pins now and the time zone from the environment', () => {
    const { clock, source } = loadConfig({
      DAYLI_NOW: '2026-10-31T15:07:00+01:00',
      DAYLI_TZ: 'Europe/Belgrade',
    });
    assert.deepEqual(localNow(clock), {
      date: '2026-10-31',
      dayIndex: 5,
      minutes: 907,
      timeZone: 'Europe/Belgrade',
    });
    assert.equal(source.name, 'sample data');
  });
  it('uses the real clock when nothing is set', () => {
    const { clock } = loadConfig({});
    assert.ok(Math.abs(clock.now().getTime() - Date.now()) < 5_000);
  });
  it('rejects bad settings with a hint', () => {
    for (const env of [{ DAYLI_NOW: 'soon' }, { DAYLI_TZ: 'Moon/Base' }]) {
      assert.throws(
        () => loadConfig(env),
        (e: unknown) => e instanceof ToolError && !!e.hint,
      );
    }
  });
});
