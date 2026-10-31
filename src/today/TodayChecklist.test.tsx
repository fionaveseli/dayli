import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { EditorProvider } from '../editor';
import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { TodayChecklist } from './TodayChecklist';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

// Monday 26 October 2026, 09:17: the sample plan's day.
const MONDAY = new Date(2026, 9, 26, 9, 17);

const renderToday = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <EditorProvider>
          <TodayChecklist now={MONDAY} />
        </EditorProvider>
      </PlanProvider>
    </ThemeProvider>,
  );

describe('TodayChecklist', () => {
  it('shows the greeting, fixed blocks and flexible tasks', async () => {
    const { getByText } = await renderToday();
    await fireEvent.press(getByText('Checklist'));
    await waitFor(() => expect(getByText('Set in stone')).toBeTruthy());
    expect(getByText('Good morning')).toBeTruthy();
    expect(getByText(/Monday 26 October/)).toBeTruthy();
    expect(getByText('Set in stone')).toBeTruthy();
    expect(getByText('Improve watercolor canvas')).toBeTruthy();
    expect(getByText('Done today')).toBeTruthy();
  });

  it('moves a task to Done today when ticked', async () => {
    const { getByLabelText, getByText } = await renderToday();
    await fireEvent.press(getByText('Checklist'));
    await fireEvent.press(getByLabelText('Complete Improve watercolor canvas'));
    await waitFor(() => expect(getByText('2')).toBeTruthy());
  });

  it('opens on the visual day with the now line, then switches to the checklist', async () => {
    const { getByTestId, getByText, queryByText, queryByTestId } = await renderToday();
    expect(getByTestId('timeline')).toBeTruthy();
    expect(getByTestId('now-line')).toBeTruthy();
    expect(getByText('Your day')).toBeTruthy();
    expect(queryByText('Set in stone')).toBeNull();
    await fireEvent.press(getByText('Checklist'));
    expect(getByText('Set in stone')).toBeTruthy();
    expect(queryByTestId('timeline')).toBeNull();
    await fireEvent.press(getByText('Visual day'));
    expect(getByTestId('timeline')).toBeTruthy();
  });

  it('shows fixed blocks, placed tasks and open time on the timeline', async () => {
    const { getAllByLabelText } = await renderToday();
    expect(getAllByLabelText(/^Open time/).length).toBeGreaterThan(0);
  });
});

describe('editor from Today', () => {
  it('opens a task in the editor and saves a new title', async () => {
    const { getByLabelText, getByText, findByText, queryByText } = await renderToday();
    await fireEvent.press(getByText('Checklist'));
    await fireEvent.press(getByLabelText('Edit Improve watercolor canvas'));
    expect(await findByText('Edit task')).toBeTruthy();
    await fireEvent.changeText(getByLabelText('Title'), 'Finish watercolor canvas');
    await fireEvent.press(getByText('Save'));
    await waitFor(() => expect(queryByText('Edit task')).toBeNull());
    expect(getByText('Finish watercolor canvas')).toBeTruthy();
  });

  it('deletes a task', async () => {
    const { getByLabelText, getByText, findByText, queryByText } = await renderToday();
    await fireEvent.press(getByText('Checklist'));
    await fireEvent.press(getByLabelText('Edit Improve watercolor canvas'));
    await findByText('Edit task');
    await fireEvent.press(getByText('Delete'));
    await waitFor(() => expect(queryByText('Improve watercolor canvas')).toBeNull());
  });
});

describe('TodayChecklist morning plan', () => {
  it('shows the plan to approve, then the approved line', async () => {
    const { getByText, queryByText } = await renderToday();
    expect(getByText('Your plan for today')).toBeTruthy();
    await fireEvent.press(getByText('Looks good'));
    await waitFor(() => expect(getByText(/Today's plan approved at 09:17/)).toBeTruthy());
    expect(queryByText('Your plan for today')).toBeNull();
    await fireEvent.press(getByText('Review'));
    await waitFor(() => expect(getByText('Your plan for today')).toBeTruthy());
  });
});
