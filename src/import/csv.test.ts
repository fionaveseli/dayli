import { SAMPLE_PLAN } from '../data/sample';
import { EMPTY_DATED } from '../sync/dated';
import {
  addImported,
  guessCat,
  ImportError,
  parseCsv,
  parseDate,
  parseDays,
  parseTime,
  readSchedule,
  SAMPLE_CSV,
  whenLabel,
} from './csv';

describe('parseCsv', () => {
  it('handles quotes, escaped quotes and line endings', () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi"""\n\n')).toEqual([
      ['a', 'b'],
      ['x, y', 'say "hi"'],
    ]);
  });
  it('detects semicolons and tabs', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ]);
    expect(parseCsv('a\tb\n1\t2')[1]).toEqual(['1', '2']);
  });
  it('drops a byte order mark', () => {
    expect(parseCsv('﻿Title\nWork')[0]).toEqual(['Title']);
  });
});

describe('parseDays', () => {
  it.each([
    ['Mon–Fri', [0, 1, 2, 3, 4]],
    ['Mon - Fri', [0, 1, 2, 3, 4]],
    ['Monday to Friday', [0, 1, 2, 3, 4]],
    ['Tue, Thu', [1, 3]],
    ['Mon/Wed/Fri', [0, 2, 4]],
    ['Tuesdays', [1]],
    ['weekdays', [0, 1, 2, 3, 4]],
    ['weekend', [5, 6]],
    ['daily', [0, 1, 2, 3, 4, 5, 6]],
    ['Fri-Mon', [0, 4, 5, 6]],
    ['3× week', []],
  ])('%s', (text, days) => expect(parseDays(text)).toEqual(days));
});

describe('parseTime', () => {
  it.each([
    ['09:00', 540],
    ['9:30 am', 570],
    ['5pm', 1020],
    ['12 AM', 0],
    ['17.30', 1050],
    ['1730', 1050],
    ['17:30:00', 1050],
    ['24:00', 1440],
    ['13pm', null],
    ['90 min', null],
  ])('%s', (text, m) => expect(parseTime(text)).toBe(m));
});

describe('parseDate', () => {
  it('reads ISO, month-first slashes and day-first dots', () => {
    expect(parseDate('2026-11-16')).toBe('2026-11-16');
    expect(parseDate('11/16/2026')).toBe('2026-11-16');
    expect(parseDate('16/11/2026')).toBe('2026-11-16');
    expect(parseDate('16.11.26')).toBe('2026-11-16');
    expect(parseDate('2026-02-30')).toBeNull();
  });
});

it('guesses a category from the title', () => {
  expect(guessCat('Morning gym')).toBe('fitness');
  expect(guessCat('Design lecture')).toBe('work');
  expect(guessCat('Dentist')).toBe('personal');
});

describe('readSchedule', () => {
  const today = '2026-11-18';

  it('reads the sample timetable as weekly commitments', () => {
    const r = readSchedule(SAMPLE_CSV, today);
    expect(r.kind).toBe('timetable');
    expect(r.skipped).toEqual([]);
    expect(r.fixed[0]).toMatchObject({
      title: 'Work',
      cat: 'work',
      days: [0, 1, 2, 3, 4],
      start: 540,
      end: 1020,
      where: 'Office',
      startsOn: null,
      endsOn: null,
    });
    expect(r.fixed.map((f) => f.title)).toEqual([
      'Work',
      'Pilates',
      'Spanish class',
      "Kids' swimming",
    ]);
  });

  it('takes a single time column and skips flexible rows', () => {
    const r = readSchedule(
      'Title,Days,Time,Type\nWork,Mon–Fri,09:00–17:00,fixed\nGym,4× week,60 min,flexible\n',
      today,
    );
    expect(r.fixed).toHaveLength(1);
    expect(r.fixed[0]).toMatchObject({ start: 540, end: 1020 });
    expect(r.skipped).toEqual([{ line: 3, title: 'Gym', why: 'Flexible, not fixed' }]);
  });

  it('turns a calendar export into dated commitments', () => {
    const csv = [
      'Subject,Start Date,Start Time,End Date,End Time,All day event,Location',
      'Statistics,11/16/2026,10:00 AM,11/16/2026,11:30 AM,False,Room 4',
      'Statistics,11/18/2026,10:00 AM,11/18/2026,11:30 AM,False,Room 4',
      'Statistics,11/23/2026,10:00 AM,11/23/2026,11:30 AM,False,Room 4',
      'Statistics,11/25/2026,10:00 AM,11/25/2026,11:30 AM,False,Room 4',
      'Dentist,11/20/2026,2:00 PM,11/20/2026,3:00 PM,False,',
      'Holiday,11/27/2026,,11/27/2026,,True,',
      'Old thing,11/02/2026,9:00 AM,11/02/2026,10:00 AM,False,',
    ].join('\n');
    const r = readSchedule(csv, today);
    expect(r.kind).toBe('calendar');
    expect(r.fixed).toEqual([
      expect.objectContaining({
        title: 'Statistics',
        days: [0, 2],
        start: 600,
        end: 690,
        where: 'Room 4',
        startsOn: '2026-11-18',
        endsOn: '2026-11-25',
      }),
      expect.objectContaining({
        title: 'Dentist',
        days: [4],
        startsOn: '2026-11-20',
        endsOn: '2026-11-20',
      }),
    ]);
    expect(r.skipped.map((s) => s.why)).toEqual(['Already over', 'All-day event', 'Already over']);
  });

  it('reads date and time in one cell', () => {
    const r = readSchedule('Title,Start,End\nCall,2026-11-19 16:00,2026-11-19T16:30:00Z\n', today);
    expect(r.fixed[0]).toMatchObject({ days: [3], start: 960, end: 990, startsOn: '2026-11-19' });
  });

  it('explains rows it cannot use', () => {
    const r = readSchedule(
      'Title,Days,Start,End\n,Mon,9,10\nA,Someday,9,10\nB,Mon,10,9\nC,Mon,,\n',
      today,
    );
    expect(r.fixed).toEqual([]);
    expect(r.skipped.map((s) => s.why)).toEqual([
      'No title',
      'Days “Someday” not clear',
      'Ends before it starts',
      'No start or end time',
    ]);
  });

  it('refuses a file without a title column or rows', () => {
    expect(() => readSchedule('Days,Start\nMon,9', today)).toThrow(ImportError);
    expect(() => readSchedule('Title', today)).toThrow(ImportError);
  });
});

describe('whenLabel', () => {
  const base = { id: 'x', title: 'A', cat: 'work' as const, start: 600, end: 690, where: '' };
  it('shows weekly, dated and one-off commitments', () => {
    expect(whenLabel({ ...base, days: [0, 2], startsOn: null, endsOn: null })).toBe(
      'Mon, Wed · 10:00–11:30',
    );
    expect(whenLabel({ ...base, days: [0, 2], startsOn: '2026-11-18', endsOn: '2026-12-09' })).toBe(
      'Mon, Wed · 10:00–11:30 · Wed 18 Nov to Wed 9 Dec',
    );
    expect(whenLabel({ ...base, days: [4], startsOn: '2026-11-20', endsOn: '2026-11-20' })).toBe(
      'Fri 20 Nov · 10:00–11:30',
    );
  });
});

describe('addImported', () => {
  const plan = {
    ...EMPTY_DATED,
    settings: SAMPLE_PLAN.settings,
    fixed: [
      {
        id: 'f1',
        title: 'Work',
        cat: 'work' as const,
        days: [0, 1, 2, 3, 4],
        start: 540,
        end: 1020,
        where: '',
        startsOn: '2026-11-02',
        endsOn: null,
      },
    ],
  };
  it('adds weekly ones from this Monday, keeps dates, and skips what is already there', () => {
    const r = readSchedule(
      'Title,Days,Start,End,Date\nWork,Mon–Fri,09:00,17:00,\nPilates,Tue,18:00,19:00,\nDentist,,14:00,15:00,2026-11-20\n',
      '2026-11-18',
    );
    const out = addImported(plan, r.fixed, '2026-11-16');
    expect(out.added).toBe(2);
    expect(out.plan.fixed.slice(1)).toEqual([
      expect.objectContaining({ title: 'Pilates', startsOn: '2026-11-16', endsOn: null }),
      expect.objectContaining({ title: 'Dentist', startsOn: '2026-11-20', endsOn: '2026-11-20' }),
    ]);
    expect(new Set(out.plan.fixed.map((f) => f.id)).size).toBe(3);
  });
});
