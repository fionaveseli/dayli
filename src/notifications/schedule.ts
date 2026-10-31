import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { planNotifications } from './plan';
import type { PlanData } from '../data/types';

export const CATEGORY = 'reminder';
export const ACTION_DONE = 'done';
export const ACTION_SNOOZE = 'snooze';
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
  const items = planNotifications(plan, now).slice(0, MAX_PENDING);
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
  return items.length;
}
