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

const models = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
];
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
  const { messages, systemPrompt } = req.body;

  if (!messages || !systemPrompt) {
    return res
      .status(400)
      .json({ error: "messages and systemPrompt are required" });
  }

  try {
    const response = await groq.chat.completions.create({
      model: models[1],
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: UNIVERSAL_RULES + "\n\n" + systemPrompt + "\n\n" + SPILL_SIGNAL_INSTRUCTION,
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
    console.error(err);
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
      max_tokens: 80,
      temperature: 0.9,
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
    console.error("Badge comment generation failed:", err);
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
    console.error("Journey line generation failed:", err);
    res.json({ line: reference, cached: false, fallback: true });
  }
}

export async function postMeasureExchange(req, res) {
  const { systemPrompt, sphere, question, answer, canGoBack } = req.body;

  if (!systemPrompt || !sphere || !question || typeof answer !== "string") {
    return res
      .status(400)
      .json({ error: "systemPrompt, sphere, question, and answer are required" });
  }

  const goBackPossible = canGoBack === true;

  const exchangePrompt = `You just asked the person, during a structured self-reflection check-in about their ${sphere}:
"${question}"

They replied:
"${answer}"

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
- If they seem stuck, unsure, or gave a vague non-answer rather than asking something specific, rephrase the original question using genuinely different words and imagery — actually reword it, don't just repeat it back — so they have a fresh way in. This is your actual job here: meet them with a new angle, not a script.
Either way, stay in character, keep it under 60 words, ground your reply only in what they actually wrote ("${answer}"), and land back on the question without literally restating your first phrasing of it.`;

  try {
    const response = await groq.chat.completions.create({
      model: models[1],
      max_tokens: 200,
      temperature: 0.5,
      messages: [
        { role: "system", content: UNIVERSAL_RULES + "\n\n" + systemPrompt },
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
    console.error("Measure exchange failed:", err);
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
    max_tokens: 400,
    temperature: 0.1,
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

// Best-effort — a save failure should never break the reading itself. Requires
// both an authenticated user and explicit special-category consent (Art. 9),
// same gate the conversation-storage flow already uses.
async function saveMeasureResultIfConsented(userPayload, interpretation, qaPairs) {
  if (!userPayload?.id) return;

  try {
    const user = await User.findOne({ id: userPayload.id });
    if (!user?.consent?.psychologicalData?.given) return;

    await MeasureResult.create({
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
  } catch (err) {
    console.error("Failed to save measure result:", err.message);
  }
}

// Best-effort, in the philosopher's own voice — holds all four sphere
// readings together rather than describing them separately, since that's
// the actual point a single blended "overall" number can't make on its own.
// Failure here should never break the reading itself, so callers just get
// `null` back and fall back to showing the reading without it.
async function requestCombinationMessage(systemPrompt, interpretation) {
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
      model: models[0],
      max_tokens: 90,
      temperature: 0.6,
      messages: [
        { role: "system", content: UNIVERSAL_RULES + "\n\n" + systemPrompt },
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
  const { qaPairs, systemPrompt } = req.body;

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
  interpretation.combinationMessage = await requestCombinationMessage(systemPrompt, interpretation);
  await saveMeasureResultIfConsented(req.user, interpretation, qaPairs);
  res.json(interpretation);
}
