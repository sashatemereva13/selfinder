import { SavedMeasureResult, Sphere } from '../types';

export interface SpherePoint {
  ts: number;
  vibrationScore: number;
  levelSlug: string;
}

export type SphereHistory = Record<Sphere, SpherePoint[]>;

const SPHERES: Sphere[] = ['body', 'mind', 'heart', 'spirit'];

// Every MeasureLine (per-sphere breakdown) is already saved on each
// SavedMeasureResult — nothing new is persisted here, this just regroups
// data that already exists per-reading into one series per sphere, so a
// caller can draw "how did Mind move over time" without re-deriving this
// grouping itself. Pure function, no store — same spirit as
// arcSparkline.ts's helpers, just across four dimensions instead of one.
export function buildSphereHistory(results: SavedMeasureResult[]): SphereHistory {
  const history: SphereHistory = { body: [], mind: [], heart: [], spirit: [] };

  // Oldest-first, matching how readingLog/the overall sparkline already
  // order points — results from getMeasureHistory aren't guaranteed to
  // arrive in a particular order, so sort explicitly rather than assuming.
  const sorted = [...results].sort(
    (a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()
  );

  for (const result of sorted) {
    if (!result.lines) continue;
    const ts = new Date(result.savedAt).getTime();
    for (const line of result.lines) {
      if (!SPHERES.includes(line.key)) continue;
      history[line.key].push({
        ts,
        vibrationScore: line.vibrationScore,
        levelSlug: line.vibrationLevel.slug,
      });
    }
  }

  return history;
}
