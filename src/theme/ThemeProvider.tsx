import { createContext, useContext, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { dark, light, type Palette } from './colors';

export type Theme = { dark: boolean; colors: Palette };

const ThemeContext = createContext<Theme | null>(null);

/** Follows the phone's light/dark setting unless `scheme` is given. */
export function ThemeProvider({
  scheme,
  children,
}: {
  scheme?: 'light' | 'dark';
  children: ReactNode;
}) {
  const system = useColorScheme();
  const isDark = (scheme ?? system) === 'dark';
  const value: Theme = { dark: isDark, colors: isDark ? dark : light };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const t = useContext(ThemeContext);
  if (!t) throw new Error('useTheme needs a ThemeProvider');
  return t;
}
