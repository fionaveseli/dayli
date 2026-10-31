import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ToolError, toErrorResult } from '../src/core/errors';
import { MemorySource, SampleSource } from '../src/data/source';
import { SAMPLE_PLAN, dayInfo, freeFor } from '../src/dayli';

describe('toErrorResult', () => {
  it('keeps the code, message and hint', () => {
    const r = toErrorResult(new ToolError('TASK_NOT_FOUND', 'No task "zzz".', 'Call get_tasks.'));
    assert.equal(r.isError, true);
    assert.deepEqual(r.structuredContent.error, {
      code: 'TASK_NOT_FOUND',
      message: 'No task "zzz".',
      hint: 'Call get_tasks.',
    });
    assert.equal(r.content[0].text, 'TASK_NOT_FOUND: No task "zzz". Call get_tasks.');
  });
  it('does not leak details of unexpected errors', () => {
    const r = toErrorResult(new Error('ECONNREFUSED 10.0.0.3:5432 password=hunter2'));
    assert.equal(r.structuredContent.error.code, 'DATA_UNAVAILABLE');
    assert.doesNotMatch(r.content[0].text, /hunter2|10\.0\.0\.3/);
  });
});

describe('plan sources', () => {
  it('serves the app sample plan', async () => {
    const plan = await new SampleSource().load();
    assert.deepEqual(plan, SAMPLE_PLAN);
  });
  it('hands out copies, so one call cannot change the next', async () => {
    const src = new SampleSource();
    (await src.load()).tasks.length = 0;
    assert.equal((await src.load()).tasks.length, SAMPLE_PLAN.tasks.length);

    const mem = new MemorySource(SAMPLE_PLAN);
    (await mem.load()).tasks[0].title = 'changed';
    assert.equal((await mem.load()).tasks[0].title, SAMPLE_PLAN.tasks[0].title);
  });
});

describe('shared app rules', () => {
  it('run in Node through the single import boundary', () => {
    assert.equal(dayInfo(SAMPLE_PLAN, 0).free, 450);
  });
  it('include the overlap fix', () => {
    const f = { ...SAMPLE_PLAN.fixed[0] };
    const s = SAMPLE_PLAN.settings;
    const twoOverlapping = [
      { ...f, start: 540, end: 660 },
      { ...f, start: 600, end: 720 },
    ];
    assert.equal(freeFor(twoOverlapping, s), freeFor([{ ...f, start: 540, end: 720 }], s));
  });
});
