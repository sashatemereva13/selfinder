import mongoose from "mongoose";
import { randomUUID } from "crypto";

// Deliberately no userId — anonymousId alone already answers every question
// that matters (does the same install return, does the same install do
// Measure then Spill). Adding account identity here would only let us know
// which specific person did what, which isn't the goal: this is for
// understanding which features are popular, not for tracking individuals.
const eventSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  name: { type: String, required: true },
  anonymousId: { type: String, required: true },
  platform: { type: String, required: true },
  properties: { type: mongoose.Schema.Types.Mixed, default: null },
  occurredAt: { type: String, required: true },
});

export default mongoose.model("Event", eventSchema);
