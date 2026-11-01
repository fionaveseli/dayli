import { supabase } from '../sync/client';
import { normalizeRoutine, type Routine } from './routine';

export class RoutineError extends Error {}

/** Sends the user's words to the parse-routine Edge Function and returns what it understood. */
export async function readRoutine(text: string): Promise<Routine> {
  if (!supabase)
    throw new RoutineError(
      'Reading your week needs an account. Sign in under More, or add it by hand.',
    );
  const { data, error } = await supabase.functions.invoke('parse-routine', { body: { text } });
  if (error) {
    let msg = 'Could not read your week right now. Try again, or add it by hand.';
    try {
      const body = await (error as { context?: Response }).context?.json();
      if (body?.error) msg = String(body.error);
    } catch {
      // keep the default message
    }
    throw new RoutineError(msg);
  }
  const routine = normalizeRoutine(data, text);
  if (!routine.fixed.length && !routine.flex.length && !routine.reminders.length)
    throw new RoutineError('I could not find anything to plan in that. Add a few more details.');
  return routine;
}
