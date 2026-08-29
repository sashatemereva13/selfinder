import { useMemo } from 'react';
import { ReadingLogEntry } from '../store/measureStore';
import { SavedWish } from '../api/wish';
import { TimeConePoint } from '../components/TimeCone';
import { useLevelColors } from '../content/measureConfig';
import { useThemeColors } from '../theme/useThemeColors';

// The time cone's own points (see TimeCone.tsx) — past cone gets every
// reading plus every wish OTHER than the current active one, spread by AGE
// alone (oldest = furthest from the vertex), never by anything about what
// a reading/wish says. Future cone gets only the active wish, per
// RULES.md's existing "no fabricated trajectory" rule — this is never a
// forecast, only the one real, stated thing reaching forward. `angle` uses
// a cheap deterministic hash of each id so a given point's angular
// position is stable across re-renders instead of jumping around, but
// carries no real information itself (see TimeConePoint's own comment).
//
// Extracted from your-arc.tsx (2026-08-22, the Center spin-off — see
// RULES.md's Product/positioning section) into a shared hook. Used to
// only be called from Center after that spin-off; 2026-08-29 the cone
// itself moved back to a real page on Your Arc (TimeConePage.tsx — see
// its own header comment for why) while Center kept just the
// kaleidoscope, so this hook now has exactly one caller again — kept as
// its own module regardless, since the geometry logic is substantial
// enough to warrant staying separate from the page component itself.
export function useTimeConeGeometry(
  readingLog: ReadingLogEntry[],
  allWishes: SavedWish[],
  activeWish: SavedWish | null
) {
  const levelColors = useLevelColors();
  const colors = useThemeColors();

  return useMemo(() => {
    const now = Date.now();
    const oldestTs = readingLog.length > 0 ? readingLog[0].ts : now;
    const span = Math.max(now - oldestTs, 1);
    const hashAngle = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
      return hash / 1000;
    };
    const pastFromReadings: TimeConePoint[] = readingLog.map((entry) => ({
      id: `reading-${entry.ts}`,
      depth: Math.min(1, (now - entry.ts) / span),
      angle: hashAngle(`reading-${entry.ts}`),
      colorRgb: levelColors[entry.levelSlug],
    }));
    // Wishes have no vibration level, so they never get a level color —
    // the neutral accent (ivoryRgb, the same pre-reading fallback used
    // everywhere else) marks them as a different KIND of past point from
    // a reading, not a missing/default color.
    const pastFromWishes: TimeConePoint[] = allWishes
      .filter((w) => w.id !== activeWish?.id)
      .map((w) => {
        const ts = new Date(w.savedAt).getTime();
        return {
          id: `wish-${w.id}`,
          depth: Math.min(1, (now - ts) / span),
          angle: hashAngle(`wish-${w.id}`),
          colorRgb: colors.accent.ivoryRgb,
        };
      });
    const futurePoints: TimeConePoint[] = activeWish
      ? [{ id: `active-wish-${activeWish.id}`, depth: 1, angle: 0.25 }]
      : [];
    return { pastPoints: [...pastFromReadings, ...pastFromWishes], futurePoints };
  }, [readingLog, allWishes, activeWish, levelColors, colors.accent.ivoryRgb]);
}
