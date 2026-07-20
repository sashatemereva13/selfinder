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
  // works once an email is on file. `sparse` lets many users share `null`
  // without tripping the unique index.
  email: { type: String, default: null, unique: true, sparse: true, lowercase: true, trim: true },
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
  // One-time code for the forgot-password flow. codeHash is bcrypt'd like
  // the password itself; cleared on successful reset or left to expire.
  passwordReset: {
    codeHash: { type: String, default: null },
    expiresAt: { type: String, default: null },
    attempts: { type: Number, default: 0 },
    requestedAt: { type: String, default: null },
  },
});

export default mongoose.model("User", userSchema);
