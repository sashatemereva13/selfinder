import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Philosopher } from '../types';
import { enableDailyReminder, disableDailyReminder } from '../utils/dailyReminder';
import { ReminderTone } from '../content/dailyReminderCopy';
import { track } from '../utils/analytics';

const STORAGE_KEY = 'selfinder_daily_reminder';

interface ReminderState {
  enabled: boolean;
  hour: number;
  minute: number;
  // Which copy variant is currently scheduled, so refreshTone can skip
  // re-scheduling (cancel + re-create the OS notification) when nothing
  // has actually changed since the last app open.
  lastScheduledTone: ReminderTone | null;
}

interface ReminderStore extends ReminderState {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  // Returns false if notification permission was denied — the caller (the
  // You tab) is responsible for reflecting that back to the user, since
  // this store has no UI of its own.
  setReminder: (philosopher: Philosopher, hour: number, minute: number, tone?: ReminderTone) => Promise<boolean>;
  clearReminder: () => Promise<void>;
  // Re-schedules with fresh copy only if the person's segment has actually
  // moved to a different tone since the last time this ran — called once
  // per cold start from the root layout, a no-op if the reminder is off.
  refreshTone: (philosopher: Philosopher, tone: ReminderTone) => Promise<void>;
}

const DEFAULT_STATE: ReminderState = { enabled: false, hour: 18, minute: 0, lastScheduledTone: null };

function readState(raw: string | null): ReminderState {
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw);
    return {
      enabled: !!parsed.enabled,
      hour: typeof parsed.hour === 'number' ? parsed.hour : DEFAULT_STATE.hour,
      minute: typeof parsed.minute === 'number' ? parsed.minute : DEFAULT_STATE.minute,
      lastScheduledTone: parsed.lastScheduledTone ?? null,
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
  },

  setReminder: async (philosopher, hour, minute, tone = 'routine') => {
    const granted = await enableDailyReminder(philosopher, hour, minute, tone);
    if (!granted) return false;
    const next: ReminderState = { enabled: true, hour, minute, lastScheduledTone: tone };
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

  refreshTone: async (philosopher, tone) => {
    const current = get();
    if (!current.enabled || current.lastScheduledTone === tone) return;
    const granted = await enableDailyReminder(philosopher, current.hour, current.minute, tone);
    if (!granted) return;
    const next: ReminderState = { ...current, lastScheduledTone: tone };
    set(next);
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // SecureStore is unavailable — the reminder is still rescheduled on-device.
    }
  },
}));
