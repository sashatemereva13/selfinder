import * as Notifications from 'expo-notifications';
import { Philosopher } from '../types';
import feelingLuckyListEn from '../content/feelingLuckyList.json';
import feelingLuckyListRu from '../content/feelingLuckyList.ru.json';
import { useLocaleStore } from '../store/localeStore';

// Reminder notifications now draw from the same content as Feeling Lucky
// ("A message for right now") rather than a fixed, philosopher-voiced
// check-in prompt ("where are you, really?"). A repeating prompt to look
// inward reads as invasive over time in a way a message simply arriving
// doesn't — the whole point of Feeling Lucky is that it isn't asking
// anything of you. See dailyReminderCopy.ts's removal for the prior
// tone-based approach this replaces.
//
// expo-notifications' DAILY trigger repeats one fixed body forever, so it
// can't rotate messages on its own. Instead this schedules a rolling
// window of REMINDER_WINDOW_DAYS one-off notifications, each its own
// random message, one per day at the chosen time — and topUpReminders (see
// below) refills that window every time the app opens, since there's no
// background task here to do it while the app is closed. Worst case (the
// app isn't opened for longer than the window), the reminder silently
// stops until the next open — quietly missing days beats ever repeating a
// stale or wrong message.
const REMINDER_WINDOW_DAYS = 14;
const IDENTIFIER_PREFIX = 'selfinder-daily-reminder-';

// Not a component, so the locale comes from the Zustand store's own
// getState() rather than the useLocaleStore() hook — same pattern
// feeling-lucky/index.tsx's pickMessage uses, just read outside React.
function pickRandomMessage(): string {
  const locale = useLocaleStore.getState().locale;
  const list = locale === 'ru' ? feelingLuckyListRu : feelingLuckyListEn;
  const entry = list[Math.floor(Math.random() * list.length)];
  return entry.message;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function cancelAllReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(IDENTIFIER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {})),
  );
}

// Schedules one notification per day for the next REMINDER_WINDOW_DAYS
// days at hour:minute, each a fresh random message — replacing whatever
// was scheduled before (a time change shouldn't leave old-time
// notifications stacked alongside new-time ones).
export async function enableDailyReminder(
  philosopher: Philosopher,
  hour: number,
  minute: number,
): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return false;

  await cancelAllReminders();
  await scheduleWindow(philosopher, hour, minute);
  return true;
}

// Tops up the rolling window — called once per cold start (see
// reminderStore.refreshWindow) so the schedule never runs dry between app
// opens. Only fills in days that don't already have a notification
// scheduled (today's or tomorrow's may already be pending from a previous
// open), and only reaches out to fill the window back up to
// REMINDER_WINDOW_DAYS days ahead.
export async function topUpDailyReminder(philosopher: Philosopher, hour: number, minute: number): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const existingKeys = new Set(
    scheduled
      .filter((n) => n.identifier.startsWith(IDENTIFIER_PREFIX))
      .map((n) => n.identifier.slice(IDENTIFIER_PREFIX.length)),
  );
  await scheduleWindow(philosopher, hour, minute, existingKeys);
}

async function scheduleWindow(
  philosopher: Philosopher,
  hour: number,
  minute: number,
  skipKeys: Set<string> = new Set(),
): Promise<void> {
  const now = new Date();
  for (let i = 0; i < REMINDER_WINDOW_DAYS; i++) {
    const day = new Date(now);
    day.setDate(day.getDate() + i);
    day.setHours(hour, minute, 0, 0);
    // If today's slot has already passed, push day 0 to tomorrow instead —
    // otherwise the first scheduled notification would fire immediately.
    if (i === 0 && day.getTime() <= now.getTime()) continue;

    const key = dateKey(day);
    if (skipKeys.has(key)) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${IDENTIFIER_PREFIX}${key}`,
      content: {
        title: philosopher.name,
        body: pickRandomMessage(),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: day,
      },
    });
  }
}

export async function disableDailyReminder(): Promise<void> {
  await cancelAllReminders();
}
