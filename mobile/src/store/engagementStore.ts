import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getRelativeTimeBucket } from '../utils/relativeTime';

const STORAGE_KEY = 'selfinder_engagement_profile';
// A rough, always-available signal for tone/copy decisions — distinct from
// the deeper backend-driven "Your Arc" analysis, which needs an account and
// full history. This is local, cheap, and works for anonymous users too.
const RECENT_READINGS_CAP = 5;
// Hawkins' own model draws the line at 200 — states below are generally the
// "heavier" ones (fear, anger, shame...), 200+ the more constructive ones
// (courage and above). Used to soften reminder tone, not to label anyone.
// Exported so arcFacts.ts can reuse the exact same boundary for its own
// "is this state genuinely good to lead with" gate, rather than a second,
// independently-tuned threshold drifting from this one over time.
export const HEAVY_REGISTER_THRESHOLD = 200;
const SESSION_GAP_MS = 20 * 60 * 1000; // 20 minutes — a real new sitting-down, not a background blip

// 'message' — the message particle on Depths has been tapped at least
// once, so its caption no longer needs to introduce it (MessageParticle).
// 'sphereAnswer' — a sphere on Depths has been tapped to see what was said
// for it, so the hint inviting that can go. 'ring' — unused since the
// map's ring was removed (2026-10-09); kept so stored profiles still parse.
export type DiscoverableFeature = 'levels' | 'tuneIn' | 'spill' | 'breathing' | 'message' | 'sphereAnswer' | 'ring' | 'arcCone';

// Depths' own tool-row keys (see buildToolGroups in depths/index.tsx) that
// the "today's-walk" breadcrumb tracks — deliberately its own union, not a
// reuse of DiscoverableFeature (that type's casing, 'tuneIn', doesn't match
// depths/index.tsx's actual Tool.key literals, e.g. 'tunein'), and
// deliberately excludes 'measure': Measure must never visually recede, so
// its visits are never recorded at all — see markToolVisited.
export type BreadcrumbTool = 'spill' | 'levels' | 'tunein' | 'breathing';

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
  // Once-only, first-ever-Measure teaching moment on Depths (see
  // docs/depths-structure-concept.md) — the Understand zone briefly
  // "blooms" to point toward it, never again after the first time.
  hasShownFirstRunCarry: boolean;
  talkAboutItCount: number;
  // Per-tool "last opened" timestamp, ISO string — used only to derive a
  // same-calendar-day "visited today" read on Depths (see
  // getRelativeTimeBucket in relativeTime.ts, isToolVisitedToday below).
  // Not a "visited ever" flag (that's `discovered`, a different,
  // permanent-forever signal for a different purpose) and never itself
  // read as true/false — always re-derived against `new Date()` at render
  // time so it silently self-resets at local midnight with no reset code
  // required. Measure is deliberately never a key here — see
  // markToolVisited.
  toolLastVisitedAt: Partial<Record<BreadcrumbTool, string>>;
  // savedAt of the reading whose own level page was last opened — Depths'
  // philosopher seam (see content/depthsSeam.ts) points to "understand
  // your state" after a reading until this matches that reading, then
  // moves on to the next step.
  levelPageSeenFor: string | null;
  // savedAt of the reading a message was actually sent about in the
  // conversation — opening the conversation alone doesn't count (the step
  // used to sit on "talk" forever after it was opened).
  talkedFor: string | null;
  // savedAt of the reading the Shift offer was shown for — the offer is
  // asked once a day per reading, and leaving it unanswered is an answer
  // (docs/shift-concept.md, §3).
  offerSeenFor: string | null;
  // When a Journey was last offered at the end of a Shift session — the
  // offer appears at most once every JOURNEY_OFFER_GAP_DAYS.
  journeyOfferedAt: string | null;
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
  markFirstRunCarryShown: () => Promise<void>;
  recordTalkAboutIt: () => Promise<void>;
  markToolVisited: (tool: BreadcrumbTool) => Promise<void>;
  markLevelPageSeen: (readingSavedAt: string) => Promise<void>;
  markTalkedAbout: (readingSavedAt: string) => Promise<void>;
  markOfferSeen: (readingSavedAt: string) => Promise<void>;
  markJourneyOffered: () => Promise<void>;
  resetAll: () => Promise<void>;
}

