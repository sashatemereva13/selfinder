import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'selfinder_engagement_profile';
// A rough, always-available signal for tone/copy decisions — distinct from
// the deeper backend-driven "Your Arc" analysis, which needs an account and
// full history. This is local, cheap, and works for anonymous users too.
const RECENT_READINGS_CAP = 5;
// Hawkins' own model draws the line at 200 — states below are generally the
// "heavier" ones (fear, anger, shame...), 200+ the more constructive ones
// (courage and above). Used to soften reminder tone, not to label anyone.
const HEAVY_REGISTER_THRESHOLD = 200;
const SESSION_GAP_MS = 20 * 60 * 1000; // 20 minutes — a real new sitting-down, not a background blip

export type DiscoverableFeature = 'levels' | 'tuneIn' | 'spill';

interface RecentReading {
  score: number;
  levelName: string;
  savedAt: string;
}

interface EngagementState {
  totalMeasureCount: number;
  firstMeasureAt: string | null;
  lastMeasureAt: string | null;
  recentReadings: RecentReading[];
  discovered: Record<DiscoverableFeature, boolean>;
  hasShownSecondVisit: boolean;
}

interface EngagementStore extends EngagementState {
  hydrated: boolean;
  // Set once per cold start, in the same render pass hydrate() resolves —
  // true if the previous lastSeenAt was long enough ago to count as a fresh
  // visit rather than a resumed session. Consumers should read this once and
  // snapshot it (see Guide's secondVisitSnapshotRef) rather than re-deriving
  // it, since lastSeenAt itself gets touched immediately after.
  isNewVisitSinceLastOpen: boolean;
  hydrate: () => Promise<void>;
  recordMeasure: (score: number, levelName: string, savedAt: string) => Promise<void>;
  markDiscovered: (feature: DiscoverableFeature) => Promise<void>;
  markSecondVisitShown: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const DEFAULT_STATE: EngagementState = {
  totalMeasureCount: 0,
  firstMeasureAt: null,
  lastMeasureAt: null,
  recentReadings: [],
  discovered: { levels: false, tuneIn: false, spill: false },
  hasShownSecondVisit: false,
};

function readState(raw: string | null): EngagementState {
  if (!raw) return DEFAULT_STATE;
  try {
    const parsed = JSON.parse(raw);
    return {
      totalMeasureCount: typeof parsed.totalMeasureCount === 'number' ? parsed.totalMeasureCount : 0,
      firstMeasureAt: parsed.firstMeasureAt ?? null,
      lastMeasureAt: parsed.lastMeasureAt ?? null,
      recentReadings: Array.isArray(parsed.recentReadings) ? parsed.recentReadings : [],
      discovered: {
        levels: !!parsed.discovered?.levels,
        tuneIn: !!parsed.discovered?.tuneIn,
        spill: !!parsed.discovered?.spill,
      },
      hasShownSecondVisit: !!parsed.hasShownSecondVisit,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

async function persist(state: EngagementState) {
  try {
    await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // SecureStore is unavailable (e.g. web) — state still holds for this session.
  }
}

export const useEngagementStore = create<EngagementStore>((set, get) => ({
  ...DEFAULT_STATE,
  hydrated: false,
  isNewVisitSinceLastOpen: false,

  hydrate: async () => {
    let raw: string | null = null;
    let lastSeenRaw: string | null = null;
    try {
      [raw, lastSeenRaw] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEY),
        SecureStore.getItemAsync(`${STORAGE_KEY}_last_seen`),
      ]);
    } catch {
      // SecureStore is unavailable — boot as if unset.
    }

    const previousSeenAt = lastSeenRaw ? new Date(lastSeenRaw).getTime() : null;
    const isNewVisit = previousSeenAt === null || Date.now() - previousSeenAt > SESSION_GAP_MS;

    set({ ...readState(raw), hydrated: true, isNewVisitSinceLastOpen: isNewVisit });

    try {
      await SecureStore.setItemAsync(`${STORAGE_KEY}_last_seen`, new Date().toISOString());
    } catch {
      // SecureStore is unavailable — nothing to persist.
    }
  },

  recordMeasure: async (score, levelName, savedAt) => {
    const current = get();
    const nextReadings = [...current.recentReadings, { score, levelName, savedAt }].slice(
      -RECENT_READINGS_CAP
    );
    const next: EngagementState = {
      ...current,
      totalMeasureCount: current.totalMeasureCount + 1,
      firstMeasureAt: current.firstMeasureAt ?? savedAt,
      lastMeasureAt: savedAt,
      recentReadings: nextReadings,
    };
    set(next);
    await persist(next);
  },

  markDiscovered: async (feature) => {
    const current = get();
    if (current.discovered[feature]) return;
    const next: EngagementState = {
      ...current,
      discovered: { ...current.discovered, [feature]: true },
    };
    set(next);
    await persist(next);
  },

  markSecondVisitShown: async () => {
    const current = get();
    if (current.hasShownSecondVisit) return;
    const next: EngagementState = { ...current, hasShownSecondVisit: true };
    set(next);
    await persist(next);
  },

  resetAll: async () => {
    set({ ...DEFAULT_STATE, hydrated: true, isNewVisitSinceLastOpen: false });
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      await SecureStore.deleteItemAsync(`${STORAGE_KEY}_last_seen`);
    } catch {
      // SecureStore is unavailable — in-memory reset above already applied.
    }
  },
}));

// --- Derived segment helpers — pure functions, no store dependency, so
// they're easy to reuse from reminder scheduling (which runs outside React). ---

export function getRecencySegment(
  lastMeasureAt: string | null
): 'new' | 'active' | 'lapsing' | 'dormant' {
  if (!lastMeasureAt) return 'new';
  const days = (Date.now() - new Date(lastMeasureAt).getTime()) / 86_400_000;
  if (days <= 7) return 'active';
  if (days <= 21) return 'lapsing';
  return 'dormant';
}

export function getVibrationalRegister(recentReadings: RecentReading[]): 'heavy' | 'light' | null {
  if (recentReadings.length === 0) return null;
  const avg = recentReadings.reduce((sum, r) => sum + r.score, 0) / recentReadings.length;
  return avg < HEAVY_REGISTER_THRESHOLD ? 'heavy' : 'light';
}

// Combines recency and register into the single tone reminder copy branches
// on — dormant always wins (longest-elapsed case), otherwise either a
// lapsing pattern or a heavy recent register calls for the gentler line.
export function getReminderTone(state: {
  lastMeasureAt: string | null;
  recentReadings: RecentReading[];
}): 'routine' | 'gentle' | 'dormant' {
  const recency = getRecencySegment(state.lastMeasureAt);
  if (recency === 'dormant') return 'dormant';
  const register = getVibrationalRegister(state.recentReadings);
  if (recency === 'lapsing' || register === 'heavy') return 'gentle';
  return 'routine';
}
