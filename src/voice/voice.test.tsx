import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { QuickAdd } from '../quickadd';
import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { transcribe, VoiceError } from './transcribe';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('./transcribe', () => {
  class VoiceError extends Error {}
  return { VoiceError, transcribe: jest.fn() };
});

const mocked = transcribe as jest.MockedFunction<typeof transcribe>;

const renderAdd = () =>
  render(
    <ThemeProvider scheme="light">
      <PlanProvider>
        <QuickAdd day={0} />
      </PlanProvider>
    </ThemeProvider>,
  );

describe('quick add by voice', () => {
  it('puts the transcript in the field and adds nothing until Add', async () => {
    mocked.mockResolvedValueOnce('Remind me at 4 p.m. to call the dentist.');
    const { getByLabelText, getByText, findByDisplayValue, queryByText } = await renderAdd();
    await fireEvent.press(getByLabelText('Add by voice'));
    await waitFor(() => expect(getByText(/Listening… 0:00/)).toBeTruthy());
    await fireEvent.press(getByLabelText(/Stop recording/));
    expect(await findByDisplayValue('Remind me at 4 pm to call the dentist')).toBeTruthy();
    expect(getByText('Check what I heard, then tap Add.')).toBeTruthy();
    expect(queryByText(/Reminder set/)).toBeNull();
    await fireEvent.press(getByText('Add'));
    await waitFor(() => expect(queryByText('Check what I heard, then tap Add.')).toBeNull());
  });

  it('explains when the transcript could not be made', async () => {
    mocked.mockRejectedValueOnce(
      new VoiceError('Voice notes are not set up yet. Type it instead.'),
    );
    const { getByLabelText, findByText } = await renderAdd();
    await fireEvent.press(getByLabelText('Add by voice'));
    await fireEvent.press(await waitFor(() => getByLabelText(/Stop recording/)));
    expect(await findByText('Voice notes are not set up yet. Type it instead.')).toBeTruthy();
  });
});
