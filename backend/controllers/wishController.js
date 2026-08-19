import Wish from "../models/Wish.js";
import { moderateWish } from "../utils/moderateWish.js";

// Moderates BEFORE persisting anything — the wish is never written to
// storage unless it classifies "ok". Response shape lets the client
// choose the retry-prompt vs. crisis-support redirect path without this
// endpoint ever needing to know which UI it triggers.
export async function saveWish(req, res) {
  const { text, measureResultId } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const { category } = await moderateWish(text);
  if (category !== "ok") {
    return res.json({ blocked: true, category });
  }

  const wish = await Wish.create({
    userId: req.user.id,
    text,
    measureResultId: typeof measureResultId === "string" ? measureResultId : null,
    savedAt: new Date().toISOString(),
  });

  res.json({ id: wish.id });
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
