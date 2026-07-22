import mongoose from "mongoose";
import { randomUUID } from "crypto";

const qaPairSchema = new mongoose.Schema(
  {
    sphere: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const measureResultSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, default: null },
  vibrationScore: { type: Number, required: true },
  rawVibrationScore: { type: Number, default: null },
  vibrationLevel: { type: mongoose.Schema.Types.Mixed, required: true },
  band: { type: String, default: null },
  dominantAxis: { type: String, default: null },
  scores: { type: mongoose.Schema.Types.Mixed, default: null },
  lines: { type: mongoose.Schema.Types.Mixed, default: null },
  microPractice: { type: String, default: null },
  affirmation: { type: String, default: null },
  combinationMessage: { type: String, default: null },
  recommendedPhilosopher: String,
  // The actual conversation this reading was scored from — same consent
  // gate as everything else on this model (saveMeasureResultIfConsented),
  // no separate opt-in. Lets a user reread what they said, not just the
  // resulting score.
  qaPairs: { type: [qaPairSchema], default: [] },
  savedAt: { type: String, required: true },
});

export default mongoose.model("MeasureResult", measureResultSchema);
