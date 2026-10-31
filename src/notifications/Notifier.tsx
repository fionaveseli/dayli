import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { usePlan } from '../store';
import { minutesOf } from './plan';
import {
  ACTION_APPROVE,
  ACTION_DONE,
  ACTION_SNOOZE,
  setupNotifications,
  syncNotifications,
} from './schedule';

/** Keeps device notifications in step with the plan and handles Done / Snooze taps. */
export function Notifier() {
  const store = usePlan();
  const {
    ready,
    reminders,
    settings,
    tasks,
    fixed,
    autopilot,
    snoozeReminder,
    markReminderDone,
    approvePlan,
  } = store;
  const actions = useRef({ snoozeReminder, markReminderDone, approvePlan });
  useEffect(() => {
    actions.current = { snoozeReminder, markReminderDone, approvePlan };
  }, [snoozeReminder, markReminderDone, approvePlan]);

  useEffect(() => {
    setupNotifications().catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const data = res.notification.request.content.data as
        { reminderId?: string; day?: number; planDate?: string } | undefined;
      if (data?.planDate) {
        if (res.actionIdentifier === ACTION_APPROVE) actions.current.approvePlan(new Date());
        return;
      }
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
    const run = () =>
      syncNotifications({ fixed, tasks, reminders, settings, autopilot }).catch(() => {});
    run();
    const sub = AppState.addEventListener('change', (s) => s === 'active' && run());
    return () => sub.remove();
  }, [ready, fixed, tasks, reminders, settings, autopilot]);

  return null;
}
