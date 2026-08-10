import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { CONSENT_VERSION } from "../stores.js";
import { sendPasswordResetEmail } from "../email.js";
import { EMAIL_RE } from "../validators.js";

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_REQUEST_COOLDOWN_MS = 60 * 1000;
const RESET_MAX_ATTEMPTS = 5;

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function register(req, res) {
  const { username, password, privacyPolicyAccepted, adminCode, email } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }

  if (!privacyPolicyAccepted) {
    return res.status(400).json({ error: "You must accept the privacy policy to create an account" });
  }

  // Normalize an empty/whitespace-only string to the same "no email"
  // state as omitting the field entirely — the User schema's unique index
  // on email is `sparse`, which only exempts documents where the field is
  // truly absent/null from the uniqueness check. A stored "" is a real,
  // indexed value, so a second account also saved with "" would collide
  // on that index (E11000 duplicate key), surfacing as "email already
  // exists" to someone who never actually entered one. Trimming and
  // treating "" the same as not-provided closes that regardless of what
  // the client sends.
  const normalizedEmail = email && email.trim() ? email.trim() : null;

  if (normalizedEmail && !EMAIL_RE.test(normalizedEmail)) {
    return res.status(400).json({ error: "That doesn't look like a valid email" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();
  const isAdmin = Boolean(process.env.ADMIN_SIGNUP_CODE) && adminCode === process.env.ADMIN_SIGNUP_CODE;

  try {
    const user = await User.create({
      username,
      passwordHash,
      role: isAdmin ? "admin" : "user",
      createdAt: now,
      email: normalizedEmail ? normalizedEmail.toLowerCase() : null,
      privacyPolicy: {
        accepted: true,
        version: CONSENT_VERSION,
        timestamp: now,
      },
      consent: {
        psychologicalData: {
          given: false,
          version: null,
          timestamp: null,
          log: [],
        },
      },
    });

    res.status(201).json({ token: signToken(user), username: user.username, role: user.role });
  } catch (err) {
    if (err.code === 11000) {
      // keyValue (the actual field/value that collided) is the reliable
      // signal here — keyPattern's key order isn't guaranteed to put the
      // colliding field first, so reading Object.keys(keyPattern)[0] can
      // report the wrong field name (e.g. "Email already in use" for a
      // username collision) even though err.code correctly identified a
      // real duplicate-key error.
      const field = Object.keys(err.keyValue ?? {})[0];
      return res.status(409).json({
        error: field === "email" ? "Email already in use" : "Username already taken",
      });
    }
    throw err;
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ token: signToken(user), username: user.username, role: user.role });
}

// Requires the current password — for a logged-in user updating their password.
export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  const user = await User.findOne({ id: req.user.id });
  if (!user) return res.status(404).json({ error: "User not found" });

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ success: true });
}

function generateResetCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// Always responds the same way regardless of whether the username/email
// exists, to avoid leaking account existence. Silently no-ops if the
// account has no email on file — there's nowhere to send the code.
export async function requestPasswordReset(req, res) {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: "username is required" });
  }

  const genericResponse = { success: true };

  const user = await User.findOne({ username });
  if (!user?.email) {
    return res.json(genericResponse);
  }

  const now = Date.now();
  const requestedAt = user.passwordReset?.requestedAt ? new Date(user.passwordReset.requestedAt).getTime() : 0;
  if (now - requestedAt < RESET_REQUEST_COOLDOWN_MS) {
    return res.json(genericResponse);
  }

  const code = generateResetCode();
  user.passwordReset = {
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: new Date(now + RESET_CODE_TTL_MS).toISOString(),
    attempts: 0,
    requestedAt: new Date(now).toISOString(),
  };
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, code);
  } catch (err) {
    console.error("Failed to send password reset email:", err.message);
  }

  res.json(genericResponse);
}

export async function resetPassword(req, res) {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) {
    return res.status(400).json({ error: "username, code, and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }

  const user = await User.findOne({ username });
  const reset = user?.passwordReset;

  if (!user || !reset?.codeHash || !reset.expiresAt || new Date(reset.expiresAt).getTime() < Date.now()) {
    return res.status(400).json({ error: "Invalid or expired code" });
  }
  if (reset.attempts >= RESET_MAX_ATTEMPTS) {
    return res.status(400).json({ error: "Too many attempts — request a new code" });
  }

  const valid = await bcrypt.compare(code, reset.codeHash);
  if (!valid) {
    user.passwordReset.attempts += 1;
    await user.save();
    return res.status(400).json({ error: "Invalid or expired code" });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordReset = { codeHash: null, expiresAt: null, attempts: 0, requestedAt: null };
  await user.save();

  res.json({ success: true });
}
