import { JOURNEY_KEYS } from '@selfinder/shared';

export type Sphere = 'body' | 'mind' | 'heart' | 'spirit';

export interface MeasureQuestion {
  sphere: Sphere;
  question: string;
}

// A short, wordless-but-spoken phrase — originally one per sphere,
// accompanying a per-sphere attention scan that used to play before each
// of Measure's four questions (see docs/measure-experience-concept.md §1).
// That per-sphere interruption was cut (see measure/index.tsx's own
// comment): scanPhrases[0] (the body-sphere line) is now the only one
// still shown, as the companion line under AuraSettle on Measure's single
// merged intro screen. Indices 1-3 (mind/heart/spirit) are unused but
// still authored per-philosopher (philosophers.ts) — kept on the type in
// case a future per-sphere cue returns, rather than deleting real content.
export interface ScanPhrase {
  sphere: Sphere;
  phrase: string;
}

// The subset of Philosopher that's hand-authored, user-facing voice/copy —
// distinct from id (a stable key) and systemPrompt (deliberately English-
// only in every locale; see philosophers.ts's own comment on why). Kept as
// its own type so a translation object can require exactly these fields,
// nothing more/less, and so getLocalizedPhilosopher's return type is
// obviously "the same shape, some fields swapped" rather than a loose
// Partial<Philosopher> that could accidentally omit something.
export interface PhilosopherVoice {
  name: string;
  // Russian-only: the instrumental case of `name` ("with Marcus Aurelius"
  // needs "Марком Аврелием", not the nominative "Марк Аврелий" — Russian
  // grammar requires the noun itself to change form, not just a fixed
  // preposition). Optional/unused on the English base object; every
  // Russian translation supplies it so "Walk with {{name}}"-style strings
  // can interpolate the grammatically correct form instead of the
  // nominative name.
  nameInstrumental?: string;
  mode: string;
  description: string;
  symbolLine: string;
  greeting: string;
  firstMeeting: string;
  secondVisitGreeting: string;
  measureQuestions: MeasureQuestion[];
  // Optional (not yet authored for any philosopher — see philosophers.ts)
  // so AttentionScan can render its motion with no phrase text until this
  // is filled in, rather than the type lying about content that isn't
  // there yet.
  scanPhrases?: ScanPhrase[];
}

export interface Philosopher extends PhilosopherVoice {
  id: string;
  systemPrompt: string;
  // Russian versions of every hand-authored voice field, keyed by locale
  // code — currently only 'ru' exists since English is the base object
  // itself. Resolved via getLocalizedPhilosopher(), not read directly by
  // consuming components (that would mean every one of the ~12 call sites
  // re-implementing the same locale-check).
  translations?: Partial<Record<'ru', PhilosopherVoice>>;
}

export interface VibrationLevel {
  name: string;
  slug: string;
  score: number;
  /** Web route path (e.g. "/levels/shame") — for app navigation use `slug` instead. */
  route: string;
}

export interface AxisScores {
  calm: number;
  clarity: number;
  intensity: number;
  grounding: number;
}

export interface MeasureLine {
  key: Sphere;
  label: string;
  helper: string;
  scores: AxisScores;
  dominantAxis: string;
  band: string;
  rawVibrationScore: number;
  vibrationScore: number;
  vibrationLevel: VibrationLevel;
}

export interface MeasureResult {
  scores: AxisScores;
  rawVibrationScore: number;
  vibrationScore: number;
  vibrationLevel: VibrationLevel;
  dominantAxis: string;
  band: string;
  microPractice?: string;
  affirmation?: string;
  /** Philosopher-voiced reflection tying all four sphere readings together —
   * null if generation failed or no philosopher context was sent. */
  combinationMessage?: string | null;
  lines: MeasureLine[];
  /** Added client-side on save — not part of the API response. */
  savedAt: string;
  /** Added client-side on save — the actual conversation this reading came from. */
  qaPairs?: QAPair[];
  /** The persisted MeasureResult's id, if the reading was saved server-side
   * (signed in + consent given) — null otherwise. Lets a later Guide
   * conversation opened via "Talk about it" link back to this reading. */
  measureResultId?: string | null;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sphere?: Sphere;
}

export interface QAPair {
  sphere: Sphere;
  question: string;
  answer: string;
}

export interface AuthSession {
  token: string;
  username: string;
  role: string;
}

