import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import User from "../models/User.js";
import JourneySession from "../models/JourneySession.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Same model roster as chatController.js — kept as its own local copy
// rather than importing from there, matching "no shared client wrapper,
// every controller calls the Groq SDK directly" (see that file's own
// history of why models[0]/[1] are what they are).
const models = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];
const QWEN_MODEL = "qwen/qwen3.6-27b";
const QWEN_REASONING_TOKEN_HEADROOM = 2800;
const GPT_OSS_REASONING_EFFORT = "low";

// Local copy of chatController.js's resolveModelParams — see that file's
// own comment for why "hidden" (not reasoning_effort: "none") is used for
// Qwen, and why gpt-oss models need their own explicit reasoning_effort.
function resolveModelParams(locale, fallbackModel, fallbackMaxTokens) {
  if (locale === "ru") {
    return {
      model: QWEN_MODEL,
      reasoning_effort: "default",
      reasoning_format: "hidden",
      max_tokens: fallbackMaxTokens + QWEN_REASONING_TOKEN_HEADROOM,
    };
  }
  return {
    model: fallbackModel,
    max_tokens: fallbackMaxTokens,
    ...(fallbackModel.startsWith("openai/gpt-oss-") ? { reasoning_effort: GPT_OSS_REASONING_EFFORT } : {}),
  };
}

const RUSSIAN_REPLY_INSTRUCTION =
  "\n\nRespond in Russian. Write naturally as a fluent Russian speaker would — do not translate word-for-word from English; express the same voice and meaning in idiomatic Russian.";

function localizedSystemPrompt(basePrompt, locale) {
  return locale === "ru" ? basePrompt + RUSSIAN_REPLY_INSTRUCTION : basePrompt;
}

// Journey-family-generic — not per-philosopher (Journeys are
// philosopher-agnostic, see docs/journeys-concept.md) and not
// Control-specific, since every future Journey uses this same engine.
const JOURNEY_SYSTEM_PROMPT = `You are guiding someone through a Journey — a fixed, carefully designed sequence of reflection questions (called "slots") that helps them discover their own answer to one question that matters to them. The sequence itself was designed in advance and never changes: you may only ever rephrase the exact next fixed question you are given, in your own voice, referencing what the person has already said in this same session so it feels specific to them rather than generic. You may never skip a slot, reorder slots, invent a new question, or ask about anything the fixed sequence doesn't already call for.

You may: ask, clarify, reflect a feeling back in your own words, reconnect something they said earlier to what they're saying now, and gently notice a contradiction if one appears in their own words.

You may never: diagnose them, interpret an unconscious motive as fact, tell them what they feel or think, tell them what they should do, or state anything about them as true that isn't already contained in their own words above. The discovery belongs entirely to them — your only job is to ask well and listen.`;

// Local copy of chatController.js's JSON-extraction pattern (already
// duplicated 4x within that file itself — this is consistent with the
// existing convention there, not a new anti-pattern).
function extractJson(text) {
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) return null;
  try {
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
  } catch {
    return null;
  }
}

// Confirms the requesting user actually owns a purchase of this journey
// with this id — prevents one account writing into another's session via
// a guessed purchaseId, since a journeyPurchases[] entry has no auth of
// its own beyond living inside the owning User document.
async function ownsPurchase(userId, journey, purchaseId) {
  const user = await User.findOne({ id: userId });
  return !!user?.journeyPurchases?.some((p) => p.id === purchaseId && p.journey === journey);
}

