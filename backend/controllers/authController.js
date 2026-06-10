import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { users, CONSENT_VERSION } from "../stores.js";

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export async function register(req, res) {
  const { username, password, privacyPolicyAccepted } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  if (!privacyPolicyAccepted) {
    return res.status(400).json({ error: "You must accept the privacy policy to create an account" });
  }

  if (users.find((u) => u.username === username)) {
    return res.status(409).json({ error: "Username already taken" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  const user = {
    id: randomUUID(),
    username,
    passwordHash,
    role: "user",
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
  };

  users.push(user);
  res.status(201).json({ token: signToken(user), username: user.username, role: user.role });
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required" });
  }

  const user = users.find((u) => u.username === username);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  res.json({ token: signToken(user), username: user.username, role: user.role });
}
