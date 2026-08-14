import mongoose from "mongoose";
import { randomUUID } from "crypto";

// "If this could feel like anything you wanted, what would that be?" —
// see docs/session-result-concept.md. Originally captured once per
// reading, right after Measure's four sphere questions; moved to stand
// on its own on Your Arc's future section (2026-08-14) — a wish depends
// on the person's current feeling, not on a specific reading, so tying
// it to one was a scope mismatch, not a real requirement. Never
// interpreted, never echoed back paraphrased — only ever returned
// verbatim or not at all.
const wishSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  // Always null now that a wish isn't reading-scoped — kept on the schema
  // rather than removed (a bare column costs nothing; dropping it would
  // be surgery across the API/mobile client for zero functional gain).
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
