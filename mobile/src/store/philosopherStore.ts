import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Philosopher } from '../types';
import { PHILOSOPHER_MAP } from '../content/philosophers';

const STORAGE_KEY = 'selfinder_philosopher_id';
const MET_STORAGE_KEY = 'selfinder_met_philosophers';

interface PhilosopherStore {
  philosopher: Philosopher | null;
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
      philosopher: id && PHILOSOPHER_MAP[id] ? PHILOSOPHER_MAP[id] : null,
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
    set({ philosopher: PHILOSOPHER_MAP[id] ?? null });
  },

  // Tracks which philosophers have ever produced a real first-meeting moment
  // in Guide, distinct from "conversation is currently empty" (which also
  // happens after Clear) — see app/(tabs)/guide/index.tsx.
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

  // Dev/testing only — see the "Reset onboarding state" button in the You
  // tab, guarded by __DEV__. Lets first-meeting content be retested without
  // reinstalling the app.
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
    set({ philosopher: null });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore is unavailable — in-memory reset above already applied.
    }
  },
}));
