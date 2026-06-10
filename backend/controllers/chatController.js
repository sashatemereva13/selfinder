import Groq from "groq-sdk";
import { UNIVERSAL_RULES } from "../data/universalAIrules.js";
import { BADGE_COMMENT_PROMPTS } from "../data/badgeCommentPrompts.js";
import { JOURNEY_LINE_PROMPTS } from "../data/journeyLinePrompts.js";

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
  return (text ?? "")
    .replace(/^["'“”‘’]+|["'“”‘’]+$/g, "")
    .replace(/[ \t]+\n/g, "\n")
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

  const cacheKey = JSON.stringify({ philosopherId, sceneId: normalizedScene, reference });

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
