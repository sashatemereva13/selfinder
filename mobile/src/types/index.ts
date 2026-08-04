export type Sphere = 'body' | 'mind' | 'heart' | 'spirit';

export interface MeasureQuestion {
  sphere: Sphere;
  question: string;
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
  mode: string;
  description: string;
  symbolLine: string;
  greeting: string;
  firstMeeting: string;
  secondVisitGreeting: string;
  measureQuestions: MeasureQuestion[];
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

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  createdAt: string;
  email: string | null;
  consent: { psychologicalData: ConsentState };
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
