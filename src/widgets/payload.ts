import { dateKey } from '../rules/autopilot';
import { widgetTimeline, type WidgetView } from '../rules/widget';
import type { PlanData } from '../data/types';
import { dark, light, type Palette } from '../theme/colors';

const KEYS = [
  'paper',
  'card',
  'ink',
  'muted',
  'line',
  'rose',
  'warn',
  'blush',
  'blushInk',
  'powder',
  'powderInk',
  'sage',
  'sageInk',
  'lav',
  'lavInk',
  'peach',
  'peachInk',
  'butter',
  'butterInk',
] as const;

type WidgetColors = Pick<Palette, (typeof KEYS)[number]>;
const pick = (p: Palette): WidgetColors =>
  Object.fromEntries(KEYS.map((k) => [k, p[k]])) as WidgetColors;

/** Everything the native widgets need, as one JSON document written to shared storage. */
export type WidgetPayload = {
  version: 1;
  /** The local date the entries are for. */
  date: string;
  /** Each entry holds from `at` (epoch ms) until the next one. */
  entries: { at: number; view: WidgetView }[];
  /** After this (local midnight) the widget asks to open Dayli instead of showing old data. */
  staleAt: number;
  theme: 'system' | 'light' | 'dark';
  colors: { light: WidgetColors; dark: WidgetColors };
};

export function widgetPayload(plan: PlanData, now: Date): WidgetPayload {
  const day = (now.getDay() + 6) % 7;
  const minute = now.getHours() * 60 + now.getMinutes();
  const at = (m: number) =>
    new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, m).getTime();
  return {
    version: 1,
    date: dateKey(now),
    entries: widgetTimeline(plan, day, minute).map((e) => ({
      at: e.from === minute ? now.getTime() : at(e.from),
      view: e.view,
    })),
    staleAt: at(24 * 60),
    theme: plan.settings.theme,
    colors: { light: pick(light), dark: pick(dark) },
  };
}
