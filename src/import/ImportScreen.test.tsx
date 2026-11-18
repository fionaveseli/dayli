import { useEffect } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanProvider, usePlan } from '../store';
import { ThemeProvider } from '../theme';
import { ImportScreen } from './ImportScreen';

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

const mockPicked = {
  name: 'timetable.csv',
  size: 120,
  text: jest.fn(async () => 'Course;Day;Start;End;Room\nStatistics;Mon/Wed;10:00;11:30;Room 4\n'),
};
const mockPick = jest.fn(async () => ({ canceled: false, result: mockPicked }));
jest.mock('expo-file-system', () => ({
  File: { pickFileAsync: (...a: unknown[]) => (mockPick as jest.Mock)(...a) },
}));

const seen: { fixed?: ReturnType<typeof usePlan>['dated']['fixed'] } = {};
function Spy() {
  const plan = usePlan();
  useEffect(() => {
    seen.fixed = plan.dated.fixed;
  });
  return null;
}

const renderScreen = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <Spy />
        <ImportScreen />
      </PlanProvider>
    </ThemeProvider>,
  );

describe('ImportScreen', () => {
  it('reads a chosen file and adds its commitments', async () => {
    const { getByText, findByText } = await renderScreen();
    await waitFor(() => getByText('Choose a CSV file'));
    const before = seen.fixed!.length;
    await fireEvent.press(getByText('Choose a CSV file'));
    await findByText('timetable.csv');
    getByText('Mon, Wed · 10:00–11:30 · Room 4');
    await fireEvent.press(getByText('Add 1 commitment'));
    await findByText('Added 1 commitment.');
    expect(seen.fixed!.length).toBe(before + 1);
    expect(seen.fixed![before]).toMatchObject({ title: 'Statistics', days: [0, 2], endsOn: null });
  });

  it('lets you remove a row from the sample before adding', async () => {
    const { getByText, getByLabelText, findByText } = await renderScreen();
    await waitFor(() => getByText('Use a sample file'));
    await fireEvent.press(getByText('Use a sample file'));
    await findByText('my-week.csv');
    await fireEvent.press(getByLabelText('Remove Pilates'));
    getByText('Add 3 commitments');
    await fireEvent.press(getByLabelText('Remove file'));
    getByText('Choose a CSV file');
  });

  it('says so when the picker is cancelled or the file has no title column', async () => {
    const { getByText, findByText } = await renderScreen();
    await waitFor(() => getByText('Choose a CSV file'));
    mockPick.mockResolvedValueOnce({ canceled: true, result: null } as never);
    await fireEvent.press(getByText('Choose a CSV file'));
    getByText('Choose a CSV file');
    mockPicked.text.mockResolvedValueOnce('Day,Start\nMon,9\n');
    await fireEvent.press(getByText('Choose a CSV file'));
    await findByText('I couldn’t find a title column. Name the first column “Title”.');
  });
});
