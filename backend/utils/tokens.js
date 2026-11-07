import { createHmac } from "node:crypto";
import jwt from "jsonwebtoken";

// Selfinder signs two kinds of token, and each must only ever be accepted
// where it was meant to be:
//   - a session token (signed in as one account) — signSessionToken
//   - an AI-processing consent grant (anonymous, anyone can get one)
//
// Until 2026-11-07 both were signed with the same JWT_SECRET, and the session
// check didn't look at what kind of token it had. A consent grant therefore
// passed requireAuth with no `id`, and Mongoose drops `{ id: undefined }`
// from a filter — so `findOne({ id: undefined })` matched the first account
// and `deleteMany({ userId: undefined })` matched every user's data.
//
// Three independent guards now keep the kinds apart:
//   1. Separate keys. The consent key is derived from JWT_SECRET with HMAC,
//      so a consent grant's signature can't verify as a session token, and
//      no new environment variable is needed to deploy this.
//   2. Audience. Each kind names who it is for (`aud`), and each check
//      demands its own.
//   3. A shape check. A session token must carry a non-empty string `id` —
//      so even a mistake in (1) or (2) can't produce an account-less
//      "signed-in" request.

const ALGORITHMS = ["HS256"];
const ISSUER = "selfinder";
const SESSION_AUDIENCE = "selfinder-session";
const CONSENT_AUDIENCE = "selfinder-ai-processing";

// Session tokens issued before `iss`/`aud` were added (2026-11-07) don't
// carry them. They live 30 days, and the app swaps its token for a fresh one
// daily, so after this date every live token has them. From then on a token
// without them is refused automatically — no one has to remember to delete
// this branch for the rule to take effect.
const LEGACY_SESSION_TOKENS_ACCEPTED_UNTIL = Date.parse("2026-12-15T00:00:00Z");

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

// `tv` (token version) lets the server revoke every token issued before a
// password change: the account's tokenVersion goes up, and requireAuth
// refuses any token still carrying the old number.
export function signSessionToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role, tv: user.tokenVersion ?? 0 },
    sessionKey(),
    { algorithm: "HS256", expiresIn: "30d", issuer: ISSUER, audience: SESSION_AUDIENCE }
  );
}

// Throws unless the token is a validly signed session token for an account
// id. It does NOT check the account still exists or the token hasn't been
// revoked — requireAuth does that against the database.
export function verifySessionToken(token, now = Date.now()) {
  const payload = jwt.verify(token, sessionKey(), { algorithms: ALGORITHMS });
  if (typeof payload !== "object" || payload === null) throw new Error("Not a session token");

  const isLegacy = payload.aud === undefined && payload.iss === undefined;
  const isCurrent = payload.aud === SESSION_AUDIENCE && payload.iss === ISSUER;
  if (!isCurrent && !(isLegacy && now < LEGACY_SESSION_TOKENS_ACCEPTED_UNTIL)) {
    throw new Error("Not a session token");
  }
  if (payload.purpose !== undefined || typeof payload.id !== "string" || payload.id.length === 0) {
    throw new Error("Not a session token");
  }
  if (payload.tv !== undefined && !Number.isInteger(payload.tv)) {
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
