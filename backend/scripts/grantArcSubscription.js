// Manually grants (or revokes) Your Arc — the cheap, ongoing record-access
// subscription — for one account, for comps, support goodwill, or the
// founder's own account, until real StoreKit/Play Billing receipt sync
// exists to do this automatically. Sets User.arcSubscription (see
// models/User.js), the real entitlement source of truth the app checks via
// useArcSubscription.ts. Split from the old grantSubscription.js (2026-08-22)
// once Selfinder+ became two separate products — see grantCenter.js for the
// other one.
//
// Usage (from backend/):
//   node scripts/grantArcSubscription.js <username>          # grant
//   node scripts/grantArcSubscription.js <username> --revoke  # revoke
import "dotenv/config";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const [, , username, flag] = process.argv;
if (!username) {
  console.error("usage: node scripts/grantArcSubscription.js <username> [--revoke]");
  process.exit(1);
}
const revoke = flag === "--revoke";

await connectDB();

const user = await User.findOne({ username });
if (!user) {
  console.error(`No account found with username "${username}"`);
  await mongoose.disconnect();
  process.exit(1);
}

if (revoke) {
  user.arcSubscription = { active: false, source: null, expiresAt: null, grantedAt: null };
} else {
  user.arcSubscription = {
    active: true,
    source: "manual",
    expiresAt: null,
    grantedAt: new Date().toISOString(),
  };
}
await user.save();

console.log(
  `${revoke ? "Revoked" : "Granted"} Your Arc for "${username}" (id: ${user.id}).`
);
await mongoose.disconnect();
