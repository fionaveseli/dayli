/** Local calendar dates as `YYYY-MM-DD`; they sort as plain strings. */
export type DateKey = string;

const p = (n: number) => String(n).padStart(2, '0');

export const keyOf = (d: Date): DateKey =>
  `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;

export const parseKey = (k: DateKey): Date => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const addKey = (k: DateKey, n: number): DateKey => {
  const d = parseKey(k);
  d.setDate(d.getDate() + n);
  return keyOf(d);
};

/** Monday of the week containing `d`. */
export const mondayKey = (d: Date): DateKey => {
  const m = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7));
  return keyOf(m);
};
