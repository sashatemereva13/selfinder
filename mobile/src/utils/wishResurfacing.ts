import { SavedWish } from '../api/wish';

// Selection for Your Arc's "pure resurfacing" row (see
// docs/session-result-concept.md's Phase 4 mechanism) — deliberately the
// simplest rule that satisfies "valence-blind": pick by age/rotation only,
// never by anything about what the wish SAYS. Any content-based scoring
// (e.g. "surface the ones that sound urgent" or "surface the hopeful
// ones") would silently turn this into the app judging which of the
// user's own words matter more — exactly what the spec rules out.
//
// A wish becomes eligible once real distance has passed (not last week —
// the felt effect this is going for is "look how long ago you said this,"
// which needs actual time to have gone by) and hasn't been opened yet.
// Among eligible wishes, oldest first — plain FIFO rotation through the
// backlog, so every wish eventually gets its moment rather than newer
// ones perpetually crowding older ones out.
export const MIN_WISH_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function selectWishToResurface(wishes: SavedWish[], now: number = Date.now()): SavedWish | null {
  const eligible = wishes.filter(
    (w) => !w.resurfacedAt && now - new Date(w.savedAt).getTime() >= MIN_WISH_AGE_MS
  );
  if (eligible.length === 0) return null;
  eligible.sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime());
  return eligible[0];
}
