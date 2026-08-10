import SpillEntry from "../models/SpillEntry.js";

export async function saveSpillEntry(req, res) {
  const { text } = req.body;

  if (typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "text is required" });
  }

  const entry = await SpillEntry.create({
    userId: req.user.id,
    text,
    savedAt: new Date().toISOString(),
  });

  res.json({ id: entry.id });
}

export async function getSpillEntry(req, res) {
  const entry = await SpillEntry.findOne({ id: req.params.id });
  if (!entry) return res.status(404).json({ error: "Spill entry not found" });
  if (entry.userId !== req.user.id) return res.status(403).json({ error: "Forbidden" });
  res.json(entry);
}

// Powers Your Arc's rich re-entry — Spill has no reading link (it's its own
// free-standing practice, not reading-scoped by design), so the caller
// matches entries to a reading by loose timestamp proximity itself, the
// same pattern your-arc.tsx already uses for qaPairs/rich-history matching.
export async function listMySpillEntries(req, res) {
  const entries = await SpillEntry.find({ userId: req.user.id }).sort({ savedAt: -1 });
  res.json(entries);
}
