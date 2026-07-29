import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { MeasureResult, ChatMessage, QAPair } from '../types';
import { usePhilosopherStore } from './philosopherStore';

const KEY_CURRENT  = 'selfinder_measure_current';
const KEY_PREVIOUS = 'selfinder_measure_previous';
const KEY_LOG      = 'selfinder_reading_log';
// Compact, append-only ledger of every reading ever taken on this install —
// the raw material Your Arc draws from. Full MeasureResults only keep
// current+previous (they're heavy); this log keeps just what a trend needs,
// from the very first reading, so the arc has history the day the feature
// ships. Signed-in users also get server history (/measure/history), but
// most of the free tier won't be signed in.
const LOG_CAP = 300;

export interface ReadingLogEntry {
  ts: number;
  score: number;
  levelSlug: string;
  philosopherId?: string;
}

interface MeasureStore {
  currentResult:  MeasureResult | null;
  previousResult: MeasureResult | null;
  readingLog:     ReadingLogEntry[];
  // Active interview session
  messages:    ChatMessage[];
  qaPairs:     QAPair[];
  sphereIndex: number;
  hydrated:    boolean;
  // In-memory only, never persisted — true for the one Depths mount right
  // after a reading finishes, so Depths can play its arrival animation
  // instead of appearing already-settled. consumeJustCompleted reads and
  // clears it in one call so a later re-render of Depths (tab switch, app
  // reopen) never replays it.
  justCompleted: boolean;

  hydrate: () => Promise<void>;
  saveResult: (result: MeasureResult) => Promise<void>;
  addMessage: (msg: ChatMessage) => void;
  addQAPair:  (pair: QAPair) => void;
  advanceSphere: () => void;
  goToPreviousSphere: () => void;
  resetInterview: () => void;
  resetSavedResults: () => Promise<void>;
  consumeJustCompleted: () => boolean;
}

function readJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

export const useMeasureStore = create<MeasureStore>((set, get) => ({
  currentResult:  null,
  previousResult: null,
  readingLog:     [],
  messages:    [],
  qaPairs:     [],
  sphereIndex: 0,
  hydrated:    false,
  justCompleted: false,

  hydrate: async () => {
    let cur: string | null = null;
    let prev: string | null = null;
    let log: string | null = null;
    try {
      [cur, prev, log] = await Promise.all([
        SecureStore.getItemAsync(KEY_CURRENT),
        SecureStore.getItemAsync(KEY_PREVIOUS),
        SecureStore.getItemAsync(KEY_LOG),
      ]);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — boot as if unset.
    }
    set({
      currentResult:  readJSON<MeasureResult>(cur),
      previousResult: readJSON<MeasureResult>(prev),
      readingLog:     readJSON<ReadingLogEntry[]>(log) ?? [],
      hydrated: true,
    });
  },

  saveResult: async (result) => {
    const prev = get().currentResult;
    const entry: ReadingLogEntry = {
      ts: Date.now(),
      score: result.vibrationScore,
      levelSlug: result.vibrationLevel.slug,
      philosopherId: usePhilosopherStore.getState().philosopher?.id,
    };
    const log = [...get().readingLog, entry].slice(-LOG_CAP);
    try {
      if (prev) {
        await SecureStore.setItemAsync(KEY_PREVIOUS, JSON.stringify(prev));
      }
      await Promise.all([
        SecureStore.setItemAsync(KEY_CURRENT, JSON.stringify(result)),
        SecureStore.setItemAsync(KEY_LOG, JSON.stringify(log)),
      ]);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — keep the
      // result in memory for this session even though it won't persist.
    }
    set({
      currentResult: result,
      previousResult: prev ?? get().previousResult,
      readingLog: log,
      justCompleted: true,
    });
  },

  addMessage:   (msg)  => set((s) => ({ messages:  [...s.messages,  msg]  })),
  addQAPair:    (pair) => set((s) => ({ qaPairs:   [...s.qaPairs,   pair] })),
  advanceSphere:  () => set((s) => ({ sphereIndex: s.sphereIndex + 1 })),
  // Drops the most recently answered sphere's pair and steps the index back,
  // so `measureQuestions[sphereIndex]` naturally re-surfaces as the current
  // question again — a no-op if there's nothing before the current sphere.
  goToPreviousSphere: () => set((s) => {
    if (s.sphereIndex === 0 || s.qaPairs.length === 0) return {};
    return { qaPairs: s.qaPairs.slice(0, -1), sphereIndex: s.sphereIndex - 1 };
  }),
  resetInterview: () => set({ messages: [], qaPairs: [], sphereIndex: 0 }),

  // Dev/testing only — see the "Reset onboarding state" button in the You
  // tab. Without this, Depths keeps showing the last real reading even
  // after Guide's met-status and conversations are cleared.
  resetSavedResults: async () => {
    set({ currentResult: null, previousResult: null, readingLog: [] });
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(KEY_CURRENT),
        SecureStore.deleteItemAsync(KEY_PREVIOUS),
        SecureStore.deleteItemAsync(KEY_LOG),
      ]);
    } catch {
      // SecureStore is unavailable — in-memory reset above already applied.
    }
  },

  consumeJustCompleted: () => {
    const value = get().justCompleted;
    if (value) set({ justCompleted: false });
    return value;
  },
}));
