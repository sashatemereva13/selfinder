import mongoose from "mongoose";
import { randomUUID } from "crypto";

// A Crossing brings together a present reading and an active wish (and,
// optionally, one past wish the user chose to carry into it) into ONE
// philosopher-voiced question — never a conclusion, never a generated
// answer. The USER's answer, not the philosopher's question, is the
// thing worth keeping — see crossingController.js's own generation-
// prompt comment for the hard content boundary this depends on (quote
// facts, never assert a pattern or reason).
const crossingSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  wishId: { type: String, required: true },
  measureResultId: { type: String, required: true },
  // The past wish the user explicitly chose to carry into this Crossing,
  // if any — null is a fully legitimate case (present + active wish
  // alone is enough to generate a question; see collaboration notes on
  // why this is optional, not required, for the first build).
  pastWishId: { type: String, default: null },
  philosopherId: { type: String, required: true },
  question: { type: String, required: true },
  // Null until the user actually answers — a generated-but-unanswered
  // Crossing still exists (so eligibility checks can find it and not
  // regenerate a new one for the same wish+reading pair), but isn't a
  // "kept" moment until answered.
  answer: { type: String, default: null },
  createdAt: { type: String, required: true },
  answeredAt: { type: String, default: null },
});

export default mongoose.model("Crossing", crossingSchema);
