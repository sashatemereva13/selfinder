// Generic quadratic-bezier helpers — extracted from onboarding's own line-
// drawing geometry (the "why?" -> "what" -> "you feel?" connecting lines),
// which is the only place these are used today, but the math itself has
// nothing onboarding-specific about it.

export interface Point {
  x: number;
  y: number;
}

export function quadBezierPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

export function quadPathString(p0: Point, p1: Point, p2: Point): string {
  return `M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`;
}

// Approximate arc length by summing short chords along the sampled curve —
// exact enough for sizing a stroke-dasharray "draw itself" reveal, without
// needing a runtime getTotalLength() call (react-native-svg doesn't expose
// one from JS the way web SVG does).
export function quadBezierLength(p0: Point, p1: Point, p2: Point, samples = 24): number {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= samples; i++) {
    const pt = quadBezierPoint(p0, p1, p2, i / samples);
    length += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  return length;
}

export function sampleQuad(pts: { p0: Point; p1: Point; p2: Point }, n: number): Point[] {
  return Array.from({ length: n }, (_, i) =>
    quadBezierPoint(pts.p0, pts.p1, pts.p2, i / (n - 1)),
  );
}
