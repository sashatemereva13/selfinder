import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import { BADGE_COMMENT_PROMPTS } from "../data/badgeCommentPrompts.js";
import { JOURNEY_LINE_PROMPTS } from "../data/journeyLinePrompts.js";
import User from "../models/User.js";
import MeasureResult from "../models/MeasureResult.js";
import { recommendPhilosopher } from "./measureController.js";
import {
  VIBRATION_SCALE_REFERENCE,
  getNearestVibrationLevel,
  getFrequencyBand,
  calibrateVibrationScore,
} from "../data/vibrationLevels.js";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// llama-3.3-70b-versatile was decommissioned by Groq on 2026-08-16; the
// call sites that used models[0] now run on openai/gpt-oss-120b, one of
// Groq's two recommended replacements (the other, Qwen3.6 27B, stays
// reserved for the Russian locale only — see QWEN_MODEL below). Unlike
// Qwen, gpt-oss-120b does NOT support reasoning_format: its hidden
// reasoning is returned in a separate response field by default (not
// prepended to message.content), so none of resolveModelParams' Qwen-style
// reasoning_format/max_tokens headroom applies here. It DOES need its own
// reasoning_effort: "low" (see GPT_OSS_REASONING_EFFORT below) — left at
// its implicit default, gpt-oss-120b burned its whole max_tokens budget on
// hidden reasoning and returned empty content with finish_reason: "length"
// on every call, confirmed live 2026-08-17 (this silently broke every
// Measure reading and Crossing reflection after the model swap above).
// llama-3.1-8b-instant and mixtral-8x7b-32768 (formerly models[1]/[2]) were
// also removed from Groq at some point after 2026-08-04 (confirmed via
// groq.models.list() on 2026-08-17: both 404 as model_not_found, and
// neither appears in the current model list at all) — a second, separate
// decommission from llama-3.3-70b-versatile above, discovered because
// Guide (postChat, models[1]) kept failing live even after the models[0]
// fix, while Measure (models[0]) worked. models[1] is now
// openai/gpt-oss-20b, the lighter sibling of models[0]'s gpt-oss-120b;
// models[2] (mixtral) was never actually referenced by any call site in
// this file, so it's dropped rather than replaced.
const models = [
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b",
];

// Qwen (Alibaba Cloud), hosted on Groq alongside the Llama models above —
// confirmed live via groq.models.list() on 2026-08-04. Used for the
// Russian-locale build instead of models[n], since Qwen is explicitly
// trained for stronger non-English (including Russian) performance than
// the Llama models this app otherwise runs on.
const QWEN_MODEL = "qwen/qwen3.6-27b";

// Qwen's hidden reasoning tokens are generated (and counted against
// max_tokens) before the visible reply, and the amount varies per request
// — measured between 1043 and 2460 reasoning tokens across a handful of
// identical test calls to the same prompt. A max_tokens sized for just the
// visible reply's own length silently truncates the reply mid-sentence
// once the model's actual reasoning that request runs long — confirmed
// live: max_tokens: 1200 cut a reply off mid-word and broke JSON parsing,
// where max_tokens: 3000 for the same prompt completed cleanly. 2800 (not
// the ~2460 max observed) leaves real margin above the highest reasoning
// count seen so far, since a harder question could plausibly need more.
// This is added on top of each call site's own fallbackMaxTokens (its
// existing English-locale budget for the visible reply alone) rather than
// replacing it, so raising a call site's reply-length budget later doesn't
// also require remembering to re-tune this constant.
const QWEN_REASONING_TOKEN_HEADROOM = 2800;

// gpt-oss-120b's default reasoning_effort ("medium") routinely consumed an
// entire small max_tokens budget (90-400 across this file's call sites) on
// hidden reasoning alone, leaving nothing for the visible reply — confirmed
// live: identical prompts returned empty content with finish_reason:
// "length" at the default effort. "low" cuts that down a lot, but is NOT
// sufficient by itself with this file's real (long) prompts — the scoring
// prompt (with the full VIBRATION_SCALE_REFERENCE embedded) still hit
// finish_reason: "length" 10/10 times at max_tokens: 400 even at "low"
// effort; only raising each call site's own max_tokens (see the values
// next to GPT_OSS_REASONING_EFFORT's call sites) made it reliable — this
// constant alone does not guarantee non-empty output.
const GPT_OSS_REASONING_EFFORT = "low";

