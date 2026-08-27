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
// 2026-08-26: rewritten around STAGES rather than single questions — a
// stage is a fixed psychological layer (e.g. Control's "object of
// control") that can take 1-3 real turns to actually satisfy, not
// necessarily one. The AI's job within a stage is still narrowly scoped
// (ask a grounding sub-question, never invent a different stage's
// question), but it now also judges whether it HAS enough yet, and
// whether its own reply would add anything before showing it at all.
const JOURNEY_SYSTEM_PROMPT = `You are guiding someone through a Journey — a fixed, carefully designed sequence of reflection stages that helps them discover their own answer to one question that matters to them. The stage sequence itself was designed in advance and never changes, and you may never skip a stage, reorder stages, or invent a stage that isn't part of the fixed sequence. Within a stage, you may ask one or more grounding sub-questions if the person's answer is too abstract to satisfy that stage's own goal — but every sub-question must serve THIS stage's goal, never introduce a different stage's topic early.

You may: ask, clarify, reflect a feeling back in your own words, reconnect something they said earlier to what they're saying now, and gently notice a contradiction if one appears in their own words.

You may never: diagnose them, interpret an unconscious motive as fact, tell them what they feel or think, tell them what they should do, or state anything about them as true that isn't already contained in their own words above. The discovery belongs entirely to them — your only job is to ask well and listen.

You are also disciplined about when to speak at all: an acknowledgment sentence is only worth showing if it clarifies, distinguishes, connects, tests, or deepens something they just said. A reply that only restates or paraphrases what they already said adds nothing — in that case you say nothing and simply ask the next question. Sounding like an instrument for thought, not a therapist performing empathy, is the standard.`;

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

// Guards against the model echoing the prompt's own JSON-shape example
// literally (confirmed live: "..." came back as the actual value) rather
// than substituting real generated text.
function isPlaceholderText(s) {
  return !s || !s.trim() || /^\.{2,}$/.test(s.trim());
}

