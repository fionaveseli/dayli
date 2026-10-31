import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePlan } from '../store';
import { minutesOf } from './plan';
import { ACTION_DONE, ACTION_SNOOZE, setupNotifications, syncNotifications } from './schedule';

/** Keeps device notifications in step with the plan and handles Done / Snooze taps. */
export function Notifier() {
  const store = usePlan();
  const { ready, reminders, settings, tasks, fixed, snoozeReminder, markReminderDone } = store;
  const actions = useRef({ snoozeReminder, markReminderDone });
  useEffect(() => {
    actions.current = { snoozeReminder, markReminderDone };
  }, [snoozeReminder, markReminderDone]);

  useEffect(() => {
    setupNotifications().catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as
        { reminderId?: string; day?: number } | undefined;
      if (!data?.reminderId || data.day === undefined) return;
      if (res.actionIdentifier === ACTION_DONE) {
        actions.current.markReminderDone(data.reminderId, data.day);
      } else if (res.actionIdentifier === ACTION_SNOOZE) {
        actions.current.snoozeReminder(data.reminderId, data.day, minutesOf(new Date()));
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const run = () => syncNotifications({ fixed, tasks, reminders, settings }).catch(() => {});
    run();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => sub.remove();
  }, [ready, fixed, tasks, reminders, settings]);

  return null;
}
