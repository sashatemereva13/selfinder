import Svg, { Circle, Path } from 'react-native-svg';
import { makeRng } from '../utils/auraDots';

// Small wireframe glyphs for Depths' own action-menu rows (Stay with it,
// Shift it, Measure again, Explore the map, Feeling lucky) — 2026-09-02,
// same construction discipline as PhilosopherObject.tsx (thin single-
// color stroke, no fill except small marker dots, one deliberate shape
// per concept rather than a generic icon set) and CardSymbol.tsx (a
// primary trace the eye lands on first). Deliberately NOT reusing either
// file's own shapes: PhilosopherObject's five forms are each tied to one
// philosopher's own idea, CardSymbol's twenty are each tied to one
// card's own concept — reusing either literally here would misname what
// these rows actually do. "Understand it" is the one row that DOES reuse
// an existing symbol on purpose: the current philosopher's own
// PhilosopherObject mark, rendered small, since that row literally means
// "talk with them" — see depths/index.tsx's own render site.
//
// Same 200x200 viewBox convention as PhilosopherObject, scaled down via
// the `size` prop for this file's own small (~32-40px) row context —
// kept at 200x200 internally (not a smaller native viewBox) so path
// coordinates stay comparable/reusable with the other symbol files if
// this set ever needs to grow.
export type DepthsMenuSymbolId =
  | 'stay'
  | 'shift'
  | 'measure'
  | 'exploreMap'
  | 'feelingLucky';

function polylinePath(points: { x: number; y: number }[]): string {
  return `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`;
}

// Stay with it — a single open, asymmetric stroke, like a hand-drawn rune
// waiting to be completed rather than any one of Cards' own twenty
// finished symbols (which would misname this as a SPECIFIC card). Built
// from a few connected arcs at varying radius/angle so it reads as one
// continuous, slightly irregular gesture, not a closed/regular shape.
function stayPath(): string {
  const pts = [
    { x: 76, y: 132 },
    { x: 88, y: 96 },
    { x: 118, y: 78 },
    { x: 132, y: 104 },
    { x: 112, y: 128 },
  ];
  const steps = 60;
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const seg = Math.min(Math.floor(t * (pts.length - 1)), pts.length - 2);
    const localT = t * (pts.length - 1) - seg;
    const a = pts[seg];
    const b = pts[seg + 1];
    out.push({ x: a.x + (b.x - a.x) * localT, y: a.y + (b.y - a.y) * localT });
  }
  return polylinePath(out);
}

// Shift it — a bound point at center releasing into a few short strokes
// that fan outward and fade, tension dispersing rather than a closed/
// contained shape. Deterministic per-render (fixed seed) so the glyph
// doesn't reshuffle.
function shiftLines(): { x1: number; y1: number; x2: number; y2: number; opacity: number }[] {
  const rng = makeRng('depths-menu-shift');
  const cx = 100;
  const cy = 100;
  const count = 6;
  const lines: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rng() - 0.5) * 0.4;
    const innerR = 10;
    const outerR = 34 + rng() * 14;
    lines.push({
      x1: cx + Math.cos(angle) * innerR,
      y1: cy + Math.sin(angle) * innerR,
      x2: cx + Math.cos(angle) * outerR,
      y2: cy + Math.sin(angle) * outerR,
      opacity: 0.35 + rng() * 0.35,
    });
  }
  return lines;
}

// Measure again — an open returning arc (not a full closed ring, which
// would visually compete with Explore the map's own miniature wheel) —
// most of a circle, with a real gap, reading as "sweeping back toward
// its own start" rather than a completed loop.
function measureArc(): string {
  const cx = 100;
  const cy = 100;
  const r = 34;
  const startAngle = -Math.PI / 2 + 0.35;
  const endAngle = Math.PI * 1.5 - 0.35;
  const steps = 60;
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = startAngle + (i / steps) * (endAngle - startAngle);
    points.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  return polylinePath(points);
}

