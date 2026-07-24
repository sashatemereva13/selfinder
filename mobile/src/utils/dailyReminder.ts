import * as Notifications from 'expo-notifications';
import { Philosopher } from '../types';
import { getDailyReminderCopy, ReminderTone } from '../content/dailyReminderCopy';

// A single stable identifier — scheduling always cancels this exact
// notification first, so enabling twice (or changing the time) never
// stacks up duplicate reminders.
const REMINDER_IDENTIFIER = 'selfinder-daily-reminder';

export async function enableDailyReminder(
  philosopher: Philosopher,
  hour: number,
  minute: number,
  tone: ReminderTone = 'routine'
): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_IDENTIFIER,
    content: {
      title: philosopher.name,
      body: getDailyReminderCopy(philosopher.id, tone),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });

  return true;
}

export async function disableDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER).catch(() => {});
}
