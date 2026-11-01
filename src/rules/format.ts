export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAYF = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const fmtT = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

export const fmtD = (m: number) =>
  m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m / 60}h`;

export const daysLabel = (ds: number[]) => {
  const s = [...ds].sort((a, b) => a - b);
  if (!s.length) return 'No days';
  if (s.length === 7) return 'Every day';
  if (s.length > 2 && s.every((d, i) => i === 0 || d === s[i - 1] + 1))
    return `${DAYS[s[0]]}–${DAYS[s[s.length - 1]]}`;
  return s.map((d) => DAYS[d]).join(', ');
};
