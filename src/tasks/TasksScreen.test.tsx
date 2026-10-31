import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { EditorProvider } from '../editor';
import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { TasksScreen } from './TasksScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const MONDAY = new Date(2026, 9, 26, 9, 17);

const renderTasks = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <EditorProvider>
          <TasksScreen now={MONDAY} />
        </EditorProvider>
      </PlanProvider>
    </ThemeProvider>,
  );

describe('TasksScreen', () => {
  it('switches sections and shows the empty copy', async () => {
    const { getByText, getByLabelText } = await renderTasks();
    await waitFor(() => expect(getByText('Tasks')).toBeTruthy());
    await fireEvent.press(getByText('Completed'));
    expect(getByText('Tap a checkbox to bring a task back.')).toBeTruthy();
    expect(getByLabelText('Filter by category')).toBeTruthy();
  });
});
