import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthSession } from '../types';
import * as authApi from '../api/auth';
import { usePhilosopherStore } from './philosopherStore';
import { useGuideChatStore } from './guideChatStore';
import { useMeasureStore } from './measureStore';
import { useEngagementStore } from './engagementStore';
import { useReminderStore } from './reminderStore';
import { useShiftStore } from './shiftStore';

const STORAGE_KEY = 'selfinder_auth_session';
// Tokens last 30 days (backend/controllers/authController.js). The app
// asks for a fresh one when it opens and its token is more than a day old,
// so anyone who opens it at least once a month stays signed in.
const REFRESH_AFTER_MS = 24 * 60 * 60 * 1000;

interface AuthStore {
  session: AuthSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  register: (username: string, password: string, privacyPolicyAccepted: boolean, email?: string) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshIfStale: () => Promise<void>;
  expire: (token: string) => Promise<void>;
}

async function persist(session: AuthSession | null) {
  try {
    if (session) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // SecureStore is unavailable (e.g. web has no implementation) — keep the
    // session in memory for this run even though it won't persist.
  }
}

let refreshing = false;

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  hydrated: false,

  hydrate: async () => {
    let raw: string | null = null;
    try {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore unavailable — boot as signed out.
    }
    let session: AuthSession | null = null;
    if (raw) {
      try { session = JSON.parse(raw); } catch { session = null; }
    }
    set({ session, hydrated: true });
  },

  register: async (username, password, privacyPolicyAccepted, email) => {
    const session = { ...(await authApi.register(username, password, privacyPolicyAccepted, email)), refreshedAt: Date.now() };
    await persist(session);
    set({ session });
  },

  login: async (username, password) => {
    const session = { ...(await authApi.login(username, password)), refreshedAt: Date.now() };
    await persist(session);
    set({ session });
    // Best-effort: repopulate local reading state from this account's
    // own server history, so a returning signed-in user sees their real
    // Depths instead of the pristine empty state logout's own privacy
    // fix now correctly leaves behind. Never blocks/fails login itself
    // — same silent-best-effort contract the existing getMe+
    // getMeasureHistory call sites already use (your-arc.tsx,
    // depths/index.tsx, AccountSection.tsx's LoggedInAccount).
    // register() deliberately does NOT call this — a brand-new account
    // has no history to fetch.
    // engagementStore's own totalMeasureCount/recentReadings are NOT
    // backfilled here — deliberately out of scope (Depths' empty-state
    // bug is driven by measureStore, not engagementStore). Revisit as a
    // separate follow-up if that staleness turns out to matter.
    await useMeasureStore.getState().repopulateFromServer(session.token);
  },

  refreshIfStale: async () => {
    const current = get().session;
    if (!current || refreshing) return;
    // A session saved before refreshing existed has no refreshedAt — it's
    // treated as stale, so it gets a 30-day token on the first open.
    if (current.refreshedAt && Date.now() - current.refreshedAt < REFRESH_AFTER_MS) return;
    refreshing = true;
    try {
      const fresh = { ...(await authApi.refresh(current.token)), refreshedAt: Date.now() };
      // Only if nothing changed meanwhile (a logout, another account).
      if (get().session?.token !== current.token) return;
      await persist(fresh);
      set({ session: fresh });
    } catch {
      // Offline or slow — try again next time. A 401 is handled by the
      // client, which calls expire().
    } finally {
      refreshing = false;
    }
  },

  // The sign-in ended on its own (expired, or the account is gone). Only
  // the sign-in is cleared: the philosopher, readings and settings stay on
  // the phone and the app stays where it is — unlike logout(), which is a
  // person choosing to leave and wipes everything for whoever uses the
  // phone next.
  expire: async (token) => {
    if (get().session?.token !== token) return;
    await persist(null);
    set({ session: null });
  },

  logout: async () => {
    await persist(null);
    set({ session: null });
    // Personal local data must not survive a logout — whoever uses the
    // app next (signed out, or signed in as a different account) must
    // not see the previous session's readings/conversations/philosopher
    // choice. Clearing philosopher/philosopherId means
    // the root layout's own redirect sends the app back to onboarding
    // right after this — intended, not a bug: it's the only way to
    // guarantee the old account's choice doesn't leak forward.
    usePhilosopherStore.getState().resetMet();
    useGuideChatStore.getState().resetAll();
    useMeasureStore.getState().resetInterview();
    await useMeasureStore.getState().resetSavedResults();
    await usePhilosopherStore.getState().resetSelection();
    await useEngagementStore.getState().resetAll();
    await useShiftStore.getState().resetAll();
    // Not personal reading content, but still wrong-owner state: the
    // previous account's chosen reminder time/schedule shouldn't carry
    // over to whoever signs in (or stays signed out) next. Cancels the
    // actual scheduled native notifications too (see
    // dailyReminder.ts's disableDailyReminder, called inside
    // clearReminder), not just the local preference.
    await useReminderStore.getState().clearReminder();
  },
}));
