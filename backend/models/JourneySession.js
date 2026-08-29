import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { JOURNEY_KEYS } from "../../shared/journeyKeys.mjs";

// One clarifying/deflection exchange that did NOT advance the stage — same
// concept as Measure's client-side-only `asides` state (interview.tsx), but
// persisted here since a Journey session must survive an app restart
// mid-stage (see JourneySession's own resumability), where Measure's asides
// never needed to (Measure completes in one sitting).
const asideSchema = new mongoose.Schema(
  { answer: { type: String, required: true }, reply: { type: String, required: true } },
  { _id: false }
);

// One sub-turn within a stage — the person engaged, but the stage's own
// psychological goal wasn't yet satisfied, so the AI asked one more
// concrete question on the SAME stage rather than advancing (see
// journeyController.js's stageComplete decision). Distinct from asides
// (true non-engagement): a sub-turn is a real, on-topic answer that just
// isn't the stage's final one yet. `shown` records whether this sub-turn's
// own reply was actually rendered to the user (see showAcknowledgment) —
// kept for the transcript even when false, so resuming a session can
// still reconstruct exactly what was asked/answered without re-deciding
// whether a reply should have shown.
const subTurnSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    reply: { type: String, default: null },
    shown: { type: Boolean, default: false },
  },
  { _id: false }
);

const stageRecordSchema = new mongoose.Schema(
  {
    stageIndex: { type: Number, required: true },
    stageId: { type: String, required: true },
    openingQuestion: { type: String, required: true },
    // Every sub-turn asked and answered within this stage, in order —
    // including the final one that triggered stageComplete. A stage can
    // legitimately span 1-3+ turns (see journeyController.js's
    // STAGE_GOALS) before enough material exists to advance.
    turns: { type: [subTurnSchema], default: [] },
    // The answer that satisfied this stage's goal — for stage "object"
    // specifically, this is the concretized answer reached after
    // grounding, not necessarily the person's first (possibly abstract)
    // reply. Read by JourneyReflection and the proposition-extraction
    // step, neither of which needs the full turn-by-turn history.
    finalAnswer: { type: String, default: null },
    asides: { type: [asideSchema], default: [] },
    // Generic bag for a non-text stage primitive (e.g. Control's agency
    // stage's agency/influence/authorship sort) — absent for ordinary
    // text stages, reusable by any future Journey's own non-text stage.
    structuredAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    // Agency stage only (Control) — the clean, first-person propositions
    // extracted from everything said in prior stages, fed into
    // AgencySortPrimitive instead of raw per-stage answers. See
    // journeyController.js's EXTRACTION_PROMPT. Absent on every other
    // stage and on the agency stage itself until extraction succeeds.
    extractedPropositions: { type: [String], default: undefined },
    // "separate" stage only (Control) — the fixed, AUTHORED reveal text
    // shown when this stage opens (see journeyController.js's
    // buildSeparateReveal), interpolated from the "observable"/"represents"
    // stages' own finalAnswer text, never AI-generated. Persisted
    // separately from openingQuestion (which stays the plain fixed
    // question, "Leave their choice out of it...") so the reflection
    // screen can quote the actual desire/need split back to the user
    // instead of raw stage-1/stage-6 answers with nothing synthesizing
    // them. Absent on every other stage.
    revealText: { type: String, default: null },
    answeredAt: { type: String, default: null },
  },
  { _id: false }
);

// One Journey attempt's worth of stage-by-stage Q&A — a separate
// collection rather than living on User.journeyPurchases[], for the same
// reason MeasureResult is its own collection rather than living on User:
// this grows turn-by-turn and shouldn't require rewriting the whole User
// document (every other purchase's data included) on every single answer.
//
// Exactly one session per purchase (purchaseId unique-indexed), created
// lazily on first stage exchange, not at purchase-grant time. Resumable
// while in progress (currentStageIndex tracks where to continue after an
// app restart); immutable once completedAt is set — no route mutates a
// session after completion, a re-visit routes straight to the reflection
// screen using the stored answers.
const journeySessionSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  journey: { type: String, enum: JOURNEY_KEYS, required: true },
  purchaseId: { type: String, required: true, unique: true },
  currentStageIndex: { type: Number, default: 0 },
  stages: { type: [stageRecordSchema], default: [] },
  startedAt: { type: String, required: true },
  completedAt: { type: String, default: null },
});

export default mongoose.model("JourneySession", journeySessionSchema);
