import { useEffect } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import OnboardingScreen from '../../app/onboarding';
import { OnboardedProvider } from '../onboarding';
import { PlanProvider, usePlan } from '../store';
import { ThemeProvider } from '../theme';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

const seen: { titles?: string[] } = {};
function Spy() {
  const plan = usePlan();
  useEffect(() => {
    seen.titles = plan.dated.fixed.map((f) => f.title);
  });
  return null;
}

describe('onboarding from a CSV', () => {
  it('reviews the file and replaces the demo commitments with it', async () => {
    const { getByText, findByText } = await render(
      <ThemeProvider scheme="light">
        <PlanProvider>
          <OnboardedProvider>
            <Spy />
            <OnboardingScreen />
          </OnboardedProvider>
        </PlanProvider>
      </ThemeProvider>,
    );
    await fireEvent.press(getByText('Import a CSV'));
    await fireEvent.press(getByText('Use a sample file'));
    await findByText('my-week.csv');
    await fireEvent.press(getByText('Build my week'));
    await findByText('From your file');
    getByText('Mon–Fri · 09:00–17:00 · Office');
    await fireEvent.press(getByText('Approve plan'));
    await waitFor(() =>
      expect(seen.titles).toEqual(['Work', 'Pilates', 'Spanish class', "Kids' swimming"]),
    );
  });
});
