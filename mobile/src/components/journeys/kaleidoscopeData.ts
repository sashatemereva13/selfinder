import { ReadingLogEntry } from '../../store/measureStore';
import { WishWoop } from '../../api/wish';

// Real, true colors from someone's own reading history, shaped for
// ArcKaleidoscope.tsx's generative render — never an interpretation, same
// discipline as arcFacts.ts/sphereHistory.ts. The kaleidoscope doesn't
// need to be legible or study-able (the real data already lives in the
// facts section and sparkline elsewhere on Your Arc) — its only job is to
// feel unmistakably like this person's own history. That licenses real
// artistic latitude in HOW colors are arranged (organic, layered, seeded-
// random shapes, see ArcKaleidoscope.tsx), but not in WHICH colors appear:
// every color here is a real per-reading level color, never invented.
export interface KaleidoscopeSegment {
  color: string; // level slug — resolved to an actual color via useLevelColors() at render time
  kind: 'band' | 'detail';
}

// The most recent readings each keep their own segment (fine detail near
// the rim); everything older is grouped into bands (broad, near center) —
// so a long history still produces a real, non-overwhelming pattern
// without needing one shape per reading.
const DETAIL_COUNT = 12;
const BAND_COUNT = 5;

function mode(entries: ReadingLogEntry[]): string | null {
  if (entries.length === 0) return null;
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.levelSlug, (counts.get(e.levelSlug) ?? 0) + 1);
  let topSlug: string | null = null;
  let topCount = 0;
  let tie = false;
  for (const [slug, count] of counts) {
    if (count > topCount) {
      topSlug = slug;
      topCount = count;
      tie = false;
    } else if (count === topCount) {
      tie = true;
    }
  }
  // A genuine tie has no real "most" to report — fall back to the band's
  // own most recent reading rather than inventing an arbitrary pick (same
  // discipline as arcFacts.ts's modeLevelSlug).
  if (tie) return entries[entries.length - 1].levelSlug;
  return topSlug;
}

export function buildKaleidoscopeSegments(
  readingLog: ReadingLogEntry[],
  detailCount: number = DETAIL_COUNT,
  bandCount: number = BAND_COUNT
): KaleidoscopeSegment[] {
  const sorted = [...readingLog].sort((a, b) => a.ts - b.ts); // oldest first
  const recent = sorted.slice(-detailCount);
  const older = sorted.slice(0, Math.max(0, sorted.length - detailCount));

  const segments: KaleidoscopeSegment[] = [];
  if (older.length > 0) {
    const bandSize = Math.ceil(older.length / bandCount);
    for (let i = 0; i < older.length; i += bandSize) {
      const band = older.slice(i, i + bandSize);
      const slug = mode(band);
      if (slug) segments.push({ color: slug, kind: 'band' });
    }
  }
  for (const r of recent) {
    segments.push({ color: r.levelSlug, kind: 'detail' });
  }
  return segments; // oldest/broad -> newest/fine
}

// A stable numeric seed derived from the data itself (not a random draw)
// — the same reading history always produces the same seed, so the
// kaleidoscope's shape placement is deterministic per person: it doesn't
// visually shuffle on every re-render, and two people's kaleidoscopes
// differ because their readings differ, not because of an unrelated
// random draw.
//
// `nonce` (2026-08-22, added for Center — see RULES.md's Product/
// positioning section) folds an optional purchase-scoped value into the
// seed alongside the real reading history. Your Arc's own callers pass no
// nonce (defaults to 0), preserving the original "never visually shuffles
// for the same history" behavior described above. Center passes a
// specific purchase's own seedNonce (persisted server-side on
// User.journeyPurchases, see backend/models/User.js) so THAT purchase
// always regenerates the same result on revisit, while a genuinely NEW
// purchase — a new array entry, a new nonce — produces a different one
// even against unchanged history. This is what makes "buy Center again"
// mean something: without a nonce, seedFromLog alone would return the
// exact same seed (and therefore the exact same image) every time,
// defeating the entire point of a repeatable purchase.
export function seedFromLog(readingLog: ReadingLogEntry[], nonce: number = 0): number {
  let s = nonce % 999999937;
  for (const e of readingLog) s = (s + e.ts) % 999999937;
  return s || 1;
}

