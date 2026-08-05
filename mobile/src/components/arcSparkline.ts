// Shared sparkline constants/helpers for the Your Arc screens
// (app/your-arc-preview.tsx, app/your-arc.tsx) — kept
// as one module so both screens always draw the same real data at the same
// aspect ratio, rather than each re-deriving its own math. Used to also
// export a YourArcTeaser card shown on the You tab; that entry point was
// removed once Depths grew its own "Your arc" row (see depths/index.tsx) —
// one entry point into the feature was enough, and Depths is the screen
// people actually open, so the entry point lives there now.

// How many of the most recent readings the free (not-subscribed) preview
// draws — everywhere it's shown (the preview screen, and previously this
// card). Kept deliberately short: enough to feel like a real, recognizable
// line, not so much that the free view already feels like the full arc.
export const PREVIEW_POINTS = 4;
// The sparkline's own coordinate space — stretched to the card's width via
// preserveAspectRatio="none", so these numbers are proportions, not pixels.
// Exported so the preview screen draws the identical shape at this same
// aspect ratio, just larger.
export const SPARKLINE_VIEW_W = 100;
export const SPARKLINE_VIEW_H = 28;
const VIEW_W = SPARKLINE_VIEW_W;
const VIEW_H = SPARKLINE_VIEW_H;
const PAD_Y = 4;

// Shared with the preview/full-arc screens so the same real data always
// draws the same shape, regardless of which screen is doing the drawing.
export function sparklinePath(points: number[]): string {
  return sparklineCoords(points)
    .map(({ x, y }, i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
}

// The per-point (x, y) coordinates behind sparklinePath's line, so a screen
// can also mark each individual reading (a dot), not just draw the
// connecting line — without recomputing the same min/max/span math a
// second time and risking it drifting out of sync with the line itself.
export function sparklineCoords(points: number[]): { x: number; y: number }[] {
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  return points.map((score, i) => ({
    x: (i / Math.max(points.length - 1, 1)) * VIEW_W,
    y: PAD_Y + (1 - (score - min) / span) * (VIEW_H - PAD_Y * 2),
  }));
}
