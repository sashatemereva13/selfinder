import { conversations, feedbackStore, measureResults, users, CONSENT_VERSION } from "../stores.js";

export function getMe(req, res) {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    privacyPolicy: user.privacyPolicy,
    consent: {
      psychologicalData: {
        given: user.consent.psychologicalData.given,
        version: user.consent.psychologicalData.version,
        timestamp: user.consent.psychologicalData.timestamp,
      },
    },
  });
}

// Right of access + portability — Art. 15 + 20
export function exportMyData(req, res) {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const userConversations = [...conversations.values()].filter((c) => c.userId === req.user.id);
  const userMeasures = measureResults.filter((r) => r.userId === req.user.id);
  const userFeedback = feedbackStore.filter((f) => f.userId === req.user.id);

  res.json({
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
    },
    privacyPolicy: user.privacyPolicy,
    consent: user.consent,
    conversations: userConversations,
    measureResults: userMeasures,
    feedback: userFeedback,
  });
}

// Right to erasure — Art. 17
export function deleteMe(req, res) {
  const idx = users.findIndex((u) => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: "User not found" });

  for (const [id, conv] of conversations) {
    if (conv.userId === req.user.id) conversations.delete(id);
  }
  for (let i = measureResults.length - 1; i >= 0; i--) {
    if (measureResults[i].userId === req.user.id) measureResults.splice(i, 1);
  }
  for (let i = feedbackStore.length - 1; i >= 0; i--) {
    if (feedbackStore[i].userId === req.user.id) feedbackStore.splice(i, 1);
  }

  users.splice(idx, 1);
  res.json({ success: true });
}

// Grant special-category consent — Art. 9(2)(a)
export function grantConsent(req, res) {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const now = new Date().toISOString();
  user.consent.psychologicalData.given = true;
  user.consent.psychologicalData.version = CONSENT_VERSION;
  user.consent.psychologicalData.timestamp = now;
  user.consent.psychologicalData.log.push({ action: "grant", timestamp: now, version: CONSENT_VERSION });

  res.json({
    success: true,
    consent: { psychologicalData: { given: true, version: CONSENT_VERSION, timestamp: now } },
  });
}

// Withdraw consent — Art. 7(3); also deletes stored conversations
export function withdrawConsent(req, res) {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  for (const [id, conv] of conversations) {
    if (conv.userId === req.user.id) conversations.delete(id);
  }

  const now = new Date().toISOString();
  user.consent.psychologicalData.given = false;
  user.consent.psychologicalData.timestamp = now;
  user.consent.psychologicalData.log.push({ action: "withdraw", timestamp: now });

  res.json({ success: true });
}
