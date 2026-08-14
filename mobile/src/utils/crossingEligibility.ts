import { SavedWish } from '../api/wish';
import { SavedCrossing } from '../api/crossing';

// A Crossing is offered only when genuinely new material exists — not on
// every visit to Your Arc (see collaboration notes, 2026-08-13: "only
// when genuinely new material exists" was the explicit choice over
// "available anytime"). Concretely: an active wish exists AND no Crossing
// already exists for that exact wish+reading pair. Once answered or not,
// an existing Crossing for this pair is never regenerated — see
// crossingController.js's own idempotency.
//
// "Active wish" = the most recent wish, full stop — NOT one tied to any
// particular reading. The wish moved off Measure entirely on 2026-08-14
// ("the wish technically depends on the user's current feeling, not on
// their reading... in measure this wish question is a bit out of scope")
// and now lives as its own standalone prompt on Your Arc's future
// section — so there's no reading to match it against anymore, by
// design, not as a fallback. (An earlier version of this function tried
// to match a wish to the CURRENT reading by timestamp proximity, which
// was itself a fix for an even earlier bug where it tried an exact
// measureResultId match that could never succeed — both approaches are
// obsolete now that a wish isn't reading-scoped at all.)
export function findActiveWish(wishes: SavedWish[]): SavedWish | null {
  if (wishes.length === 0) return null;
  return [...wishes].sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())[0];
}

export function findExistingCrossing(
  crossings: SavedCrossing[],
  wishId: string,
  measureResultId: string
): SavedCrossing | null {
  return crossings.find((c) => c.wishId === wishId && c.measureResultId === measureResultId) ?? null;
}
