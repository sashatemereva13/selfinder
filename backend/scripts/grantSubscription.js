// Manually grants (or revokes) Selfinder+ for one account — for comps,
// support goodwill, or the founder's own account, until real StoreKit/Play
// Billing receipt sync exists to do this automatically. Sets
// User.subscription (see models/User.js), the real entitlement source of
// truth the app now checks via useIsSubscribed.ts.
//
// Usage (from backend/):
//   node scripts/grantSubscription.js <username>          # grant
//   node scripts/grantSubscription.js <username> --revoke  # revoke
import "dotenv/config";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const [, , username, flag] = process.argv;
if (!username) {
  console.error("usage: node scripts/grantSubscription.js <username> [--revoke]");
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
  user.subscription = { active: false, source: null, expiresAt: null, grantedAt: null };
} else {
  user.subscription = {
    active: true,
    source: "manual",
    expiresAt: null,
    grantedAt: new Date().toISOString(),
  };
}
await user.save();

console.log(
  `${revoke ? "Revoked" : "Granted"} Selfinder+ for "${username}" (id: ${user.id}).`
);
await mongoose.disconnect();
