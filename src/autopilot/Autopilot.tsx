import { useEffect } from 'react';
import { AppState } from 'react-native';

import { usePlan } from '../store';

/**
 * Also creates each week's rhythm sessions.
 * Moves unfinished tasks forward once a day has ended: when the app opens, comes back
 * to the front, and at bedtime while it stays open. Does nothing when the user would
 * rather be asked (the Today screen shows that card) or has switched it off.
 */
export function Autopilot() {
  const { ready, runRollover, runRhythm, settings } = usePlan();
  const { autoRoll, rollAsk, sleep } = settings;

  useEffect(() => {
    if (!ready || !autoRoll || rollAsk) return;
    const run = () => runRollover(new Date());
    run();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    const now = new Date();
    const end = new Date(now);
    end.setHours(0, sleep, 1, 0);
    const wait = end.getTime() - now.getTime();
    const timer = wait > 0 ? setTimeout(run, wait) : undefined;
    return () => {
      sub.remove();
      if (timer) clearTimeout(timer);
    };
  }, [ready, autoRoll, rollAsk, sleep, runRollover]);

  /** Weekly rhythms: each week's sessions are made once, when the app opens or returns. */
  useEffect(() => {
    if (!ready) return;
    const run = () => runRhythm(new Date());
    run();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => sub.remove();
  }, [ready, runRhythm]);

  return null;
}