// Picks the model (and any model-specific request params, including
// max_tokens) for a given call: Qwen when the request came from the
// Russian-locale app, otherwise whichever Llama/Mixtral model and
// max_tokens that call site already used. Spread the return value
// directly into groq.chat.completions.create()'s params object — it
// always includes max_tokens, so call sites should NOT also set their own
// max_tokens key alongside this spread (the object literal's later key
// would silently win over this one, undoing the reasoning headroom).
//
// reasoning_format: "hidden" is not cosmetic — Qwen3.6 has reasoning mode
// on by default, and left unconfigured it prepends a raw
// `<think>...</think>` block to every reply (confirmed live against the
// real Groq API). That breaks two things at once: the person would see the
// model's internal chain-of-thought instead of the philosopher's reply,
// and every call site that parses the reply as JSON (postChat,
// postMeasureExchange) would fail to parse, since the leaked <think>
// block isn't valid JSON.
//
// Using "hidden" rather than reasoning_effort: "none" specifically because
// disabling reasoning outright measurably changes the quality of the
// *answer itself*, not just whether a trace is shown — a philosopher's
// reply benefits from the model actually reasoning about tone, what's
// underneath what the person said, and how to phrase it in character,
// even though none of that reasoning should ever be shown. "hidden" keeps
// reasoning_effort at its default and lets Qwen think as much as it
// needs, it just excludes that trace from message.content.
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

// Appended to the system prompt only for Russian-locale requests — every
// system prompt in this file (UNIVERSAL_RULES, each philosopher's
// hand-authored persona, the badge/journey-line prompts) is written in
// English, so without this the model has no signal that a Russian reply
// is expected just because the request happened to come from the Russian
// build. Kept as a short trailing instruction rather than translating the
// prompts themselves — the persona/rules content stays the single English
// source of truth; only the output language changes per request.
const RUSSIAN_REPLY_INSTRUCTION =
  "\n\nRespond in Russian. Write naturally as a fluent Russian speaker would — do not translate word-for-word from English; express the same voice and meaning in idiomatic Russian.";

function localizedSystemPrompt(basePrompt, locale) {
  return locale === "ru" ? basePrompt + RUSSIAN_REPLY_INSTRUCTION : basePrompt;
}
const BADGE_COMMENT_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const badgeCommentCache = new Map();

function readCachedBadgeComment(cacheKey) {
  const cached = badgeCommentCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > BADGE_COMMENT_CACHE_TTL_MS) {
    badgeCommentCache.delete(cacheKey);
    return null;
  }
  return cached.comment;
}

function cleanBadgeComment(text) {
  return (text ?? "")
    .replace(/\s+/g, " ")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .trim();
}

const JOURNEY_LINE_CACHE_TTL_MS = 1000 * 60 * 60 * 12;
const JOURNEY_LINE_CACHE_VERSION = 2;
const journeyLineCache = new Map();

function readCachedJourneyLine(cacheKey) {
  const cached = journeyLineCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.createdAt > JOURNEY_LINE_CACHE_TTL_MS) {
    journeyLineCache.delete(cacheKey);
    return null;
  }
  return cached.line;
}

function cleanJourneyLine(text) {
  const metaPrefixes = [
    /^(?:here(?:'s| is)\s+)?(?:a\s+)?rewritten version(?:\s+of\s+the\s+line)?(?:\s+in\s+the\s+voice\s+of\s+[a-z .'-]+)?[:,-]?\s*/i,
    /^(?:here(?:'s| is)\s+)?(?:the\s+)?rewritten line(?:\s+in\s+the\s+voice\s+of\s+[a-z .'-]+)?[:,-]?\s*/i,
    /^(?:here(?:'s| is)\s+)?(?:the\s+)?line(?:\s+rewritten)?(?:\s+in\s+the\s+voice\s+of\s+[a-z .'-]+)?[:,-]?\s*/i,
    /^(?:socrates|marcus aurelius|kierkegaard|camus|aristotle)\s*(?:would say|might say)[:,-]?\s*/i,
  ];

  let cleaned = (text ?? "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .trim();

  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1 && metaPrefixes.some((pattern) => pattern.test(lines[0]))) {
    cleaned = lines.slice(1).join("\n").trim();
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of metaPrefixes) {
      const next = cleaned.replace(pattern, "").trim();
      if (next !== cleaned) {
        cleaned = next;
        changed = true;
      }
    }
  }

  return cleaned;
}

