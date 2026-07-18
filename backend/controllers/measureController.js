import MeasureResult from "../models/MeasureResult.js";

export function recommendPhilosopher(vibrationScore) {
  if (vibrationScore < 200) return "camus";        // Shame / Guilt / Apathy / Grief / Fear
  if (vibrationScore < 310) return "kierkegaard";  // Desire / Anger / Pride / Courage / Neutrality
  if (vibrationScore < 400) return "stoics";       // Willingness / Acceptance / Reason
  return "aristotle";                              // Love and above
}

// Right of access, scoped to this one resource type — GDPR Art. 15.
export async function getMeasureHistory(req, res) {
  const results = await MeasureResult.find({ userId: req.user.id })
    .sort({ savedAt: -1 })
    .limit(50);

  res.json(results);
}
