import { dateLine, dayIndexOf, greetingFor, toLine } from './today';

describe('today helpers', () => {
  it('maps dates to Monday-first day indexes', () => {
    expect(dayIndexOf(new Date(2026, 9, 26))).toBe(0);
    expect(dayIndexOf(new Date(2026, 9, 25))).toBe(6);
  });
  it('greets by time of day', () => {
    expect(greetingFor(new Date(2026, 9, 26, 9))).toBe('Good morning');
    expect(greetingFor(new Date(2026, 9, 26, 14))).toBe('Good afternoon');
    expect(greetingFor(new Date(2026, 9, 26, 20))).toBe('Good evening');
  });
  it('writes the date line and lowercases a title', () => {
    expect(dateLine(new Date(2026, 9, 26))).toBe('Monday 26 October');
    expect(toLine('Call mum')).toBe('call mum');
  });
});
