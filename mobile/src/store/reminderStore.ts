import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Philosopher } from '../types';
import { enableDailyReminder, disableDailyReminder, topUpDailyReminder } from '../utils/dailyReminder';
import { track } from '../utils/analytics';

const STORAGE_KEY = 'selfinder_daily_reminder';

interface ReminderState {
  enabled: boolean;
  hour: number;
  minute: number;
}

interface ReminderStore extends ReminderState {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  // Returns false if notification permission was denied — the caller (the
  // You tab) is responsible for reflecting that back to the user, since
  // this store has no UI of its own.
  setReminder: (philosopher: Philosopher, hour: number, minute: number) => Promise<boolean>;
  clearReminder: () => Promise<void>;
  // Tops up the rolling window of scheduled one-off notifications (see
  // dailyReminder.ts) — called once per cold start from the root layout, a
  // no-op if the reminder is off. Replaces the old refreshTone, which
  // re-picked which fixed copy variant a single repeating notification
  // should show; there's no tone to refresh now that each notification is
  // its own random message.
  refreshWindow: (philosopher: Philosopher) => Promise<void>;
}

const DEFAULT_STATE: ReminderState = { enabled: false, hour: 18, minute: 0 };

function readState(raw: string | null): ReminderState {
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      hour: typeof parsed.hour === 'number' ? parsed.hour : DEFAULT_STATE.hour,
      minute: typeof parsed.minute === 'number' ? parsed.minute : DEFAULT_STATE.minute,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export const useReminderStore = create<ReminderStore>((set, get) => ({
  ...DEFAULT_STATE,
  hydrated: false,

  hydrate: async () => {
    let raw: string | null = null;
    try {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — boot as if unset.
    }
    set({ ...readState(raw), hydrated: true });
    // Deliberately doesn't re-request permission or re-schedule on boot —
    // iOS keeps a repeating local notification scheduled across app
    // restarts on its own; this just restores what the UI should show.
    // refreshWindow (called separately from the root layout) is what tops
    // the schedule back up.
  },

  setReminder: async (philosopher, hour, minute) => {
    const granted = await enableDailyReminder(philosopher, hour, minute);
    if (!granted) return false;
    const next: ReminderState = { enabled: true, hour, minute };
    set(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // SecureStore is unavailable — the reminder is still scheduled on-device.
    }
    track('daily_reminder_enabled', { hour, minute });
    return true;
  },

  clearReminder: async () => {
    await disableDailyReminder();
    const next: ReminderState = { ...DEFAULT_STATE };
    set(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // SecureStore is unavailable — the reminder is still cancelled on-device.
    }
  },

  refreshWindow: async (philosopher) => {
    const current = get();
    if (!current.enabled) return;
    await topUpDailyReminder(philosopher, current.hour, current.minute);
  },
}));
