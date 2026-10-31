import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from '@expo-google-fonts/figtree';
import {
  Newsreader_400Regular,
  Newsreader_500Medium,
  Newsreader_500Medium_Italic,
  useFonts,
} from '@expo-google-fonts/newsreader';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { EditorProvider } from '../src/editor';
import { Notifier } from '../src/notifications';
import { PlanProvider } from '../src/store';
import { ThemeProvider, useTheme } from '../src/theme';

function Shell() {
  const { dark, colors } = useTheme();
  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.paper } }}
      />
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Newsreader_500Medium_Italic,
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
  });
  if (!loaded) return null;
  return (
    <ThemeProvider>
      <PlanProvider>
        <EditorProvider>
          <Notifier />
          <Shell />
        </EditorProvider>
      </PlanProvider>
    </ThemeProvider>
  );
}
