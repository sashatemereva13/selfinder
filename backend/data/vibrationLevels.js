export const VIBRATION_LEVELS = [
  { name: "Shame", slug: "shame", score: 20, route: "/levels/shame" },
  { name: "Guilt", slug: "guilt", score: 30, route: "/levels/guilt" },
  { name: "Apathy", slug: "apathy", score: 50, route: "/levels/apathy" },
  { name: "Grief", slug: "grief", score: 75, route: "/levels/grief" },
  { name: "Fear", slug: "fear", score: 100, route: "/levels/fear" },
  { name: "Desire", slug: "desire", score: 125, route: "/levels/desire" },
  { name: "Anger", slug: "anger", score: 150, route: "/levels/anger" },
  { name: "Pride", slug: "pride", score: 175, route: "/levels/pride" },
  { name: "Courage", slug: "courage", score: 200, route: "/levels/courage" },
  { name: "Neutrality", slug: "neutrality", score: 250, route: "/levels/neutrality" },
  { name: "Willingness", slug: "willingness", score: 310, route: "/levels/willingness" },
  { name: "Acceptance", slug: "acceptance", score: 350, route: "/levels/acceptance" },
  { name: "Reason", slug: "reason", score: 400, route: "/levels/reason" },
  { name: "Love", slug: "love", score: 500, route: "/levels/love" },
  { name: "Unconditional Love", slug: "unconditionallove", score: 540, route: "/levels/unconditionallove" },
  { name: "Peace", slug: "peace", score: 600, route: "/levels/peace" },
  { name: "Enlightenment", slug: "enlightenment", score: 700, route: "/levels/enlightenment" },
];

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
