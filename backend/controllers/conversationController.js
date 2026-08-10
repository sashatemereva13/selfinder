import Conversation from "../models/Conversation.js";

export async function saveConversation(req, res) {
  const { philosopherId, messages, measureResultId } = req.body;

  if (!philosopherId || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "philosopherId and a non-empty messages array are required" });
  }

  const conversation = await Conversation.create({
    userId: req.user.id,
    philosopherId,
    messages,
    measureResultId: measureResultId || null,
    savedAt: new Date().toISOString(),
  });

  res.json({ id: conversation.id });
}

export async function getConversation(req, res) {
  const conversation = await Conversation.findOne({ id: req.params.id });
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  if (conversation.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  res.json(conversation);
}

// Powers Your Arc's rich re-entry — "the conversation that followed this
// reading," found by the measureResultId link saved alongside the
// conversation (see guideChatStore.ts's flushPendingSave). Most recent
// first in the unlikely case more than one conversation links to the same
// reading; the caller only shows the newest.
export async function getConversationsByMeasureResult(req, res) {
  const conversations = await Conversation.find({
    userId: req.user.id,
    measureResultId: req.params.measureResultId,
  }).sort({ savedAt: -1 });
  res.json(conversations);
}
