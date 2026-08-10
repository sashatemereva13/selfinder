import mongoose from "mongoose";
import { randomUUID } from "crypto";

// A Spill entry the user explicitly chose to keep ("keep this moment"),
// not an auto-save of everything ever written — see spillController.js.
// Unstructured free text, unlike MeasureResult's qaPairs — Spill has no
// sphere/question shape to preserve, it's a single free-write.
const spillEntrySchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  text: { type: String, required: true },
  savedAt: { type: String, required: true },
});

export default mongoose.model("SpillEntry", spillEntrySchema);
