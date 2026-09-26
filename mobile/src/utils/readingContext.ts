import { MeasureResult } from '../types';

// The system-prompt note that tells a philosopher which reading a
// conversation is about (see guideChatStore's readingContext). Facts only —
// the level names are the map's own names, not a verdict — and an explicit
// instruction not to interpret them back at the person, per RULES.md's
// "the answers are already inside the person."
export function buildReadingContext(result: MeasureResult): string {
  const spheres = result.lines
    .map((line) => `${line.key}: ${line.vibrationLevel.name}`)
    .join(', ');
  return [
    `This conversation is about a Measure reading the person took with you on ${result.savedAt.slice(0, 10)}.`,
    `Overall it read as ${result.vibrationLevel.name}, mostly in ${result.dominantAxis}. By sphere — ${spheres}.`,
    'Your reflection on it is already in the conversation above. Do not restate the reading or tell them what it says about them — follow what they bring.',
  ].join(' ');
}
