import { ReadingLogEntry } from '../store/measureStore';

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
export function seedFromLog(readingLog: ReadingLogEntry[]): number {
  let s = 0;
  for (const e of readingLog) s = (s + e.ts) % 999999937;
  return s || 1;
}
