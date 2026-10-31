import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { EditorProvider } from '../editor';
import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { CalendarScreen } from './CalendarScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Monday 26 October 2026, 09:17.
const MONDAY = new Date(2026, 9, 26, 9, 17);

const renderCalendar = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <EditorProvider>
          <CalendarScreen now={MONDAY} />
        </EditorProvider>
      </PlanProvider>
    </ThemeProvider>,
  );

describe('CalendarScreen', () => {
  it('shows the day with its free time and load', async () => {
    const { getByText, getAllByText } = await renderCalendar();
    await waitFor(() => expect(getByText('Mon, 26 Oct')).toBeTruthy());
    expect(getAllByText('Free').length).toBeGreaterThan(0);
    expect(getByText('Planned')).toBeTruthy();
    expect(getByText('Load')).toBeTruthy();
  });

  it('switches to the week grid and picks another day', async () => {
    const { getByText, getByTestId, getByLabelText, queryByTestId } = await renderCalendar();
    await waitFor(() => getByText('Mon, 26 Oct'));
    await fireEvent.press(getByText('Week'));
    expect(getByTestId('week-grid')).toBeTruthy();
    expect(getByText('26 Oct – 1 Nov')).toBeTruthy();
    await fireEvent.press(getByLabelText('Wednesday 28'));
    expect(getByText(/Wednesday, 28 Oct/)).toBeTruthy();
    await fireEvent.press(getByText('Day'));
    expect(queryByTestId('week-grid')).toBeNull();
  });

  it('moves a task to another day from the sheet', async () => {
    const { getAllByLabelText, getByText, getByLabelText, queryAllByLabelText } =
      await renderCalendar();
    await waitFor(() => getByText('Mon, 26 Oct'));
    const before = getAllByLabelText('Move to another day').length;
    await fireEvent.press(getAllByLabelText('Move to another day')[0]);
    await fireEvent.press(getByLabelText(/^Thursday, /));
    await waitFor(() => expect(queryAllByLabelText('Move to another day').length).toBe(before - 1));
  });
});
