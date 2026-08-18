import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import ArcLine from "../models/ArcLine.js";
import MeasureResult from "../models/MeasureResult.js";
import Wish from "../models/Wish.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
// Same model/param story as crossingController.js's CROSSING_MODEL — see
// that file's own comment (llama-3.3-70b-versatile decommission, then
// gpt-oss-120b's reasoning_effort/max_tokens tuning).
const ARC_LINE_MODEL = "openai/gpt-oss-120b";
const ARC_LINE_REASONING_EFFORT = "low";

const RUSSIAN_REPLY_INSTRUCTION =
  "\n\nRespond in Russian. Write naturally as a fluent Russian speaker would — do not translate word-for-word from English; express the same voice and meaning in idiomatic Russian.";

function localizedSystemPrompt(basePrompt, locale) {
  return locale === "ru" ? basePrompt + RUSSIAN_REPLY_INSTRUCTION : basePrompt;
}

// Server's own UTC calendar date — the idempotency key for "once per day."
// Deliberately simple (no per-user timezone lookup exists anywhere else in
// this backend either): worst case, a user near a UTC day boundary gets a
// fresh line up to ~12h earlier/later than their own local midnight, which
// is a non-issue for a once-a-day ambient line.
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Same content boundary as crossingController.js's buildCrossingPrompt —
// this is the Cover page's own version of the identical discipline: quote
// or lightly paraphrase REAL facts about this person's own record, never
// assert a pattern, reason, or conclusion about them. See RULES.md
// ("History is the product... never analysis of it") and
// crossingController's own header comment for the full reasoning; this
// prompt exists because the Cover page previously showed only static
// copy that never changed visit to visit (see collaboration notes on
// wanting it to "show something relevant... relate to the history of
// that user"), and the fix has to hold the same anti-profiling line
// Crossing already draws, not loosen it for a lower-stakes page.
function buildArcLinePrompt({ readingCount, sinceDate, streakDays, latestLevelName, wishText }) {
  const facts = [
    `They have taken ${readingCount} reading${readingCount === 1 ? "" : "s"} since ${sinceDate}.`,
    streakDays >= 2 ? `They have measured every day for the last ${streakDays} days.` : null,
    latestLevelName ? `Their most recent reading was ${latestLevelName}.` : null,
    wishText ? `What they are currently wishing for, in their own words: "${wishText}"` : null,
  ].filter(Boolean).join("\n");

  return `You are about to write ONE short line for this person, in your own voice, to greet them as they open their own record of past readings ("Your Arc") — using only the real facts given below, nothing else.

${facts}

Write ONE line, in your voice — either a brief remark or a short question — that acknowledges they are looking at their own record right now.

Hard rules, no exceptions:
- Pick exactly ONE of the facts above to reference — either the reading count/streak, OR the most recent level, OR the wish. Never combine two facts, and never draw a connection between them.
- If you reference the wish, only quote or closely paraphrase its words — do NOT ask whether it is closer, nearer, resonating, sitting well, helped by anything, or any variant of progress/effect. The wish is not a target to evaluate.
- Never ask what "draws them back," what they are "looking for," or anything else that presumes a reason or motive behind the fact — a fact may be stated or asked about directly, never explained.
- Never state or imply a pattern, a reason, or a cause ("this suggests," "it seems like," "you tend to," "again," "still," "this shows").
- Never assert anything about who they are, how they have changed, or what they feel.
- Never judge whether their record is good or bad, or whether they are doing "well."
- Under 20 words total. No preamble, no "Here is a line" — output only the line itself, in character, nothing else.`;
}

// Idempotent per user+philosopher+day, same "never regenerate once
// something exists" discipline as Crossing — Your Arc's Cover page calls
// this once per visit; a cached hit costs no Groq call at all.
export async function getArcLine(req, res) {
  const { systemPrompt, locale, philosopherId } = req.body;

  if (!systemPrompt || !philosopherId) {
    return res.status(400).json({ error: "systemPrompt and philosopherId are required" });
  }

  const dateKey = todayKey();

  const existing = await ArcLine.findOne({ userId: req.user.id, philosopherId, dateKey });
  if (existing) {
    return res.json({ line: existing.line, cached: true });
  }

  const [readings, wishes] = await Promise.all([
    MeasureResult.find({ userId: req.user.id }).sort({ savedAt: 1 }),
    Wish.find({ userId: req.user.id }).sort({ savedAt: -1 }).limit(1),
  ]);

  if (readings.length === 0) {
    return res.status(404).json({ error: "No reading history yet" });
  }

  const readingCount = readings.length;
  const sinceDate = new Date(readings[0].savedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const latestLevelName = readings[readings.length - 1].vibrationLevel?.name ?? null;

  const daysWithReading = new Set(
    readings.map((r) => new Date(r.savedAt).toISOString().slice(0, 10))
  );
  let streakDays = 0;
  const cursor = new Date();
  const todayHasReading = daysWithReading.has(cursor.toISOString().slice(0, 10));
  if (!todayHasReading) cursor.setUTCDate(cursor.getUTCDate() - 1);
  while (daysWithReading.has(cursor.toISOString().slice(0, 10))) {
    streakDays += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const wishText = wishes[0]?.text ?? null;

  const prompt = buildArcLinePrompt({ readingCount, sinceDate, streakDays, latestLevelName, wishText });

  try {
    const response = await groq.chat.completions.create({
      model: ARC_LINE_MODEL,
      max_tokens: 900,
      temperature: 0.7,
      reasoning_effort: ARC_LINE_REASONING_EFFORT,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES + "\n\n" + systemPrompt, locale) },
        { role: "user", content: prompt },
      ],
    });

    const line = response.choices[0].message.content.trim();
    if (!line) throw new Error("Empty arc line");

    await ArcLine.create({
      userId: req.user.id,
      philosopherId,
      dateKey,
      line,
      createdAt: new Date().toISOString(),
    });

    res.json({ line, cached: false });
  } catch (err) {
    console.error("Arc line generation failed:", err.message);
    res.status(500).json({ error: "Arc line generation failed" });
  }
}
