// The House — narrative sequence (open navigation, implied order).
// Persona now lives in the entry sequence (EntryGate), before the router even
// mounts, so it is not one of these in-house steps anymore.
export const HOUSE_ROOMS = [
  {
    key: "threshold",
    route: "/",
    label: "The Threshold",
    stage: "Arrival",
    description: "You arrive. Something cracks open. The message lands. You cross.",
    themes: ["arrival", "awakening", "crossing"],
  },
  {
    key: "self",
    route: "/self",
    label: "The Self",
    stage: "Completion",
    description: "Integration. The whole. Conscious and unconscious in balance.",
    themes: ["integration", "wholeness", "arrival"],
  },
];

// Instruments — supporting tools, accessible from anywhere in the house
export const INSTRUMENTS = [
  {
    key: "measure",
    route: "/measure",
    label: "Feel",
    description: "Feel into your frequency at any point in the journey.",
  },
  {
    key: "luna",
    route: "/luna",
    label: "Luna",
    description: "Understand your timing through the lunar cycle.",
  },
  {
    key: "tunein",
    route: "/tunein",
    label: "Tune In",
    description: "Regulate before entering a difficult room.",
  },
  {
    key: "levels",
    route: "/levels",
    label: "Levels",
    description: "See where you are on the map of consciousness.",
  },
];

const ALL_STEPS = [...HOUSE_ROOMS, ...INSTRUMENTS];

export function getStepByKey(key) {
  return ALL_STEPS.find((s) => s.key === key) ?? null;
}

export function getStepByPath(pathname) {
  if (!pathname) return null;
  if (pathname === "/" || pathname.startsWith("/threshold")) return getStepByKey("threshold");
  if (pathname.startsWith("/self") && !pathname.startsWith("/selfinder")) return getStepByKey("self");
  if (pathname.startsWith("/measure") || pathname.startsWith("/depths/spheres")) return getStepByKey("measure");
  if (pathname.startsWith("/luna")) return getStepByKey("luna");
  if (pathname.startsWith("/tunein")) return getStepByKey("tunein");
  if (pathname.startsWith("/levels")) return getStepByKey("levels");
  return null;
}

export function getNextHouseRoom(currentKey) {
  const index = HOUSE_ROOMS.findIndex((r) => r.key === currentKey);
  if (index < 0 || index >= HOUSE_ROOMS.length - 1) return null;
  return HOUSE_ROOMS[index + 1];
}

// Backwards compatibility for components that still import these names
export const NARRATIVE_FLOW_STEPS = ALL_STEPS;
export const getNarrativeStepByKey = getStepByKey;
export const getNarrativeStepByPath = getStepByPath;
export function getNextNarrativeStep(currentKey) {
  return getNextHouseRoom(currentKey);
}
