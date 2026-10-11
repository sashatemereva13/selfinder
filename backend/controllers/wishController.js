import Wish from "../models/Wish.js";
import { moderateWish } from "../utils/moderateWish.js";

// 2026-09-13 — validates an optional WOOP payload's shape (all 4 fields
// non-empty strings, or the whole thing absent) without touching
// moderation/persistence — kept separate from buildModerationBlob below
// so "is this a well-formed WOOP" and "what do we send the classifier"
// stay two distinct, individually testable concerns. Returns null for
// "no WOOP submitted" (valid — WOOP is optional), a plain object for
// "well-formed," or throws-equivalent (returns undefined) for malformed
// input the caller should reject with a 400.
function normalizeWoop(woop) {
  if (woop === undefined || woop === null) return null;
  if (typeof woop !== "object") return undefined;
  const { outcome, obstacle, planIf, planThen } = woop;
  const fields = { outcome, obstacle, planIf, planThen };
  for (const v of Object.values(fields)) {
    if (typeof v !== "string" || !v.trim()) return undefined;
  }
  return fields;
}

// One combined moderation call for wish text + WOOP, not one call per
// field — a guided flow that already asks the person to commit each WOOP
// step in sequence shouldn't also pay for 4 separate blocking network
// round-trips at save time. WOOP text is categorically the same kind of
// user self-disclosure moderateWish already classifies for the wish
// text itself, so concatenating is a legitimate single classification
// target, not a scope change for the classifier.
function buildModerationBlob(text, woop) {
  if (!woop) return text;
  return [
    text,
    `Outcome: ${woop.outcome}`,
    `Obstacle: ${woop.obstacle}`,
    `Plan: if ${woop.planIf}, then ${woop.planThen}`,
  ].join("\n");
}

// Moderates BEFORE persisting anything — the wish (and any WOOP
// submitted alongside it) is never written to storage unless the
// COMBINED text classifies "ok". Response shape lets the client choose
// the retry-prompt vs. crisis-support redirect path without this
// endpoint ever needing to know which UI it triggers. Never persists
// wish text while silently dropping a flagged WOOP field — a single
// gate covers the whole save, or nothing is saved.
export async function saveWish(req, res) {
  const { text, measureResultId, woop: rawWoop } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const woop = normalizeWoop(rawWoop);
  if (woop === undefined) {
    return res.status(400).json({ error: "woop, if present, must have all 4 fields as non-empty strings" });
  }

  const { category } = await moderateWish(buildModerationBlob(text, woop));
  if (category !== "ok") {
    return res.json({ blocked: true, category });
  }

  const wish = await Wish.create({
    userId: req.user.id,
    text,
    measureResultId: typeof measureResultId === "string" ? measureResultId : null,
    savedAt: new Date().toISOString(),
    woop,
  });

  res.json({ id: wish.id });
}

// Adds/replaces WOOP on an already-saved wish — needed once the composer
// lets someone complete WOOP after the wish itself is already active
// (e.g. returning to an existing active wish later, not just during the
// single composer session that created it). Same fail-closed moderation
// gate as saveWish's own combined blob, scoped to just the WOOP text
// here since the wish's own text was already moderated when it was
// first saved.
export async function setWishWoop(req, res) {
  const wish = await Wish.findOne({ id: req.params.id });
  if (!wish) return res.status(404).json({ error: "Wish not found" });
  if (wish.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

  const woop = normalizeWoop(req.body.woop);
  if (!woop) {
    return res.status(400).json({ error: "woop is required and must have all 4 fields as non-empty strings" });
  }

  const { category } = await moderateWish(buildModerationBlob(wish.text, woop));
  if (category !== "ok") {
    return res.json({ blocked: true, category });
  }

  wish.woop = woop;
  await wish.save();
  res.json({ id: wish.id, woop: wish.woop });
}

export async function getWish(req, res) {
  const wish = await Wish.findOne({ id: req.params.id });
  if (!wish) return res.status(404).json({ error: "Wish not found" });
  if (wish.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  res.json(wish);
}

export async function listMyWishes(req, res) {
  const wishes = await Wish.find({ userId: req.user.id }).sort({ savedAt: -1 });
  res.json(wishes);
}

// Marks a wish as resurfaced ONLY when the person actually opens it via
// Your Arc's resurfacing row — not when it's merely selected as eligible
// client-side. This is what lets selection be pure FIFO rotation (oldest
// not-yet-resurfaced first) with no content-based ranking: an eligible
// wish that was offered but never tapped stays in the backlog for next
// time, exactly like the same-session "held, not displayed" version never
// counts as shown until opened.
export async function markWishResurfaced(req, res) {
  const wish = await Wish.findOne({ id: req.params.id });
  if (!wish) return res.status(404).json({ error: "Wish not found" });
  if (wish.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (!wish.resurfacedAt) {
    wish.resurfacedAt = new Date().toISOString();
    await wish.save();
  }
  res.json({ id: wish.id, resurfacedAt: wish.resurfacedAt });
}

// Marks a wish as fulfilled — the user's own claim that it came true,
// from Your Arc's "What calls you" page (2026-08-19). Idempotent
// (re-ticking an already-ticked wish just returns the existing
// timestamp) and reversible (a wish can be un-ticked — see
// unmarkWishFulfilled — since a person may tick something and change
// their mind, and nothing here should feel like a one-way, high-stakes
// commitment). Never inferred or suggested by the app itself — this
// endpoint only ever fires from the user's own explicit tap.
export async function markWishFulfilled(req, res) {
  const wish = await Wish.findOne({ id: req.params.id });
  if (!wish) return res.status(404).json({ error: "Wish not found" });
  if (wish.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  if (!wish.fulfilledAt) {
    wish.fulfilledAt = new Date().toISOString();
    await wish.save();
  }
  res.json({ id: wish.id, fulfilledAt: wish.fulfilledAt });
}

export async function unmarkWishFulfilled(req, res) {
  const wish = await Wish.findOne({ id: req.params.id });
  if (!wish) return res.status(404).json({ error: "Wish not found" });
  if (wish.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  wish.fulfilledAt = null;
  await wish.save();
  res.json({ id: wish.id, fulfilledAt: null });
}
