import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planMorningNotifications } from './morning';
import { planNotifications } from './plan';
import type { PlanData } from '../data/types';

export const CATEGORY = 'reminder';
export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';
export const PLAN_CATEGORY = 'plan';
export const ACTION_APPROVE = 'approve';
const CHANNEL = 'reminders';
// iOS keeps at most 64 pending local notifications.
const MAX_PENDING = 60;

export function setupNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  return Promise.all([
    Notifications.setNotificationCategoryAsync(CATEGORY, [
      { identifier: ACTION_DONE, buttonTitle: 'Done', options: { opensAppToForeground: false } },
      {
        identifier: ACTION_SNOOZE,
        buttonTitle: 'Snooze 10 min',
        options: { opensAppToForeground: false },
      },
    ]),
    Notifications.setNotificationCategoryAsync(PLAN_CATEGORY, [
      {
        identifier: ACTION_APPROVE,
        buttonTitle: 'Looks good',
        options: { opensAppToForeground: false },
      },
    ]),
    Platform.OS === 'android'
      ? Notifications.setNotificationChannelAsync(CHANNEL, {
          name: 'Reminders',
          importance: 4 /* high */,
        })
      : Promise.resolve(null),
  ]);
}

export async function ensurePermission(): Promise<boolean> {
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

/** Replace everything pending with what the plan needs now. */
export async function syncNotifications(plan: PlanData, now = new Date()): Promise<number> {
  if (!(await ensurePermission())) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const mornings = planMorningNotifications(plan, now);
  const items = planNotifications(plan, now).slice(0, MAX_PENDING - mornings.length);
  for (const m of mornings) {
    await Notifications.scheduleNotificationAsync({
      identifier: m.key,
      content: {
        title: m.title,
        body: m.body,
        categoryIdentifier: PLAN_CATEGORY,
        data: { planDate: m.date },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: m.at,
        channelId: CHANNEL,
      },
    });
  }
  for (const n of items) {
    await Notifications.scheduleNotificationAsync({
      identifier: n.key,
      content: {
        title: n.title,
        body: n.body,
        categoryIdentifier: CATEGORY,
        data: { reminderId: n.reminderId, day: n.day },
        ...(n.leave ? { interruptionLevel: 'timeSensitive' as const } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: n.at,
        channelId: CHANNEL,
      },
    });
  }
  return items.length + mornings.length;
}
