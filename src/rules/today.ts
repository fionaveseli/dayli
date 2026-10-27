import type { Category } from '../data/types';
import type { Tone } from '../theme/colors';
import { DAYF } from './format';

/** Monday = 0 … Sunday = 6, matching the plan's day indexes. */
export const dayIndexOf = (d: Date): number => (d.getDay() + 6) % 7;

export const greetingFor = (d: Date): string => {
  const h = d.getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
};

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const dateLine = (d: Date): string =>
  `${DAYF[dayIndexOf(d)]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;

export const toLine = (title: string): string => title.charAt(0).toLowerCase() + title.slice(1);

export const CATS: Record<Category, { label: string; tone: Tone }> = {
  work: { label: 'Day job', tone: 'powder' },
  client: { label: 'Blue Bamboo', tone: 'lav' },
  portfolio: { label: 'Portfolio', tone: 'blush' },
  interview: { label: 'Interview prep', tone: 'peach' },
  fitness: { label: 'Fitness', tone: 'sage' },
  personal: { label: 'Personal', tone: 'butter' },
};
