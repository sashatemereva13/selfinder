import Event from "../models/Event.js";

// Fixed allow-list — the only real abuse guard this endpoint has right now
// (it has no auth), and it keeps the event log meaningful rather than
// accepting arbitrary client-supplied names.
const ALLOWED_EVENT_NAMES = new Set([
  "onboarding_completed",
  "measure_started",
  "measure_completed",
  "spill_started",
  "spill_completed",
  "guide_first_meeting_shown",
  "guide_message_sent",
  "tune_in_played",
  "feeling_lucky_viewed",
  "level_detail_viewed",
  "daily_reminder_enabled",
  "history_transcript_viewed",
  "cards_drawn",
  "cards_talk_about_it",
  "cards_spill_it",
]);

const MAX_BATCH_SIZE = 20;

export async function postEvents(req, res) {
  const { events, anonymousId, platform } = req.body;

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: "events must be a non-empty array" });
  }
  if (!anonymousId || typeof anonymousId !== "string") {
    return res.status(400).json({ error: "anonymousId is required" });
  }
  if (platform !== "ios" && platform !== "android" && platform !== "web") {
    return res.status(400).json({ error: 'platform must be "ios", "android", or "web"' });
  }

  const docs = events
    .slice(0, MAX_BATCH_SIZE)
    .filter((event) => event && ALLOWED_EVENT_NAMES.has(event.name))
    .map((event) => ({
      name: event.name,
      anonymousId,
      platform,
      properties: event.properties ?? null,
      occurredAt: event.occurredAt || new Date().toISOString(),
    }));

  if (docs.length === 0) {
    return res.status(400).json({ error: "no valid events in batch" });
  }

  try {
    await Event.insertMany(docs);
    res.json({ received: docs.length });
  } catch (err) {
    console.error("Failed to save events:", err.message);
    res.status(500).json({ error: "Failed to save events" });
  }
}
