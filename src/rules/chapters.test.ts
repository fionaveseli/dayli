import { CHAPTERS0, GOALS0, MILESTONES0, TASKS0 } from '../data/sample';
import {
  chapterFormOk,
  chapterInfo,
  chapterMeta,
  chapterStatus,
  endAfterMonths,
  fmtRange,
  groupChapters,
} from './chapters';

const TODAY = '2026-11-05';
const info = (id: string) =>
  chapterInfo(
    CHAPTERS0.find((c) => c.id === id)!,
    GOALS0,
    MILESTONES0,
    TASKS0,
    TODAY,
  );

describe('chapters', () => {
  it('derives now, next and past from the dates', () => {
    expect(CHAPTERS0.map((c) => chapterStatus(c, TODAY))).toEqual(['now', 'next', 'past', 'past']);
    expect(chapterStatus({ start: TODAY, end: TODAY }, TODAY)).toBe('now');
  });

  it('counts days and time passed for the current chapter', () => {
    const c = info('c1');
    expect(c.total).toBe(153);
    expect(c.elapsed).toBe(66);
    expect(c.left).toBe(87);
    expect(c.tp).toBeCloseTo(66 / 153);
    expect(chapterMeta(c)).toBe('Day 66 of 153 · 87 days left');
  });

  it('describes an upcoming and a closed chapter', () => {
    expect(chapterMeta(info('c2'))).toBe('Starts in 88 days');
    expect(info('c2').tp).toBe(0);
    expect(chapterMeta(info('c3'))).toBe('41 walks and 9 books.');
    expect(info('c3').tp).toBe(1);
  });

  it('gathers the goals and milestones of a chapter', () => {
    const c = info('c1');
    expect(c.goals.map((g) => g.id)).toEqual(['g1', 'g2', 'g3']);
    expect(c.milestonesTotal).toBe(10);
    expect(c.milestonesDone).toBe(2);
    expect(info('c2').goals).toEqual([]);
    expect(info('c2').gp).toBe(0);
  });

  it('groups chapters, latest closed first', () => {
    const g = groupChapters(CHAPTERS0, TODAY);
    expect(g.now.map((c) => c.id)).toEqual(['c1']);
    expect(g.next.map((c) => c.id)).toEqual(['c2']);
    expect(g.past.map((c) => c.id)).toEqual(['c3', 'c4']);
  });

  it('writes a date range, adding the year when it is not this one', () => {
    expect(fmtRange('2026-09-01', '2027-01-31', TODAY)).toBe('1 Sep – 31 Jan 2027');
  });

  it('ends a template chapter the day before the same date months later', () => {
    expect(endAfterMonths('2026-11-05', 3)).toBe('2027-02-04');
    expect(endAfterMonths('2026-08-31', 6)).toBe('2027-02-27');
    expect(endAfterMonths('2027-02-01', 5)).toBe('2027-06-30');
  });

  it('needs a name and an end after the start', () => {
    expect(chapterFormOk({ name: 'x', start: '2026-11-01', end: '2027-01-31' })).toBe(true);
    expect(chapterFormOk({ name: ' ', start: '2026-11-01', end: '2027-01-31' })).toBe(false);
    expect(chapterFormOk({ name: 'x', start: '2027-01-31', end: '2026-11-01' })).toBe(false);
    expect(chapterFormOk({ name: 'x', start: '2026-11-01', end: '' })).toBe(false);
  });
});
