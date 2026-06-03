export const NARRATIVE_FLOW_STEPS = [
  {
    key: "threshold",
    route: "/threshold",
    label: "The Threshold",
    longLabel: "Entry to the Psyche",
    stage: "Arrival",
    description: "Your entry point. Touch the sphere, receive a message, and cross into the inner space.",
  },
  {
    key: "core",
    route: "/core",
    label: "Core",
    longLabel: "Persona Chamber",
    stage: "Activation",
    description: "Explore the persona you present to the world — and what lives beneath it.",
  },
  {
    key: "measure",
    route: "/measure",
    label: "Measure",
    longLabel: "Signal Mapping",
    stage: "Diagnostic",
    description: "Map your current emotional frequency using the Hawkins scale of consciousness.",
  },
  {
    key: "luna",
    route: "/luna",
    label: "Luna",
    longLabel: "Timing Lens",
    stage: "Context",
    description: "Read your timing through the lunar cycle. Understand the context of now.",
  },
  {
    key: "tunein",
    route: "/tunein",
    label: "Tune In",
    longLabel: "Regulation",
    stage: "Alignment",
    description: "Regulate your inner frequency through sound, resonance, and guided tones.",
  },
  {
    key: "levels",
    route: "/levels",
    label: "Levels",
    longLabel: "Integration",
    stage: "Reflection",
    description: "Study the 17 levels of consciousness from Shame to Enlightenment. Locate yourself.",
  },
  {
    key: "guide",
    route: "/guide",
    label: "Guide",
    longLabel: "Inner Dialogue",
    stage: "Dialogue",
    description: "Talk to a philosophical companion. Choose Socrates, Stoics, Kierkegaard, Camus, or Aristotle.",
  },
];

export function getNarrativeStepByKey(key) {
  return NARRATIVE_FLOW_STEPS.find((step) => step.key === key) || null;
}

export function getNarrativeStepByPath(pathname) {
  if (!pathname) return null;
  if (pathname === "/") return getNarrativeStepByKey("threshold");
  if (pathname.startsWith("/core")) return getNarrativeStepByKey("core");
  if (pathname.startsWith("/threshold")) return getNarrativeStepByKey("threshold");
  if (pathname.startsWith("/measure")) return getNarrativeStepByKey("measure");
  if (pathname.startsWith("/luna")) return getNarrativeStepByKey("luna");
  if (pathname.startsWith("/tunein")) return getNarrativeStepByKey("tunein");
  if (pathname.startsWith("/levels")) return getNarrativeStepByKey("levels");
  if (pathname.startsWith("/guide")) return getNarrativeStepByKey("guide");
  return null;
}

export function getNextNarrativeStep(currentKey) {
  const index = NARRATIVE_FLOW_STEPS.findIndex((step) => step.key === currentKey);
  if (index < 0) return getNarrativeStepByKey("measure");
  return NARRATIVE_FLOW_STEPS[Math.min(index + 1, NARRATIVE_FLOW_STEPS.length - 1)];
}
