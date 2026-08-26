import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { JOURNEY_KEYS } from "../../shared/journeyKeys.mjs";

// One clarifying/deflection exchange that did NOT advance the slot — same
// concept as Measure's client-side-only `asides` state (interview.tsx), but
// persisted here since a Journey session must survive an app restart
// mid-slot (see JourneySession's own resumability), where Measure's asides
// never needed to (Measure completes in one sitting).
const asideSchema = new mongoose.Schema(
  { answer: { type: String, required: true }, reply: { type: String, required: true } },
  { _id: false }
);

const slotRecordSchema = new mongoose.Schema(
  {
    slotIndex: { type: Number, required: true },
    slotId: { type: String, required: true },
    baseQuestion: { type: String, required: true },
    phrasedQuestion: { type: String, required: true },
    answer: { type: String, default: null },
    asides: { type: [asideSchema], default: [] },
    // Generic bag for a non-text slot primitive (e.g. Control's slot 7
    // agency/influence/authorship sort) — absent for ordinary text slots,
    // reusable by any future Journey's own non-text slot.
    structuredAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    answeredAt: { type: String, default: null },
  },
  { _id: false }
);

// One Journey attempt's worth of slot-by-slot Q&A — a separate collection
// rather than living on User.journeyPurchases[], for the same reason
// MeasureResult is its own collection rather than living on User: this
// grows turn-by-turn and shouldn't require rewriting the whole User
// document (every other purchase's data included) on every single answer.
//
// Exactly one session per purchase (purchaseId unique-indexed), created
// lazily on first slot exchange, not at purchase-grant time. Resumable
// while in progress (currentSlotIndex tracks where to continue after an
// app restart); immutable once completedAt is set — no route mutates a
// session after completion, a re-visit routes straight to the reflection
// screen using the stored answers.
const journeySessionSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  journey: { type: String, enum: JOURNEY_KEYS, required: true },
  purchaseId: { type: String, required: true, unique: true },
  currentSlotIndex: { type: Number, default: 0 },
  slots: { type: [slotRecordSchema], default: [] },
  startedAt: { type: String, required: true },
  completedAt: { type: String, default: null },
});

export default mongoose.model("JourneySession", journeySessionSchema);