// POST /api/journeys/exchange — one call per turn. Combines two jobs in a
// single Groq call: classify the answer just given (advance / goBack /
// stuck-so-ask-again — directly ported from postMeasureExchange's own
// decision tree, see chatController.js), and, only if advancing, phrase
// the NEXT fixed slot's question live, referencing everything said so far
// in this session. This "phrase the next question" step is the one
// genuinely new capability Journeys need beyond what Measure's exchange
// endpoint already does (Measure's questions are static/client-authored;
// a Journey's AI must phrase its own fixed next question every time).
export async function postJourneyExchange(req, res) {
  const {
    purchaseId,
    journey,
    slotIndex,
    slotId,
    baseQuestion,
    nextBaseQuestion,
    priorSlots,
    answer,
    canGoBack,
    priorAsideCount,
    totalSlots,
    locale,
    structuredAnswer,
  } = req.body;

  if (!purchaseId || !journey || !Number.isInteger(slotIndex) || !slotId || !baseQuestion || typeof answer !== "string") {
    return res.status(400).json({ error: "purchaseId, journey, slotIndex, slotId, baseQuestion, and answer are required" });
  }

  const owns = await ownsPurchase(req.user.id, journey, purchaseId);
  if (!owns) {
    return res.status(403).json({ error: "No matching journey purchase for this account" });
  }

  let session = await JourneySession.findOne({ userId: req.user.id, purchaseId });
  if (session?.completedAt) {
    return res.status(409).json({ error: "This journey session is already complete" });
  }
  if (!session) {
    session = new JourneySession({
      userId: req.user.id,
      journey,
      purchaseId,
      startedAt: new Date().toISOString(),
      slots: [{ slotIndex: 0, slotId, baseQuestion, phrasedQuestion: baseQuestion }],
    });
  } else {
    // A slot record created by the PREVIOUS turn only knows its
    // phrasedQuestion (the AI-generated text) — it doesn't yet carry the
    // real slotId, since that's only known once the client actually
    // requests this slot. Reconcile from the client's own authored
    // content file (the source of truth for slotId/baseQuestion) now
    // that this slot is actually being answered. Looked up by the
    // slotIndex field, not raw array position — see persistExchange's
    // own comment for why.
    const existingSlot = session.slots.find((s) => s.slotIndex === slotIndex);
    if (existingSlot) {
      existingSlot.slotId = slotId;
      existingSlot.baseQuestion = baseQuestion;
    }
  }

  const goBackPossible = canGoBack === true;
  const stuckBefore = Number.isInteger(priorAsideCount) && priorAsideCount > 0 ? priorAsideCount : 0;
  const isLastSlot = slotIndex === totalSlots - 1;
  const priorSlotsText = Array.isArray(priorSlots) && priorSlots.length > 0
    ? priorSlots.map((s) => `"${s.question}" → "${s.answer}"`).join("\n")
    : "(this is the first question of the Journey)";

  const exchangePrompt = `Everything they've said so far in this Journey, in order:
${priorSlotsText}

You just asked, at question ${slotIndex + 1} of ${totalSlots}:
"${baseQuestion}"

They replied:
"${answer}"
${stuckBefore > 0 ? `\nThey have already gotten stuck on this exact question ${stuckBefore} time(s) before this reply — go smaller this time, not the same size again.\n` : ""}
First, check: are they asking to go back and reconsider an earlier answer? ${goBackPossible ? "Going back is possible right now." : "Going back is NOT possible right now — this is the first question, there is nothing before it yet."}

Respond with ONLY valid JSON, no markdown, no explanation, in exactly this shape (both "reply" and "nextQuestion" below are placeholders you must replace with real generated text — never output the literal words "reply" or "nextQuestion" or the punctuation shown here):
{"advance": true, "goBack": false, "reply": "<your one-sentence acknowledgment goes here>", "nextQuestion": "<your phrased version of the next question goes here, or null>"}

If they're asking to go back${goBackPossible ? "" : " (even though there's nothing to go back to yet)"}:
- Set "advance" to false, "nextQuestion" to null.
${goBackPossible
    ? `- Set "goBack" to true. "reply" is ONE short, warm sentence confirming you're taking them back to reconsider it.`
    : `- Set "goBack" to false. "reply" is ONE short sentence gently noting this is the first question, then invite them to answer what's in front of them.`}

Otherwise, decide: did they actually engage with the question — even in one word, tersely, vaguely, or emotionally? A short honest answer IS engagement. Only treat it as non-engagement if they asked you something back, pushed back, or said something that isn't really an answer at all.

If they engaged, set "advance" to true and "goBack" to false. "reply" is ONE short sentence (10-20 words) acknowledging what they shared, in your own words — do not just restate their words back. ${isLastSlot
    ? `This was the FINAL question — set "nextQuestion" to null, there is nothing after it.`
    : `Then set "nextQuestion" to the following fixed question, phrased in your own voice so it clearly and naturally references what they specifically just said — never a generic rewording, never a different question, never invented: "${nextBaseQuestion}"`}

If they did not really engage (and are not asking to go back), set "advance" to false, "goBack" to false, "nextQuestion" to null. If they asked you a genuine question, answer it honestly in your own voice. If they seem stuck or gave a vague non-answer, offer one small, concrete thing to notice right now, worded so it can be answered in a few words — do not repeat the same rephrasing move twice in a row.

