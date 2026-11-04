import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { GoalsScreen } from './GoalsScreen';

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
jest.mock('../editor', () => ({ useEditor: () => ({ openEditor: jest.fn() }) }));

const renderScreen = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <GoalsScreen />
      </PlanProvider>
    </ThemeProvider>,
  );

describe('GoalsScreen', () => {
  it('shows the goal, its next milestone and moves progress when a step is ticked', async () => {
    const { getByText, getAllByText, getAllByLabelText } = await renderScreen();
    await waitFor(() => getByText('Find a remote software engineering job by January'));
    expect(getAllByText(/Next: Finish portfolio by 15 Nov/).length).toBe(1);
    expect(getByText('3 of 10 steps done')).toBeTruthy();
    await fireEvent.press(getAllByLabelText('Complete Build portfolio homepage')[0]);
    expect(getByText('4 of 10 steps done')).toBeTruthy();
  });

  it('adds a milestone with a target date', async () => {
    const { getByText, getByLabelText } = await renderScreen();
    await waitFor(() => getByText('Milestones'));
    await fireEvent.press(getByText('Add milestone'));
    await fireEvent.changeText(getByLabelText('Milestone'), 'Send ten applications');
    await fireEvent.changeText(getByLabelText('Target date'), '2027-01-15');
    await fireEvent.press(getByText('Save'));
    await waitFor(() => getByText('Send ten applications'));
    expect(getByText(/No steps · 15 Jan/)).toBeTruthy();
  });

  it('adds a goal', async () => {
    const { getByText, getAllByText, getByLabelText } = await renderScreen();
    await waitFor(() => getByText('+ New goal'));
    await fireEvent.press(getByText('+ New goal'));
    await fireEvent.changeText(getByLabelText('Goal'), 'Read twelve books');
    await fireEvent.press(getByText('Add goal'));
    await waitFor(() => getByText('Milestones'));
    expect(getAllByText('Read twelve books').length).toBeGreaterThan(0);
  });
});
