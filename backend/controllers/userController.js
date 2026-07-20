import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import MeasureResult from "../models/MeasureResult.js";
import Feedback from "../models/Feedback.js";
import { CONSENT_VERSION } from "../stores.js";
import { EMAIL_RE } from "../validators.js";

export async function getMe(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

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

  const [userConversations, userMeasures, userFeedback] = await Promise.all([
    Conversation.find({ userId: req.user.id }),
    MeasureResult.find({ userId: req.user.id }),
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
    feedback: userFeedback,
  });
}

// Right to erasure — Art. 17
export async function deleteMe(req, res) {
  const user = await User.findOneAndDelete({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  await Promise.all([
    Conversation.deleteMany({ userId: req.user.id }),
    MeasureResult.deleteMany({ userId: req.user.id }),
    Feedback.deleteMany({ userId: req.user.id }),
  ]);

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

// Withdraw consent — Art. 7(3); also deletes stored conversations and measure results
export async function withdrawConsent(req, res) {
  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  await Promise.all([
    Conversation.deleteMany({ userId: req.user.id }),
    MeasureResult.deleteMany({ userId: req.user.id }),
  ]);

  const now = new Date().toISOString();
  user.consent.psychologicalData.given = false;
  user.consent.psychologicalData.timestamp = now;
  user.consent.psychologicalData.log.push({ action: "withdraw", timestamp: now });
  await user.save();

  res.json({ success: true });
}