const SPILL_SIGNAL_INSTRUCTION = `
Respond with ONLY valid JSON, no markdown, in exactly this shape:
{"reply": "...", "suggestSpill": false}

"reply" is your actual response, fully in character, following every rule above.

Set "suggestSpill" to true only when the person's most recent message reads
as someone who needs to get something out before they can engage in dialogue
at all — a flood, not a thought. Long, unstructured, emotionally overwhelmed
messages are the signal, not sadness or difficulty in general; someone
reflecting, questioning, or in an ordinary back-and-forth is not this. This
should be rare — most messages are not this. When true, weave a brief,
natural invitation into "reply" to just write freely instead of talking,
fully in your own voice — never a generic suggestion bolted on.`;

// SPILL_SIGNAL_INSTRUCTION asks the model to report its suggestSpill
// decision as a separate JSON field, but the smaller/faster model
// (models[1]) sometimes narrates that decision inline instead — a trailing
// "(No suggestion of Spill)" or similar aside appended to the actual reply
// text. This still parses as valid JSON (it's just extra text inside the
// "reply" string), so the fail-open branch above never catches it; this
// strips that specific meta-commentary pattern before the reply reaches
// the person on the other end, who should never see the model's own
// bookkeeping about itself.
function cleanSpillMetaCommentary(reply) {
  return reply
    .replace(/\n*\(\s*(?:no\s+)?suggestion(?:\s+of)?\s+spill\s*\)\s*$/i, "")
    .trim();
}

export async function postChat(req, res) {
  const { messages, systemPrompt, locale } = req.body;

  if (!messages || !systemPrompt) {
    return res
      .status(400)
      .json({ error: "messages and systemPrompt are required" });
  }

  try {
    const response = await groq.chat.completions.create({
      ...resolveModelParams(locale, models[1], 512),
      messages: [
        {
          role: "system",
          content: localizedSystemPrompt(
            UNIVERSAL_RULES + "\n\n" + systemPrompt + "\n\n" + SPILL_SIGNAL_INSTRUCTION,
            locale
          ),
        },
        ...messages,
      ],
    });

    const text = response.choices[0].message.content.trim();
    let parsed = null;
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      // Fail open: treat the raw output as the reply so a parsing hiccup
      // never blocks the conversation.
      return res.json({ reply: text, suggestSpill: false });
    }

    res.json({
      reply: cleanSpillMetaCommentary(parsed.reply),
      suggestSpill: parsed.suggestSpill === true,
    });
  } catch (err) {
    console.error("Chat request failed:", err.message);
    res.status(500).json({ error: "AI request failed" });
  }
}

