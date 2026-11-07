import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { requireAuth, optionalAuth } from "../middleware/auth.js";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";
import { AI_DISCLOSURE_VERSION, grantAiProcessingConsent } from "../controllers/aiConsentController.js";
import { signSessionToken } from "../utils/tokens.js";
import User from "../models/User.js";

process.env.JWT_SECRET = "test-only-secret-for-session-separation";

// requireAuth looks the account up; these tests run without MongoDB.
const accounts = new Map([["user-123", { id: "user-123", username: "sasha", role: "user", tokenVersion: 0 }]]);
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

async function anonymousConsentGrant() {
  const res = responseRecorder();
  await grantAiProcessingConsent({ body: { accepted: true, version: AI_DISCLOSURE_VERSION } }, res);
  return res.body.token;
}

// The 2026-11-07 P0: an anonymous consent grant was accepted as a sign-in,
// with no account id — which Mongoose turned into "match everyone".
test("a consent grant from the public endpoint is not a session", async () => {
  const { res, nextCalled } = await runRequireAuth(await anonymousConsentGrant());
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
});

test("a consent grant signed the pre-fix way is not a session either", async () => {
  const legacy = jwt.sign(
    { purpose: "ai_processing_consent", version: AI_DISCLOSURE_VERSION },
    process.env.JWT_SECRET,
    { expiresIn: "1h", audience: "selfinder-ai-processing" }
  );
  assert.equal((await runRequireAuth(legacy)).nextCalled, false);
});

test("a correctly signed token without an account id is rejected", async () => {
  for (const payload of [{}, { id: "" }, { id: 42 }, { username: "x", role: "admin" }]) {
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    assert.equal((await runRequireAuth(token)).nextCalled, false, JSON.stringify(payload));
  }
});

test("an unsigned (alg: none) token is rejected", async () => {
  const token = jwt.sign({ id: "someone" }, null, { algorithm: "none" });
  assert.equal((await runRequireAuth(token)).nextCalled, false);
});

test("optionalAuth treats a consent grant as anonymous", async () => {
  const req = { headers: { authorization: `Bearer ${await anonymousConsentGrant()}` } };
  let nextCalled = false;
  await optionalAuth(req, responseRecorder(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.equal(req.user, undefined);
});

test("a real session token still signs in", async () => {
  const token = signSessionToken({ id: "user-123", username: "sasha", role: "user" });
  const { req, nextCalled } = await runRequireAuth(token);
  assert.equal(nextCalled, true);
  assert.equal(req.user.id, "user-123");
});

test("a session token is not accepted as AI consent", () => {
  const token = signSessionToken({ id: "user-123", username: "sasha", role: "user" });
  const res = responseRecorder();
  let nextCalled = false;
  requireAiProcessingConsent({ get: () => token }, res, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("consent grants issued before the fix keep working for AI consent", () => {
  const legacy = jwt.sign(
    { purpose: "ai_processing_consent", version: AI_DISCLOSURE_VERSION },
    process.env.JWT_SECRET,
    { expiresIn: "1h", audience: "selfinder-ai-processing" }
  );
  let nextCalled = false;
  requireAiProcessingConsent({ get: () => legacy }, responseRecorder(), () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
