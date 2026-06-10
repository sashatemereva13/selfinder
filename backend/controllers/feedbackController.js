import { randomUUID } from "crypto";
import { feedbackStore } from "../stores.js";

export function postFeedback(req, res) {
  const { conversationId, philosopherId, rating, note } = req.body;

  if (!philosopherId || rating === undefined) {
    return res.status(400).json({ error: "philosopherId and rating are required" });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be a number between 1 and 5" });
  }

  const feedback = {
    id: randomUUID(),
    conversationId: conversationId ?? null,
    philosopherId,
    rating,
    note: note ?? null,
    submittedAt: new Date().toISOString(),
  };

  feedbackStore.push(feedback);
  res.json({ success: true, id: feedback.id });
}