export interface ConsentState {
  given: boolean;
  version: string | null;
  timestamp: string | null;
}

export interface SubscriptionState {
  active: boolean;
  source: 'manual' | 'apple' | 'google' | null;
  expiresAt: string | null;
}

// Every Journey named so far — an OPEN-ENDED, growing family, not a fixed
// set (2026-08-23 pivot — see RULES.md's Product/positioning section).
// Center is the only one with real content today; Either/Or and Identity
// are named catalog entries with no content yet. The keys themselves
// come from shared/journeyKeys.mjs (backed by journeyKeys.d.ts for the
// literal typing) — the single source of truth this union and
// backend/models/User.js's Mongoose enum both derive from.
export type JourneyKey = (typeof JOURNEY_KEYS)[number];

// One Journey purchase — repeatable, one-time-purchase experience,
// standalone from Your Arc (2026-08-23: generalized from the old
// Center-only CenterPurchase once Center became the first of an
// open-ended Journey family — see RULES.md's Product/positioning
// section). seedNonce is combined with real reading history in
// kaleidoscopeData.ts's seedFromLog (Center) or the equivalent for a
// future Journey, so this specific purchase always regenerates the same
// result on revisit, while a different purchase (a different array
// entry) produces a different one.
export interface JourneyPurchase {
  id: string;
  journey: JourneyKey;
  source: 'manual' | 'apple' | 'google';
  purchasedAt: string;
  seedNonce: number;
}

// One authored, fixed question in a Journey's slot sequence (see
// docs/journeys-concept.md) — the architecture never changes; the AI is
// only ever allowed to phrase THIS question live, referencing prior
// answers, never invent, skip, or reorder slots.
export interface JourneySlot {
  id: string;
  question: string;
  // Only present on a slot with a non-text answer UI (e.g. Control's
  // slot 7, the agency/influence/authorship sort) — extend as future
  // Journeys need new primitives.
  primitive?: 'agency-sort';
}

// One slot's persisted record for a single Journey session — mirrors
// backend/models/JourneySession.js's slotRecordSchema exactly.
export interface JourneySlotRecord {
  slotIndex: number;
  slotId: string;
  baseQuestion: string;
  phrasedQuestion: string;
  answer: string | null;
  asides: { answer: string; reply: string }[];
  // Slot 7 only for Control today — a generic bag any future Journey's
  // own non-text slot primitive can reuse.
  structuredAnswer?: AgencySortResult | null;
  answeredAt: string | null;
}

// Mirrors backend/models/JourneySession.js — one Journey attempt's worth
// of slot-by-slot Q&A, linked to one journeyPurchases[] entry via
// purchaseId. Resumable while in progress; immutable once completedAt is
// set.
export interface JourneySessionDTO {
  id: string;
  userId: string;
  journey: JourneyKey;
  purchaseId: string;
  currentSlotIndex: number;
  slots: JourneySlotRecord[];
  startedAt: string;
  completedAt: string | null;
}

// Control's slot 7 result — which of the elements the user named earlier
// in the session belong to their own agency, their influence, or outside
// their authorship entirely (see docs/journeys-concept.md's Control
// section). No ranking between the three buckets.
export interface AgencySortResult {
  agency: string[];
  influence: string[];
  authorship: string[];
}

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  email: string | null;
  consent: { psychologicalData: ConsentState };
  // Renamed from the old single `subscription` field (2026-08-22) once
  // Selfinder+ split into two differently-shaped products — see
  // journeyPurchases below for the other one.
  arcSubscription: SubscriptionState;
  // Real count, not the full history — backs the free-trial progress
  // display (useArcTrialStatus.ts). See backend/controllers/
  // userController.js's own comment for why this is a cheap count query,
  // not a byproduct of a full getMeasureHistory fetch.
  savedReadingCount: number;
  journeyPurchases: JourneyPurchase[];
}

/** Shape returned by GET /measure/history — a persisted MeasureResult document. */
export interface SavedMeasureResult {
  id: string;
  vibrationScore: number;
  rawVibrationScore: number | null;
  vibrationLevel: VibrationLevel;
  band: string | null;
  dominantAxis: string | null;
  scores: AxisScores | null;
  lines: MeasureLine[] | null;
  microPractice: string | null;
  affirmation: string | null;
  combinationMessage: string | null;
  recommendedPhilosopher: string | null;
  qaPairs: QAPair[];
  savedAt: string;
}
