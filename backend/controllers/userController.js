import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import MeasureResult from "../models/MeasureResult.js";
import SpillEntry from "../models/SpillEntry.js";
import Feedback from "../models/Feedback.js";
import { CONSENT_VERSION } from "../stores.js";
import { EMAIL_RE } from "../validators.js";

export async function getMe(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  // Cheap count, not the full history — backs the client's free-trial
  // progress display (useArcTrialStatus.ts, "N of 7 free readings saved")
  // without paying for a full getMeasureHistory fetch just to measure its
  // length. Real count regardless of subscription status; the client
  // decides what it means (a subscribed account has no trial limit to
  // compare it against).
  const savedReadingCount = await MeasureResult.countDocuments({ userId: req.user.id });

  res.json({
    id: user.id,
    username: user.username,
    role: user.role,
    createdAt: user.createdAt,
    email: user.email,
    privacyPolicy: user.privacyPolicy,
    consent: {
      psychologicalData: {
        given: user.consent.psychologicalData.given,
        version: user.consent.psychologicalData.version,
        timestamp: user.consent.psychologicalData.timestamp,
      },
    },
    arcSubscription: {
      active: user.arcSubscription?.active ?? false,
      source: user.arcSubscription?.source ?? null,
      expiresAt: user.arcSubscription?.expiresAt ?? null,
    },
    savedReadingCount,
    // Full purchase list, not just a count/latest — the client needs every
    // past purchase's own id/journey/seedNonce to render a Journey's
    // browsable history (see mobile/app/center.tsx). Renamed from
    // centerPurchases (2026-08-23) once Center generalized into the first
    // of an open-ended Journey family — see RULES.md's Product/positioning
    // section.
    journeyPurchases: (user.journeyPurchases ?? []).map((p) => ({
      id: p.id,
      journey: p.journey,
      source: p.source,
      purchasedAt: p.purchasedAt,
      seedNonce: p.seedNonce,
    })),
  });
}

// Lets an existing account add/update the email on file — required for the
// forgot-password flow to work, since accounts don't collect one at signup.
export async function updateEmail(req, res) {
  const { email } = req.body;
  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "A valid email is required" });
  }

  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  user.email = email.toLowerCase().trim();
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: "Email already in use" });
    }
    throw err;
  }

  res.json({ success: true, email: user.email });
}

// Right of access + portability — Art. 15 + 20
export async function exportMyData(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  const [userConversations, userMeasures, userSpillEntries, userFeedback] = await Promise.all([
    Conversation.find({ userId: req.user.id }),
    MeasureResult.find({ userId: req.user.id }),
    SpillEntry.find({ userId: req.user.id }),
    Feedback.find({ userId: req.user.id }),
  ]);

  res.json({
    exportedAt: new Date().toISOString(),
    profile: {
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      email: user.email,
    },
    privacyPolicy: user.privacyPolicy,
    consent: user.consent,
    conversations: userConversations,
    measureResults: userMeasures,
    spillEntries: userSpillEntries,
    feedback: userFeedback,
  });
}

// Right to erasure — Art. 17. Deletes child collections before the User
// document itself (same ordering as withdrawConsent below) — if the process
// dies partway through, the failure mode is "user still exists, some data
// gone" (recoverable by retrying deletion) rather than orphaned
// psychological-data rows referencing a userId that no longer resolves to
// any account.
export async function deleteMe(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  await Promise.all([
    Conversation.deleteMany({ userId: req.user.id }),
    MeasureResult.deleteMany({ userId: req.user.id }),
    SpillEntry.deleteMany({ userId: req.user.id }),
    Feedback.deleteMany({ userId: req.user.id }),
  ]);

  await User.deleteOne({ id: req.user.id });

  res.json({ success: true });
}

// Grant special-category consent — Art. 9(2)(a)
export async function grantConsent(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  const now = new Date().toISOString();
  user.consent.psychologicalData.given = true;
  user.consent.psychologicalData.version = CONSENT_VERSION;
  user.consent.psychologicalData.timestamp = now;
  user.consent.psychologicalData.log.push({ action: "grant", timestamp: now, version: CONSENT_VERSION });
  await user.save();

  res.json({
    success: true,
    consent: { psychologicalData: { given: true, version: CONSENT_VERSION, timestamp: now } },
  });
}

// Withdraw consent — Art. 7(3); also deletes stored conversations, measure
// results, kept Spill entries, and feedback notes (the same collections
// deleteMe clears — withdrawing consent stops psychological-data storage
// without deleting the account itself, so it should remove exactly the same
// special-category data a full account deletion would).
export async function withdrawConsent(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  await Promise.all([
    Conversation.deleteMany({ userId: req.user.id }),
    MeasureResult.deleteMany({ userId: req.user.id }),
    SpillEntry.deleteMany({ userId: req.user.id }),
    Feedback.deleteMany({ userId: req.user.id }),
  ]);

  const now = new Date().toISOString();
  user.consent.psychologicalData.given = false;
  user.consent.psychologicalData.timestamp = now;
  user.consent.psychologicalData.log.push({ action: "withdraw", timestamp: now });
  await user.save();

  res.json({ success: true });
}
