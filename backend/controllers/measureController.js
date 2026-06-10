import { randomUUID } from "crypto";
import { measureResults } from "../stores.js";

function recommendPhilosopher(vibrationScore) {
  if (vibrationScore < 200) return "camus";        // Shame / Guilt / Apathy / Grief / Fear
  if (vibrationScore < 310) return "kierkegaard";  // Desire / Anger / Pride / Courage / Neutrality
  if (vibrationScore < 400) return "stoics";       // Willingness / Acceptance / Reason
  return "aristotle";                              // Love and above
}

export function postMeasureResults(req, res) {
  const { vibrationScore, vibrationLevel, band, dominantAxis } = req.body;

  if (vibrationScore === undefined || !vibrationLevel) {
    return res.status(400).json({ error: "vibrationScore and vibrationLevel are required" });
  }

  const result = {
    id: randomUUID(),
    userId: req.user?.id ?? null,
    vibrationScore,
    vibrationLevel,
    band: band ?? null,
    dominantAxis: dominantAxis ?? null,
    recommendedPhilosopher: recommendPhilosopher(vibrationScore),
    savedAt: new Date().toISOString(),
  };

  measureResults.push(result);
  res.json(result);
}
