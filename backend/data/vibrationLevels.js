// `frame` is a one-line qualitative anchor for each level, ported from
// frontend/src/levels/levelsContent.js (keep in sync by hand) — used to
// ground the interview scoring prompt so it discriminates between
// adjacent/similar-sounding levels (e.g. fear vs. anger vs. desire) instead
// of guessing from bare word association with the level name alone.
export const VIBRATION_LEVELS = [
  { name: "Shame", slug: "shame", score: 20, route: "/levels/shame", frame: "Shame is not a failure; it is the soul's extreme sensitivity to dignity." },
  { name: "Guilt", slug: "guilt", score: 30, route: "/levels/guilt", frame: "Not evidence of being bad — an old standard the mind hasn't yet forgiven itself for missing." },
  { name: "Apathy", slug: "apathy", score: 50, route: "/levels/apathy", frame: "Not laziness — exhaustion in a system that has stopped expecting help to arrive." },
  { name: "Grief", slug: "grief", score: 75, route: "/levels/grief", frame: "Not weakness — the honest cost of having valued something enough to feel its loss." },
  { name: "Fear", slug: "fear", score: 100, route: "/levels/fear", frame: "Fear is not weakness; it is intelligence about uncertainty." },
  { name: "Desire", slug: "desire", score: 125, route: "/levels/desire", frame: "Not greed — the mind reaching outward to fill a lack it hasn't yet located within." },
  { name: "Anger", slug: "anger", score: 150, route: "/levels/anger", frame: "Anger is not pathology; it is the signal that a boundary has been crossed." },
  { name: "Pride", slug: "pride", score: 175, route: "/levels/pride", frame: "Not vanity — self-worth borrowing its shape from comparison before it has learned to stand on its own." },
  { name: "Courage", slug: "courage", score: 200, route: "/levels/courage", frame: "Not the absence of fear — the willingness to meet it standing up." },
  { name: "Neutrality", slug: "neutrality", score: 250, route: "/levels/neutrality", frame: "Not indifference — the calm of no longer needing things to go a particular way." },
  { name: "Willingness", slug: "willingness", score: 310, route: "/levels/willingness", frame: "Confirmation that the friction of resistance has finally been spent." },
  { name: "Acceptance", slug: "acceptance", score: 350, route: "/levels/acceptance", frame: "Not resignation — the moment perception stops arguing with what is already true." },
  { name: "Reason", slug: "reason", score: 400, route: "/levels/reason", frame: "The mind organizing experience — useful information, until it mistakes the map for the territory." },
  { name: "Love", slug: "love", score: 500, route: "/levels/love", frame: "Not earned and not owed — energy that has stopped needing somewhere to go." },
  { name: "Unconditional Love", slug: "unconditionallove", score: 540, route: "/levels/unconditionallove", frame: "Not a feat of willpower — what's left once love no longer needs a condition to stand on." },
  { name: "Peace", slug: "peace", score: 600, route: "/levels/peace", frame: "Stillness here is not the absence of feeling — it is feeling with nothing left to resist." },
  { name: "Enlightenment", slug: "enlightenment", score: 700, route: "/levels/enlightenment", frame: "Not an achievement to chase — it is what's left when nothing is being defended." },
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