Ground your reply only in what they actually wrote ("${answer}"), stay under 60 words, and never claim anything about them that isn't already in their own words above.`;

  try {
    const response = await groq.chat.completions.create({
      ...resolveModelParams(locale, models[1], 600),
      temperature: 0.5,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES + "\n\n" + JOURNEY_SYSTEM_PROMPT, locale) },
        { role: "user", content: exchangePrompt },
      ],
    });

    const parsed = extractJson(response.choices[0].message.content.trim());

    if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      throw new Error("Unparseable or empty reply from model");
    }

    const advance = parsed.advance !== false;
    const goBack = goBackPossible && parsed.goBack === true;
    // Fail-open-adjacent guard: even on a parsed, successful response, if
    // advance is true but the model didn't give usable next-question text
    // and this isn't the last slot, fall back to the raw authored line —
    // same discipline as the outer catch block below, just reached via a
    // different failure shape (a well-formed but incomplete response).
    // isPlaceholderText guards against the model echoing the prompt's own
    // JSON-shape example literally (confirmed live: "..." came back as
    // the actual value) rather than substituting real generated text.
    const isPlaceholderText = (s) => !s || !s.trim() || /^\.{2,}$/.test(s.trim());
    const nextQuestion = advance && !isLastSlot
      ? (typeof parsed.nextQuestion === "string" && !isPlaceholderText(parsed.nextQuestion) ? parsed.nextQuestion.trim() : nextBaseQuestion)
      : null;
    const isComplete = advance && isLastSlot;

    await persistExchange({ session, slotIndex, slotId, baseQuestion, nextBaseQuestion, answer, structuredAnswer, advance, goBack, reply: parsed.reply.trim(), nextQuestion, isComplete });

    return res.json({ advance, goBack, reply: parsed.reply.trim(), nextQuestion, isComplete });
  } catch (err) {
    console.error("Journey exchange failed:", err.message);
    // Fail open, adapted for Journeys: Measure's plain {advance:true,...}
    // fallback isn't enough here, because a Journey's next question isn't
    // known client-side the way Measure's static sphere questions are —
    // fall back to the client-supplied raw authored text, unphrased,
    // rather than leaving the client with nothing to show.
    const advance = true;
    const isComplete = isLastSlot;
    const nextQuestion = isLastSlot ? null : nextBaseQuestion ?? null;
    await persistExchange({ session, slotIndex, slotId, baseQuestion, nextBaseQuestion, answer, structuredAnswer, advance, goBack: false, reply: "", nextQuestion, isComplete });
    return res.json({ advance, goBack: false, reply: "", nextQuestion, isComplete });
  }
}

async function persistExchange({ session, slotIndex, slotId, baseQuestion, nextBaseQuestion, answer, structuredAnswer, advance, goBack, reply, nextQuestion, isComplete }) {
  // goBack is never persisted server-side, matching Measure's own
  // goToPreviousSphere (pure client Zustand state, no server call) —
  // mobile fully owns "which slot is displayed." Worst case of a goBack
  // right before an app kill: the persisted session sits one slot ahead
  // of what the user saw: resuming re-syncs from the persisted session,
  // so nothing is lost, just possibly one slot to re-confirm.
  if (goBack) return;

  // Looked up by the slotIndex field, not raw array position — slots are
  // always pushed sequentially in real usage so the two coincide, but
  // matching by field is more robust and self-documenting than assuming
  // array position.
  const slot = session.slots.find((s) => s.slotIndex === slotIndex);
  if (!slot) {
    throw new Error(`No slot record found for slotIndex ${slotIndex} in session ${session.id}`);
  }
  if (!advance) {
    slot.asides.push({ answer, reply });
    await session.save();
    return;
  }

  slot.answer = answer;
  slot.answeredAt = new Date().toISOString();
  if (structuredAnswer !== undefined) slot.structuredAnswer = structuredAnswer;

  if (isComplete) {
    session.completedAt = new Date().toISOString();
  } else {
    session.slots.push({
      // slotId/baseQuestion are placeholders — reconciled from the
      // client's own content file (the source of truth) at the top of
      // this handler once the client actually requests this slot, see
      // the `session.slots[slotIndex]` reconciliation above.
      slotIndex: slotIndex + 1,
      slotId: "pending",
      baseQuestion: nextBaseQuestion ?? "",
      phrasedQuestion: nextQuestion ?? nextBaseQuestion ?? "",
    });
    session.currentSlotIndex = slotIndex + 1;
  }
  await session.save();
}

// GET /api/journeys/session?purchaseId=... — lets the client resume an
// in-progress session or fetch the stored slot answers for the reflection
// screen after an app restart (component state alone wouldn't survive
// that gap between finishing and viewing the reflection).
export async function getJourneySession(req, res) {
  const { purchaseId } = req.query;
  if (!purchaseId) {
    return res.status(400).json({ error: "purchaseId is required" });
  }

  const session = await JourneySession.findOne({ userId: req.user.id, purchaseId });
  if (!session) {
    return res.status(404).json({ error: "No session found for this purchase" });
  }

  const owns = await ownsPurchase(req.user.id, session.journey, purchaseId);
  if (!owns) {
    return res.status(403).json({ error: "No matching journey purchase for this account" });
  }

  res.json(session);
}
