import mongoose from "mongoose";
import { randomUUID } from "crypto";

const conversationSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  philosopherId: { type: String, required: true },
  messages: { type: [mongoose.Schema.Types.Mixed], required: true },
  savedAt: { type: String, required: true },
});

export default mongoose.model("Conversation", conversationSchema);
