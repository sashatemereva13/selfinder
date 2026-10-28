const MAX_STRING_LENGTH = 80;
const MAX_EVENT_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
export const MAX_EVENT_BATCH_SIZE = 20;
const enumValue = (...values) => (value) => typeof value === "string" && values.includes(value);
const identifierValue = (maxLength) => (value) => typeof value === "string" &&
  value.length > 0 && value.length <= maxLength && /^[a-z0-9_-]+$/i.test(value);

const STRING_FIELDS = {
  onboarding_completed: {
    philosopher: enumValue("socrates", "stoics", "kierkegaard", "camus", "aristotle"),
    choice: enumValue("measure", "explore"),
  },
  tune_in_played: { state: enumValue("Calm", "Deep Rest", "Sleep") },
  level_detail_viewed: { slug: identifierValue(60) },
  cards_drawn: { card: identifierValue(MAX_STRING_LENGTH) },
  cards_talk_about_it: { card: identifierValue(MAX_STRING_LENGTH) },
  cards_spill_it: { card: identifierValue(MAX_STRING_LENGTH) },
};

const NUMERIC_FIELDS = {
  daily_reminder_enabled: {
    hour: (value) => Number.isInteger(value) && value >= 0 && value <= 23,
    minute: (value) => Number.isInteger(value) && value >= 0 && value <= 59,
  },
};

const BOOLEAN_FIELDS = {
  onboarding_walk: { skipped_intro: true },
};

const NUMBER_FIELDS = {
  onboarding_walk: { ms_since_view: (value) => Number.isInteger(value) && value >= 0 && value <= 3_600_000 },
};

const NO_PROPERTY_EVENTS = new Set([
  "measure_started",
  "measure_completed",
  "spill_started",
  "spill_completed",
  "guide_first_meeting_shown",
  "guide_message_sent",
  "feeling_lucky_viewed",
  "history_transcript_viewed",
]);

export const ALLOWED_EVENT_NAMES = new Set([
  ...NO_PROPERTY_EVENTS,
  ...Object.keys(STRING_FIELDS),
  ...Object.keys(NUMERIC_FIELDS),
  ...Object.keys(BOOLEAN_FIELDS),
  ...Object.keys(NUMBER_FIELDS),
]);

export function validateEventProperties(name, properties) {
  const value = properties ?? {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const schema = {
    ...(STRING_FIELDS[name] ?? {}),
    ...(NUMERIC_FIELDS[name] ?? {}),
    ...(BOOLEAN_FIELDS[name] ?? {}),
    ...(NUMBER_FIELDS[name] ?? {}),
  };
  const keys = Object.keys(value);
  if (keys.length !== Object.keys(schema).length || keys.some((key) => !Object.hasOwn(schema, key))) return false;

  for (const [key, rule] of Object.entries(schema)) {
    const property = value[key];
    if (typeof rule === "number") {
      if (typeof property !== "string" || !property.trim() || property.length > rule) return false;
    } else if (typeof rule === "function") {
      if (!rule(property)) return false;
    } else if (typeof rule === "boolean" && typeof property !== "boolean") {
      return false;
    }
  }
  return true;
}

export function validOccurredAt(value, now = Date.now()) {
  if (typeof value !== "string" || value.length > 40) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString() === value &&
    timestamp >= now - MAX_EVENT_AGE_MS && timestamp <= now + MAX_FUTURE_SKEW_MS;
}

export function validateEvent(event, now = Date.now()) {
  return !!event && typeof event === "object" && !Array.isArray(event) &&
    ALLOWED_EVENT_NAMES.has(event.name) &&
    validateEventProperties(event.name, event.properties) &&
    validOccurredAt(event.occurredAt, now);
}

export function prepareEventBatch({ events, anonymousId, platform }, now = Date.now()) {
  if (!Array.isArray(events) || events.length === 0) return { error: "events must be a non-empty array" };
  if (events.length > MAX_EVENT_BATCH_SIZE) return { error: `events must contain no more than ${MAX_EVENT_BATCH_SIZE} items` };
  if (typeof anonymousId !== "string" || !anonymousId.trim() || anonymousId.length > 80) {
    return { error: "anonymousId is invalid" };
  }
  if (!["ios", "android", "web"].includes(platform)) return { error: "platform is invalid" };

  const docs = events.filter((event) => validateEvent(event, now)).map((event) => ({
    name: event.name,
    anonymousId,
    platform,
    properties: Object.keys(event.properties ?? {}).length ? event.properties : null,
    occurredAt: event.occurredAt,
  }));
  if (docs.length === 0) return { error: "no valid events in batch" };
  return { docs };
}