const DEFAULT_STATE: EngagementState = {
  totalMeasureCount: 0,
  firstMeasureAt: null,
  lastMeasureAt: null,
  recentReadings: [],
  discovered: { levels: false, tuneIn: false, spill: false, breathing: false, message: false, sphereAnswer: false, ring: false, arcCone: false },
  hasShownSecondVisit: false,
  hasShownFirstRunCarry: false,
  talkAboutItCount: 0,
  toolLastVisitedAt: {},
  levelPageSeenFor: null,
  talkedFor: null,
  offerSeenFor: null,
  journeyOfferedAt: null,
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
        message: !!parsed.discovered?.message,
        sphereAnswer: !!parsed.discovered?.sphereAnswer,
        ring: !!parsed.discovered?.ring,
        arcCone: !!parsed.discovered?.arcCone,
      },
      hasShownSecondVisit: !!parsed.hasShownSecondVisit,
      hasShownFirstRunCarry: !!parsed.hasShownFirstRunCarry,
      talkAboutItCount: typeof parsed.talkAboutItCount === 'number' ? parsed.talkAboutItCount : 0,
      toolLastVisitedAt: {
        spill: typeof parsed.toolLastVisitedAt?.spill === 'string' ? parsed.toolLastVisitedAt.spill : undefined,
        levels: typeof parsed.toolLastVisitedAt?.levels === 'string' ? parsed.toolLastVisitedAt.levels : undefined,
        tunein: typeof parsed.toolLastVisitedAt?.tunein === 'string' ? parsed.toolLastVisitedAt.tunein : undefined,
        breathing:
          typeof parsed.toolLastVisitedAt?.breathing === 'string' ? parsed.toolLastVisitedAt.breathing : undefined,
      },
      levelPageSeenFor: typeof parsed.levelPageSeenFor === 'string' ? parsed.levelPageSeenFor : null,
      talkedFor: typeof parsed.talkedFor === 'string' ? parsed.talkedFor : null,
      offerSeenFor: typeof parsed.offerSeenFor === 'string' ? parsed.offerSeenFor : null,
      journeyOfferedAt: typeof parsed.journeyOfferedAt === 'string' ? parsed.journeyOfferedAt : null,
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

  markFirstRunCarryShown: async () => {
    const current = get();
    if (current.hasShownFirstRunCarry) return;
    const next: EngagementState = { ...current, hasShownFirstRunCarry: true };
    set(next);
    await persist(next);
  },

  recordTalkAboutIt: async () => {
    const current = get();
    const next: EngagementState = { ...current, talkAboutItCount: current.talkAboutItCount + 1 };
    set(next);
    await persist(next);
  },

  markToolVisited: async (tool) => {
    // Unlike markDiscovered there's no "already true, skip" early-return —
    // this value is a timestamp meant to be overwritten on every visit, not
    // a one-time flag.
    const current = get();
    const next: EngagementState = {
      ...current,
      toolLastVisitedAt: { ...current.toolLastVisitedAt, [tool]: new Date().toISOString() },
    };
    set(next);
    await persist(next);
  },

  markLevelPageSeen: async (readingSavedAt) => {
    const current = get();
    if (current.levelPageSeenFor === readingSavedAt) return;
    const next: EngagementState = { ...current, levelPageSeenFor: readingSavedAt };
    set(next);
    await persist(next);
  },

  markTalkedAbout: async (readingSavedAt) => {
    const current = get();
    if (current.talkedFor === readingSavedAt) return;
    const next: EngagementState = { ...current, talkedFor: readingSavedAt };
    set(next);
    await persist(next);
  },

  markOfferSeen: async (readingSavedAt) => {
    const current = get();
    if (current.offerSeenFor === readingSavedAt) return;
    const next: EngagementState = { ...current, offerSeenFor: readingSavedAt };
    set(next);
    await persist(next);
  },

  markJourneyOffered: async () => {
    const next: EngagementState = { ...get(), journeyOfferedAt: new Date().toISOString() };
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

// The "today's-walk" breadcrumb's one read: has this tool been opened
// today (local calendar day)? Derived fresh every call, never persisted as
// a boolean — see toolLastVisitedAt's own comment for why.
export function isToolVisitedToday(
  toolLastVisitedAt: Partial<Record<BreadcrumbTool, string>>,
  tool: BreadcrumbTool
): boolean {
  const ts = toolLastVisitedAt[tool];
  return ts !== undefined && getRelativeTimeBucket(ts) === 'today';
}
