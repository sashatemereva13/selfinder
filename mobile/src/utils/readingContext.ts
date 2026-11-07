import { MeasureResult, Sphere } from '../types';

// What a philosopher is told about the reading a conversation is about
// (see guideChatStore's readingContext). Facts only, as structured fields
// the server checks against fixed lists — the server writes the sentences
// the philosopher reads, including the rule not to interpret the reading
// back at the person (RULES.md, "the answers are already inside the
// person"). The app no longer writes any instruction to the model: since
// 2026-11-07 the server is the only author of a system prompt
// (backend/utils/philosopherPrompt.js).
export interface ReadingFacts {
  date: string;
  overall: string;
  dominantAxis: string;
  spheres: Partial<Record<Sphere, string>>;
}

// One of the person's own Measure answers they're asking about from
// Depths — sent as their words, never as an instruction.
export interface FocusFacts {
  sphere: Sphere;
  level: string;
  answer: string;
}

export interface GuideContext {
  reading?: ReadingFacts;
  focus?: FocusFacts[];
}

export function buildReadingContext(result: MeasureResult): ReadingFacts {
  return {
    date: result.savedAt.slice(0, 10),
    overall: result.vibrationLevel.slug,
    dominantAxis: result.dominantAxis,
    spheres: Object.fromEntries(result.lines.map((line) => [line.key, line.vibrationLevel.slug])),
  };
}
