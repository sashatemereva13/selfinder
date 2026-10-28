import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { ALLOWED_EVENT_NAMES, validateEventProperties, validOccurredAt } from "../utils/eventValidation.js";

// Deliberately no userId — anonymousId alone already answers every question
// that matters (does the same install return, does the same install do
// Measure then Spill). Adding account identity here would only let us know
// which specific person did what, which isn't the goal: this is for
// understanding which features are popular, not for tracking individuals.
const eventSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  name: { type: String, required: true, enum: [...ALLOWED_EVENT_NAMES] },
  anonymousId: { type: String, required: true, maxlength: 80 },
  platform: { type: String, required: true, enum: ["ios", "android", "web"] },
  properties: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
    validate: {
      validator(value) { return validateEventProperties(this.name, value); },
      message: "Event properties do not match the event schema",
    },
  },
  occurredAt: {
    type: String,
    required: true,
    validate: { validator: validOccurredAt, message: "Invalid event timestamp" },
  },
});

export default mongoose.model("Event", eventSchema);
