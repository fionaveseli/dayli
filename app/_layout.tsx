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
import type { ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';

import { Autopilot } from '../src/autopilot';
import { EditorProvider } from '../src/editor';
import { Notifier } from '../src/notifications';
import { OnboardedProvider } from '../src/onboarding';
import { PlanProvider, usePlan } from '../src/store';
import { AuthProvider, SyncProvider } from '../src/sync';
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

/** Light, dark or the phone's own setting, as chosen in Settings. */
function SettingsTheme({ children }: { children: ReactNode }) {
  const { settings } = usePlan();
  return (
    <ThemeProvider scheme={settings.theme === 'system' ? undefined : settings.theme}>
      {children}
    </ThemeProvider>
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
    <OnboardedProvider>
      <AuthProvider>
        <PlanProvider>
          <SettingsTheme>
            <SyncProvider>
              <EditorProvider>
                <Notifier />
                <Autopilot />
                <Shell />
              </EditorProvider>
            </SyncProvider>
          </SettingsTheme>
        </PlanProvider>
      </AuthProvider>
    </OnboardedProvider>
  );
}
