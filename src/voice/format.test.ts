import { asLine, cleanTranscript, clock } from './format';

describe('voice format', () => {
  it('shows the timer as m:ss', () => {
    expect(clock(0)).toBe('0:00');
    expect(clock(7)).toBe('0:07');
    expect(clock(90.6)).toBe('1:30');
    expect(clock(-3)).toBe('0:00');
  });

  it('tidies a transcript', () => {
    expect(cleanTranscript('  so,   I work  nine to five.\n')).toBe('So, I work nine to five.');
    expect(cleanTranscript('   ')).toBe('');
  });

  it('turns a transcript into a quick-add line', () => {
    expect(asLine('remind me at 4 to call mum.')).toBe('Remind me at 4 to call mum');
    expect(asLine('Buy milk!')).toBe('Buy milk');
    expect(asLine('Remind me at 4 P.M. to call mum.')).toBe('Remind me at 4 pm to call mum');
  });
});