// Guards against a distinct failure mode confirmed live (2026-08-26): the
// model returns a well-formed, non-placeholder "nextQuestion" that isn't
// a rephrasing of the fixed text it was given at all — it invented its
// own contextually-plausible follow-up instead (e.g. fixed text "What
// exactly would you like to determine?" came back as "What does that
// relationship feel like for you right now?" — fluent, on-topic, and a
// clear violation of "never a different question, never invented"). This
// is a coarse heuristic — does the candidate share at least one
// non-generic content word with the fixed text — not a semantic check,
// so it has one known false-positive shape (a rephrasing that swaps
// vocabulary entirely, e.g. "determine" -> "figure out", falls back to
// the raw authored text even though it was a valid rephrasing). That's an
// acceptable tradeoff: the real fix is the strengthened prompt
// instruction wherever this is used (a reduction test + worked example)
// — this check is a last-resort backstop for when the model ignores that
// instruction outright, not the primary defense, so occasionally being
// too cautious is fine.
const STOPWORDS = new Set(["what", "which", "would", "your", "about", "that", "this", "with", "does", "do", "you", "the", "and", "for", "like", "right", "now", "feel", "just", "have", "when", "will", "here", "there"]);
function significantWords(s) {
  return new Set((s.toLowerCase().match(/[a-z']{4,}/g) || []).filter((w) => !STOPWORDS.has(w)));
}
function isTopicDrift(candidate, fixed) {
  const fixedWords = significantWords(fixed);
  if (fixedWords.size === 0) return false; // nothing distinctive to compare against — don't false-positive
  const candidateWords = significantWords(candidate);
  return ![...fixedWords].some((w) => candidateWords.has(w));
}

// Control's own stage goals — used to judge STAGE COMPLETE, i.e. whether
// enough material now exists to advance to the next stage, as opposed to
// ENGAGED, which only judges whether this one reply was a real answer at
// all. Journey-specific (unlike JOURNEY_SYSTEM_PROMPT above, which is
// shared engine-level) — a future second Journey needs its own goals
// keyed by its own journey id; this map is looked up by `journey` below,
// so adding one is additive, not a rewrite of this file's structure.
const STAGE_GOALS = {
  control: {
    object: 'Land on ONE concrete, specific thing they are trying to control — an actual situation, relationship, or outcome, not an abstract feeling or a meta-question about the process. If their answer is vague, abstract, "I don\'t know," or about the conversation itself rather than their life, you do NOT have enough yet — ask one small, concrete grounding question (e.g. "What situation is this about?") before treating the stage as complete. Do not ask more than 3 sub-questions total even if still vague — after 3, accept whatever concrete-ish anchor exists and move on.',
    "desired-outcome": "A specific thing they would like to know or have determined, phrased as an outcome, not a feeling.",
    certainty: "What would concretely change for them if they had certainty — a real shift, not just \"I'd feel better.\"",
    "feared-alternative": "What actually appears when they imagine not knowing — an image, thought, or feeling, named specifically.",
    meaning: "What the fear is actually about — connects to something more specific than \"bad things.\"",
    "underlying-need": "What that would mean to them at a level below the immediate fear — self-worth, safety, belonging, competence, etc., in their own words.",
    agency: "The elements they place into each bucket during the sort — this stage completes as soon as the sort itself is submitted, not through conversation.",
    recognition: "Something that feels different or newly visible to them now, in their own words.",
  },
};

// A short, generic fallback sub-question per stage, used only when the
// model's own generated sub-question is empty/placeholder AND the stage
// isn't complete yet — there's no fixed "next stage" text to fall back to
// mid-stage the way there is on a real stage transition, so each stage
// needs its own minimal nudge.
const STAGE_FALLBACK_NUDGE = {
  control: {
    object: "What situation is this actually about?",
    "desired-outcome": "What's the one thing you'd most want to know?",
    certainty: "What would feel different, even in a small way?",
    "feared-alternative": "What's the first thing that comes to mind?",
    meaning: "What does that fear point to?",
    "underlying-need": "What would that change about how you see things?",
    recognition: "What stands out to you right now?",
  },
};

// POST /api/journeys/exchange — one call per turn. The AI decides, in
// order: ENGAGED (did they say something real), STAGE COMPLETE (only if
// engaged — do we now have what this stage's own goal requires, or do we
// need one more grounding sub-question on the SAME stage), and SHOW
// ACKNOWLEDGMENT (only if engaged — would a reply actually clarify,
// distinguish, connect, test, or deepen something, or would it just
// restate what they said). Only on stageComplete does it also phrase the
// next STAGE's fixed opening question, reusing the verified
// reduction-test mechanism (originally scoped to slots, now to stages).
export async function postJourneyExchange(req, res) {
  const {
    purchaseId,
    journey,
    stageIndex,
    stageId,
    openingQuestion,
    nextOpeningQuestion,
    priorStages,
    answer,
    canGoBack,
    priorAsideCount,
    totalStages,
    locale,
    structuredAnswer,
  } = req.body;

  if (!purchaseId || !journey || !Number.isInteger(stageIndex) || !stageId || !openingQuestion || typeof answer !== "string") {
    return res.status(400).json({ error: "purchaseId, journey, stageIndex, stageId, openingQuestion, and answer are required" });
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
      stages: [{ stageIndex: 0, stageId, openingQuestion }],
    });
  } else {
    // A stage record created by the PREVIOUS turn only knows its opening
    // question — it doesn't yet carry the real stageId, since that's only
    // known once the client actually requests this stage. Reconcile from
    // the client's own authored content file (the source of truth) now
    // that this stage is actually being answered. Looked up by the
    // stageIndex field, not raw array position — stages are always
    // pushed sequentially in real usage so the two coincide, but matching
    // by field is more robust and self-documenting than assuming array
    // position.
    const existingStage = session.stages.find((s) => s.stageIndex === stageIndex);
    if (existingStage) {
      existingStage.stageId = stageId;
      existingStage.openingQuestion = openingQuestion;
    }
  }

  // The agency stage (Control) has no conversational completion — it
  // completes the instant the sort primitive submits a structuredAnswer,
  // with no AI call at all (there's nothing to classify: the person
  // either finished sorting or they didn't). Handled entirely separately
  // from the conversational path below.
  if (structuredAnswer !== undefined) {
    const isLastStage = stageIndex === totalStages - 1;
    await persistExchange({
      session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer,
      engaged: true, stageComplete: true, goBack: false, showAcknowledgment: false, reply: null,
      nextQuestion: isLastStage ? null : nextOpeningQuestion ?? null, isComplete: isLastStage,
    });
    return res.json({
      engaged: true, goBack: false, stageComplete: true, showAcknowledgment: false, reply: null,
      nextQuestion: isLastStage ? null : nextOpeningQuestion ?? null, isComplete: isLastStage,
    });
  }

  const goBackPossible = canGoBack === true;
  const stuckBefore = Number.isInteger(priorAsideCount) && priorAsideCount > 0 ? priorAsideCount : 0;
  const isLastStage = stageIndex === totalStages - 1;
  const stageGoal = STAGE_GOALS[journey]?.[stageId] ?? null;
  const currentStage = session.stages.find((s) => s.stageIndex === stageIndex);
  const currentStageTurnsText = currentStage?.turns?.length
    ? currentStage.turns.map((t) => `"${t.question}" → "${t.answer}"`).join("\n")
    : "(no sub-questions asked yet this stage)";
  const priorStagesText = Array.isArray(priorStages) && priorStages.length > 0
    ? priorStages.map((s) => `"${s.question}" → "${s.answer}"`).join("\n")
    : "(this is the first stage of the Journey)";

  const exchangePrompt = `${stageGoal ? `This stage's goal — what you need before it's complete: ${stageGoal}\n\n` : ""}Everything they've said in prior stages, in order:
${priorStagesText}

Within the CURRENT stage, everything already asked and answered so far, in order:
${currentStageTurnsText}

You just asked, within this stage:
"${openingQuestion}"

They replied:
"${answer}"
${stuckBefore > 0 ? `\nThey have already gotten stuck ${stuckBefore} time(s) before this reply within this stage — go smaller this time, not the same size again.\n` : ""}
First, check: are they asking to go back and reconsider an earlier stage? ${goBackPossible ? "Going back is possible right now." : "Going back is NOT possible right now — this is the first stage, there is nothing before it yet."}

Respond with ONLY valid JSON, no markdown, no explanation, in exactly this shape (all placeholders below must be replaced with real generated text or true/false/null as appropriate — never output the literal words shown here):
{"engaged": true, "goBack": false, "stageComplete": true, "showAcknowledgment": true, "reply": "<or null if showAcknowledgment is false>", "nextQuestion": "<see rules below, or null>"}

If they're asking to go back${goBackPossible ? "" : " (even though there's nothing to go back to yet)"}:
- Set "engaged" to false, "stageComplete" to false, "showAcknowledgment" to true, "nextQuestion" to null.
${goBackPossible
    ? `- Set "goBack" to true. "reply" is ONE short, warm sentence confirming you're taking them back to reconsider it.`
    : `- Set "goBack" to false. "reply" is ONE short sentence gently noting this is the first stage, then invite them to answer what's in front of them.`}

Otherwise, decide THREE things, in order:

1. ENGAGED: did they actually say something real — even one word, tersely, vaguely, or emotionally? A short honest answer counts. Only "not engaged" if they asked you something back, pushed back, or said something that isn't really an answer at all. If not engaged, set "engaged" false, "stageComplete" false, "showAcknowledgment" true, and "reply" per the non-engagement rules below.

2. If engaged, STAGE COMPLETE: considering everything said in THIS stage so far (not just this last reply), do you now have what the stage's goal above requires? If not, you need exactly one more small, concrete sub-question on the SAME stage's own topic — never a different stage's question, never repeating a sub-question already asked this stage.

3. If engaged, SHOW ACKNOWLEDGMENT: would a one-sentence reply to what they just said actually CLARIFY (name what was fuzzy in sharper terms), DISTINGUISH (separate two things they were treating as one), CONNECT (link this to something specific they said earlier), TEST (surface a tension in their own words), or DEEPEN (show a layer under the surface, using only their own words) — or would it just restate/paraphrase what they said with no new element? If it's genuinely one of the first five, set "showAcknowledgment" true and write it (10-20 words, your own words, never a diagnosis or a claim not already in their words). If it would just be a paraphrase, set "showAcknowledgment" false and "reply" to null — go straight to the next question with no lead-in sentence at all.

Worked example of the acknowledgment distinction:
- SHOW this one: they say "I want the relationship to work but I also want to know if it will" → reply: "Those may be two different wants: wanting the relationship, and wanting certainty about the relationship. Which one feels harder to leave unresolved?" (this DISTINGUISHES two things they'd fused into one)
- SUPPRESS this one: they say "I don't know, I'm just confused" → the paraphrase "I hear that confusion is standing with you right now" adds nothing they didn't already say — set showAcknowledgment false, reply null, and go straight to the next question instead.

For "nextQuestion":
${isLastStage
    ? `This is the FINAL stage — if stageComplete is true, set "nextQuestion" to null, there is nothing after it.`
    : `If stageComplete is true: THE FIXED NEXT STAGE'S OPENING QUESTION IS: "${nextOpeningQuestion}"
This exact question is what you must ask next — it is not a suggestion or a topic, it is the literal question the fixed sequence requires at this point. Your ONLY job is to restate this same question so it flows naturally from what they just said, adjusted only to reference their specific words instead of a generic pronoun. Do NOT write a different, related, or "logically following" question of your own. A rephrasing test: if you removed all the specific words you added, your "nextQuestion" must reduce back to "${nextOpeningQuestion}" in meaning.

Example of the ONLY kind of transformation allowed: fixed question "What exactly would you like to determine?" + they just said "a relationship" → correct: "What exactly would you like to determine about this relationship?" — incorrect (invented, discard): "What does that relationship feel like for you right now?"

If stageComplete is false: write ONE concrete sub-question that serves THIS stage's own goal above, worded so it can be answered in a few words — do not repeat a sub-question already shown in this stage's turns above, and do not ask about a different stage's topic.`}

If they did not really engage (and are not asking to go back): "reply" — if they asked you a genuine question, answer it honestly in your own voice; if they seem stuck or gave a vague non-answer, offer one small, concrete thing to notice right now, worded so it can be answered in a few words, not repeating the same rephrasing move twice in a row. "nextQuestion" is null in this case (the sub-question lives in "reply" itself).

Ground everything only in what they actually wrote ("${answer}"), stay under 60 words for any reply, and never claim anything about them that isn't already in their own words above.`;

  try {
    const response = await groq.chat.completions.create({
      ...resolveModelParams(locale, models[1], 650),
      temperature: 0.5,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES + "\n\n" + JOURNEY_SYSTEM_PROMPT, locale) },
        { role: "user", content: exchangePrompt },
      ],
    });

    const parsed = extractJson(response.choices[0].message.content.trim());

    if (!parsed) {
      throw new Error("Unparseable response from model");
    }

    const engaged = parsed.engaged !== false;
    const goBack = goBackPossible && parsed.goBack === true;
    const stageComplete = engaged && !goBack && parsed.stageComplete === true;
    const showAcknowledgment = !goBack && parsed.showAcknowledgment !== false;
    const reply = showAcknowledgment && typeof parsed.reply === "string" && !isPlaceholderText(parsed.reply)
      ? parsed.reply.trim()
      : null;

    // If we were told to show an acknowledgment but got nothing usable,
    // that's a malformed response, not a legitimate "nothing to add" —
    // fail open rather than silently showing an empty turn.
    if (showAcknowledgment && !reply && !goBack) {
      throw new Error("showAcknowledgment true but no usable reply text");
    }

    let nextQuestion = null;
    if (goBack) {
      nextQuestion = null;
    } else if (!engaged) {
      nextQuestion = null; // the sub-question lives in `reply` for non-engagement, per the prompt
    } else if (stageComplete) {
      nextQuestion = isLastStage
        ? null
        : (typeof parsed.nextQuestion === "string" && !isPlaceholderText(parsed.nextQuestion) && nextOpeningQuestion && !isTopicDrift(parsed.nextQuestion, nextOpeningQuestion)
            ? parsed.nextQuestion.trim()
            : nextOpeningQuestion);
    } else {
      // Still gathering — a genuine sub-question, no fixed text exists to
      // compare it against (see STAGE_FALLBACK_NUDGE's own comment).
      nextQuestion = typeof parsed.nextQuestion === "string" && !isPlaceholderText(parsed.nextQuestion)
        ? parsed.nextQuestion.trim()
        : STAGE_FALLBACK_NUDGE[journey]?.[stageId] ?? "Can you say a little more about that?";
    }

    const isComplete = stageComplete && isLastStage;

    let extractedPropositions = null;
    if (stageComplete && stageId === "underlying-need") {
      extractedPropositions = await tryExtractPropositions({ session, journey, locale, answer, stageIndex });
    }

    await persistExchange({
      session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer,
      engaged, stageComplete, goBack, showAcknowledgment, reply, nextQuestion, isComplete, extractedPropositions,
    });

    return res.json({ engaged, goBack, stageComplete, showAcknowledgment, reply, nextQuestion, isComplete });
  } catch (err) {
    console.error("Journey exchange failed:", err.message);
    // Fail open: treat as engaged + stage-complete so the Journey never
    // gets stuck on a bad response, falling back to the raw authored next
    // stage's opening question (unphrased) rather than leaving the
    // client with nothing to show — same discipline as the rest of this
    // controller's fail-open branches.
    const engaged = true;
    const stageComplete = true;
    const isComplete = isLastStage;
    const nextQuestion = isLastStage ? null : nextOpeningQuestion ?? null;
    await persistExchange({
      session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer,
      engaged, stageComplete, goBack: false, showAcknowledgment: false, reply: null, nextQuestion, isComplete,
    });
    return res.json({ engaged, goBack: false, stageComplete, showAcknowledgment: false, reply: null, nextQuestion, isComplete });
  }
}

