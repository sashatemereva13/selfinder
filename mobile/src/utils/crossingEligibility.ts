import { SavedWish } from '../api/wish';
import { SavedCrossing } from '../api/crossing';

// A Crossing is offered only when genuinely new material exists — not on
// every visit to Your Arc (see collaboration notes, 2026-08-13: "only
// when genuinely new material exists" was the explicit choice over
// "available anytime"). Concretely: the current reading has a wish tied
// to it (the wish captured right after that Measure — see
// docs/session-result-concept.md, "captured once per reading"), AND no
// Crossing already exists for that exact wish+reading pair. Once
// answered or not, an existing Crossing for this pair is never
// regenerated — see crossingController.js's own idempotency.
export function findActiveWish(wishes: SavedWish[], currentMeasureResultId: string | null | undefined): SavedWish | null {
  if (!currentMeasureResultId) return null;
  return wishes.find((w) => w.measureResultId === currentMeasureResultId) ?? null;
}

export function findExistingCrossing(
  crossings: SavedCrossing[],
  wishId: string,
  measureResultId: string
): SavedCrossing | null {
  return crossings.find((c) => c.wishId === wishId && c.measureResultId === measureResultId) ?? null;
}
