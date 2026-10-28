import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";
import { AI_DISCLOSURE_VERSION, grantAiProcessingConsent } from "../controllers/aiConsentController.js";

process.env.JWT_SECRET = "test-only-secret-for-consent-middleware";

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test("AI processing is denied without a consent grant", () => {
  const res = responseRecorder();
  let nextCalled = false;
  requireAiProcessingConsent({ get: () => undefined }, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, "AI_CONSENT_REQUIRED");
  assert.equal(nextCalled, false);
});

test("signed current consent grant is accepted", () => {
  const token = jwt.sign(
    { purpose: "ai_processing_consent", version: AI_DISCLOSURE_VERSION },
    process.env.JWT_SECRET,
    { audience: "selfinder-ai-processing", expiresIn: "1h" }
  );
  const res = responseRecorder();
  let nextCalled = false;
  const req = { get: (name) => name === "X-AI-Consent" ? token : undefined };
  requireAiProcessingConsent(req, res, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
  assert.deepEqual(req.aiConsent, { version: AI_DISCLOSURE_VERSION });
});

test("wrong-purpose grants are rejected before route handlers", () => {
  const token = jwt.sign(
    { purpose: "other", version: AI_DISCLOSURE_VERSION },
    process.env.JWT_SECRET,
    { audience: "selfinder-ai-processing", expiresIn: "1h" }
  );
  const res = responseRecorder();
  let nextCalled = false;
  requireAiProcessingConsent({ get: () => token }, res, () => { nextCalled = true; });
  assert.equal(res.statusCode, 403);
  assert.equal(nextCalled, false);
});

test("grant endpoint only issues a token for explicit, versioned acceptance", async () => {
  const res = responseRecorder();
  await grantAiProcessingConsent({ body: { accepted: true, version: AI_DISCLOSURE_VERSION } }, res);
  assert.equal(res.statusCode, 200);
  const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET, { audience: "selfinder-ai-processing" });
  assert.equal(decoded.purpose, "ai_processing_consent");
  assert.equal(decoded.version, AI_DISCLOSURE_VERSION);

  const denied = responseRecorder();
  await grantAiProcessingConsent({ body: { accepted: false, version: AI_DISCLOSURE_VERSION } }, denied);
  assert.equal(denied.statusCode, 400);
});
