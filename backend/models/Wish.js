import mongoose from "mongoose";
import { randomUUID } from "crypto";

// "If this could feel like anything you wanted, what would that be?" —
// captured once per reading, right after Measure's four sphere questions
// (see docs/session-result-concept.md). Unlike SpillEntry, a wish is
// always tied to the specific reading that prompted it (measureResultId)
// — needed so a later resurfacing can say "two months ago, right after a
// reading, you wished...". Never interpreted, never echoed back
// paraphrased — only ever returned verbatim or not at all.
const wishSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  measureResultId: { type: String, default: null },
  savedAt: { type: String, required: true },
});

export default mongoose.model("Wish", wishSchema);
