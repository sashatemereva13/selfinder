// `frame` is a one-line qualitative anchor for each level — used to
// ground the interview scoring prompt so it discriminates between
// adjacent/similar-sounding levels (e.g. fear vs. anger vs. desire) instead
// of guessing from bare word association with the level name alone.
// `name`/`slug`/`score`/`route` now come from shared/vibrationLevels.mjs —
// the single source of truth this file and mobile/src/content/
// measureConfig.ts's own VIBRATION_LEVELS both import, instead of two
// independently hardcoded 17-entry arrays.
//
// `frame` itself stays backend-only local content, layered over the
// shared array by slug below — it's LLM-prompt-grounding text mobile's
// bundle has no use for. This is a SEPARATE, still-manual duplication:
// mobile/src/content/levelsContent.ts has its own `frame` field (richer,
// reader-facing Level-detail copy, matching this text verbatim in the
// entries checked), and frontend/src/levels/levelsContent.js has a third
// copy — none of those three are unified by this change; flagged here as
// known, unfixed debt for a future pass.
import { VIBRATION_LEVELS as SHARED_LEVELS } from "../../shared/vibrationLevels.mjs";

const FRAMES = {
  shame: "The deepest wound to who you know yourself to be.",
  guilt: "The mind still judging itself.",
  apathy: "Too tired to expect anything.",
  grief: "You loved it, so you feel it.",
  fear: "Your mind reading the room for danger.",
  desire: "Looking outside for what's missing inside.",
  anger: "A boundary was crossed.",
  pride: "Self-worth still learning to stand alone.",
  courage: "Fear met straight on.",
  neutrality: "Calm without needing anything different.",
  willingness: "The resistance wears itself out.",
  acceptance: "What is, without the argument.",
  reason: "Clarity that doesn't mistake itself for truth.",
  love: "Warmth that goes nowhere in particular.",
  unconditionallove: "Love without conditions.",
  peace: "Feeling everything, resisting nothing.",
  enlightenment: "Nothing left to defend.",
};

export const VIBRATION_LEVELS = SHARED_LEVELS.map((level) => ({
  ...level,
  frame: FRAMES[level.slug],
}));

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
