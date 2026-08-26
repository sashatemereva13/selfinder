import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { MeasureResult, ChatMessage, QAPair, SavedMeasureResult } from '../types';
import { usePhilosopherStore } from './philosopherStore';
import { getMe, getMeasureHistory } from '../api/user';

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
  repopulateFromServer: (token: string) => Promise<void>;
}

function readJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

// Maps a server-persisted reading into the client MeasureResult shape
// Depths renders. Returns null (reject, don't fabricate) if the saved
// record is missing any field Depths cannot safely render without —
// lines/dominantAxis/band/scores/rawVibrationScore can all be null on
// SavedMeasureResult (legacy/corrupt records) but Depths' own render
// code assumes they're always present, since until now the only source
// of a MeasureResult was a freshly-completed live Measure interview.
// Never default/fabricate these.
function toMeasureResult(saved: SavedMeasureResult): MeasureResult | null {
  if (
    saved.lines == null ||
    saved.dominantAxis == null ||
    saved.band == null ||
    saved.scores == null ||
    saved.rawVibrationScore == null
  ) {
    return null;
  }
  return {
    scores: saved.scores,
    rawVibrationScore: saved.rawVibrationScore,
    vibrationScore: saved.vibrationScore,
    vibrationLevel: saved.vibrationLevel,
    dominantAxis: saved.dominantAxis,
    band: saved.band,
    microPractice: saved.microPractice ?? undefined,
    affirmation: saved.affirmation ?? undefined,
    combinationMessage: saved.combinationMessage,
    lines: saved.lines,
    savedAt: saved.savedAt,
    qaPairs: saved.qaPairs,
    measureResultId: saved.id,
  };
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

  // Used on sign-out/account-switch (see authStore.ts) — without this,
  // Depths keeps showing the last real reading even after Guide's
  // met-status and conversations are cleared.
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

  // Called once, right after a successful login (see authStore.ts) — a
  // returning signed-in user's local device was likely just wiped by
  // logout's own privacy fix (or is simply new), so without this Depths
  // would show the pristine empty state even though their real history
  // is safe on the server. Best-effort and silent on any failure — same
  // contract the existing getMe+getMeasureHistory call sites already use
  // (your-arc.tsx, depths/index.tsx) — login itself must never fail
  // because this did.
  repopulateFromServer: async (token) => {
    try {
      const profile = await getMe(token);
      if (!profile.consent?.psychologicalData?.given) return;
      const saved = await getMeasureHistory(token);
      if (saved.length === 0) return; // genuinely empty account

      // Order isn't guaranteed by the API — sort explicitly, newest
      // first, by the same field your-arc.tsx already trusts (never
      // array position).
      const sorted = [...saved].sort(
        (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      );
      const mapped = sorted.map(toMeasureResult).filter((r): r is MeasureResult => r !== null);
      if (mapped.length === 0) return; // every record missing required fields

      const [current, previous] = mapped; // previous undefined if only 1 valid record — fine

      const log: ReadingLogEntry[] = [...mapped]
        .reverse() // readingLog convention: chronological, oldest first
        .map((r) => ({
          ts: new Date(r.savedAt).getTime(),
          score: r.vibrationScore,
          levelSlug: r.vibrationLevel.slug,
          // philosopherId intentionally omitted — SavedMeasureResult
          // carries no such field (only the unrelated
          // recommendedPhilosopher), and ReadingLogEntry.philosopherId
          // is optional, so this is an honest omission, not a
          // workaround.
        }))
        .slice(-LOG_CAP);

      try {
        if (previous) await SecureStore.setItemAsync(KEY_PREVIOUS, JSON.stringify(previous));
        else await SecureStore.deleteItemAsync(KEY_PREVIOUS);
        await Promise.all([
          SecureStore.setItemAsync(KEY_CURRENT, JSON.stringify(current)),
          SecureStore.setItemAsync(KEY_LOG, JSON.stringify(log)),
        ]);
      } catch {
        // SecureStore unavailable — in-memory set below still applies for this run.
      }

      set({ currentResult: current, previousResult: previous ?? null, readingLog: log });
      // Deliberately does NOT set justCompleted: true — that flag exists
      // to trigger Depths' arrival/reveal animation right after a LIVE
      // Measure finishes; a login-time repopulation isn't that moment
      // and should render already-settled.
    } catch {
      // Best-effort — network/API failure leaves local state as-is.
    }
  },
}));
