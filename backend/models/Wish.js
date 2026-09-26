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
//
// 2026-09-13 — WOOP (Wish-Outcome-Obstacle-Plan, Gabriele Oettingen's
// mental-contrasting-with-implementation-intentions research; see
// WishCrossingPage.tsx's own header comment for the full research
// rationale) used to be entirely ephemeral client-side state — never
// sent here, gone the moment the person left the page. Persisting it
// makes it a real, lasting part of the wish record (not just a one-time
// in-session exercise), and gives Center's own kaleidoscope something
// real to derive shape from later (see ArcKaleidoscope.tsx's own
// eventual woopSeed usage). Embedded sub-schema, not four flat top-level
// fields, mirroring JourneySession.js's own stageRecordSchema
// convention — OUTCOME/OBSTACLE/PLAN are one cohesive unit that's
// absent-or-complete together, not four independent facts about the
// wish. All four sub-fields are the person's own words, unedited —
// same "never interpreted, never rephrased" rule as `text` above.
const woopSchema = new mongoose.Schema(
  {
    outcome: { type: String, default: null },
    obstacle: { type: String, default: null },
    planIf: { type: String, default: null },
    planThen: { type: String, default: null },
  },
  { _id: false }
);

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
  // "Ticked" — the user's own claim that this wish came true, set from
  // Your Arc's "What calls you" page (2026-08-19). A timestamp, not a
  // boolean, same pattern as resurfacedAt, so it also records WHEN. This
  // is never inferred, scored, or suggested by the app — only the user
  // marks a wish fulfilled, and only their own account of it; the app has
  // no way to know whether a wish "really" came true and never claims to.
  // A fulfilled wish is NOT the same as simply being superseded by a
  // newer active wish (findActiveWish already treats any older wish as
  // "past" once a newer one exists) — this is a separate, positive claim,
  // and a wish can in principle be both superseded and never ticked, or
  // ticked while still technically active.
  fulfilledAt: { type: String, default: null },
  // null = no WOOP done for this wish yet — read everywhere WOOP-presence
  // is checked. Every pre-existing wish reads as `woop: null` automatically
  // (default applies with no migration needed) since this field didn't
  // exist before 2026-09-13.
  woop: { type: woopSchema, default: null },
});

export default mongoose.model("Wish", wishSchema);
