import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import type { ShiftDoor } from '../content/shiftContent';

// Finished Shift sessions, kept on the phone only (docs/shift-concept.md,
// §6): which door, where the person started (the reading's level) and
// where they placed themselves after — their own placement, never
// computed — plus anything they chose to write. Your Arc will read this
// for the before/after (build step 4). A record, never a score.

const STORAGE_KEY = 'selfinder_shift_sessions';
// SecureStore isn't meant for large values; the latest sessions are
// enough until Your Arc keeps them properly.
const CAP = 30;

export interface ShiftSession {
  at: string;
  door: ShiftDoor;
  readingAt: string;
  fromSlug: string;
  toSlug: string;
  words: Partial<Record<'gratitude' | 'act' | 'where', string>>;
}

interface ShiftStore {
  sessions: ShiftSession[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addSession: (session: ShiftSession) => Promise<void>;
  resetAll: () => Promise<void>;
}

export const useShiftStore = create<ShiftStore>((set, get) => ({
  sessions: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    let sessions: ShiftSession[] = [];
    try {
      const raw = await SecureStore.getItemAsync(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) sessions = parsed;
    } catch {
      // Unavailable (web) or unreadable — start empty.
    }
    set({ sessions, hydrated: true });
  },

  addSession: async (session) => {
    const sessions = [...get().sessions, session].slice(-CAP);
    set({ sessions });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // Unavailable (e.g. web) — kept for this session only.
    }
  },

  resetAll: async () => {
    set({ sessions: [] });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
    } catch {
      // Nothing to delete.
    }
  },
}));
