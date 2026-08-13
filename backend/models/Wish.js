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
  // Set once this wish has actually been opened via Your Arc's resurfacing
  // row (not merely selected as eligible) — see docs/session-result-
  // concept.md's Phase 4 "pure resurfacing" mechanism. Lets selection
  // rotate through the backlog (oldest not-yet-resurfaced first) instead
  // of ever re-showing the same wish indefinitely or needing any
  // content-based ranking.
  resurfacedAt: { type: String, default: null },
});

export default mongoose.model("Wish", wishSchema);
