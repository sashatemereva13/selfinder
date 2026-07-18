import mongoose from "mongoose";
import { randomUUID } from "crypto";

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
  recommendedPhilosopher: String,
  savedAt: { type: String, required: true },
});

export default mongoose.model("MeasureResult", measureResultSchema);
