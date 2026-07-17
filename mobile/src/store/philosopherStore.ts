import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Philosopher } from '../types';
import { PHILOSOPHER_MAP } from '../content/philosophers';

const STORAGE_KEY = 'selfinder_philosopher_id';

interface PhilosopherStore {
  philosopher: Philosopher | null;
  hydrated: boolean;
  select: (id: string) => Promise<void>;
  hydrate: () => Promise<void>;
}

export const usePhilosopherStore = create<PhilosopherStore>((set) => ({
  philosopher: null,
  hydrated: false,

  hydrate: async () => {
    let id: string | null = null;
    try {
      id = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — boot as if unset.
    }
    set({
      philosopher: id && PHILOSOPHER_MAP[id] ? PHILOSOPHER_MAP[id] : null,
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
}));
