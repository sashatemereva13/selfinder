import test from "node:test";
import assert from "node:assert/strict";
import { ALLOWED_EVENT_NAMES, prepareEventBatch, validateEvent, validateEventProperties, validOccurredAt } from "../utils/eventValidation.js";

const now = Date.parse("2026-10-28T12:00:00.000Z");
const occurredAt = new Date(now).toISOString();

test("known events with their exact property shapes are accepted", () => {
  assert.equal(ALLOWED_EVENT_NAMES.has("measure_started"), true);
  assert.equal(validateEvent({ name: "measure_started", occurredAt }, now), true);
  assert.equal(validateEvent({
    name: "onboarding_completed",
    properties: { philosopher: "socrates", choice: "measure" },
    occurredAt,
  }, now), true);
  assert.equal(validateEvent({
    name: "daily_reminder_enabled",
    properties: { hour: 8, minute: 30 },
    occurredAt,
  }, now), true);
  assert.equal(validateEvent({
    name: "onboarding_walk",
    properties: { ms_since_view: 1200, skipped_intro: false },
    occurredAt,
  }, now), true);
});

test("unknown events and unexpected property keys are rejected", () => {
  assert.equal(validateEvent({ name: "made_up", occurredAt }, now), false);
  assert.equal(validateEvent({
    name: "measure_started", properties: { message: "private text" }, occurredAt,
  }, now), false);
  assert.equal(validateEventProperties("cards_drawn", { card: "x", extra: "x" }), false);
});

test("property values must have the expected type and bounded size", () => {
  assert.equal(validateEventProperties("cards_drawn", { card: "card-1" }), true);
  assert.equal(validateEventProperties("cards_drawn", { card: "x".repeat(81) }), false);
  assert.equal(validateEventProperties("daily_reminder_enabled", { hour: 24, minute: 0 }), false);
  assert.equal(validateEventProperties("daily_reminder_enabled", { hour: 8, minute: 2.5 }), false);
  assert.equal(validateEventProperties("onboarding_walk", { ms_since_view: -1, skipped_intro: true }), false);
  assert.equal(validateEventProperties("onboarding_walk", { ms_since_view: 10, skipped_intro: "no" }), false);
});

test("timestamps must be canonical ISO values within the accepted age window", () => {
  assert.equal(validOccurredAt(occurredAt, now), true);
  assert.equal(validOccurredAt("not-a-date", now), false);
  assert.equal(validOccurredAt(new Date(now - 31 * 24 * 60 * 60 * 1000).toISOString(), now), false);
  assert.equal(validOccurredAt(new Date(now + 6 * 60 * 1000).toISOString(), now), false);
});

test("event batches enforce size and metadata bounds and keep only valid events", () => {
  const valid = { name: "measure_started", occurredAt };
  const accepted = prepareEventBatch({
    events: [valid, { name: "unknown", occurredAt }],
    anonymousId: "install-123",
    platform: "ios",
  }, now);
  assert.equal(accepted.docs.length, 1);
  assert.equal(accepted.docs[0].properties, null);

  const tooMany = prepareEventBatch({
    events: Array(21).fill(valid), anonymousId: "install-123", platform: "ios",
  }, now);
  assert.match(tooMany.error, /no more than 20/);
  assert.ok(prepareEventBatch({ events: [valid], anonymousId: "x".repeat(81), platform: "ios" }, now).error);
  assert.ok(prepareEventBatch({ events: [valid], anonymousId: "install-123", platform: "desktop" }, now).error);
});

test("events route applies a per-source rate limiter", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../routes/events.js", import.meta.url), "utf8");
  assert.match(source, /router\.post\("\/",\s*eventsRateLimiter,\s*postEvents\)/);
});
