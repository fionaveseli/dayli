import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { ResetScreen } from './ResetScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
const mockBack = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ back: mockBack }) }));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

/** Sunday evening of the week the sample plan is placed in. */
const sunday = () => {
  const d = new Date();
  d.setDate(d.getDate() + (6 - ((d.getDay() + 6) % 7)));
  d.setHours(19, 0, 0, 0);
  return d;
};

const renderScreen = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <ResetScreen now={sunday()} />
      </PlanProvider>
    </ThemeProvider>,
  );

describe('ResetScreen', () => {
  it('shows what slipped, the proposed week, and approves it', async () => {
    const { getByText, getAllByText, queryAllByLabelText, getAllByLabelText } =
      await renderScreen();
    await waitFor(() => getByText('What slipped'));
    const slipped = getAllByLabelText(/^Slipped /);
    expect(slipped.length).toBeGreaterThan(0);
    expect(getAllByText('Next week').length).toBe(slipped.length + 1);
    expect(getAllByText(/^From this week/).length).toBe(slipped.length);

    await fireEvent.press(getAllByText('Let go')[0]);
    expect(getAllByText(/^From this week/).length).toBe(slipped.length - 1);

    await fireEvent.press(getByText('Approve next week'));
    expect(mockBack).toHaveBeenCalled();
    expect(queryAllByLabelText(/^Slipped /).length).toBe(0);
    expect(getByText('Next week is set. Changes save as you go.')).toBeTruthy();
  });
});
