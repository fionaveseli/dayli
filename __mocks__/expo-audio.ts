// Jest stand-in for the native audio module: a recorder that "records" instantly.
export const RecordingPresets = { HIGH_QUALITY: {}, LOW_QUALITY: {} };
export const requestRecordingPermissionsAsync = jest.fn(async () => ({ granted: true }));
export const setAudioModeAsync = jest.fn(async () => {});
const recorder = {
  uri: 'file:///note.m4a' as string | null,
  prepareToRecordAsync: jest.fn(async () => {}),
  record: jest.fn(),
  stop: jest.fn(async () => {}),
};
export const useAudioRecorder = () => recorder;
