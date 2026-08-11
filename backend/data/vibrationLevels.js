// `frame` is a one-line qualitative anchor for each level — used to
// ground the interview scoring prompt so it discriminates between
// adjacent/similar-sounding levels (e.g. fear vs. anger vs. desire) instead
// of guessing from bare word association with the level name alone.
// Source of truth is mobile/src/content/levelsContent.ts (the actively
// developed app) — keep this file, frontend/src/levels/levelsContent.js,
// and selfinder-app/src/content/levelsContent.ts in sync by hand whenever
// mobile's frame text changes, so the philosopher's own grounding never
// reads a different version of a level than the user does.
export const VIBRATION_LEVELS = [
  { name: "Shame", slug: "shame", score: 20, route: "/levels/shame", frame: "The deepest wound to who you know yourself to be." },
  { name: "Guilt", slug: "guilt", score: 30, route: "/levels/guilt", frame: "The mind still judging itself." },
  { name: "Apathy", slug: "apathy", score: 50, route: "/levels/apathy", frame: "Too tired to expect anything." },
  { name: "Grief", slug: "grief", score: 75, route: "/levels/grief", frame: "You loved it, so you feel it." },
  { name: "Fear", slug: "fear", score: 100, route: "/levels/fear", frame: "Your mind reading the room for danger." },
  { name: "Desire", slug: "desire", score: 125, route: "/levels/desire", frame: "Looking outside for what's missing inside." },
  { name: "Anger", slug: "anger", score: 150, route: "/levels/anger", frame: "A boundary was crossed." },
  { name: "Pride", slug: "pride", score: 175, route: "/levels/pride", frame: "Self-worth still learning to stand alone." },
  { name: "Courage", slug: "courage", score: 200, route: "/levels/courage", frame: "Fear met straight on." },
  { name: "Neutrality", slug: "neutrality", score: 250, route: "/levels/neutrality", frame: "Calm without needing anything different." },
  { name: "Willingness", slug: "willingness", score: 310, route: "/levels/willingness", frame: "The resistance wears itself out." },
  { name: "Acceptance", slug: "acceptance", score: 350, route: "/levels/acceptance", frame: "What is, without the argument." },
  { name: "Reason", slug: "reason", score: 400, route: "/levels/reason", frame: "Clarity that doesn't mistake itself for truth." },
  { name: "Love", slug: "love", score: 500, route: "/levels/love", frame: "Warmth that goes nowhere in particular." },
  { name: "Unconditional Love", slug: "unconditionallove", score: 540, route: "/levels/unconditionallove", frame: "Love without conditions." },
  { name: "Peace", slug: "peace", score: 600, route: "/levels/peace", frame: "Feeling everything, resisting nothing." },
  { name: "Enlightenment", slug: "enlightenment", score: 700, route: "/levels/enlightenment", frame: "Nothing left to defend." },
];

// Single source of truth for "the 17 levels, briefly" — used both in the
// interview scoring prompt and in UNIVERSAL_RULES, so every philosopher
// conversation (not just the moment of scoring) is grounded in the app's own
// original descriptions instead of generic knowledge of the Hawkins scale.
export const VIBRATION_SCALE_REFERENCE = [...VIBRATION_LEVELS]
  .reverse()
  .map((l) => `${l.score} ${l.name} — ${l.frame}`)
  .join("\n");

export function getNearestVibrationLevel(score) {
  return VIBRATION_LEVELS.reduce((closest, level) => {
    if (!closest) return level;
    return Math.abs(level.score - score) < Math.abs(closest.score - score)
      ? level
      : closest;
  }, null);
}

export function getFrequencyBand(scores) {
  const topAxis = Object.entries(scores)
    .filter(([k]) => k !== "vibration")
    .sort((a, b) => b[1] - a[1])[0]?.[0];
  if (topAxis === "grounding") return "Grounding Band";
  if (topAxis === "calm") return "Restorative Band";
  if (topAxis === "clarity") return "Clarity Band";
  return "Activation Band";
}

export function calibrateVibrationScore(rawScore, scores) {
  const center = 250;
  let calibrated = center + (rawScore - center) * 0.88;
  if (scores.clarity >= scores.intensity + 3) calibrated += 18;
  if (scores.calm >= scores.intensity + 2) calibrated += 12;
  if (scores.grounding >= scores.intensity + 2 && calibrated < 250) calibrated += 10;
  if (scores.intensity >= scores.calm + 4 && scores.clarity <= scores.intensity) calibrated -= 10;
  return Math.round(Math.min(700, Math.max(20, calibrated)));
}
