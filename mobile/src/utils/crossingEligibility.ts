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
//
// Matched by timestamp proximity, NOT wish.measureResultId — every wish
// is saved with measureResultId: null (interview.tsx's own
// handleWishSubmit: the real id doesn't exist client-side until scoring
// returns it, well after the wish itself was already saved), so a strict
// equality check here can never match anything. Confirmed as a real bug
// on a real device (2026-08-13 collaboration notes: "how to find the
// Crossing" — it was never reachable at all, for anyone). Same loose-
// match pattern your-arc.tsx already uses for linking a Spill entry to a
// reading (SPILL_MATCH_WINDOW_MS), just a tighter window here — the wish
// is saved seconds after the reading completes (same interview flow,
// not a separate later action), not up to 30 minutes later.
const WISH_MATCH_WINDOW_MS = 5 * 60 * 1000;

export function findActiveWish(
  wishes: SavedWish[],
  currentReadingSavedAt: string | null | undefined
): SavedWish | null {
  if (!currentReadingSavedAt) return null;
  const readingTs = new Date(currentReadingSavedAt).getTime();
  return (
    wishes.find((w) => Math.abs(new Date(w.savedAt).getTime() - readingTs) < WISH_MATCH_WINDOW_MS) ?? null
  );
}

export function findExistingCrossing(
  crossings: SavedCrossing[],
  wishId: string,
  measureResultId: string
): SavedCrossing | null {
  return crossings.find((c) => c.wishId === wishId && c.measureResultId === measureResultId) ?? null;
}
