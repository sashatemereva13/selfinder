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
