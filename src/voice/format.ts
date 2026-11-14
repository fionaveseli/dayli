/** Longest voice note, in seconds. Recording stops by itself here. */
export const MAX_SECS = 120;

/** 0:07, 1:30. */
export function clock(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Tidies a transcript: trims, collapses runs of spaces, capitalises the first letter. */
export function cleanTranscript(text: string): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : '';
}

/** For quick add: drops the full stop a transcript ends with, so it reads like a typed line. */
export function asLine(text: string): string {
  return cleanTranscript(text)
    .replace(/\b([ap])\.\s?m\./gi, (_, x: string) => x.toLowerCase() + 'm')
    .replace(/[.!]+$/, '');
}
