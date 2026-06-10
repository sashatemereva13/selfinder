import { randomUUID } from "crypto";
import { conversations } from "../stores.js";

export function saveConversation(req, res) {
  const { philosopherId, messages } = req.body;

  if (!philosopherId || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "philosopherId and a non-empty messages array are required" });
  }

  const id = randomUUID();
  conversations.set(id, {
    id,
    userId: req.user.id,
    philosopherId,
    messages,
    savedAt: new Date().toISOString(),
  });

  res.json({ id });
}

export function getConversation(req, res) {
  const conversation = conversations.get(req.params.id);
  if (!conversation) return res.status(404).json({ error: "Conversation not found" });
  if (conversation.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  res.json(conversation);
}
