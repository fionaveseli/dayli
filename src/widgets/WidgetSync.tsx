import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePlan } from '../store';
import { publishWidgets, widgetsAvailable } from './bridge';
import { widgetPayload } from './payload';

/** Keeps the home screen widgets in step with the plan. Does nothing where widgets aren't built in. */
export function WidgetSync() {
  const { ready, fixed, tasks, reminders, settings, autopilot } = usePlan();
  useEffect(() => {
    if (!ready || !widgetsAvailable) return;
    const run = () =>
      publishWidgets(
        widgetPayload({ fixed, tasks, reminders, settings, autopilot }, new Date()),
      ).catch(() => {});
    run();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => sub.remove();
  }, [ready, fixed, tasks, reminders, settings, autopilot]);
  return null;
}
