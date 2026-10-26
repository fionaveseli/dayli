export const radii = { xs: 6, sm: 10, md: 14, lg: 16, xl: 24, pill: 999 } as const;

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Minimum touch target, in points. */
export const hit = 44;

export const fonts = {
  display: 'Newsreader_500Medium',
  displayItalic: 'Newsreader_500Medium_Italic',
  displayRegular: 'Newsreader_400Regular',
  ui: 'Figtree_400Regular',
  uiMedium: 'Figtree_500Medium',
  uiSemi: 'Figtree_600SemiBold',
  uiBold: 'Figtree_700Bold',
} as const;

export type TextVariant =
  'wordmark' | 'h1' | 'title' | 'h2' | 'h3' | 'body' | 'hand' | 'label' | 'small';

export const textStyles: Record<
  TextVariant,
  { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number }
> = {
  wordmark: { fontFamily: fonts.displayItalic, fontSize: 28, lineHeight: 28, letterSpacing: -0.56 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 31, letterSpacing: -0.28 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, letterSpacing: -0.22 },
  h2: { fontFamily: fonts.uiBold, fontSize: 18, lineHeight: 23 },
  h3: { fontFamily: fonts.uiBold, fontSize: 15.5, lineHeight: 20 },
  body: { fontFamily: fonts.ui, fontSize: 15, lineHeight: 22 },
  hand: { fontFamily: fonts.ui, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.uiSemi, fontSize: 13, lineHeight: 18 },
  small: { fontFamily: fonts.uiMedium, fontSize: 12.5, lineHeight: 17 },
};
