import { useEffect } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanProvider, usePlan } from '../store';
import { ThemeProvider } from '../theme';
import { SettingsScreen } from './SettingsScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('expo-router', () => ({ useRouter: () => ({ back: jest.fn() }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const seen: { settings?: ReturnType<typeof usePlan>['settings'] } = {};
function Spy() {
  const plan = usePlan();
  useEffect(() => {
    seen.settings = plan.settings;
  });
  return null;
}
const latest = () => seen.settings!;

const renderScreen = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <Spy />
        <SettingsScreen />
      </PlanProvider>
    </ThemeProvider>,
  );

describe('SettingsScreen', () => {
  it('changes the theme, breathing room and a toggle', async () => {
    const { getByText, getByLabelText } = await renderScreen();
    await waitFor(() => getByText('Working hours'));
    await fireEvent.press(getByText('Dark'));
    expect(latest().theme).toBe('dark');
    await fireEvent.press(getByText('1h 30m'));
    expect(latest().buffer).toBe(90);
    const before = latest().autoRoll;
    await fireEvent.press(getByLabelText('Move unfinished tasks forward'));
    expect(latest().autoRoll).toBe(!before);
  });

  it('moves work start in 5-minute steps', async () => {
    const { getByText, getByLabelText } = await renderScreen();
    await waitFor(() => getByText('Working hours'));
    const start = latest().workStart;
    await fireEvent.press(getByLabelText('Later Work starts'));
    expect(latest().workStart).toBe(start + 5);
  });
});
