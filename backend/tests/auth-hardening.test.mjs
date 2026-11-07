import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import "../db.js"; // applies the app-wide sanitizeFilter setting
import { requireAuth, requireRole } from "../middleware/auth.js";
import { signSessionToken, verifySessionToken } from "../utils/tokens.js";
import { loginAccountLimiter, loginIpLimiter, registerLimiter } from "../middleware/aiRequestLimits.js";
import User from "../models/User.js";

process.env.JWT_SECRET = "test-only-secret-for-auth-hardening";
// authController pulls in the email client, which needs a key at import time.
process.env.RESEND_API_KEY ??= "re_test_only";
const { login, changePassword } = await import("../controllers/authController.js");

const accounts = new Map();
User.findOne = (filter) => ({ lean: async () => accounts.get(filter.id) ?? null });

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function runRequireAuth(token) {
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = responseRecorder();
  let nextCalled = false;
  await requireAuth(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

// --- Revocation (tokenVersion) -------------------------------------------

test("a token from before a password change is refused", async () => {
  accounts.set("u1", { id: "u1", username: "a", role: "user", tokenVersion: 0 });
  const oldToken = signSessionToken({ id: "u1", username: "a", role: "user", tokenVersion: 0 });
  assert.equal((await runRequireAuth(oldToken)).nextCalled, true);

  accounts.set("u1", { id: "u1", username: "a", role: "user", tokenVersion: 1 }); // password changed
  const after = await runRequireAuth(oldToken);
  assert.equal(after.nextCalled, false);
  assert.equal(after.res.statusCode, 401);

  const newToken = signSessionToken({ id: "u1", username: "a", role: "user", tokenVersion: 1 });
  assert.equal((await runRequireAuth(newToken)).nextCalled, true);
});

test("a token for a deleted account is refused", async () => {
  const token = signSessionToken({ id: "gone", username: "g", role: "user" });
  assert.equal((await runRequireAuth(token)).nextCalled, false);
});

test("role comes from the database, not the token", async () => {
  // Signed as admin, but the account has since been demoted.
  accounts.set("u2", { id: "u2", username: "b", role: "user", tokenVersion: 0 });
  const token = signSessionToken({ id: "u2", username: "b", role: "admin" });
  const { req } = await runRequireAuth(token);
  assert.equal(req.user.role, "user");
  const res = responseRecorder();
  let nextCalled = false;
  requireRole("admin")(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("changing the password bumps tokenVersion and returns a fresh token", async () => {
  const bcrypt = (await import("bcrypt")).default;
  const doc = {
    id: "u3", username: "c", role: "user", tokenVersion: 2,
    passwordHash: await bcrypt.hash("old-password", 4),
    saved: false,
    async save() { this.saved = true; },
  };
  const original = User.findOne;
  User.findOne = async () => doc;
  try {
    const res = responseRecorder();
    await changePassword({ user: { id: "u3" }, body: { currentPassword: "old-password", newPassword: "new-password" } }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(doc.tokenVersion, 3);
    assert.equal(doc.saved, true);
    assert.equal(verifySessionToken(res.body.token).tv, 3);
  } finally {
    User.findOne = original;
  }
});

// --- Issuer / audience ----------------------------------------------------

test("new session tokens carry issuer and audience", () => {
  const claims = verifySessionToken(signSessionToken({ id: "x", username: "x", role: "user" }));
  assert.equal(claims.iss, "selfinder");
  assert.equal(claims.aud, "selfinder-session");
});

test("pre-audience session tokens work until 2026-12-15, then stop", () => {
  const legacy = jwt.sign({ id: "x", username: "x", role: "user" }, process.env.JWT_SECRET, { expiresIn: "30d" });
  assert.doesNotThrow(() => verifySessionToken(legacy, Date.parse("2026-12-14T23:59:00Z")));
  assert.throws(() => verifySessionToken(legacy, Date.parse("2026-12-15T00:00:00Z")));
});

test("a token with some other audience is not a session", () => {
  const other = jwt.sign({ id: "x" }, process.env.JWT_SECRET, { expiresIn: "1h", audience: "something-else", issuer: "selfinder" });
  assert.throws(() => verifySessionToken(other));
});

// --- NoSQL injection ------------------------------------------------------

test("login refuses non-string credentials before touching the database", async () => {
  let queried = false;
  const original = User.findOne;
  User.findOne = async () => { queried = true; return null; };
  try {
    for (const body of [
      { username: { $ne: null }, password: "x" },
      { username: "a", password: { $gt: "" } },
      { username: ["a"], password: "x" },
    ]) {
      const res = responseRecorder();
      await login({ body }, res);
      assert.equal(res.statusCode, 400, JSON.stringify(body));
    }
    assert.equal(queried, false);
  } finally {
    User.findOne = original;
  }
});

test("sanitizeFilter turns a smuggled operator into a literal value", () => {
  const Probe = mongoose.models.SanitizeProbe ?? mongoose.model("SanitizeProbe", new mongoose.Schema({ username: String }));
  const query = Probe.find({ username: { $ne: null } });
  query._castConditions();
  assert.deepEqual(query.getFilter(), { username: { $eq: { $ne: null } } });
});

test("a deliberately trusted operator still works", () => {
  const Probe = mongoose.models.SanitizeProbe;
  const query = Probe.find({ username: mongoose.trusted({ $ne: null }) });
  query._castConditions();
  assert.equal(JSON.stringify(query.getFilter()), JSON.stringify({ username: { $ne: null } }));
});

// --- Rate limits ------------------------------------------------------------

test("login and register are rate limited", async () => {
  const { readFile } = await import("node:fs/promises");
  const routes = await readFile(new URL("../routes/auth.js", import.meta.url), "utf8");
  assert.match(routes, /router\.post\("\/register",\s*registerLimiter,\s*register\)/);
  assert.match(routes, /router\.post\("\/login",\s*loginIpLimiter,\s*loginAccountLimiter,\s*login\)/);
  for (const limiter of [loginAccountLimiter, loginIpLimiter, registerLimiter]) {
    assert.equal(typeof limiter, "function");
  }
});
