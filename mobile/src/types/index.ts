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

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  email: string | null;
  consent: { psychologicalData: ConsentState };
  subscription: SubscriptionState;
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
