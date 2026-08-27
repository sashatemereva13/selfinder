import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Philosopher } from '../types';
import { PHILOSOPHER_MAP, getLocalizedPhilosopher } from '../content/philosophers';
import { useLocaleStore } from './localeStore';

const STORAGE_KEY = 'selfinder_philosopher_id';
const MET_STORAGE_KEY = 'selfinder_met_philosophers';

// Resolves a stored id to the localized Philosopher object for whatever
// locale is active right now — read directly from useLocaleStore's own
// state rather than threading locale through every call site here, same
// pattern src/api/chat.ts already uses for the same reason.
function resolvePhilosopher(id: string | null): Philosopher | null {
  if (!id || !PHILOSOPHER_MAP[id]) return null;
  return getLocalizedPhilosopher(PHILOSOPHER_MAP[id], useLocaleStore.getState().locale);
}

interface PhilosopherStore {
  philosopher: Philosopher | null;
  // The selected id on its own, separate from the resolved `philosopher`
  // object above — kept so a locale change after selection can re-resolve
  // the same philosopher into its Russian voice without needing another
  // SecureStore round-trip (see localeStore.subscribe below).
  philosopherId: string | null;
  metPhilosopherIds: string[];
  hydrated: boolean;
  select: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
  markMet: (id: string) => Promise<void>;
  resetMet: () => Promise<void>;
  resetSelection: () => Promise<void>;
}

function readMetIds(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const usePhilosopherStore = create<PhilosopherStore>((set, get) => ({
  philosopher: null,
  philosopherId: null,
  metPhilosopherIds: [],
  hydrated: false,

  hydrate: async () => {
    let id: string | null = null;
    let metRaw: string | null = null;
    try {
      [id, metRaw] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEY),
        SecureStore.getItemAsync(MET_STORAGE_KEY),
      ]);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — boot as if unset.
    }
    set({
      philosopher: resolvePhilosopher(id),
      philosopherId: id,
      metPhilosopherIds: readMetIds(metRaw),
      hydrated: true,
    });
  },

  select: async (id: string) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, id);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — keep the
      // selection in memory for this session even though it won't persist.
    }
    set({ philosopher: resolvePhilosopher(id), philosopherId: id });
  },

  // Tracks which philosophers have ever produced a real first-meeting moment
  // in Guide, distinct from "conversation is currently empty" (which also
  // happens after Clear) — see app/guide.tsx.
  markMet: async (id: string) => {
    if (get().metPhilosopherIds.includes(id)) return;
    const next = [...get().metPhilosopherIds, id];
    set({ metPhilosopherIds: next });
    try {
      await SecureStore.setItemAsync(MET_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // SecureStore is unavailable — keep it in memory for this session only.
    }
  },

  // Used on sign-out/account-switch (see authStore.ts) so a new account
  // sees each philosopher's real first-meeting content, not the previous
  // account's met-status.
  resetMet: async () => {
    set({ metPhilosopherIds: [] });
    try {
      await SecureStore.deleteItemAsync(MET_STORAGE_KEY);
    } catch {
      // SecureStore is unavailable — in-memory reset above already applied.
    }
  },

  // Dev/testing only — clears the selection itself (not just met-status), so
  // the root layout's redirect (app/_layout.tsx) sends you back to the real
  // onboarding intro, as if the app had just been installed.
  resetSelection: async () => {
    set({ philosopher: null, philosopherId: null });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore is unavailable — in-memory reset above already applied.
    }
  },
}));

// Re-resolves the already-selected philosopher whenever the app's locale
// changes (e.g. someone switches language in settings after already
// picking a philosopher) — without this, switching to Russian mid-session
// would leave every already-mounted screen still showing the English
// voice fields until the app restarted, since `select`/`hydrate` are the
// only other places resolvePhilosopher() runs.
useLocaleStore.subscribe((state, prevState) => {
  if (state.locale === prevState.locale) return;
  const { philosopherId } = usePhilosopherStore.getState();
  if (philosopherId) {
    usePhilosopherStore.setState({ philosopher: resolvePhilosopher(philosopherId) });
  }
});