// Extracts clean, first-person propositions-about-agency from everything
// said across all prior stages, once "underlying-need" (the stage
// immediately before "agency") completes — a SEPARATE Groq call, not
// merged into the same JSON blob as the exchange decision above, since
// mixing "phrase the next question" and "extract propositions" into one
// response risks the same drift problem the reduction-test mechanism
// above already had to solve once. Fails open to null (the caller falls
// back to raw per-stage answers, matching the original V1 behavior) on
// any error — this must never block a stage transition.
async function tryExtractPropositions({ session, journey, locale, answer }) {
  if (journey !== "control") return null; // agency-sort is Control-specific for now
  try {
    const allTurnsText = [
      ...session.stages
        .filter((s) => s.finalAnswer)
        .map((s) => `"${s.openingQuestion}" → "${s.finalAnswer}"`),
      `"underlying-need" → "${answer}"`, // the answer that just completed this stage, not yet persisted
    ].join("\n");

    const extractionPrompt = `Everything this person has said so far in this Journey about what they're trying to control, in order:
${allTurnsText}

Your job: extract 4-6 short, first-person PROPOSITIONS ABOUT AGENCY from what they said — each one a single claim about something that either is or isn't theirs to determine, decide, or influence. NOT a quote of their exact sentence, NOT a paraphrase of their emotional state, NOT a question they asked out loud — a clean, concrete, first-person statement of a thing at stake.

Rules:
- Each proposition must be something a person could meaningfully sort into "mine to choose," "I can affect but not decide," or "not mine to author" — so it must be an action, a decision, an outcome, or another person's internal state, never a feeling-report about the speaker themselves (drop "I'm confused," "I don't know," "I feel uncertain" entirely — these aren't agency claims).
- Merge duplicates or near-duplicates into one clean statement.
- Write every proposition in first person ("Whether I...", "How I...", "What...").
- 4-6 propositions total. Fewer if the material doesn't support more; never invent one that isn't grounded in something they actually said.

Worked example:
Raw statements: "I want this to become a relationship" / "I don't know what he wants" / "I keep wondering what this is" / "I want him to choose me" / "I feel confused" / "Am I trying to control or not?"
Correct extraction: ["Whether I tell them what I want", "How I respond to uncertainty", "Whether they want a relationship", "Whether the relationship becomes one", "What I want"]
(Note "I feel confused" and "Am I trying to control or not?" produced NO proposition each — they're not agency claims, they're process/emotional commentary. Skip anything that isn't a claim about an action, decision, outcome, or another person's state.)

Respond with ONLY valid JSON: {"propositions": ["...", "...", ...]}`;

    const response = await groq.chat.completions.create({
      ...resolveModelParams(locale, models[1], 400),
      temperature: 0.4,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES, locale) },
        { role: "user", content: extractionPrompt },
      ],
    });

    const parsed = extractJson(response.choices[0].message.content.trim());
    const propositions = Array.isArray(parsed?.propositions)
      ? parsed.propositions.filter((p) => typeof p === "string" && p.trim()).map((p) => p.trim())
      : null;

    return propositions && propositions.length > 0 ? propositions : null;
  } catch (err) {
    console.error("Proposition extraction failed:", err.message);
    return null;
  }
}