// Explore the map — a small ring with a handful of ticks around the rim,
// directly echoing the real 17-level wheel already visible on this same
// screen (VibrationSpectrum) — fewer ticks (8, not 17) since this is a
// small row glyph, not the instrument itself.
function exploreMapTicks(): { x1: number; y1: number; x2: number; y2: number }[] {
  const cx = 100;
  const cy = 100;
  const r = 32;
  const tickLen = 7;
  const count = 8;
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const inner = { x: cx + (r - tickLen / 2) * Math.cos(angle), y: cy + (r - tickLen / 2) * Math.sin(angle) };
    const outer = { x: cx + (r + tickLen / 2) * Math.cos(angle), y: cy + (r + tickLen / 2) * Math.sin(angle) };
    ticks.push({ x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y });
  }
  return ticks;
}

// Feeling lucky — a loose scatter of faint points with exactly one
// brighter/larger point among them, "something finding you" out of many
// possibilities — same visual logic as CardSymbol's own fixedPoint
// concept, not the same geometry (a fresh scatter, not fixedPoint's own
// two-tier field).
function luckyScatter(): { x: number; y: number; r: number; opacity: number; bright?: boolean }[] {
  const rng = makeRng('depths-menu-lucky');
  const cx = 100;
  const cy = 100;
  const points: { x: number; y: number; r: number; opacity: number; bright?: boolean }[] = [];
  const count = 6;
  // Radii sized for this file's own small (~34px) display size, NOT
  // CardSymbol/PhilosopherObject's own scatter-point sizes (r≈1-2 there,
  // at a 96-120px display size) — at 34px those would shrink to under a
  // pixel and vanish. Confirmed on-device: an earlier pass at r=2.4/4.4
  // (this file's own first draft) was invisible at the real row size.
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const r = 12 + rng() * 26;
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      r: 7,
      opacity: 0.3 + rng() * 0.2,
    });
  }
  // The one bright point — placed last so it renders on top, fixed
  // position (not part of the random scatter) so it's always clearly
  // "the one," not just the luckiest random draw.
  points.push({ x: cx + 16, y: cy - 12, r: 13, opacity: 1, bright: true });
  return points;
}

export function DepthsMenuSymbol({
  id,
  rgb,
  size = 34,
}: {
  id: DepthsMenuSymbolId;
  rgb: string;
  size?: number;
}) {
  const color = `rgb(${rgb})`;

  let content: React.ReactNode = null;
  switch (id) {
    case 'stay':
      content = (
        <Path d={stayPath()} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      );
      break;
    case 'shift':
      content = (
        <>
          {shiftLines().map((l, i) => (
            <Path
              key={i}
              d={`M${l.x1.toFixed(1)},${l.y1.toFixed(1)} L${l.x2.toFixed(1)},${l.y2.toFixed(1)}`}
              stroke={color}
              strokeWidth={4}
              strokeOpacity={l.opacity}
              strokeLinecap="round"
            />
          ))}
          <Circle cx={100} cy={100} r={7} fill={color} />
        </>
      );
      break;
    case 'measure':
      content = (
        <Path d={measureArc()} fill="none" stroke={color} strokeWidth={5} strokeLinecap="round" />
      );
      break;
    case 'exploreMap':
      content = (
        <>
          <Circle cx={100} cy={100} r={32} fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.5} />
          {exploreMapTicks().map((t, i) => (
            <Path
              key={i}
              d={`M${t.x1.toFixed(1)},${t.y1.toFixed(1)} L${t.x2.toFixed(1)},${t.y2.toFixed(1)}`}
              stroke={color}
              strokeWidth={4}
              strokeLinecap="round"
            />
          ))}
        </>
      );
      break;
    case 'feelingLucky':
      content = (
        <>
          {luckyScatter().map((p, i) => (
            <Circle key={i} cx={p.x} cy={p.y} r={p.r} fill={color} fillOpacity={p.opacity} />
          ))}
        </>
      );
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      {content}
    </Svg>
  );
}
