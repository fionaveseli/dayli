import type { LoadKind } from '../data/types';
import type { Palette } from '../theme';

/** Colour only on status: calm for light/balanced, warning when full, alarm when over. */
export const loadColor = (c: Palette, k: LoadKind): string =>
  ({ light: c.sageInk, balanced: c.powderInk, full: c.warn, over: c.over })[k];
