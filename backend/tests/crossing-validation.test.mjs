import test from "node:test";
import assert from "node:assert/strict";

process.env.GROQ_API_KEY = "test-only";
const { generateCrossing } = await import("../controllers/crossingController.js");
const { default: Wish } = await import("../models/Wish.js");
const { default: Crossing } = await import("../models/Crossing.js");

function responseRecorder() {
  return { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
}

const base = { wishId: "w1", measureResultId: "m1", philosopherId: "camus", levelName: "Courage", locale: "en" };

// Stop right after validation: an existing Crossing is returned as-is.
Wish.findOne = async () => ({ id: "w1", userId: "u1", text: "x" });
Crossing.findOne = async () => ({ id: "c1", question: "q" });

test("no earlier wish (null, as the app sends it) is accepted", async () => {
  const res = responseRecorder();
  await generateCrossing({ user: { id: "u1" }, body: { ...base, pastWishId: null } }, res);
  assert.equal(res.statusCode, 200);
});

test("a pastWishId that isn't a plain string is refused", async () => {
  for (const pastWishId of [{ $ne: null }, ["w2"], 42, ""]) {
    const res = responseRecorder();
    await generateCrossing({ user: { id: "u1" }, body: { ...base, pastWishId } }, res);
    assert.equal(res.statusCode, 400, JSON.stringify(pastWishId));
  }
});
