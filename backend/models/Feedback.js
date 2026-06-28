import mongoose from "mongoose";
import { randomUUID } from "crypto";

const feedbackSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, default: null },
  conversationId: { type: String, default: null },
  philosopherId: { type: String, required: true },
  rating: { type: Number, required: true },
  note: { type: String, default: null },
  submittedAt: { type: String, required: true },
});

export default mongoose.model("Feedback", feedbackSchema);
