import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import { BADGE_COMMENT_PROMPTS } from "../data/badgeCommentPrompts.js";
import { JOURNEY_LINE_PROMPTS } from "../data/journeyLinePrompts.js";
import {
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
        { role: "system", content: UNIVERSAL_RULES + "\n\n" + systemPrompt },
        ...messages,
      ],
    });

    res.json({ reply: response.choices[0].message.content });
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
  const { systemPrompt, sphere, question, answer } = req.body;

  if (!systemPrompt || !sphere || !question || typeof answer !== "string") {
    return res
      .status(400)
      .json({ error: "systemPrompt, sphere, question, and answer are required" });
  }

  const exchangePrompt = `You just asked the person, during a structured self-reflection check-in about their ${sphere}:
"${question}"

They replied:
"${answer}"

Decide: did they actually engage with the question — even in one word, tersely, vaguely, or emotionally, describing something true about their current state? A short answer like "good", "fine", "tired", or "okay" IS engagement — it directly answers the question, it is not a deflection just because it's brief. Only treat it as non-engagement if they asked you something back, pushed back, expressed confusion about the process, or said something that isn't really an answer at all.

Respond with ONLY valid JSON, no markdown, no explanation, in exactly this shape:
{"advance": true, "reply": "..."}

If they engaged with the question, set "advance" to true. "reply" is ONE short sentence (10-20 words) acknowledging specifically what they shared, completely in your voice. Do not ask another question yet.

If they did not really engage, set "advance" to false. There is no list of preset answers offered to them anymore — if someone can't find the words, pushing back or asking for help IS the expected way to get unstuck, not a failure state. Two cases:
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
      return res.json({ advance: true, reply: "" });
    }

    res.json({ advance: parsed.advance !== false, reply: parsed.reply.trim() });
  } catch (err) {
    console.error("Measure exchange failed:", err);
    res.json({ advance: true, reply: "" });
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

export async function postMeasureInterview(req, res) {
  const { qaPairs } = req.body;

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
- vibration: 20–700 (Hawkins emotional frequency: shame=20, grief=75, fear=100, desire=125, anger=150, pride=175, courage=200, neutrality=250, willingness=310, acceptance=350, reason=400, love=500, peace=600, enlightenment=700)

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

  res.json(buildInterviewInterpretation(rawScores));
}
