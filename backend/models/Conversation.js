import mongoose from "mongoose";
import { randomUUID } from "crypto";

const conversationSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  philosopherId: { type: String, required: true },
  messages: { type: [mongoose.Schema.Types.Mixed], required: true },
  // The MeasureResult.id this conversation followed, if opened via
  // "Talk about it" from a reading — null for a free-standing Guide chat.
  measureResultId: { type: String, default: null },
  savedAt: { type: String, required: true },
});

export default mongoose.model("Conversation", conversationSchema);
