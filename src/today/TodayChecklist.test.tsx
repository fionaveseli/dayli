import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { TodayChecklist } from './TodayChecklist';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Monday 26 October 2026, 09:17: the sample plan's day.
const MONDAY = new Date(2026, 9, 26, 9, 17);

const renderToday = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <TodayChecklist now={MONDAY} />
      </PlanProvider>
    </ThemeProvider>,
  );

describe('TodayChecklist', () => {
  it('shows the greeting, fixed blocks and flexible tasks', async () => {
    const { getByText } = await renderToday();
    expect(getByText('Good morning')).toBeTruthy();
    expect(getByText(/Monday 26 October/)).toBeTruthy();
    expect(getByText('Set in stone')).toBeTruthy();
    expect(getByText('Improve watercolor canvas')).toBeTruthy();
    expect(getByText('Done today')).toBeTruthy();
  });

  it('moves a task to Done today when ticked', async () => {
    const { getByLabelText, getByText } = await renderToday();
    await fireEvent.press(getByLabelText('Complete Improve watercolor canvas'));
    await waitFor(() => expect(getByText('2')).toBeTruthy());
  });
});
