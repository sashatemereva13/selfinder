import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import Crossing from "../models/Crossing.js";
import Wish from "../models/Wish.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const CROSSING_MODEL = "llama-3.3-70b-versatile";

// Same locale handling pattern as chatController.js (RUSSIAN_REPLY_INSTRUCTION)
// — kept as its own narrow copy rather than importing chatController's
// module-private helpers, same reasoning moderateWish.js already uses for
// its own small Groq setup: this is a distinct feature with a distinct,
// tightly-scoped prompt, not a general chat surface.
const RUSSIAN_REPLY_INSTRUCTION =
  "\n\nRespond in Russian. Write naturally as a fluent Russian speaker would — do not translate word-for-word from English; express the same voice and meaning in idiomatic Russian.";

function localizedSystemPrompt(basePrompt, locale) {
  return locale === "ru" ? basePrompt + RUSSIAN_REPLY_INSTRUCTION : basePrompt;
}

// The Crossing's ENTIRE safety model rests on this prompt never letting
// the model assert a pattern, reason, or conclusion about the person —
// only ONE new philosopher-voiced question, built by juxtaposing real
// quoted facts (the wish's own words, today's level name, a past wish's
// own words if one was chosen). See docs/session-result-concept.md and
// RULES.md's "the record is the product, never analysis of it" — this is
// the one place in the whole app that generates something NEW from two
// pieces of a person's private data, so the boundary has to be explicit,
// not just implied by a gentle tone. Confirmed with the user directly
// (2026-08-13 collaboration): quoting facts and juxtaposing them is
// allowed; naming a pattern, a reason, or using words like "again",
// "still", "this suggests", "you tend to" is not — those are exactly the
// off-brief moves RULES.md's Product/positioning section rules out for
// Your Arc specifically.
function buildCrossingPrompt({ wishText, levelName, pastWishText, pastWishDate }) {
  const pastMomentBlock = pastWishText
    ? `They also chose to carry in something they once wrote, on ${pastWishDate}:
"${pastWishText}"`
    : "";

  return `You are about to ask this person ONE question, in your own voice, using only the real facts given below — nothing else.

Here is what they wished for, in their own words:
"${wishText}"

Here is where they read today: ${levelName}.
${pastMomentBlock}

Write ONE question, in your voice, that simply places these facts next to each other and asks what is true right now. You may quote or closely paraphrase what they actually wrote — never invent detail they didn't give you.

Hard rules, no exceptions:
- Never state or imply a pattern, a reason, or a cause ("this suggests," "it seems like," "you tend to," "again," "still," "this shows").
- Never assert anything about who they are or what they feel — only ask.
- Never judge whether their wish has or hasn't happened, or whether today's reading is good or bad.
- End with an open question they answer in their own words — not multiple choice, not yes/no.
- Under 40 words total. No preamble, no "Here is a question" — output only the question itself, in character, nothing else.`;
}

// A Crossing is offered only when genuinely new material exists — never
// regenerated for the same wish+reading pair once one already exists
// (answered or not), so revisiting Your Arc doesn't re-offer the same
// thing repeatedly. Client checks eligibility via listMyCrossings before
// calling this.
export async function generateCrossing(req, res) {
  const { wishId, measureResultId, pastWishId, systemPrompt, levelName, locale } = req.body;

  if (!wishId || !measureResultId || !systemPrompt || !levelName) {
    return res.status(400).json({ error: "wishId, measureResultId, systemPrompt, and levelName are required" });
  }

  const wish = await Wish.findOne({ id: wishId });
  if (!wish || wish.userId !== req.user.id) {
    return res.status(404).json({ error: "Wish not found" });
  }

  const existing = await Crossing.findOne({ userId: req.user.id, wishId, measureResultId });
  if (existing) {
    return res.json({ id: existing.id, question: existing.question });
  }

  let pastWishText = null;
  let pastWishDate = null;
  if (pastWishId) {
    const pastWish = await Wish.findOne({ id: pastWishId });
    if (pastWish && pastWish.userId === req.user.id) {
      pastWishText = pastWish.text;
      pastWishDate = new Date(pastWish.savedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
  }

  const prompt = buildCrossingPrompt({ wishText: wish.text, levelName, pastWishText, pastWishDate });

  try {
    const response = await groq.chat.completions.create({
      model: CROSSING_MODEL,
      max_tokens: 120,
      temperature: 0.7,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES + "\n\n" + systemPrompt, locale) },
        { role: "user", content: prompt },
      ],
    });

    const question = response.choices[0].message.content.trim();
    if (!question) throw new Error("Empty Crossing question");

    const crossing = await Crossing.create({
      userId: req.user.id,
      wishId,
      measureResultId,
      pastWishId: pastWishId ?? null,
      philosopherId: req.body.philosopherId ?? "unknown",
      question,
      createdAt: new Date().toISOString(),
    });

    res.json({ id: crossing.id, question: crossing.question });
  } catch (err) {
    console.error("Crossing generation failed:", err.message);
    res.status(500).json({ error: "Crossing generation failed" });
  }
}

// Saves the user's OWN answer — this, not the generated question, is the
// thing worth keeping (see Crossing.js's own header comment). Never
// re-interpreted, never responded to — same "no content-echoing" rule
// the wish itself follows.
export async function answerCrossing(req, res) {
  const { answer } = req.body;
  if (typeof answer !== "string" || !answer.trim()) {
    return res.status(400).json({ error: "answer is required" });
  }

  const crossing = await Crossing.findOne({ id: req.params.id });
  if (!crossing) return res.status(404).json({ error: "Crossing not found" });
  if (crossing.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  crossing.answer = answer.trim();
  crossing.answeredAt = new Date().toISOString();
  await crossing.save();

  res.json({ id: crossing.id, answer: crossing.answer, answeredAt: crossing.answeredAt });
}

export async function listMyCrossings(req, res) {
  const crossings = await Crossing.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(crossings);
}
