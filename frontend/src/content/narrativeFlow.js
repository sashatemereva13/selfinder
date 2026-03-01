export const NARRATIVE_FLOW_STEPS = [
  {
    key: "threshold",
    route: "/threshold",
    label: "Threshold",
    longLabel: "Welcome Layer",
    stage: "Arrival",
  },
  {
    key: "core",
    route: "/",
    label: "Core",
    longLabel: "Neural Core",
    stage: "Activation",
  },
  {
    key: "measure",
    route: "/measure",
    label: "Measure",
    longLabel: "Signal Mapping",
    stage: "Diagnostic",
  },
  {
    key: "luna",
    route: "/luna",
    label: "Luna",
    longLabel: "Timing Lens",
    stage: "Context",
  },
  {
    key: "tunein",
    route: "/tunein",
    label: "Tune In",
    longLabel: "Regulation",
    stage: "Alignment",
  },
  {
    key: "levels",
    route: "/levels",
    label: "Levels",
    longLabel: "Integration",
    stage: "Reflection",
  },
];

export function getNarrativeStepByKey(key) {
  return NARRATIVE_FLOW_STEPS.find((step) => step.key === key) || null;
}

export function getNarrativeStepByPath(pathname) {
  if (!pathname) return null;
  if (pathname === "/") return getNarrativeStepByKey("core");
  if (pathname.startsWith("/core")) return getNarrativeStepByKey("core");
  if (pathname.startsWith("/threshold")) return getNarrativeStepByKey("threshold");
  if (pathname.startsWith("/measure")) return getNarrativeStepByKey("measure");
  if (pathname.startsWith("/luna")) return getNarrativeStepByKey("luna");
  if (pathname.startsWith("/tunein")) return getNarrativeStepByKey("tunein");
  if (pathname.startsWith("/levels")) return getNarrativeStepByKey("levels");
  return null;
}

export function getNextNarrativeStep(currentKey) {
  const index = NARRATIVE_FLOW_STEPS.findIndex((step) => step.key === currentKey);
  if (index < 0) return getNarrativeStepByKey("measure");
  return NARRATIVE_FLOW_STEPS[Math.min(index + 1, NARRATIVE_FLOW_STEPS.length - 1)];
}
