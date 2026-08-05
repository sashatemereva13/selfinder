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

export type DiscoverableFeature = 'levels' | 'tuneIn' | 'spill' | 'breathing';

interface RecentReading {
  score: number;
  levelName: string;
  savedAt: string;
}

// How many times someone has tapped "Talk about it" (continuing a past
// reading's conversation) before the not-subscribed Your Arc preview screen
// (app/your-arc-preview.tsx) starts showing a "Keep the
// conversation going" Selfinder+ nudge. Depths' own "Talk about it" row
// stays one plain, always-tappable action regardless of this count — the
// nudge lives on the screen someone visits to see what subscribing would
// add, not on the row that's just trying to open Guide. There's no real
// purchase flow in the app yet, so this is a soft, honest nudge, not an
// actual paywall/checkout gate — and never shown to a subscribed user, who
// has nothing left to be nudged toward.
export const TALK_ABOUT_IT_UPSELL_THRESHOLD = 3;

interface EngagementState {
  totalMeasureCount: number;
  firstMeasureAt: string | null;
  lastMeasureAt: string | null;
  recentReadings: RecentReading[];
  discovered: Record<DiscoverableFeature, boolean>;
  hasShownSecondVisit: boolean;
  talkAboutItCount: number;
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
  recordTalkAboutIt: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const DEFAULT_STATE: EngagementState = {
  totalMeasureCount: 0,
  firstMeasureAt: null,
  lastMeasureAt: null,
  recentReadings: [],
  discovered: { levels: false, tuneIn: false, spill: false, breathing: false },
  hasShownSecondVisit: false,
  talkAboutItCount: 0,
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
        breathing: !!parsed.discovered?.breathing,
      },
      hasShownSecondVisit: !!parsed.hasShownSecondVisit,
      talkAboutItCount: typeof parsed.talkAboutItCount === 'number' ? parsed.talkAboutItCount : 0,
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

  recordTalkAboutIt: async () => {
    const current = get();
    const next: EngagementState = { ...current, talkAboutItCount: current.talkAboutItCount + 1 };
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
// they're easy to reuse anywhere copy/behavior needs to vary by how active
// or how "heavy" someone's recent readings have been (discovery nudges,
// future tone decisions). No longer used by reminder scheduling — the
// daily reminder now sends Feeling Lucky-style messages rather than
// segment-varied copy (see dailyReminder.ts). ---

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
