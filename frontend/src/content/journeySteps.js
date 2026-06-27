// The core Selfinder path — four beats, in order. This is deliberately
// separate from narrativeFlow's HOUSE_ROOMS/INSTRUMENTS (which model a
// browse-anywhere menu, not a sequence) — JourneyProgress needs a strict
// 1-of-4 ordering, those don't.
export const JOURNEY_STEPS = [
  { key: "threshold", label: "Threshold" },
  { key: "measure", label: "Measure" },
  { key: "levels", label: "Levels" },
  { key: "tunein", label: "Tune In" },
];

export function getJourneyStepIndex(key) {
  return JOURNEY_STEPS.findIndex((s) => s.key === key);
}
