// Manually grants one Center purchase for an account — for comps, support
// goodwill, or testing, until real StoreKit/Play Billing receipt sync
// exists. Unlike grantArcSubscription.js, this PUSHES a new entry onto
// User.centerPurchases (see models/User.js) rather than overwriting a
// single flag — Center is a repeatable, one-time-purchase experience, not
// an ongoing subscription, so running this twice grants two independent
// purchases, each with its own seedNonce (used by kaleidoscopeData.ts's
// seedFromLog to make each purchase's generated result genuinely
// different, even against unchanged reading history). No --revoke: there
// is nothing meaningful to "undo" about a past generated result.
//
// Usage (from backend/):
//   node scripts/grantCenter.js <username>
import "dotenv/config";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const [, , username] = process.argv;
if (!username) {
  console.error("usage: node scripts/grantCenter.js <username>");
  process.exit(1);
}

await connectDB();

const user = await User.findOne({ username });
if (!user) {
  console.error(`No account found with username "${username}"`);
  await mongoose.disconnect();
  process.exit(1);
}

user.centerPurchases.push({
  source: "manual",
  purchasedAt: new Date().toISOString(),
  seedNonce: Date.now(),
});
await user.save();

console.log(
  `Granted a Center purchase for "${username}" (id: ${user.id}) — ${user.centerPurchases.length} total.`
);
await mongoose.disconnect();
