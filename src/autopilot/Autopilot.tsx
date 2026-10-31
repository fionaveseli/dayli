import { useEffect } from 'react';
import { AppState } from 'react-native';

import { usePlan } from '../store';

/**
 * Moves unfinished tasks forward once a day has ended: when the app opens, comes back
 * to the front, and at bedtime while it stays open. Does nothing when the user would
 * rather be asked (the Today screen shows that card) or has switched it off.
 */
export function Autopilot() {
  const { ready, runRollover, settings } = usePlan();
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

  return null;
}
