import { render, waitFor } from '@testing-library/react-native';

import { SAMPLE_PLAN } from '../data/sample';
import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { widgetPayload } from './payload';
import { WidgetsScreen } from './WidgetsScreen';

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

/** Monday 10:00 of the week the sample plan is placed in. */
const monday = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(10, 0, 0, 0);
  return d;
};

describe('widgetPayload', () => {
  it('holds today as timed entries and the colours for both themes', () => {
    const now = new Date(2026, 9, 26, 10, 0);
    const p = widgetPayload(SAMPLE_PLAN, now);
    expect(p.date).toBe('2026-10-26');
    expect(p.entries[0].at).toBe(now.getTime());
    expect(p.entries[1].at).toBe(new Date(2026, 9, 26, 12, 30).getTime());
    expect(p.staleAt).toBe(new Date(2026, 9, 27, 0, 0).getTime());
    expect(p.colors.light.paper).toBe('#FAF7F4');
    expect(p.colors.dark.paper).toBe('#17181C');
  });
});

describe('WidgetsScreen', () => {
  it('previews the next thing and Don’t forget', async () => {
    const { getByText, getAllByText } = await render(
      <ThemeProvider scheme="light">
        <PlanProvider>
          <WidgetsScreen now={monday()} />
        </PlanProvider>
      </ThemeProvider>,
    );
    await waitFor(() => getByText('Home screen widgets'));
    expect(getAllByText('Call the dentist to book a check-up').length).toBeGreaterThan(0);
    expect(getByText("Don't forget")).toBeTruthy();
    expect(getByText(/In Expo Go this is a preview/)).toBeTruthy();
  });
});
