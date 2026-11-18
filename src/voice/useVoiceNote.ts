import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  type RecordingOptions,
} from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';

import { MAX_SECS } from './format';
import { transcribe, VoiceError } from './transcribe';

export type VoiceStatus = 'idle' | 'recording' | 'transcribing';

// Speech only: mono and a modest bit rate keep uploads small (about 0.5 MB a minute).
const OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  numberOfChannels: 1,
  bitRate: 64000,
};

/**
 * Record a voice note and turn it into text. `onText` receives the transcript,
 * which the screen shows for editing before anything uses it. Pass a stable `onText`
 * (a state setter or a `useCallback`): it keeps the two-minute limit timer steady.
 */
export function useVoiceNote(onText: (text: string) => void) {
  const recorder = useAudioRecorder(OPTIONS);
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [secs, setSecs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    setStatus('transcribing');
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      if (!recorder.uri) throw new VoiceError('No recording came through. Try again.');
      onText(await transcribe(recorder.uri));
    } catch (e) {
      setError(e instanceof VoiceError ? e.message : 'Could not hear that. Try again, or type it.');
    } finally {
      setStatus('idle');
    }
  }, [recorder, onText]);

  const start = useCallback(async () => {
    setError(null);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        setError('Dayli needs the microphone for voice notes. Allow it in Settings, or type it.');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setSecs(0);
      setStatus('recording');
    } catch {
      setError('Could not start recording. Try again, or type it.');
    }
  }, [recorder]);

  useEffect(() => {
    if (status !== 'recording') return;
    const i = setInterval(() => setSecs((s) => s + 1), 1000);
    const limit = setTimeout(() => void stop(), MAX_SECS * 1000);
    return () => {
      clearInterval(i);
      clearTimeout(limit);
    };
  }, [status, stop]);

  const toggle = useCallback(
    () => (status === 'recording' ? stop() : status === 'idle' ? start() : undefined),
    [status, start, stop],
  );

  return { status, secs, error, toggle };
}
