import mongoose from "mongoose";
import { randomUUID } from "crypto";

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
  // The real entitlement source of truth (Selfinder+) — replaces the old
  // client-only, per-device isSubscribed dev toggle for any signed-in
  // account. `source: "manual"` is an admin-granted account (e.g. the
  // founder's own account, a comp, support goodwill); "apple"/"google" are
  // reserved for when real StoreKit/Play Billing receipt sync lands —
  // nothing writes those yet. `expiresAt: null` means "doesn't expire"
  // (appropriate for manual grants); a store-synced subscription would set
  // a real expiry and get refreshed on renewal/cancellation webhooks.
  subscription: {
    active: { type: Boolean, default: false },
    source: { type: String, enum: ["manual", "apple", "google"], default: null },
    expiresAt: { type: String, default: null },
    grantedAt: { type: String, default: null },
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
