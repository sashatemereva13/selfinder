import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import User from "../models/User.js";
import JourneySession from "../models/JourneySession.js";
import { JOURNEY_KEYS } from "../../shared/journeyKeys.mjs";

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

A reflection may ONLY use words, images, or bodily language the person themselves already used — this is a hard, mechanical rule, not a matter of degree. If they say one word ("Happiness"), your acknowledgment may restate that word or ask about it — it may NOT invent a metaphor, a body location, a feeling-word, or a trait (like "self-worth" or "competence") they didn't say themselves. WRONG: they say "Happiness" → you say "Happiness feels like a bright, steady light in your chest." RIGHT: they say "Happiness" → you ask "What does happiness feel like in your body right now?" and wait for THEM to answer, or you say nothing and move straight to the next question. WRONG: they say "That I'm better and bigger than I think I am" → you say "You notice that feeling of being bigger and better, suggesting a boost in self-worth and competence." RIGHT: you either quote their own words back exactly, or ask a question that invites THEM to say more — never supply the interpretation yourself.

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

// Control's "separate" stage opens with a fixed, AUTHORED reveal — not a
// model-generated reply — built directly from the "observable" and
// "represents" stages' own already-collected finalAnswer text. No Groq
// call is involved in producing this text at all: it's pure string
// interpolation, so it can never invent a metaphor or a trait the person
// didn't say (the exact failure mode a real on-device test caught: "I
// don't know" -> the model supplying "steadiness", "self-worth and
// competence", a bodily "bright, steady light in your chest" the person
// never said). This implements the "reflect -> contrast -> classify ->
// move on" pattern in place of the three open-ended conversational stages
// (feared-alternative/meaning/underlying-need) it replaces.
function buildSeparateReveal(priorStages) {
  const observable = priorStages?.find((s) => s.stageId === "observable")?.answer?.trim();
  const represents = priorStages?.find((s) => s.stageId === "represents")?.answer?.trim();
  if (!observable || !represents) return null; // missing prior material — fall back to the plain fixed question, no reveal
  // 2026-09-03: softened from an asserted "Underneath it, you want to..."
  // to "You said it would give you..." — both clauses are still pure
  // interpolation of the user's own words (never invents anything), but
  // the old wording stated a two-layer want/need structure as fact; this
  // phrasing only reflects back what they themselves already said, letting
  // the split be something they notice rather than something the app
  // tells them is true (see docs/journeys-concept.md's psychoanalytic
  // grounding review, 2026-09-03: control's real object isn't always a
  // single internal "need" — it can be certainty, agency, or a specific
  // other person's behavior — so the copy shouldn't hard-code "underneath"
  // as if there's always exactly one layer under the surface want).
  return `You want ${observable}. You said it would give you ${represents}. Which of those can you author?`;
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
    situation: 'ONE concrete, real situation the person wishes would unfold differently — an actual scene, relationship, or circumstance, not an abstract feeling or a meta-question about the process. If their answer is vague, abstract, "I don\'t know," or about the conversation itself rather than their life, you do NOT have enough yet — ask one small, concrete grounding question (e.g. "What situation is this about?") before treating the stage as complete. Do not ask more than 2 sub-questions total even if still vague — after 2, accept whatever concrete-ish anchor exists and move on.',
    wish: 'ONE concrete thing they wish were happening instead, in the situation they just named — this becomes the thing they are trying to control for every later stage, so it needs to be a real wished-for outcome or change, not a vague feeling like "I wish I felt better." Do not ask more than 1 sub-question — accept their first real answer and move on.',
    observable: 'ONE concrete, observable sign that would tell them the thing they wished for is actually happening — something they could see, hear, or point to, not a feeling. Do not ask more than 1 sub-question — if their first answer is already a concrete sign (an action, an event, a specific thing someone would say or do), the stage is complete immediately; only ask once, to turn a vague answer into a concrete one, then move on regardless.',
    represents: 'The ONE thing that observable sign would actually give them if it happened — what it would mean to them. This does not have to be a feeling-word: it may just as legitimately be certainty/knowing something, a sense that their own will or effort counts here, or simply a specific other person behaving predictably — do not steer them toward naming an emotion if their honest answer is one of these instead. Do not ask more than 1 sub-question — accept their first real answer and move on; this stage exists to name ONE thing, not to explore it.',
    separate: 'One grounded thing that would still be theirs to change even with the other person/outside factor\'s choice left out of it entirely. Do not ask more than 1 sub-question — accept whatever concrete thing they name and move on; this stage is testing whether they can locate a real answer, not exhausting the topic.',
    agency: "The elements they place into each bucket during the sort — this stage completes as soon as the sort itself is submitted, not through conversation.",
    recognition: "Something that feels different or newly visible to them now, in their own words. Do not ask more than 1 sub-question — this is the closing stage; accept their first real answer and let the Journey end.",
  },
  // The Choice — "what do I actually want?" (docs/journeys-concept.md).
  // Hard content constraint carried into every stage's own goal text
  // where relevant: this Journey never resolves "I want both" into one
  // manufactured "real" desire — A, B, both, neither, and "I still don't
  // know" must all be acceptable, fully complete answers, especially at
  // the final "choice-again" stage.
  'the-choice': {
    choice: 'TWO concrete things they are actually choosing between — real options, not a vague "I don\'t know what I want." If vague, ask one small grounding question (e.g. "What are the two real options in front of you?"). Do not ask more than 2 sub-questions — after 2, accept whatever two-sided framing exists, even an imperfect one, and move on.',
    attraction: 'What draws them toward EACH option, and what having it would actually give them (money, safety, being seen a certain way, ease, pride, etc.) — a real mix of reasons is expected and does not need to be sorted into good/bad yet. Do not ask more than 1 sub-question.',
    pressure: 'What they believe they SHOULD choose, and whose reaction they are most aware of when they imagine choosing the other way — do not accept a pressure-free answer without at least asking once whether anyone else\'s opinion is in the room. Do not ask more than 1 sub-question.',
    audience: 'What changes, if anything, once approval/disapproval and being seen are imagined removed from the equation — "nothing changes" is a fully legitimate answer (it means the want was never about the audience) and must be accepted as complete, not probed further. Do not ask more than 1 sub-question.',
    fear: 'ONE real fear attached to each option, if they have one — a feared consequence, not just a feeling-word. "I don\'t know" or "no real fear on one side" is a legitimate, completable answer. Do not ask more than 1 sub-question.',
    cost: 'What they would lose by choosing each option — a real cost on both sides, not just the "wrong" one. Do not ask more than 1 sub-question.',
    futures: 'For EACH imagined six-months-later life: what draws them toward it and what makes them pull away. Do not ask more than 1 sub-question — if they only address one imagined future in depth, one nudge toward the other is enough, then move on regardless.',
    'choice-again': 'Their own answer to the same opening question, now informed by everything above — A, B, both, neither, and "I still don\'t know" are ALL complete, legitimate answers; never treat uncertainty as an incomplete stage needing another sub-question. Do not ask more than 1 sub-question, and only if their answer is truly empty (e.g. no reply at all), never to push toward a cleaner decision.',
  },
  // The Loop — "why does this keep happening to me?" (docs/journeys-
  // concept.md). Hard ethical guardrail carried into familiarity/compare/
  // pattern's own goal text: "this isn't actually a pattern" must be a
  // fully legitimate, complete answer at each of those stages — never
  // treat "not similar" or "no real repetition" as an incomplete stage
  // needing another push toward finding one.
  'the-loop': {
    present: 'A real, specific recent situation, PLUS what they thought it meant, what they felt, and what they did about it — a full chain, not just the bare event. If they only give the bare event, ask once for the rest of the chain. Do not ask more than 2 sub-questions — after 2, accept whatever chain exists even if thin, and move on.',
    familiarity: 'What, if anything, feels familiar about this situation — "actually, it doesn\'t feel familiar" is a fully legitimate, complete answer and must be accepted as such, never pushed past. Do not ask more than 1 sub-question.',
    past: 'ONE earlier, real situation that feels similar, PLUS its own chain (what happened, what they thought, what they felt, what they did) — same shape as "present." If they can\'t recall one, "I can\'t think of one" is a legitimate answer that still lets the Journey continue (compare simply has less to work with). Do not ask more than 2 sub-questions.',
    compare: 'What is actually the same and what is actually different between the two situations named so far — "these aren\'t very similar after all" is a fully legitimate, complete answer, never something to probe past in search of a similarity that isn\'t there. Do not ask more than 1 sub-question.',
    desire: 'What they wanted in EACH situation — a real want, named for both, not just one. Do not ask more than 1 sub-question.',
    expectation: 'What they expected from the other person or the world, in EACH situation. Do not ask more than 1 sub-question.',
    response: 'What they actually did in anticipation of what they expected, in each situation — a real action or reaction, not a feeling-report. Do not ask more than 1 sub-question.',
    pattern: 'Where the repetition actually lives, if anywhere — the situation itself, a feeling, an expectation, their own response, a role they keep occupying, or the outcome. "There isn\'t really a repeating element" or "I\'m not sure" are fully legitimate, complete answers — never push toward naming one that isn\'t genuinely there. Do not ask more than 1 sub-question.',
    recognition: 'Something that feels different or newly visible to them now, in their own words, including which part (if any) they might want to change next time. "I don\'t know yet" is a legitimate closing answer. Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // Whose Voice? — "is this really what I believe or want?" (docs/
  // journeys-concept.md). Hard content constraint carried into
  // integration/my-voice's own goal text: "it came from someone else, and
  // I've discovered I choose it too" must be treated as a fully
  // legitimate, even celebrated outcome — never validate only
  // origin-tracing-toward-rejection.
  'whose-voice': {
    statement: 'ONE real belief or want, PLUS whether it feels like a want, a should, a must, a need, or a "supposed to" — both halves, not just the belief alone. Do not ask more than 2 sub-questions.',
    consequence: 'What they imagine would happen if they didn\'t follow this belief, PLUS the feeling that appears when they imagine that (guilt, fear, shame, relief, disappointment, something else) — both halves. Do not ask more than 1 sub-question.',
    origin: 'When they remember first encountering this idea, PLUS who or what around them seemed to carry it — parents, a partner, teachers, culture, social media, an earlier version of themselves. "I don\'t know" for either half is a fully legitimate, complete answer — never push past it. Do not ask more than 1 sub-question.',
    meaning: 'What the belief meant in the environment/time it came from, PLUS what it means to them now — both halves, even if the answer is "the same thing." Do not ask more than 1 sub-question.',
    remove: 'What remains of the belief once being seen/judged by others is imagined removed — "nothing changes" is a fully legitimate, complete answer (it means the want was never about the audience). Do not ask more than 1 sub-question.',
    disagreement: 'Who they would be disagreeing with if they let this belief go, and whether changing it would feel like leaving something or someone behind — "no, this is genuinely just mine" is just as legitimate an answer as "yes, it would feel like a betrayal." Do not ask more than 1 sub-question.',
    integration: 'Whether they endorse this belief TODAY, regardless of where it came from — yes, partly, no, and "I don\'t know yet" are ALL complete, legitimate answers. A "yes, I still choose it" answer is not a failure of the Journey to find something to reject — it is one of the most meaningful outcomes this Journey can produce. Do not ask more than 1 sub-question.',
    'my-voice': 'Their own current belief, stated in their own words, now informed by everything above. Do not ask more than 1 sub-question, and only if their answer is truly empty — this is the closing stage.',
  },
  // The Road Not Taken — "why can't I stop thinking about what could have
  // been?" (docs/journeys-concept.md). Hard content constraint carried
  // into closed-open and return-to-now's own goal text: "I lost
  // something and cannot have it back, full stop, no lesson" must be a
  // fully legitimate, complete answer — never turn every closed door
  // into a search for a silver lining.
  'the-road-not-taken': {
    fork: 'The real fork (what actually happened), PLUS what they imagine would have happened instead on the other road — a real constructed alternative, not just a vague wish. Do not ask more than 2 sub-questions.',
    'reality-imagination': 'At least a rough classification of the imagined road into what they know, what they think probably would have happened, what they hope would have happened, and what they honestly don\'t know — doesn\'t need to be exhaustive, just genuinely attempted. Do not ask more than 1 sub-question.',
    object: 'What specifically they miss, PLUS what having it would actually give them (not just the object itself). Do not ask more than 1 sub-question.',
    responsibility: 'Whether they wish their own action, another person\'s action, or the circumstances themselves had been different — this distinguishes regret from disappointment and matters for what follows. Do not ask more than 1 sub-question.',
    'me-then-now': 'What they knew, wanted, feared, and believed their options were back then, PLUS what they know now only because they lived through what followed — both halves, since the point is the contrast, not just hindsight alone. Do not ask more than 1 sub-question.',
    'closed-open': 'What feels irreversibly gone, PLUS what still remains possible, even in another form — "nothing remains open, this is simply closed" is a fully legitimate, complete answer and must never be pushed toward finding a silver lining. Do not ask more than 1 sub-question.',
    'unlived-self': 'Who they imagine they would have become on the other road, PLUS what they feel toward that imagined version of themselves (envy, tenderness, grief, longing, anger, pride, or several at once). Do not ask more than 1 sub-question.',
    uncertainty: 'What might also have been difficult about the other road — this must stay genuinely epistemic (the other road wasn\'t guaranteed either), never a rhetorical trick toward manufactured gratitude for what actually happened. "I don\'t know, it might have been fine" is a legitimate answer. Do not ask more than 1 sub-question.',
    'return-to-now': 'What this imagined alternative reveals about their life now, and their own answer to why they keep returning to this road — many different honest answers are legitimate here (still wanting something it represented, understanding a past choice differently now, discovering part of it is still open, grieving, or simply not knowing). Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // Letting Go — "what am I actually holding onto?" (docs/journeys-
  // concept.md). Hard content constraint carried into form-now's own
  // goal text: the ending must NEVER conclude "it's time to let go" —
  // "keep it exactly as is," "carry it differently," "leave part of it,"
  // and "not ready to decide" must all be fully legitimate, equally
  // complete answers.
  'letting-go': {
    'the-object': 'ONE real thing they are trying to let go of, PLUS what specifically about it feels difficult to release once they say it out loud — the object may shift once named (e.g. from a person to a possibility) and that shift is a real, welcome discovery, not something to correct. Do not ask more than 2 sub-questions.',
    'gone-remains': 'What has actually ended, PLUS what still exists — genuinely two separate lists, not one blended answer. Do not ask more than 1 sub-question.',
    connection: 'What they are keeping alive by holding onto this (hope, a version of themselves, a belief, a possibility), PLUS what they imagine would be lost if they stopped holding it. Do not ask more than 1 sub-question.',
    hope: 'What they are still hoping will happen, PLUS what keeping that possibility open costs them today — both halves, held side by side with no verdict drawn from the comparison. Do not ask more than 1 sub-question.',
    unfinished: 'Whether anything feels unresolved, and if so, what is still waiting to happen and from whom (themselves, the other person, both, or "nobody can anymore"). "No, nothing feels unfinished" is a fully legitimate, complete answer. Do not ask more than 1 sub-question.',
    meaning: 'What receiving whatever they are waiting for would actually change for them — going one layer beneath the surface want. Do not ask more than 1 sub-question.',
    identity: 'Who they have been while holding onto this, PLUS who they imagine they would be without it — "I don\'t know" for the second half is not a failure, it may be the actual center of this Journey for this person. Do not ask more than 1 sub-question.',
    'function-price': 'What holding onto this gives them (connection, hope, identity, certainty, protection, meaning, motivation), PLUS what it asks from them (time, attention, energy, waiting) — asked without judgment in either direction. Do not ask more than 1 sub-question.',
    'time-keep': 'Whether what they are holding has changed since it began, PLUS what they would want to keep if they didn\'t have to lose everything — the "keep" half is about addition, not subtraction, and should surface something positive worth naming regardless of what happens with the rest. Do not ask more than 1 sub-question.',
    'form-now': 'Whether this feels like something to hold, carry differently, or leave — or genuinely not decide yet, which is a fully legitimate, complete answer — PLUS their own answer to the Journey\'s own opening question, now informed by everything above. Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // The Mirror — "why does this person affect me so strongly?" (docs/
  // journeys-concept.md). This Journey's central discipline: preserving
  // the OTHER person's reality and separateness throughout. REALITY
  // (what they actually did) must be kept strictly factual, never
  // colored by interpretation — MEANING is the explicit separate bridge.
  // reality-check is the single most load-bearing stage in this Journey:
  // it must be able to conclude "no, they are genuinely, repeatedly doing
  // something real" and STOP there — never route every answer back into
  // "this is about my own history." The word "projection" must never
  // appear anywhere in this Journey's generated text.
  'the-mirror': {
    person: 'Who affects them, PLUS what happens inside them around this person, PLUS what specifically seems to trigger that — three things, not just the name. This applies equally to attraction/admiration/fascination as to insecurity/anger; a positive intensity is just as valid a Mirror moment. Do not ask more than 2 sub-questions.',
    reality: 'ONLY what the other person actually said or did — concrete, factual, observable. If their answer already contains an interpretation ("they don\'t care about me"), gently ask for the observable fact underneath it once. Do not ask more than 1 sub-question.',
    meaning: 'What they made the other person\'s behavior mean — the bridge between the fact (reality) and the reaction (person). Never imply the interpretation is wrong; it only needs to be named as an interpretation. Do not ask more than 1 sub-question.',
    desire: 'What they want from this person, PLUS why receiving it from THEM specifically matters (not just wanting the thing in general). Do not ask more than 1 sub-question.',
    self: 'Who they become around this person (small, competitive, powerful, childlike, defensive, calm, desired, alive — any register, positive or negative), PLUS what the other person seems to embody that brings that out. Do not ask more than 1 sub-question.',
    role: 'What part this person seems to be playing in what just happened, PLUS what part that leaves the user playing — keep this DESCRIPTIVE (a plain description of the interaction dynamic, e.g. "the one who criticized" / "the one who apologized first"), not archetypal or interpretive (avoid framing like "the withholding parent" or naming a psychological pattern) — interpretive framing here, before reality-check has run, would pre-load a conclusion reality-check is supposed to test independently. Discovered by them, never proposed by you. Do not ask more than 1 sub-question.',
    familiarity: 'Whether they have played these same two parts before, even with a completely different kind of person — matching the STRUCTURE of the interaction, not surface similarity between people. "No, this feels new" is a fully legitimate, complete answer. This stage is doing real comparative work (a pattern is only real once it recurs across more than one instance) — don\'t let it be skipped just because "person" already felt like it captured the whole picture. Do not ask more than 1 sub-question.',
    'reality-check': 'TWO things, not one: (1) EVIDENCE — has this specific person concretely done this specific thing more than once (not just "did it feel bad," but did it actually recur, specifically, from them); (2) FIT — does the size and shape of their reaction match what a reasonable person would feel toward that documented pattern, or does it feel like it carries more weight than this one relationship could account for. Both can be true at once (a real, repeated harm AND some extra personal weight) — never force an either/or. A third legitimate candidate: the intensity may have started somewhere else entirely (a bad day, an unrelated stress, a bodily state) and simply landed on this person because they were the most salient thing in the room — offer this as equally legitimate to "it\'s about them" and "it\'s about my history," never assert which one is true for this person. "Yes, they are genuinely, repeatedly doing something real, and my reaction makes complete sense as a response to that, full stop" MUST be accepted as a fully legitimate, complete stopping point — never redirected back toward "but what does this say about you." This is the single most important stage in this Journey — never rush it or treat a "this is really about them" answer as an incomplete result. Do not ask more than 1 sub-question.',
    authority: 'What their approval would seem to prove, PLUS what their rejection would seem to prove, PLUS what changes once their opinion is imagined to prove nothing definitive about the user\'s worth — three parts. Both "actually, nothing changes, I still want to know them" and "actually, I realize I wanted validation, not the relationship" are equally legitimate discoveries; never privilege one. Do not ask more than 1 sub-question.',
    'the-mirror-now': 'What being around this person makes visible in them, PLUS their own answer to why this person affects them so strongly — this answer can legitimately land anywhere from "this is genuinely about my own history" to "this is genuinely about what they are actually doing" to an honest mixture, and REALITY CHECK\'s own finding must not be quietly overridden here. Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // The Unsaid — "what do I actually want to say?" (docs/journeys-
  // concept.md). Distinctive boundary: completion never requires any
  // real-world action. Hard content constraint carried into
  // communication's own goal text: "no, I just needed to say it to
  // myself" must be a fully legitimate, complete, SUCCESSFUL outcome —
  // never an unfinished Journey. Never draft the actual message to send —
  // that would cross from self-discovery into communication advice.
  'the-unsaid': {
    person: 'Who this is about, PLUS what feels unsaid, PLUS a low-stakes incomplete opening sentence if the full feeling is hard to name yet ("I wish...", "I never told you..."). "I don\'t know" for the middle part is legitimate — the incomplete sentence can carry the stage instead. Do not ask more than 2 sub-questions.',
    reaction: 'What happens inside them imagining actually saying it, PLUS what they imagine the other person would do in response — both halves. Do not ask more than 1 sub-question.',
    'expression-outcome': 'What they want to SAY, kept genuinely separate from what they want to HAPPEN afterward — these are often fused and the stage isn\'t complete until both are named distinctly. Do not ask more than 1 sub-question.',
    meaning: 'What they need the other person to understand, PLUS what they want their words to actually DO (express, reveal, request, change, repair, end, be recognized, provoke, protect — more than one purpose can be present at once). Do not ask more than 1 sub-question.',
    silence: 'What staying silent protects (the relationship, dignity, hope, the other person\'s feelings, ambiguity, the possibility of being wrong), PLUS what staying silent asks of them — no predetermined conclusion that speaking is superior; "silence is genuinely the right choice for me" is a fully legitimate answer. Do not ask more than 1 sub-question.',
    exposure: 'What the other person would know about them if they said what they really mean, PLUS how it feels to imagine that being known — locating the real barrier (often vulnerability, not wording). Do not ask more than 1 sub-question.',
    'remove-listener-editor': 'Raw material generated under BOTH counterfactual strips — first assuming the words will never be heard, then assuming they don\'t have to be fair or reasonable. Never correct, refine, or soften what emerges here; this stage exists to produce unedited material, not a polished message. Do not ask more than 1 sub-question.',
    contradiction: 'Whether another part of them wants to say something different, or the opposite — genuinely allow two coexisting, unreconciled true wants (e.g. "leave me alone" and "please don\'t leave") rather than forcing them into one blended sentence. "No, it\'s all one thing" is also legitimate. Do not ask more than 1 sub-question.',
    distill: 'Which part of everything written so far feels most true to them — their own judgment call, not yours to make for them. Do not ask more than 1 sub-question.',
    communication: 'Whether any of this needs to reach the other person (yes / some of it / no / I don\'t know — all legitimate), PLUS who really needs to hear it (them, the user themselves, both, someone else, or "nobody, I just needed to say it"). Someone discovering mid-answer that they, not the other person, are who needs to hear it is a valid and complete discovery. Do not ask more than 1 sub-question — this is the closing stage. Never draft or suggest actual wording for a message to send.',
  },
  // Becoming — "who am I becoming?" (docs/journeys-concept.md). Hard
  // content constraint carried into "evidence": a claimed transformation
  // is never accepted on its own — always tied to something they
  // actually did differently. This is what keeps the whole Journey
  // grounded rather than aspirational, per its own founding premise.
  becoming: {
    change: 'What feels different about them lately, PLUS what has NOT changed — both halves required, since identity being fully in flux is rarely true and would itself be a false clarity. Do not ask more than 1 sub-question.',
    evidence: 'A real, concrete ACTION they have done differently (not a feeling or a self-description), PLUS a choice they keep making repeatedly — a claimed change ("I\'m becoming more confident") is not accepted on its own until tied to something they actually did. Do not ask more than 2 sub-questions.',
    practice: 'What way of being those repeated choices seem to be rehearsing, PLUS what they feel they are becoming better at. Do not ask more than 1 sub-question.',
    normal: 'What they are becoming accustomed to, PLUS what they tolerate now that they didn\'t before, or have stopped tolerating — either direction is legitimate. Do not ask more than 1 sub-question.',
    'possible-selves': 'All three: who they hope they\'re becoming, who they\'re afraid they\'re becoming, and who they believe they\'re supposed to become — these can genuinely differ from each other and that\'s the point, not something to resolve into one. Do not ask more than 1 sub-question.',
    trajectory: 'Which of the three named possible selves their actual current life most resembles, PLUS which version of themselves they feel they are becoming less like. Do not ask more than 1 sub-question.',
    'feeling-real': 'Where in their current life they feel most like themselves — genuinely themselves, inhabited rather than performed. Do not ask more than 1 sub-question.',
    extrapolate: 'What might become stronger if they continued exactly as they are now, PLUS which direction(s) they choose to strengthen, reconsider, or simply keep observing without acting yet — "just watch, not decide yet" is a fully legitimate choice. Do not ask more than 1 sub-question.',
    'name-it-now': 'Their own completion of "I am becoming someone who..." PLUS something concrete they are doing today that is already creating that person. Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // The Threshold — "what is stopping me from moving forward?" (docs/
  // journeys-concept.md). Hard content constraint carried into
  // return-answer's own goal text below: the Journey's desired outcome
  // is CLARITY about non-action, not action — staying exactly where they
  // are, with real clarity about why, must be a fully legitimate,
  // complete, successful outcome, never nudged toward crossing.
  'the-threshold': {
    movement: 'What "moving forward" actually means concretely, PLUS the one specific action that would make it real (e.g. "press publish," not "launch my business" left abstract) — a real BEFORE/THRESHOLD/AFTER structure is needed before anything else can be grounded. Do not ask more than 2 sub-questions.',
    'forward-back': 'What genuinely pulls them toward moving, PLUS what genuinely pulls them away — both must be treated as equally real; never imply the "back" pull is simply fear to be overcome. Do not ask more than 1 sub-question.',
    'reality-knowing': 'What becomes concretely real once they cross this specific threshold, PLUS what they would find out that they currently don\'t have to know. Do not ask more than 1 sub-question.',
    'failure-success': 'What they fear if it goes badly, PLUS what changes if it goes well — both halves, symmetric weight. Do not ask more than 1 sub-question.',
    'loss-staying': 'What they could lose BY MOVING, PLUS what staying currently gives them, PLUS what they could lose BY NOT MOVING — genuinely three things, the deliberately symmetric structure (moving has both gains and losses; staying has both gains and losses) rather than the naive move=risk/stay=safety framing. Do not ask more than 1 sub-question.',
    voice: 'What their hesitation would say if it could speak as its own voice, PLUS which of those concerns respond to something actually happening now versus something that might happen later. Do not ask more than 1 sub-question.',
    ambivalence: 'What the part of them that wants to move seems to want FOR them (not just "to move"), PLUS what the part that wants to stay wants for them — treating both parts as having a genuine, legitimate interest in their wellbeing, neither villainized. Do not ask more than 1 sub-question.',
    'identity-permission': 'Who they imagine they would become on the other side of this threshold, PLUS whose permission (if anyone\'s) they feel they are waiting for — "nobody\'s, I think it\'s just me" is a legitimate answer. Do not ask more than 1 sub-question.',
    'staying-future': 'What feels impossible to undo, PLUS whether that\'s actually true (many things people call irreversible have more give than they assume — but never assert this, only ask), PLUS where staying leads if this direction simply continues. Do not ask more than 1 sub-question.',
    'return-answer': 'Their own honest answer to what is actually stopping them from moving forward, now informed by everything above — clarity about NOT crossing, with real understanding of why, is a fully legitimate, complete, successful outcome. Never treat "I think I\'m going to stay, and now I understand why" as an incomplete or lesser result than deciding to move. Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // Possible Selves — "which future actually feels like mine?" (docs/
  // journeys-concept.md). Hard content constraint: multiple, even
  // competing, imagined futures at once is psychologically sound, not
  // indecisive — never quietly narrow the person toward one "correct"
  // future at any stage.
  'possible-selves': {
    multiplicity: 'AT LEAST TWO genuinely different imagined futures, PLUS what an ordinary day actually looks like in each — concrete daily texture, not just a social-identity label ("a doctor," "married with kids"). If they only offer one future, ask once for at least a second. Do not ask more than 2 sub-questions.',
    underneath: 'What each named future gives them psychologically, PLUS for each one, whether they want to BE that person or simply HAVE what that person has — a real, useful distinction, not a trick question. Do not ask more than 1 sub-question.',
    'audience-status': 'What remains of each future\'s pull once being seen by others is imagined removed, PLUS once impressiveness is imagined removed — "nothing changes" for either is a fully legitimate, complete answer for any given future. Do not ask more than 1 sub-question.',
    fear: 'Which futures they reject because of what choosing them would seem to mean about them, PLUS who they are afraid of becoming, PLUS which future still draws them once its social label/identity is stripped away. Do not ask more than 1 sub-question.',
    'cost-loss': 'What each future would ask of them, PLUS what version of themselves each would require leaving behind — real costs on every option, not just the ones they\'re leaning away from. Do not ask more than 1 sub-question.',
    continuity: 'Where each named future ALREADY exists in some form in their current life, right now — this stage is not optional scaffolding, it\'s central to the whole Journey\'s premise that futures reveal a present self, not a destination. Do not ask more than 1 sub-question.',
    congruence: 'Which future feels inhabited rather than performed, PLUS what happens inside them when they imagine having already chosen it. Do not ask more than 1 sub-question.',
    'escape-reality': 'What present problem they imagine each future solving, PLUS what NEW problems that future might create instead — every future must have both, no fantasy-only option. Do not ask more than 1 sub-question.',
    'common-thread': 'What element, quality, or feeling appears across every future that genuinely feels like theirs — "nothing common, they\'re all different" is a legitimate answer. Do not ask more than 1 sub-question.',
    'return-answer': 'What these imagined futures reveal about who they are today, PLUS their own answer to which future feels like theirs, OR what a future would need to contain to feel like theirs — a specific future is not required; naming the missing ingredient is an equally complete answer. Do not ask more than 1 sub-question — this is the closing stage.',
  },
  // Enough — "what would actually be enough for me?" (docs/journeys-
  // concept.md). Hard content constraint: never rank goals as worthy or
  // unworthy (wanting money, recognition, or achievement is not
  // inherently unhealthy) — only ever ask what the goal is doing for the
  // person, in every stage's own goal text below.
  enough: {
    'more-threshold': 'ONE real thing they feel they don\'t have enough of (can be any domain — money, recognition, reassurance, achievement, certainty), PLUS a real answer to how they\'d know when they had enough of it — a number, a feeling, a condition, whatever they actually name. Do not ask more than 2 sub-questions.',
    underneath: 'What they expect having enough would actually give them, PLUS what they are postponing until they reach it ("then I\'ll..."). Do not ask more than 1 sub-question.',
    'history-adaptation': 'What once would have felt like plenty to them, PLUS something they actually reached that eventually became normal/unremarkable — concrete instances, not a general claim about human nature. Do not ask more than 1 sub-question.',
    authority: 'Who or what determines whether they have enough, PLUS who they\'re comparing themselves against, PLUS what changes if nobody could see what they have — three parts. Do not ask more than 1 sub-question.',
    'purpose-levels': 'What "enough" is actually for in this case, PLUS an attempt to distinguish what would cover survival, safety, the life they actually want, versus what\'s simply more beyond that — doesn\'t need to be precise, just genuinely attempted. Do not ask more than 1 sub-question.',
    'not-no-desire': 'Something they would still want even after having enough of the thing named in stage 1 — this guards against mistaking "enough" for "wanting nothing further," which is not the same thing and must not be implied as the goal. Do not ask more than 1 sub-question.',
    'fear-motivation': 'What feels threatening about saying "this is enough" (loss of drive, loss of identity, complacency, being seen as having stopped trying), PLUS whether they believe they personally need some dissatisfaction to keep moving — never validate or challenge this belief, only surface it. Do not ask more than 1 sub-question.',
    maximizing: 'A genuine answer to whether they are looking for enough or for the maximum possible outcome — maximizing is not framed as a flaw, just a real, nameable orientation with its own real tradeoffs (research shows maximizers sometimes get objectively better outcomes while feeling worse about them). Do not ask more than 1 sub-question.',
    'recognition-condition': 'Somewhere in their life where they already genuinely know what enough feels like (even a small, unrelated domain), PLUS what conditions (rather than a number) would make the thing from stage 1 feel like enough. Do not ask more than 1 sub-question.',
    permission: 'An honest answer to whether they would actually let themselves count those conditions as enough if they existed — "no, I don\'t think I would" is a real, important, legitimate answer, not a failure. Do not ask more than 1 sub-question.',
    'now-answer': 'How much of what they\'d call enough is already present in their life right now, PLUS their own answer to the Journey\'s own opening question, now informed by everything above. Do not ask more than 1 sub-question — this is the closing stage.',
  },
};

// Mechanical, code-enforced ceiling on sub-questions per stage — NOT just
// the soft "do not ask more than N" language already embedded in each
// STAGE_GOALS entry above. Confirmed live (2026-08-29, throwaway
// scripts/test-control-redesign.mjs) that the prompt-only cap is not
// reliably obeyed on its own: a deliberately vague answer pushed a
// "1 sub-question max" stage to 3+ turns before the model finally marked
// stageComplete. This map is the real backstop — once a stage's turn
// count (turns already recorded, BEFORE this reply) reaches the cap, the
// stage is forced complete regardless of what the model returned,
// matching this project's own standing "a soft prompt rule needs a hard
// backstop, not just better wording" lesson (see isTopicDrift's own
// history).
const STAGE_SUBQUESTION_CAP = {
  control: {
    situation: 2,
    wish: 1,
    observable: 1,
    represents: 1,
    separate: 1,
    recognition: 1,
  },
  'the-choice': {
    choice: 2,
    attraction: 1,
    pressure: 1,
    audience: 1,
    fear: 1,
    cost: 1,
    futures: 1,
    'choice-again': 1,
  },
  'the-loop': {
    present: 2,
    familiarity: 1,
    past: 2,
    compare: 1,
    desire: 1,
    expectation: 1,
    response: 1,
    pattern: 1,
    recognition: 1,
  },
  'whose-voice': {
    statement: 2,
    consequence: 1,
    origin: 1,
    meaning: 1,
    remove: 1,
    disagreement: 1,
    integration: 1,
    'my-voice': 1,
  },
  'the-road-not-taken': {
    fork: 2,
    'reality-imagination': 1,
    object: 1,
    responsibility: 1,
    'me-then-now': 1,
    'closed-open': 1,
    'unlived-self': 1,
    uncertainty: 1,
    'return-to-now': 1,
  },
  'letting-go': {
    'the-object': 2,
    'gone-remains': 1,
    connection: 1,
    hope: 1,
    unfinished: 1,
    meaning: 1,
    identity: 1,
    'function-price': 1,
    'time-keep': 1,
    'form-now': 1,
  },
  'the-mirror': {
    person: 2,
    reality: 1,
    meaning: 1,
    desire: 1,
    self: 1,
    role: 1,
    familiarity: 1,
    'reality-check': 1,
    authority: 1,
    'the-mirror-now': 1,
  },
  'the-unsaid': {
    person: 2,
    reaction: 1,
    'expression-outcome': 1,
    meaning: 1,
    silence: 1,
    exposure: 1,
    'remove-listener-editor': 1,
    contradiction: 1,
    distill: 1,
    communication: 1,
  },
  becoming: {
    change: 1,
    evidence: 2,
    practice: 1,
    normal: 1,
    'possible-selves': 1,
    trajectory: 1,
    'feeling-real': 1,
    extrapolate: 1,
    'name-it-now': 1,
  },
  'the-threshold': {
    movement: 2,
    'forward-back': 1,
    'reality-knowing': 1,
    'failure-success': 1,
    'loss-staying': 1,
    voice: 1,
    ambivalence: 1,
    'identity-permission': 1,
    'staying-future': 1,
    'return-answer': 1,
  },
  'possible-selves': {
    multiplicity: 2,
    underneath: 1,
    'audience-status': 1,
    fear: 1,
    'cost-loss': 1,
    continuity: 1,
    congruence: 1,
    'escape-reality': 1,
    'common-thread': 1,
    'return-answer': 1,
  },
  enough: {
    'more-threshold': 2,
    underneath: 1,
    'history-adaptation': 1,
    authority: 1,
    'purpose-levels': 1,
    'not-no-desire': 1,
    'fear-motivation': 1,
    maximizing: 1,
    'recognition-condition': 1,
    permission: 1,
    'now-answer': 1,
  },
};

// A short, generic fallback sub-question per stage, used only when the
// model's own generated sub-question is empty/placeholder AND the stage
// isn't complete yet — there's no fixed "next stage" text to fall back to
// mid-stage the way there is on a real stage transition, so each stage
// needs its own minimal nudge.
const STAGE_FALLBACK_NUDGE = {
  control: {
    situation: "What situation is this actually about?",
    wish: "What would you want to happen instead, in one sentence?",
    observable: "What's one thing you'd see or hear that would tell you?",
    represents: "What would that give you, in one word?",
    separate: "Leaving that aside — what's still yours here?",
    recognition: "What stands out to you right now?",
  },
  'the-choice': {
    choice: "What are the two real options in front of you?",
    attraction: "What's one thing that draws you toward it?",
    pressure: "Is anyone else's opinion in the room right now?",
    audience: "If nobody would know, what changes — if anything?",
    fear: "What's the thing you're actually afraid might happen?",
    cost: "What would you be giving up?",
    futures: "What does that imagined life pull you toward, or away from?",
    'choice-again': "What feels true right now, even if it's still unclear?",
  },
  'the-loop': {
    present: "What did you think, feel, or do about it?",
    familiarity: "Does anything about it feel familiar — or not?",
    past: "Can you recall a time that felt something like this?",
    compare: "What's actually the same, and what's different?",
    desire: "What did you want, in each of these?",
    expectation: "What did you expect to happen?",
    response: "What did you actually do?",
    pattern: "If anything repeats here, where does it live?",
    recognition: "What stands out to you right now?",
  },
  'whose-voice': {
    statement: "Is it a want, a should, or a must?",
    consequence: "What do you feel when you imagine not following it?",
    origin: "Who or what comes to mind first?",
    meaning: "What does it mean to you now?",
    remove: "What's left once nobody's watching?",
    disagreement: "Would letting it go feel like leaving something behind?",
    integration: "Do you still choose it today?",
    'my-voice': "What do you believe, in your own words?",
  },
  'the-road-not-taken': {
    fork: "What do you imagine would have happened next?",
    'reality-imagination': "Which parts do you actually know versus just hope?",
    object: "What would having it actually give you?",
    responsibility: "Whose action, or what circumstance, do you wish had been different?",
    'me-then-now': "What do you know now that you didn't know then?",
    'closed-open': "Is there anything that still feels possible, even changed?",
    'unlived-self': "What do you feel toward that version of yourself?",
    uncertainty: "What might not have gone well on that road either?",
    'return-to-now': "What does this show you about your life now?",
  },
  'letting-go': {
    'the-object': "What exactly feels hard to release?",
    'gone-remains': "What still exists, even now?",
    connection: "What would you lose if you let go?",
    hope: "What does keeping that hope open cost you?",
    unfinished: "What's still waiting to happen?",
    meaning: "What would that actually change for you?",
    identity: "Who would you be without it?",
    'function-price': "What does it ask of you in return?",
    'time-keep': "What would you want to keep, regardless?",
    'form-now': "Hold, carry differently, or leave — which feels closest?",
  },
  'the-mirror': {
    person: "What specifically brings that reaction out?",
    reality: "What did they actually say or do?",
    meaning: "What did you take that to mean?",
    desire: "Why does it matter that it's them, specifically?",
    self: "What do they bring out in you?",
    role: "What part does that leave you playing?",
    familiarity: "Has this pairing shown up before, with someone else?",
    'reality-check': "Has this specifically happened before, more than once?",
    authority: "What would change if their opinion couldn't define you?",
    'the-mirror-now': "What does this make visible in you?",
  },
  'the-unsaid': {
    person: "Even one unfinished sentence — where would you start?",
    reaction: "What do you imagine they'd do?",
    'expression-outcome': "Separate from what you want to happen — what do you want to SAY?",
    meaning: "What do you want your words to actually do?",
    silence: "What does staying quiet ask of you?",
    exposure: "What would they know about you if you said it plainly?",
    'remove-listener-editor': "If it never had to be fair or reasonable — what else is there?",
    contradiction: "Is there a part of you that wants the opposite?",
    distill: "Which part feels truest?",
    communication: "Who really needs to hear this?",
  },
  becoming: {
    change: "What's the same as it's always been?",
    evidence: "What's something you actually did, not just felt?",
    practice: "What do you seem to be getting better at?",
    normal: "What are you used to now that you weren't before?",
    'possible-selves': "Who are you afraid of becoming?",
    trajectory: "Which one does your life right now actually look like?",
    'feeling-real': "Where do you feel most like yourself?",
    extrapolate: "Which direction do you want to keep, or reconsider?",
    'name-it-now': "What are you doing today that builds that?",
  },
  'the-threshold': {
    movement: "What's the actual next concrete step?",
    'forward-back': "And what pulls you the other way?",
    'reality-knowing': "What would you rather not know yet?",
    'failure-success': "What changes if it goes well?",
    'loss-staying': "What does staying still give you?",
    voice: "Is that about now, or about what might happen?",
    ambivalence: "What does the part that wants to stay want for you?",
    'identity-permission': "Whose permission do you feel like you're waiting for?",
    'staying-future': "Is it actually undoable, or does it just feel that way?",
    'return-answer': "What do you think is really stopping you?",
  },
  'possible-selves': {
    multiplicity: "What's a second, different future you imagine?",
    underneath: "Do you want to be them, or just have what they have?",
    'audience-status': "Does it still pull you if nobody's impressed?",
    fear: "What would choosing it seem to say about you?",
    'cost-loss': "What would you leave behind for that one?",
    continuity: "Where does that already show up in your life now?",
    congruence: "Does it feel like you, or like a performance?",
    'escape-reality': "What new problem might it bring instead?",
    'common-thread': "What shows up in more than one of these?",
    'return-answer': "What would a future need, to feel like yours?",
  },
  enough: {
    'more-threshold': "How would you actually know you had enough?",
    underneath: "What are you waiting to reach before you allow yourself something?",
    'history-adaptation': "What became normal that used to feel like plenty?",
    authority: "Who's actually deciding whether it's enough?",
    'purpose-levels': "Enough for what, exactly?",
    'not-no-desire': "What would you still want, even then?",
    'fear-motivation': "What do you think you'd lose by saying 'enough'?",
    maximizing: "Best possible, or just good enough?",
    'recognition-condition': "Where do you already know what enough feels like?",
    permission: "Would you actually let that count?",
    'now-answer': "How much of that is already here?",
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
  // Mechanical cap — see STAGE_SUBQUESTION_CAP's own comment for why this
  // exists on top of (not instead of) the prompt's own soft language.
  // currentStage.turns.length is how many sub-questions have ALREADY been
  // asked and answered before this reply — once that meets the cap, this
  // reply is forced to complete the stage no matter what the model says.
  const subQuestionCap = STAGE_SUBQUESTION_CAP[journey]?.[stageId];
  const forceStageComplete = typeof subQuestionCap === "number" && (currentStage?.turns?.length ?? 0) >= subQuestionCap;
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
    // forceStageComplete overrides the model's own stageComplete decision
    // once the mechanical cap is hit — see STAGE_SUBQUESTION_CAP's comment.
    // Still gated on engaged/!goBack, same as the model-driven path: a
    // non-engaged or go-back reply is never forced complete.
    const stageComplete = engaged && !goBack && (parsed.stageComplete === true || forceStageComplete);
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

    const separateReveal = (stageComplete && journey === "control" && stageId === "represents")
      ? buildSeparateReveal(priorStages)
      : null;

    let nextQuestion = null;
    if (goBack) {
      nextQuestion = null;
    } else if (!engaged) {
      nextQuestion = null; // the sub-question lives in `reply` for non-engagement, per the prompt
    } else if (stageComplete) {
      if (isLastStage) {
        nextQuestion = null;
      } else if (separateReveal !== null || (journey === "control" && stageId === "represents")) {
        // "separate" opens with the authored reveal, not the AI's own
        // phrasing — see buildSeparateReveal's own comment. The model
        // isn't even asked to phrase this transition (no drift risk
        // possible since nothing here is generated).
        nextQuestion = separateReveal ? `${separateReveal} ${nextOpeningQuestion}` : nextOpeningQuestion;
      } else {
        nextQuestion = typeof parsed.nextQuestion === "string" && !isPlaceholderText(parsed.nextQuestion) && nextOpeningQuestion && !isTopicDrift(parsed.nextQuestion, nextOpeningQuestion)
          ? parsed.nextQuestion.trim()
          : nextOpeningQuestion;
      }
    } else {
      // Still gathering — a genuine sub-question, no fixed text exists to
      // compare it against (see STAGE_FALLBACK_NUDGE's own comment).
      nextQuestion = typeof parsed.nextQuestion === "string" && !isPlaceholderText(parsed.nextQuestion)
        ? parsed.nextQuestion.trim()
        : STAGE_FALLBACK_NUDGE[journey]?.[stageId] ?? "Can you say a little more about that?";
    }

    const isComplete = stageComplete && isLastStage;

    let extractedPropositions = null;
    if (stageComplete && stageId === "separate") {
      extractedPropositions = await tryExtractPropositions({ session, journey, locale, answer, stageIndex });
    }

    await persistExchange({
      session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer,
      engaged, stageComplete, goBack, showAcknowledgment, reply, nextQuestion, isComplete, extractedPropositions,
      nextStageRevealText: separateReveal,
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
    const failOpenReveal = (journey === "control" && stageId === "represents") ? buildSeparateReveal(priorStages) : null;
    const nextQuestion = isLastStage
      ? null
      : failOpenReveal
        ? `${failOpenReveal} ${nextOpeningQuestion}`
        : nextOpeningQuestion ?? null;
    await persistExchange({
      session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer,
      engaged, stageComplete, goBack: false, showAcknowledgment: false, reply: null, nextQuestion, isComplete,
      nextStageRevealText: failOpenReveal,
    });
    return res.json({ engaged, goBack: false, stageComplete, showAcknowledgment: false, reply: null, nextQuestion, isComplete });
  }
}

// Extracts clean, first-person propositions-about-agency from everything
// said across all prior stages, once "separate" (the stage immediately
// before "agency") completes — a SEPARATE Groq call, not merged into the
// same JSON blob as the exchange decision above, since mixing "phrase the
// next question" and "extract propositions" into one response risks the
// same drift problem the reduction-test mechanism above already had to
// solve once. Fails open to null (the caller falls back to raw per-stage
// answers, matching the original V1 behavior) on any error — this must
// never block a stage transition.
async function tryExtractPropositions({ session, journey, locale, answer }) {
  if (journey !== "control") return null; // agency-sort is Control-specific for now
  try {
    const allTurnsText = [
      ...session.stages
        .filter((s) => s.finalAnswer)
        .map((s) => `"${s.openingQuestion}" → "${s.finalAnswer}"`),
      `"separate" → "${answer}"`, // the answer that just completed this stage, not yet persisted
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

async function persistExchange({ session, stageIndex, stageId, openingQuestion, nextOpeningQuestion, answer, structuredAnswer, engaged, stageComplete, goBack, showAcknowledgment, reply, nextQuestion, isComplete, extractedPropositions, nextStageRevealText }) {
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
    if (nextStageRevealText) nextStage.revealText = nextStageRevealText;
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

// GET /api/journeys/sessions — every COMPLETED session for the signed-in
// user, across all Journeys, newest first (2026-08-30, see RULES.md's
// "history is the product" framing — every finished Journey becomes a
// real entry in the person's own record). No consent check here — unlike
// MeasureResult (never created at all without consent, see
// chatController.js's saveMeasureResultIfConsented), a JourneySession must
// persist regardless of consent since the engine itself depends on it
// (resuming mid-stage, the completion reflection) for every user, not
// just consenting ones. Consent for Journey-history VISIBILITY is instead
// enforced client-side in Your Arc (mobile/app/your-arc.tsx applies this
// fetch's result only inside the same profile.consent.psychologicalData
// .given guard every other record type there already uses) — a product/
// UI decision, not a data-access one; the session always belongs to and
// is readable by its own owner via this endpoint.
export async function getJourneySessions(req, res) {
  const sessions = await JourneySession.find({
    userId: req.user.id,
    completedAt: { $ne: null },
  })
    .sort({ completedAt: -1 })
    .limit(100);
  res.json(sessions);
}

// POST /api/journeys/purchase — self-service free grant (2026-08-28,
// Selfinder is fully free for now, see RULES.md's Product/positioning
// section). Any signed-in user can call this to grant themselves one
// journeyPurchases[] entry for the given journey, the same shape
// scripts/grantJourney.js already creates for an admin comp, just with
// source: "free" instead of "manual" so the data itself still
// distinguishes the two. Always creates a NEW entry (never reuses an
// existing one) — a Journey is bought again and again by design (see
// RULES.md: "Bought again, not owned once"), so a fresh purchaseId/
// seedNonce here matches exactly what a real repeat purchase would do,
// just without payment behind it.
export async function postJourneyPurchase(req, res) {
  const { journey } = req.body;
  if (!journey || !JOURNEY_KEYS.includes(journey)) {
    return res.status(400).json({ error: `journey must be one of: ${JOURNEY_KEYS.join(", ")}` });
  }

  const user = await User.findOne({ id: req.user.id });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const purchase = {
    journey,
    source: "free",
    purchasedAt: new Date().toISOString(),
    seedNonce: Date.now(),
  };
  user.journeyPurchases.push(purchase);
  await user.save();

  const saved = user.journeyPurchases[user.journeyPurchases.length - 1];
  res.json({ id: saved.id, journey: saved.journey, source: saved.source, purchasedAt: saved.purchasedAt, seedNonce: saved.seedNonce });
}
