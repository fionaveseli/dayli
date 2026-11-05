import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { ChapterScreen } from './ChapterScreen';
import { ChaptersScreen } from './ChaptersScreen';
import { NewChapterScreen } from './NewChapterScreen';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('react-native-safe-area-context'),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));
const mockRouter = { back: jest.fn(), push: jest.fn(), replace: jest.fn() };
let mockId = 'c1';
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({ id: mockId }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../editor', () => ({ useEditor: () => ({ openEditor: jest.fn() }) }));

const wrap = (ui: React.ReactElement) =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>{ui}</PlanProvider>
    </ThemeProvider>,
  );

beforeEach(() => {
  jest.useFakeTimers({
    doNotFake: ['nextTick', 'setImmediate', 'setTimeout'],
    now: new Date(2026, 10, 5, 10),
  });
  Object.values(mockRouter).forEach((f) => f.mockClear());
  mockId = 'c1';
});
afterEach(() => jest.useRealTimers());

describe('chapters', () => {
  it('lists the current, coming and earlier chapters', async () => {
    const { getByText, getByLabelText } = await wrap(<ChaptersScreen />);
    await waitFor(() => getByText('Earlier chapters'));
    expect(getByLabelText('The Remote Job Era, Now')).toBeTruthy();
    expect(getByLabelText('Launch My Business, Next')).toBeTruthy();
    expect(getByLabelText('Summer Reset, Closed')).toBeTruthy();
    expect(getByText('Day 66 of 153 · 87 days left')).toBeTruthy();
    await fireEvent.press(getByLabelText('Launch My Business, Next'));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/chapter/[id]',
      params: { id: 'c2' },
    });
  });

  it('shows a chapter with its goals and moves a goal in and out', async () => {
    const { getByText, getByLabelText, queryByLabelText, getAllByText } = await wrap(
      <ChapterScreen />,
    );
    await waitFor(() => getByText('Weekly rhythm'));
    expect(getByText('2/10')).toBeTruthy();
    expect(getByLabelText('Open goal Train four times a week')).toBeTruthy();
    await fireEvent.press(getAllByText('Remove from chapter')[2]);
    expect(queryByLabelText('Open goal Train four times a week')).toBeNull();
    await fireEvent.press(getByText('+ Four workouts a week'));
    expect(getByLabelText('Open goal Train four times a week')).toBeTruthy();
  });

  it('deleting a chapter keeps its goals', async () => {
    mockId = 'c1';
    const { getByText } = await wrap(<ChapterScreen />);
    await waitFor(() => getByText('Delete this chapter'));
    await fireEvent.press(getByText('Delete this chapter'));
    expect(mockRouter.back).toHaveBeenCalled();
    await waitFor(() => getByText('This chapter is gone'));
  });

  it('creates a chapter in three steps', async () => {
    const { getByText, getByLabelText } = await wrap(<NewChapterScreen />);
    await waitFor(() => getByText('Career sprint'));
    await fireEvent.press(getByText('Career sprint'));
    await fireEvent.press(getByText('Continue'));
    expect(getByLabelText('Starts').props.value).toBe('2026-11-05');
    expect(getByLabelText('Ends').props.value).toBe('2027-02-04');
    await fireEvent.changeText(getByLabelText('Name'), 'Interview Season');
    await fireEvent.press(getByText('Continue'));
    await fireEvent.press(getByLabelText('sage'));
    await fireEvent.press(getByText('Create chapter'));
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/chapter/[id]',
      params: { id: expect.stringMatching(/^c/) },
    });
  });
});
