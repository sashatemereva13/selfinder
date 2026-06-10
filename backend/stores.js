// Shared in-memory stores.
// Swap each Map/array for a real DB call when you're ready to persist.

export const CONSENT_VERSION = "1.0";

// conversations: Map<id, { id, userId, philosopherId, messages, savedAt }>
export const conversations  = new Map();
// feedbackStore: Array<{ id, userId?, conversationId?, philosopherId, rating, note, submittedAt }>
export const feedbackStore  = [];
// measureResults: Array<{ id, userId?, vibrationScore, vibrationLevel, band, dominantAxis, recommendedPhilosopher, savedAt }>
export const measureResults = [];
// users: Array<{ id, username, passwordHash, role, createdAt, privacyPolicy, consent }>
export const users          = [];
