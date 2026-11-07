import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";

// Selfinder signs two kinds of token, and each must only ever be accepted
// where it was meant to be:
//   - a session token (signed in as one account) — authController.signToken
//   - an AI-processing consent grant (anonymous, anyone can get one)
//
// Until 2026-11-07 both were signed with the same JWT_SECRET, and the session
// check didn't look at what kind of token it had. A consent grant therefore
// passed requireAuth with no `id`, and Mongoose drops `{ id: undefined }`
// from a filter — so `findOne({ id: undefined })` matched the first account
// and `deleteMany({ userId: undefined })` matched every user's data.
//
// Two independent guards now keep the kinds apart:
//   1. Separate keys. The consent key is derived from JWT_SECRET with HMAC,
//      so a consent grant's signature can't verify as a session token, and
//      no new environment variable is needed to deploy this.
//   2. A shape check. A session token must carry a non-empty string `id` and
//      none of the consent grant's markers — so even a mistake in (1) can't
//      produce an account-less "signed-in" request.

const ALGORITHMS = ["HS256"];
const CONSENT_AUDIENCE = "selfinder-ai-processing";

function sessionKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

function consentKey() {
  return createHmac("sha256", sessionKey())
    .update("selfinder/ai-processing-consent/v1")
    .digest("hex");
}

export function signSessionToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    sessionKey(),
    { algorithm: "HS256", expiresIn: "30d" }
  );
}

// Throws unless the token is a valid session token for a real account id.
export function verifySessionToken(token) {
  const payload = jwt.verify(token, sessionKey(), { algorithms: ALGORITHMS });
  if (
    typeof payload !== "object" || payload === null ||
    typeof payload.id !== "string" || payload.id.length === 0 ||
    payload.aud !== undefined || payload.purpose !== undefined
  ) {
    throw new Error("Not a session token");
  }
  return payload;
}

export function signConsentToken(version) {
  return jwt.sign(
    { purpose: "ai_processing_consent", version },
    consentKey(),
    { algorithm: "HS256", expiresIn: "365d", audience: CONSENT_AUDIENCE }
  );
}

// Grants issued before 2026-11-07 were signed with JWT_SECRET itself. They're
// still accepted *here* (never by verifySessionToken) so nobody is asked to
// consent again. They last 365 days, so remove this fallback after
// 2027-11-07.
export function verifyConsentToken(token) {
  const options = { algorithms: ALGORITHMS, audience: CONSENT_AUDIENCE };
  try {
    return jwt.verify(token, consentKey(), options);
  } catch {
    return jwt.verify(token, sessionKey(), options);
  }
}
