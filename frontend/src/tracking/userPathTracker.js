export const USER_PATH_STORAGE_KEY = "sf_user_path_v1";
const MAX_STEPS = 500;

function hasSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

function safeParse(raw) {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function readPathTrail() {
  if (!hasSessionStorage()) return [];
  return safeParse(window.sessionStorage.getItem(USER_PATH_STORAGE_KEY));
}

export function appendPathStep(step) {
  if (!hasSessionStorage() || !step?.path) return [];

  const nextStep = {
    path: step.path,
    ts: step.ts || new Date().toISOString(),
    source: step.source || "route",
    navType: step.navType || null,
  };

  const trail = readPathTrail();
  const prev = trail[trail.length - 1];

  if (
    prev &&
    prev.path === nextStep.path &&
    prev.source === nextStep.source &&
    prev.navType === nextStep.navType
  ) {
    return trail;
  }

  const nextTrail = [...trail, nextStep].slice(-MAX_STEPS);
  window.sessionStorage.setItem(USER_PATH_STORAGE_KEY, JSON.stringify(nextTrail));
  window.__sfUserPathTrail = nextTrail;
  return nextTrail;
}

export function clearPathTrail() {
  if (!hasSessionStorage()) return;
  window.sessionStorage.removeItem(USER_PATH_STORAGE_KEY);
  window.__sfUserPathTrail = [];
}
