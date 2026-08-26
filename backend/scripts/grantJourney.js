// Manually grants one Journey purchase for an account — for comps, support
// goodwill, or testing, until real StoreKit/Play Billing receipt sync
// exists. Unlike grantArcSubscription.js, this PUSHES a new entry onto
// User.journeyPurchases (see models/User.js) rather than overwriting a
// single flag — a Journey is a repeatable, one-time-purchase experience,
// not an ongoing subscription, so running this twice grants two independent
// purchases, each with its own seedNonce (used by kaleidoscopeData.ts's
// seedFromLog, or the equivalent for a future Journey, to make each
// purchase's generated result genuinely different, even against unchanged
// reading history). No --revoke: there is nothing meaningful to "undo"
// about a past generated result.
//
// Renamed from grantCenter.js (2026-08-23 pivot) once Center generalized
// into the first of an open-ended "Journey" family — see RULES.md's
// Product/positioning section. No Your Arc subscription is required to
// grant or use a Journey purchase; that gate was reversed in the same
// pivot.
//
// Usage (from backend/):
//   node scripts/grantJourney.js <username> <journey>
//   node scripts/grantJourney.js alice center
import "dotenv/config";
import { connectDB } from "../db.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { JOURNEY_KEYS as VALID_JOURNEYS } from "../../shared/journeyKeys.mjs";

const [, , username, journey] = process.argv;
if (!username || !journey) {
  console.error("usage: node scripts/grantJourney.js <username> <journey>");
  console.error(`  <journey> must be one of: ${VALID_JOURNEYS.join(", ")}`);
  process.exit(1);
}
if (!VALID_JOURNEYS.includes(journey)) {
  console.error(`Unknown journey "${journey}" — must be one of: ${VALID_JOURNEYS.join(", ")}`);
  process.exit(1);
}

await connectDB();

const user = await User.findOne({ username });
if (!user) {
  console.error(`No account found with username "${username}"`);
  await mongoose.disconnect();
  process.exit(1);
}

user.journeyPurchases.push({
  journey,
  source: "manual",
  purchasedAt: new Date().toISOString(),
  seedNonce: Date.now(),
});
await user.save();

const total = user.journeyPurchases.filter((p) => p.journey === journey).length;
console.log(
  `Granted a "${journey}" purchase for "${username}" (id: ${user.id}) — ${total} total for this journey.`
);
await mongoose.disconnect();
