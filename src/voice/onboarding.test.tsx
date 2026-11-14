import { fireEvent, render, waitFor } from '@testing-library/react-native';

import OnboardingScreen from '../../app/onboarding';
import { OnboardedProvider } from '../onboarding';
import { PlanProvider } from '../store';
import { ThemeProvider } from '../theme';
import { transcribe } from './transcribe';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(async () => null), setItem: jest.fn(async () => {}) },
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('./transcribe', () => {
  class VoiceError extends Error {}
  return { VoiceError, transcribe: jest.fn() };
});

describe('onboarding by voice', () => {
  it('shows the transcript for editing before building the week', async () => {
    (transcribe as jest.Mock).mockResolvedValueOnce('I work nine to five on weekdays.');
    const { getByText, getByLabelText, findByLabelText } = await render(
      <ThemeProvider scheme="light">
        <PlanProvider>
          <OnboardedProvider>
            <OnboardingScreen />
          </OnboardedProvider>
        </PlanProvider>
      </ThemeProvider>,
    );
    await fireEvent.press(getByText('Record a voice note'));
    await fireEvent.press(getByLabelText('Start recording'));
    await fireEvent.press(await waitFor(() => getByLabelText('Stop recording')));
    const box = await findByLabelText('Transcript');
    expect(box.props.value).toBe('I work nine to five on weekdays.');
    expect(getByText('What I heard')).toBeTruthy();
    await fireEvent.changeText(box, 'I work nine to six on weekdays.');
    expect(getByLabelText('Transcript').props.value).toBe('I work nine to six on weekdays.');
    await fireEvent.press(getByText('Record again'));
    expect(getByLabelText('Start recording')).toBeTruthy();
  });
});