// "While the past creates the colors, the future creates the shape" —
// the user's own framing for how the kaleidoscope should connect forward
// to a wish, not just backward to reading history (see RULES.md's Center
// section for what's unchanged: still anti-diagnosis, still "you are
// shaping your future," never a forecast). This reads real content from
// the active wish's own WOOP (Wish-Outcome-Obstacle-Plan, see
// WishCrossingPage.tsx) and turns it into a few bounded multipliers on
// ArcKaleidoscope's EXISTING shape parameters (spread/tendril-chance/
// jitter) — it never introduces a second seed or a second rand stream.
// The same single rand() sequence from seedFromLog still drives
// everything; only the fixed constants that sequence feeds into move,
// deterministically, based on this wish's own words. This keeps "same
// history -> same kaleidoscope" intact (no wish/WOOP -> byte-identical
// output to before this feature existed) while still making a completed
// WOOP visibly, not subliminally, felt in the result.
//
// Three signals, deliberately whole-WOOP rather than one dial per field
// (a wish is one thing, not three independent inputs):
//   - spreadFactor:  Outcome+Obstacle+Plan word count together -> how much
//                    more open/expansive the petals are than the default.
//                    A fuller WOOP reads as a more expansive shape; no
//                    WOOP at all is spreadFactor 1 (today's unchanged
//                    default).
//   - tendrilChance: whether Obstacle names something real -> a higher
//                    chance of the wispy trailing tendril per segment
//                    ("something reaching outward, not fully smooth").
//                    No obstacle named keeps today's 0.7 chance
//                    (buildWedgeShapes' own `rand() > 0.3` line) exactly.
//   - jitterFactor:  whether Plan (both if/then blanks) is complete ->
//                    calmer, less jittery edges once a real plan exists.
//                    No plan yet keeps today's jitter amounts unchanged
//                    (jitterFactor 1).
// Word-count bucketing intentionally coarse (short/medium/long) rather
// than a continuous formula — "more words -> smoothly more spread" would
// invite over-interpreting a difference that isn't really about length,
// it's about whether real content exists at all.
export interface WoopShapeParams {
  spreadFactor: number; // multiplies buildWedgeShapes' own spread calculation
  tendrilChance: number; // replaces the fixed 0.7 chance (rand() > 0.3) per segment
  jitterFactor: number; // multiplies every jitter/wobble amount in petalPath/tendrilPath
}

const DEFAULT_WOOP_SHAPE_PARAMS: WoopShapeParams = { spreadFactor: 1, tendrilChance: 0.7, jitterFactor: 1 };

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function woopShapeParams(woop: WishWoop | null | undefined): WoopShapeParams {
  if (!woop) return DEFAULT_WOOP_SHAPE_PARAMS;

  const totalWords = wordCount(woop.outcome) + wordCount(woop.obstacle) + wordCount(woop.planIf) + wordCount(woop.planThen);
  // Coarse short/medium/long buckets, not a continuous scale — see this
  // function's own header comment for why.
  const spreadFactor = totalWords >= 40 ? 1.25 : totalWords >= 15 ? 1.12 : 1;

  const obstacleNamed = woop.obstacle.trim().length > 0;
  const tendrilChance = obstacleNamed ? 0.85 : DEFAULT_WOOP_SHAPE_PARAMS.tendrilChance;

  const planComplete = woop.planIf.trim().length > 0 && woop.planThen.trim().length > 0;
  const jitterFactor = planComplete ? 0.6 : 1;

  return { spreadFactor, tendrilChance, jitterFactor };
}