export async function postBadgeComment(req, res) {
  const { philosopherId, pathname, pageContext, fallbackComment } = req.body;
  const systemPrompt = BADGE_COMMENT_PROMPTS[philosopherId];

  if (!philosopherId || !systemPrompt) {
    return res.status(400).json({ error: "A valid philosopherId is required" });
  }

  const normalizedPath = typeof pathname === "string" && pathname.trim() ? pathname.trim() : "/";
  const contextLabel = pageContext?.label || normalizedPath;
  const contextDescription = pageContext?.description || "A page within the Selfinder journey.";
  const contextThemes = Array.isArray(pageContext?.themes)
    ? pageContext.themes.filter(Boolean).slice(0, 5)
    : [];

  const cacheKey = JSON.stringify({
    philosopherId,
    pathname: normalizedPath,
    label: contextLabel,
    description: contextDescription,
    themes: contextThemes,
  });

  const cachedComment = readCachedBadgeComment(cacheKey);
  if (cachedComment) {
    return res.json({ comment: cachedComment, cached: true });
  }

  const referenceLine = typeof fallbackComment === "string" && fallbackComment.trim()
    ? fallbackComment.trim()
    : null;

  const prompt = [
    `The user has just opened "${contextLabel}" (${normalizedPath}).`,
    `Page context: ${contextDescription}`,
    contextThemes.length > 0 ? `Themes: ${contextThemes.join(", ")}.` : null,
    referenceLine ? `Reference line from the existing scripted version: ${referenceLine}` : null,
    "Write exactly one original line for the philosopher badge.",
    "Requirements:",
    "- one sentence only",
    "- 8 to 22 words",
    "- no quotation marks",
    "- no emojis",
    "- no bullet points",
    "- no stage directions",
    "- do not repeat the reference line verbatim",
  ].filter(Boolean).join("\n");

  try {
    const response = await groq.chat.completions.create({
      model: models[1],
      max_tokens: 150,
      temperature: 0.9,
      reasoning_effort: GPT_OSS_REASONING_EFFORT,
      messages: [
        { role: "system", content: UNIVERSAL_RULES + "\n\n" + systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const comment = cleanBadgeComment(response.choices[0].message.content);
    if (!comment) {
      throw new Error("Empty badge comment");
    }

    badgeCommentCache.set(cacheKey, {
      comment,
      createdAt: Date.now(),
    });

    res.json({ comment, cached: false });
  } catch (err) {
    console.error("Badge comment generation failed:", err.message);
    if (referenceLine) {
      return res.json({ comment: referenceLine, cached: false, fallback: true });
    }
    res.status(500).json({ error: "Badge comment generation failed" });
  }
}

export async function postJourneyLine(req, res) {
  const { philosopherId, sceneId, referenceLine } = req.body;
  const systemPrompt = JOURNEY_LINE_PROMPTS[philosopherId];

  if (!philosopherId || !systemPrompt) {
    return res.status(400).json({ error: "A valid philosopherId is required" });
  }

  if (typeof referenceLine !== "string" || !referenceLine.trim()) {
    return res.status(400).json({ error: "A referenceLine is required" });
  }

  const reference = referenceLine.trim();
  const normalizedScene =
    typeof sceneId === "string" && sceneId.trim() ? sceneId.trim() : "scene";
  const lineCount = reference.split("\n").filter(Boolean).length;

  const cacheKey = JSON.stringify({
    version: JOURNEY_LINE_CACHE_VERSION,
    philosopherId,
    sceneId: normalizedScene,
    reference,
  });

  const cachedLine = readCachedJourneyLine(cacheKey);
  if (cachedLine) {
    return res.json({ line: cachedLine, cached: true });
  }

  const prompt = [
    `This is the line currently spoken at this moment of the journey ("${normalizedScene}"):`,
    `"""${reference}"""`,
    "Rewrite it as something you would say in this exact moment — same purpose, same audience, your voice.",
    lineCount > 1
      ? `Keep it to ${lineCount} short lines, separated by line breaks, matching the original's rhythm and pacing.`
      : "Keep it to one short line.",
    "Requirements:",
    "- return only the final rewritten line(s)",
    "- begin immediately with the spoken line itself",
    '- do not preface with phrases like "Here\'s a rewritten version", "Here is the line", or the philosopher\'s name',
    "- do not explain what you changed",
    "- speak directly to the traveller, in second person",
    "- no quotation marks, no emojis, no stage directions or asterisks",
    "- do not repeat the original line verbatim",
  ].join("\n");

  try {
    const response = await groq.chat.completions.create({
      model: models[1],
      max_tokens: 220,
      temperature: 0.85,
      reasoning_effort: GPT_OSS_REASONING_EFFORT,
      messages: [
        { role: "system", content: UNIVERSAL_RULES + "\n\n" + systemPrompt },
        { role: "user", content: prompt },
      ],
    });

    const line = cleanJourneyLine(response.choices[0].message.content);
    if (!line) {
      throw new Error("Empty journey line");
    }

    journeyLineCache.set(cacheKey, { line, createdAt: Date.now() });
    res.json({ line, cached: false });
  } catch (err) {
    console.error("Journey line generation failed:", err.message);
    res.json({ line: reference, cached: false, fallback: true });
  }
}

export async function postMeasureExchange(req, res) {
  const { systemPrompt, sphere, question, answer, canGoBack, priorAsideCount, locale } = req.body;

  if (!systemPrompt || !sphere || !question || typeof answer !== "string") {
    return res
      .status(400)
      .json({ error: "systemPrompt, sphere, question, and answer are required" });
  }

  const goBackPossible = canGoBack === true;
  // How many times they've already gotten stuck on THIS question (asked back,
  // deflected, or given a non-answer) before this reply — without this, a
  // second "I don't know" got the same-size response as the first (another
  // reworded version of the question), which reads as not having noticed the
  // first reword already didn't help. 0 on a fresh question.
  const stuckBefore = Number.isInteger(priorAsideCount) && priorAsideCount > 0 ? priorAsideCount : 0;

  const exchangePrompt = `You just asked the person, during a structured self-reflection check-in about their ${sphere}:
"${question}"

They replied:
"${answer}"
${stuckBefore > 0 ? `\nThey have already gotten stuck on this exact question ${stuckBefore} time(s) before this reply — you already tried rewording it, and that didn't land. Keep this in mind for the "did not really engage" case below.\n` : ""}
First, check: are they asking to go back and reconsider or change their answer to an earlier question, rather than answering this one (things like "wait, can I go back", "actually let me redo the last one", "I want to change what I said about my mind")? ${goBackPossible ? "Going back is possible right now — there is a previous answer to revisit." : "Going back is NOT possible right now — this is the very first question, there is nothing before it yet."}

Respond with ONLY valid JSON, no markdown, no explanation, in exactly this shape:
{"advance": true, "goBack": false, "reply": "..."}

If they're asking to go back${goBackPossible ? "" : " (even though there's nothing to go back to yet)"}:
- Set "advance" to false.
${
  goBackPossible
    ? `- Set "goBack" to true. "reply" is ONE short, warm sentence in your voice confirming you're taking them back to reconsider it — do not ask a new question.`
    : `- Set "goBack" to false. "reply" is ONE short sentence, in your voice, gently noting this is the very first one so there's nothing yet to go back to, then invite them to answer what's in front of them.`
}

Otherwise, decide: did they actually engage with the question — even in one word, tersely, vaguely, or emotionally, describing something true about their current state? A short answer like "good", "fine", "tired", or "okay" IS engagement — it directly answers the question, it is not a deflection just because it's brief. Only treat it as non-engagement if they asked you something back, pushed back, expressed confusion about the process, or said something that isn't really an answer at all.

If they engaged with the question, set "advance" to true and "goBack" to false. "reply" is ONE short sentence (10-20 words) acknowledging specifically what they shared, completely in your voice. Do not ask another question yet. Do not restate their own words or phrasing back to them — that reads as hollow mirroring, not insight. Instead, name what's underneath in your own language: reframe, interpret, or reflect the shape of it the way you actually see it, the way a real reflective listener adds a genuinely new angle rather than echoing what was just said.

If they did not really engage (and are not asking to go back), set "advance" to false and "goBack" to false. There is no list of preset answers offered to them anymore — if someone can't find the words, pushing back or asking for help IS the expected way to get unstuck, not a failure state. Two cases:
- If they asked you a genuine question of their own, answer it honestly and specifically, in your own voice, with real reasoning — not just an acknowledgment that they asked something. Only do this if they actually asked something; never invent or quote back a question they did not ask.
- If they seem stuck, unsure, or gave a vague non-answer rather than asking something specific — including saying it again after already having said it once ("I still don't know", "I don't know either", "can you help me answer") — go SMALLER, not the same size again: offer one small, concrete thing to notice or try right now (a place to put their attention, a specific contrast to check, a single word to test against how they feel), worded so it can be answered in a few words. Do not reuse the same rephrasing move twice in a row — if they're stuck a second time, a second reworded version of the same question will not land any better than the first one did.
Either way, stay in character, keep it under 60 words, ground your reply only in what they actually wrote ("${answer}"), and do not repeat any part of your own original phrasing of the question — "${question}" — word for word.`;

  try {
    const response = await groq.chat.completions.create({
      ...resolveModelParams(locale, models[1], 350),
      temperature: 0.5,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES + "\n\n" + systemPrompt, locale) },
        { role: "user", content: exchangePrompt },
      ],
    });

    const text = response.choices[0].message.content.trim();
    let parsed = null;
    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
    } catch {
      parsed = null;
    }

    if (!parsed || typeof parsed.reply !== "string" || !parsed.reply.trim()) {
      // Fail open: treat as answered so the interview never gets stuck on a bad response.
      return res.json({ advance: true, goBack: false, reply: "" });
    }

    res.json({
      advance: parsed.advance !== false,
      // Server-side guard: never honor goBack if the client says there's nothing to go back to,
      // regardless of what the model returned.
      goBack: goBackPossible && parsed.goBack === true,
      reply: parsed.reply.trim(),
    });
  } catch (err) {
    console.error("Measure exchange failed:", err.message);
    res.json({ advance: true, goBack: false, reply: "" });
  }
}

const SPHERE_HELPERS = {
  body: "How your physical state is moving",
  mind: "How attention and inner narrative are moving",
  heart: "How connection and drive are moving",
  spirit: "How meaning and direction are moving",
};

const MICRO_PRACTICES = {
  calm: "Take three slow breaths with a longer exhale than inhale.",
  clarity: "Write one clear intention for the next hour — one is enough.",
  grounding: "Place both feet flat on the floor and press down for 20 seconds.",
  intensity: "Pause. Notice the activation in your body without acting on it yet.",
};

const AFFIRMATIONS = {
  calm: "I can move at the pace that is real, not the pace I think I should have.",
  clarity: "Clear is enough.",
  grounding: "I am already standing on something solid.",
  intensity: "Strong energy can be directed. I get to choose where it goes.",
};

function clampInt(v, min, max) {
  return Math.max(min, Math.min(max, Math.round(Number(v) || 0)));
}

function clampScores(raw) {
  return {
    calm: clampInt(raw.calm, 0, 12),
    clarity: clampInt(raw.clarity, 0, 12),
    intensity: clampInt(raw.intensity, 0, 12),
    grounding: clampInt(raw.grounding, 0, 12),
  };
}

function dominantAxisOf(scores) {
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

function buildInterviewInterpretation(rawScores) {
  const overallScores = clampScores(rawScores.overall ?? {});
  const rawVibration = clampInt(rawScores.overall?.vibration ?? 250, 20, 700);
  const vibrationScore = calibrateVibrationScore(rawVibration, overallScores);
  const vibrationLevel = getNearestVibrationLevel(vibrationScore);
  const dominantAxis = dominantAxisOf(overallScores);
  const band = getFrequencyBand(overallScores);

  const sphereKeys = ["body", "mind", "heart", "spirit"];
  const lines = sphereKeys.map((key) => {
    const raw = rawScores[key] ?? {};
    const scores = clampScores(raw);
    const lineRawVib = clampInt(raw.vibration ?? rawVibration, 20, 700);
    const lineVibScore = calibrateVibrationScore(lineRawVib, scores);
    return {
      key,
      label: key,
      helper: SPHERE_HELPERS[key],
      scores,
      dominantAxis: dominantAxisOf(scores),
      band: getFrequencyBand(scores),
      rawVibrationScore: lineRawVib,
      vibrationScore: lineVibScore,
      vibrationLevel: getNearestVibrationLevel(lineVibScore),
    };
  });

  return {
    scores: overallScores,
    rawVibrationScore: rawVibration,
    vibrationScore,
    vibrationLevel,
    dominantAxis,
    band,
    microPractice: MICRO_PRACTICES[dominantAxis] ?? MICRO_PRACTICES.clarity,
    affirmation: AFFIRMATIONS[dominantAxis] ?? AFFIRMATIONS.clarity,
    lines,
  };
}

async function requestRawInterviewScores(scoringPrompt) {
  const response = await groq.chat.completions.create({
    model: models[0],
    max_tokens: 1200,
    temperature: 0.1,
    reasoning_effort: GPT_OSS_REASONING_EFFORT,
    messages: [
      { role: "system", content: "You are a precise scoring system. Return only valid JSON, nothing else." },
      { role: "user", content: scoringPrompt },
    ],
  });

  const text = response.choices[0].message.content.trim();
  const jsonStart = text.indexOf("{");
  const jsonEnd = text.lastIndexOf("}");
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error(`No JSON object found in scoring response: ${text}`);
  }
  return JSON.parse(text.slice(jsonStart, jsonEnd + 1));
}

// Free-trial window for a non-subscribed account (2026-08-23 pivot — see
// RULES.md's Product/positioning section). Everyone's first 7 server-saved
// readings are free and fully real, not a preview/teaser; a subscribed
// account's history is never trimmed. Chosen deliberately over gating
// saving itself behind a subscription from reading #1 — the purchase
// decision becomes concrete (a real, visible Arc already exists) instead
// of abstract (an imagined future value).
const FREE_TRIAL_READING_LIMIT = 7;

// Best-effort — a save failure should never break the reading itself. Requires
// both an authenticated user and explicit special-category consent (Art. 9),
// same gate the conversation-storage flow already uses. Returns the saved
// document's id (or null if it no-opped/failed) so the caller can hand it
// back to the client — without this, the client has no way to later link a
// Guide conversation to the reading it followed, since a fresh MeasureResult
// otherwise has no id anywhere in the interview response.
async function saveMeasureResultIfConsented(userPayload, interpretation, qaPairs) {
  if (!userPayload?.id) return null;

  try {
    const user = await User.findOne({ id: userPayload.id });
    if (!user?.consent?.psychologicalData?.given) return null;

    const saved = await MeasureResult.create({
      userId: userPayload.id,
      vibrationScore: interpretation.vibrationScore,
      rawVibrationScore: interpretation.rawVibrationScore,
      vibrationLevel: interpretation.vibrationLevel,
      band: interpretation.band,
      dominantAxis: interpretation.dominantAxis,
      scores: interpretation.scores,
      lines: interpretation.lines,
      microPractice: interpretation.microPractice ?? null,
      affirmation: interpretation.affirmation ?? null,
      combinationMessage: interpretation.combinationMessage ?? null,
      recommendedPhilosopher: recommendPhilosopher(interpretation.vibrationScore),
      qaPairs: Array.isArray(qaPairs) ? qaPairs : [],
      savedAt: new Date().toISOString(),
    });

    // Free-trial rolling window — a non-subscribed account's server
    // history never grows past FREE_TRIAL_READING_LIMIT; each new save
    // beyond it permanently deletes the oldest saved reading (a real
    // delete, not a soft/archive flag — confirmed with the user as "gone
    // means gone"). Subscribing at any point stops this: the check below
    // is against CURRENT subscription status at save time, not a one-time
    // migration, so the moment arcSubscription.active flips true, saves
    // stop being trimmed and everything already in the window (plus
    // everything from then on) simply accumulates. This intentionally
    // does not resurrect anything already deleted before subscribing.
    if (!user.arcSubscription?.active) {
      const excess = await MeasureResult.find({ userId: userPayload.id })
        .sort({ savedAt: 1 })
        .skip(FREE_TRIAL_READING_LIMIT);
      if (excess.length > 0) {
        await MeasureResult.deleteMany({ _id: { $in: excess.map((r) => r._id) } });
      }
    }

    return saved.id;
  } catch (err) {
    console.error("Failed to save measure result:", err.message);
    return null;
  }
}

// Best-effort, in the philosopher's own voice — holds all four sphere
// readings together rather than describing them separately, since that's
// the actual point a single blended "overall" number can't make on its own.
// Failure here should never break the reading itself, so callers just get
// `null` back and fall back to showing the reading without it.
async function requestCombinationMessage(systemPrompt, interpretation, locale) {
  if (!systemPrompt) return null;

  const lineSummary = interpretation.lines
    .map((line) => `${line.label}: ${line.vibrationLevel.name} (${line.vibrationScore})`)
    .join("\n");

  const prompt = `A person just completed a self-reflection check-in. Their four spheres read:
${lineSummary}

Write ONE short reflection, in your voice, that holds all four of these
together — not a summary of each one separately, but something that notices
how they relate: where there's a gap between them, what one might be waiting
on another to catch up with, or what it means that they're this different
(or this aligned) right now.

This is shown right next to the four scores themselves, so it must not
re-describe them. Never name a sphere (body/mind/heart/spirit) or a level
name or number from the list above — the person can already see those. State
the one real insight directly, in plain language, not as a walk-through of
each part in turn. Do not hedge with "may be" or "perhaps" — say what you
actually see.

Strict limit: ONE sentence, at most 30 words. Do not ask a question. Stay
fully in character. Return only the reflection itself, no preamble, no
quotation marks.`;

  try {
    const response = await groq.chat.completions.create({
      ...resolveModelParams(locale, models[0], 500),
      temperature: 0.6,
      messages: [
        { role: "system", content: localizedSystemPrompt(UNIVERSAL_RULES + "\n\n" + systemPrompt, locale) },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0].message.content.trim();
    return text || null;
  } catch (err) {
    console.error("Combination message generation failed:", err.message);
    return null;
  }
}

export async function postMeasureInterview(req, res) {
  const { qaPairs, systemPrompt, locale } = req.body;

  if (!Array.isArray(qaPairs) || qaPairs.length < 4) {
    return res.status(400).json({ error: "qaPairs must contain 4 sphere answers" });
  }

  const transcript = qaPairs
    .map((p) => `[${String(p.sphere).toUpperCase()}]\nQuestion: ${p.question}\nAnswer: ${p.answer}`)
    .join("\n\n");

  const scoringPrompt = `You are analyzing self-reflection answers to score a person's current inner state.

Score all five readings (overall + 4 spheres) using integer values:
- calm: 0–12 (peace, rest, low urgency)
- clarity: 0–12 (focus, clear thinking, decisiveness)
- intensity: 0–12 (activation, urgency, force, heat)
- grounding: 0–12 (rootedness, physical presence, stability)
- vibration: 20–700 (Hawkins emotional frequency)

The vibration scale, high to low, each with what actually distinguishes it —
use these to tell adjacent levels apart (e.g. fear vs. anger vs. desire all
sit close together but mean different things). Match the level whose
description best fits the emotional quality of what they said, not just a
surface keyword — and don't let general urgency or intensity alone pull a
reading upward toward Anger. Anger specifically requires a boundary having
been crossed (violation, obstruction, injustice) — not just activation.
Worry or urgency about something practical (money, time, a decision) that
pushes someone to act is usually Fear (if it's about uncertainty) or Desire
(if it's about a felt lack), not Anger, even though all three can look
equally "activating" from the outside:
${VIBRATION_SCALE_REFERENCE}

Conversation:
${transcript}

Return ONLY valid JSON. No explanation. No markdown. Exactly this shape:
{"overall":{"calm":0,"clarity":0,"intensity":0,"grounding":0,"vibration":0},"body":{"calm":0,"clarity":0,"intensity":0,"grounding":0,"vibration":0},"mind":{"calm":0,"clarity":0,"intensity":0,"grounding":0,"vibration":0},"heart":{"calm":0,"clarity":0,"intensity":0,"grounding":0,"vibration":0},"spirit":{"calm":0,"clarity":0,"intensity":0,"grounding":0,"vibration":0}}`;

  const MAX_ATTEMPTS = 2;
  let rawScores;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      rawScores = await requestRawInterviewScores(scoringPrompt);
      break;
    } catch (err) {
      console.error(`Interview scoring attempt ${attempt} failed:`, err.message);
      if (attempt === MAX_ATTEMPTS) {
        return res.status(500).json({ error: "Scoring failed" });
      }
    }
  }

  const interpretation = buildInterviewInterpretation(rawScores);
  interpretation.combinationMessage = await requestCombinationMessage(systemPrompt, interpretation, locale);
  // null when the reading wasn't persisted (signed out, or consent not
  // given) — the client uses this to link a later Guide conversation back
  // to this specific reading, only when one actually exists to link to.
  interpretation.measureResultId = await saveMeasureResultIfConsented(req.user, interpretation, qaPairs);
  res.json(interpretation);
}
