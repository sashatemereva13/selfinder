// The House — 5 Jungian rooms in narrative sequence (open navigation, implied order)
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
    key: "persona",
    route: "/persona",
    label: "The Persona",
    stage: "Room I",
    description: "The mask you wear. The roles you perform. Who do you become when others are watching?",
    themes: ["mask", "role", "performance"],
  },
  {
    key: "shadow",
    route: "/shadow",
    label: "The Shadow",
    stage: "Room II",
    description: "What you repress. What you deny. Hidden desires. The unloved parts.",
    themes: ["repression", "denial", "hidden"],
  },
  {
    key: "anima",
    route: "/anima",
    label: "The Anima / Animus",
    stage: "Room III",
    description: "The inner opposite. Projection. Attraction. What do you see in others that is actually in you?",
    themes: ["projection", "mirror", "other"],
  },
  {
    key: "innerchild",
    route: "/innerchild",
    label: "The Inner Child",
    stage: "Room IV",
    description: "Memory. Wound. Innocence. Creativity. What did you leave behind?",
    themes: ["memory", "wound", "wonder"],
  },
  {
    key: "self",
    route: "/self",
    label: "The Self",
    stage: "Room V",
    description: "Integration. The whole. Conscious and unconscious in balance.",
    themes: ["integration", "wholeness", "arrival"],
  },
];

// Instruments — supporting tools, accessible from anywhere in the house
export const INSTRUMENTS = [
  {
    key: "measure",
    route: "/measure",
    label: "Measure",
    description: "Take a frequency reading at any point in the journey.",
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
  if (pathname.startsWith("/persona") || pathname.startsWith("/core")) return getStepByKey("persona");
  if (pathname.startsWith("/shadow")) return getStepByKey("shadow");
  if (pathname.startsWith("/anima")) return getStepByKey("anima");
  if (pathname.startsWith("/innerchild")) return getStepByKey("innerchild");
  if (pathname.startsWith("/self") && !pathname.startsWith("/selfinder")) return getStepByKey("self");
  if (pathname.startsWith("/measure")) return getStepByKey("measure");
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
