// The core Selfinder path — four beats, in order. This is deliberately
// separate from narrativeFlow's HOUSE_ROOMS/INSTRUMENTS (which model a
// browse-anywhere menu, not a sequence) — JourneyProgress needs a strict
// 1-of-4 ordering, those don't.
export const JOURNEY_STEPS = [
  { key: "threshold", label: "Threshold", route: "/" },
  { key: "measure", label: "Measure", route: "/depths" },
  { key: "levels", label: "Levels", route: "/levels" },
  { key: "tunein", label: "Tune In", route: "/tunein" },
];

export function getJourneyStepIndex(key) {
  return JOURNEY_STEPS.findIndex((s) => s.key === key);
}
