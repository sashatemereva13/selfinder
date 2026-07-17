import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { MeasureResult, ChatMessage, QAPair } from '../types';

const KEY_CURRENT  = 'selfinder_measure_current';
const KEY_PREVIOUS = 'selfinder_measure_previous';

interface MeasureStore {
  currentResult:  MeasureResult | null;
  previousResult: MeasureResult | null;
  // Active interview session
  messages:    ChatMessage[];
  qaPairs:     QAPair[];
  sphereIndex: number;
  hydrated:    boolean;

  hydrate: () => Promise<void>;
  saveResult: (result: MeasureResult) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
  addQAPair:  (pair: QAPair) => void;
  advanceSphere: () => void;
  resetInterview: () => void;
}

function readJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export const useMeasureStore = create<MeasureStore>((set, get) => ({
  currentResult:  null,
  previousResult: null,
  messages:    [],
  qaPairs:     [],
  sphereIndex: 0,
  hydrated:    false,

  hydrate: async () => {
    let cur: string | null = null;
    let prev: string | null = null;
    try {
      [cur, prev] = await Promise.all([
        SecureStore.getItemAsync(KEY_CURRENT),
        SecureStore.getItemAsync(KEY_PREVIOUS),
      ]);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — boot as if unset.
    }
    set({
      currentResult:  readJSON<MeasureResult>(cur),
      previousResult: readJSON<MeasureResult>(prev),
      hydrated: true,
    });
  },

  saveResult: async (result) => {
    const prev = get().currentResult;
    try {
      if (prev) {
        await SecureStore.setItemAsync(KEY_PREVIOUS, JSON.stringify(prev));
      }
      await SecureStore.setItemAsync(KEY_CURRENT, JSON.stringify(result));
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — keep the
      // result in memory for this session even though it won't persist.
    }
    set({ currentResult: result, previousResult: prev ?? get().previousResult });
  },

  addMessage:   (msg)  => set((s) => ({ messages:  [...s.messages,  msg]  })),
  addQAPair:    (pair) => set((s) => ({ qaPairs:   [...s.qaPairs,   pair] })),
  advanceSphere:  () => set((s) => ({ sphereIndex: s.sphereIndex + 1 })),
  resetInterview: () => set({ messages: [], qaPairs: [], sphereIndex: 0 }),
}));
