export type Sphere = 'body' | 'mind' | 'heart' | 'spirit';

export interface MeasureQuestion {
  sphere: Sphere;
  question: string;
}

export interface Philosopher {
  id: string;
  name: string;
  mode: string;
  description: string;
  color: string;
  accentRgb: string;
  greeting: string;
  measureQuestions: MeasureQuestion[];
  systemPrompt: string;
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
  lines: MeasureLine[];
  /** Added client-side on save — not part of the API response. */
  savedAt: string;
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