async function persistExchange({ session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer, engaged, stageComplete, goBack, showAcknowledgment, reply, nextQuestion, isComplete, extractedPropositions }) {
  // goBack is never persisted server-side, matching Measure's own
  // goToPreviousSphere (pure client Zustand state, no server call) —
  // mobile fully owns "which stage is displayed." Worst case of a goBack
  // right before an app kill: the persisted session sits one stage ahead
  // of what the user saw: resuming re-syncs from the persisted session,
  // so nothing is lost, just possibly one stage to re-confirm.
  if (goBack) return;

  const stage = session.stages.find((s) => s.stageIndex === stageIndex);
  if (!stage) {
    throw new Error(`No stage record found for stageIndex ${stageIndex} in session ${session.id}`);
  }

  if (!engaged) {
    stage.asides.push({ answer, reply: reply ?? "" });
    await session.save();
    return;
  }

  if (!stageComplete) {
    // Still gathering — record this as a sub-turn, not a completion.
    // Distinct from asides: this was a real, on-topic answer, it just
    // wasn't enough to satisfy the stage's goal yet.
    stage.turns.push({ question: openingQuestion, answer, reply, shown: showAcknowledgment && !!reply });
    await session.save();
    return;
  }

  stage.turns.push({ question: openingQuestion, answer, reply, shown: showAcknowledgment && !!reply });
  stage.finalAnswer = answer;
  stage.answeredAt = new Date().toISOString();
  if (structuredAnswer !== undefined) stage.structuredAnswer = structuredAnswer;

  if (isComplete) {
    session.completedAt = new Date().toISOString();
  } else {
    const nextStage = {
      // stageId/openingQuestion are placeholders — reconciled from the
      // client's own content file (the source of truth) at the top of
      // this handler once the client actually requests this stage, see
      // the `session.stages` reconciliation above.
      stageIndex: stageIndex + 1,
      stageId: "pending",
      openingQuestion: nextOpeningQuestion ?? "",
    };
    if (extractedPropositions) nextStage.extractedPropositions = extractedPropositions;
    session.stages.push(nextStage);
    session.currentStageIndex = stageIndex + 1;
  }
  await session.save();
}

// GET /api/journeys/session?purchaseId=... — lets the client resume an
// in-progress session or fetch the stored stage answers for the
// reflection screen after an app restart (component state alone wouldn't
// survive that gap between finishing and viewing the reflection).
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
