import mongoose from "mongoose";
import { randomUUID } from "crypto";
import { JOURNEY_KEYS } from "../../shared/journeyKeys.mjs";

const consentLogEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    timestamp: { type: String, required: true },
    version: String,
  },
  { _id: false },
);

const userSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: "user" },
  createdAt: { type: String, required: true },
  // Optional — existing accounts predate this field. Forgot-password only
  // works once an email is on file. The unique index is declared with a
  // partialFilterExpression below (not `sparse` here) — a sparse index
  // only exempts documents where the field is truly *absent*, but every
  // account is written with an explicit `email: null` (see
  // authController.js), so a plain sparse index still saw two `null`s as
  // a real collision. A partial index keyed on `$type: "string"` only
  // enforces uniqueness once an email is actually a string.
  email: { type: String, default: null, lowercase: true, trim: true },
  privacyPolicy: {
    accepted: { type: Boolean, default: false },
    version: String,
    timestamp: String,
  },
  consent: {
    psychologicalData: {
      given: { type: Boolean, default: false },
      version: { type: String, default: null },
      timestamp: { type: String, default: null },
      log: { type: [consentLogEntrySchema], default: [] },
    },
  },
  // Your Arc — the ongoing, cheap record-access subscription (2026-08-22:
  // renamed from the old single `subscription` field once Selfinder+ was
  // split into two differently-shaped products — see RULES.md's Product/
  // positioning section). `source: "manual"` is an admin-granted account
  // (e.g. the founder's own account, a comp, support goodwill);
  // "apple"/"google" are reserved for when real StoreKit/Play Billing
  // receipt sync lands — nothing writes those yet. `expiresAt: null`
  // means "doesn't expire" (appropriate for manual grants); a store-
  // synced subscription would set a real expiry and get refreshed on
  // renewal/cancellation webhooks.
  arcSubscription: {
    active: { type: Boolean, default: false },
    source: { type: String, enum: ["manual", "apple", "google"], default: null },
    expiresAt: { type: String, default: null },
    grantedAt: { type: String, default: null },
  },
  // Journeys — repeatable, one-time-purchase experiences, standalone from
  // Your Arc (2026-08-23 pivot: generalized from the old Center-only
  // `centerPurchases` field once Center became the first of an open-ended
  // family; see RULES.md's Product/positioning section). An ARRAY, not a
  // boolean: each purchase is its own entitlement record AND its own
  // generated result, browsable individually — never "owned once" the way
  // arcSubscription's flag is. `journey` is a discriminator, not a
  // separate array per product, so a future Journey is a one-line enum
  // edit here, never a schema migration. seedNonce feeds
  // kaleidoscopeData.ts's seedFromLog (Center) or the equivalent for a
  // future Journey, alongside the real reading history, so THIS purchase
  // always regenerates the same result on revisit, while a new purchase
  // (a new array entry, a new nonce) produces a genuinely different one
  // even against unchanged history. No longer requires an active
  // arcSubscription to purchase or use — that gate was reversed in the
  // same pivot; Your Arc's role is additive (connecting Journey results
  // longitudinally over time), not a prerequisite. `journey`'s valid keys
  // now come from shared/journeyKeys.mjs — the single source of truth
  // this schema and mobile/src/types/index.ts's JourneyKey union both
  // import, instead of two (or three, counting products.tsx) independent
  // lists.
  journeyPurchases: {
    type: [
      {
        id: { type: String, default: () => randomUUID() },
        journey: { type: String, enum: JOURNEY_KEYS, required: true },
        // "free" added 2026-08-28 — Selfinder is fully free for now (no
        // legal entity yet to receive real payment, see RULES.md's
        // Product/positioning section), so a signed-in user self-grants
        // a "purchase" entry the first time they open a Journey (see
        // journeyController.js's postJourneyPurchase) rather than an
        // admin running grantJourney.js on their behalf. Kept distinct
        // from "manual" so the data itself still tells the difference
        // between an admin comp and normal free-tier usage once real
        // payment exists again.
        source: { type: String, enum: ["manual", "apple", "google", "free"], required: true },
        purchasedAt: { type: String, required: true },
        seedNonce: { type: Number, required: true },
      },
    ],
    default: [],
  },
  // One-time code for the forgot-password flow. codeHash is bcrypt'd like
  // the password itself; cleared on successful reset or left to expire.
  passwordReset: {
    codeHash: { type: String, default: null },
    expiresAt: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    requestedAt: { type: String, default: null },
  },
});

userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string" } } },
);

export default mongoose.model("User", userSchema);
