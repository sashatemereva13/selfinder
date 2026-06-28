import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { CONSENT_VERSION } from "../stores.js";

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function register(req, res) {
  const { username, password, privacyPolicyAccepted, adminCode } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  if (!privacyPolicyAccepted) {
    return res.status(400).json({ error: "You must accept the privacy policy to create an account" });
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
      return res.status(409).json({ error: "Username already taken" });
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
