import test from "node:test";
import assert from "node:assert/strict";

// Every Groq call in this file goes through this stub, so each test decides
// what the classifier "says" — or that it fails.
process.env.GROQ_API_KEY = "test-only";
let classifier = () => { throw new Error("not set"); };
globalThis.fetch = async (_url, init) => {
  const reply = classifier(JSON.parse(init.body));
  if (reply instanceof Error) throw reply;
  return new Response(JSON.stringify({ choices: [{ message: { content: reply } }] }), {
    status: 200, headers: { "content-type": "application/json" },
  });
};
const { detectSelfHarm } = await import("../utils/moderateWish.js");
const { mentionsCrisis } = await import("../../shared/crisisPhrases.mjs");

const DANGER = "I want to die and I don't know what to do";
const HEAVY = "Today was awful and I feel completely alone";

test("the classifier decides when it answers", async () => {
  classifier = () => '{"category":"self-harm"}';
  assert.equal(await detectSelfHarm(HEAVY), true);
  classifier = () => '{"category":"ok"}';
  assert.equal(await detectSelfHarm(DANGER), false); // its call, not the list's
});

test("a classifier outage falls back to the phrase list instead of 'no'", async () => {
  classifier = () => new Error("network down");
  assert.equal(await detectSelfHarm(DANGER), true);
  assert.equal(await detectSelfHarm(HEAVY), false); // heavy feelings never trigger it
});

test("an unreadable or unexpected answer counts as a failed check", async () => {
  for (const reply of ["sorry, I can't help with that", '{"category":"maybe"}', "{}"]) {
    classifier = () => reply;
    assert.equal(await detectSelfHarm(DANGER), true, reply);
  }
});

test("text past the classifier's window is still checked", async () => {
  let classifiedLength = 0;
  classifier = (body) => { classifiedLength = body.messages.at(-1).content.length; return '{"category":"ok"}'; };
  const longMeasure = "My body feels tired. ".repeat(250) + "\n\n" + DANGER; // danger sits past 4,000 chars
  assert.ok(longMeasure.indexOf(DANGER) > 4000);
  assert.equal(await detectSelfHarm(longMeasure), true);
  assert.ok(classifiedLength <= 4000);
});

test("the shared list matches in both languages, phrases not single words", () => {
  assert.equal(mentionsCrisis("я не хочу жить"), true);
  assert.equal(mentionsCrisis("This deadline will be the death of me", "I could die laughing"), false);
});
