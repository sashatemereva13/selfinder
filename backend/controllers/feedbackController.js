import Feedback from "../models/Feedback.js";

export async function postFeedback(req, res) {
  const { conversationId, philosopherId, rating, note } = req.body;

  if (!philosopherId || rating === undefined) {
    return res.status(400).json({ error: "philosopherId and rating are required" });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be a number between 1 and 5" });
  }

  const feedback = await Feedback.create({
    userId: req.user?.id ?? null,
    conversationId: conversationId ?? null,
    philosopherId,
    rating,
    note: note ?? null,
    submittedAt: new Date().toISOString(),
  });

  res.json({ success: true, id: feedback.id });
}

// Admin-only: review feedback submitted across all users.
export async function getAllFeedback(req, res) {
  res.json(await Feedback.find());
}
