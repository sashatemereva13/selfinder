import Feedback from "../models/Feedback.js";
import User from "../models/User.js";

// Anonymous feedback (req.user unset, via optionalAuth) carries no identity,
// so there's nothing for a psychological-data consent gate to protect — the
// note isn't linked to anyone. A signed-in user attaching their account to
// free-text feedback is the case that actually needs the same Art. 9(2)(a)
// gate MeasureResult/Conversation already use, so it's checked here rather
// than via the shared requireConsent middleware (which assumes requireAuth
// already ran and would throw on an anonymous request).
export async function postFeedback(req, res) {
  const { conversationId, philosopherId, rating, note } = req.body;

  if (!philosopherId || rating === undefined) {
    return res.status(400).json({ error: "philosopherId and rating are required" });
  }

  if (typeof rating !== "number" || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be a number between 1 and 5" });
  }

  if (req.user?.id) {
    const user = await User.findOne({ id: req.user.id });
    if (!user?.consent?.psychologicalData?.given) {
      return res.status(403).json({
        error: "Consent for storing psychological data is required.",
        code: "CONSENT_REQUIRED",
      });
    }
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
