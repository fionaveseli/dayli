export type Palette = {
  paper: string;
  paper2: string;
  card: string;
  ink: string;
  ink2: string;
  muted: string;
  faint: string;
  line: string;
  line2: string;
  rose: string;
  roseSoft: string;
  sel: string;
  blush: string;
  blushInk: string;
  powder: string;
  powderInk: string;
  sage: string;
  sageInk: string;
  lav: string;
  lavInk: string;
  peach: string;
  peachInk: string;
  butter: string;
  butterInk: string;
  warn: string;
  warnBg: string;
  over: string;
  overBg: string;
  btn: string;
  btnInk: string;
  navBg: string;
  active: string;
  scrim: string;
};

export const light: Palette = {
  paper: '#FAF7F4',
  paper2: '#F3EEE9',
  card: '#FFFFFF',
  ink: '#20242C',
  ink2: '#4B4F58',
  muted: '#63666D',
  faint: '#6B6C72',
  line: '#EAE4E0',
  line2: '#DBD3CD',
  rose: '#C25E88',
  roseSoft: '#F8E5EC',
  sel: '#FDF5F8',
  blush: '#F5DCE6',
  blushInk: '#9A4468',
  powder: '#DCE8F8',
  powderInk: '#3A5E98',
  sage: '#DDEBDD',
  sageInk: '#456E4A',
  lav: '#E8DDF6',
  lavInk: '#684C9E',
  peach: '#F9E6D6',
  peachInk: '#9C592B',
  butter: '#F4EBC8',
  butterInk: '#7C6318',
  warn: '#A3601C',
  warnBg: '#FAEAD7',
  over: '#AE3F4E',
  overBg: '#F8DFE2',
  btn: '#20242C',
  btnInk: '#FAF7F4',
  navBg: 'rgba(255,255,255,.86)',
  active: '#ECE6E1',
  scrim: 'rgba(32,36,44,.3)',
};

export const dark: Palette = {
  paper: '#17181C',
  paper2: '#1D1E23',
  card: '#23252B',
  ink: '#F3EEE9',
  ink2: '#CFC9C3',
  muted: '#9A9BA2',
  faint: '#8A8B92',
  line: '#2D2F36',
  line2: '#3B3D45',
  rose: '#E48DB1',
  roseSoft: '#3A2630',
  sel: '#241E23',
  blush: '#3B2631',
  blushInk: '#F1B5CD',
  powder: '#22304A',
  powderInk: '#A9C5F1',
  sage: '#22332A',
  sageInk: '#A8D3AD',
  lav: '#2E2741',
  lavInk: '#CDB9F2',
  peach: '#3A2B21',
  peachInk: '#F1C39E',
  butter: '#352F1B',
  butterInk: '#E9D58D',
  warn: '#EDB070',
  warnBg: '#3A2B1B',
  over: '#F09AA5',
  overBg: '#3E2329',
  btn: '#F3EEE9',
  btnInk: '#17181C',
  navBg: 'rgba(35,37,43,.86)',
  active: '#2C2E35',
  scrim: 'rgba(0,0,0,.5)',
};

export type Tone = 'powder' | 'sage' | 'lav' | 'peach' | 'butter' | 'blush';

/** Background and ink colour for a category tone. */
export function toneColors(p: Palette, tone: Tone): { bg: string; ink: string } {
  return { bg: p[tone], ink: p[`${tone}Ink` as const] };
}
