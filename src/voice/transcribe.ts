import { supabase } from '../sync/client';
import { cleanTranscript } from './format';

export class VoiceError extends Error {}

/** Sends a recording to the transcribe Edge Function and returns the text. */
export async function transcribe(uri: string): Promise<string> {
  if (!supabase)
    throw new VoiceError('Voice notes need an account. Sign in under More, or type it.');
  const name = uri.split('/').pop() || 'note.m4a';
  const form = new FormData();
  // React Native's FormData takes a file as { uri, name, type }.
  form.append('audio', { uri, name, type: 'audio/mp4' } as unknown as Blob);
  const { data, error } = await supabase.functions.invoke('transcribe', { body: form });
  if (error) {
    let msg = 'Could not hear that right now. Try again, or type it.';
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) msg = String(body.error);
    } catch {
      // keep the default message
    }
    throw new VoiceError(msg);
  }
  const text = cleanTranscript(String(data?.text ?? ''));
  if (!text) throw new VoiceError('I didn’t catch anything. Try again, a little closer.');
  return text;
}
