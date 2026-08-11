import Svg, { Defs, RadialGradient, Stop, Circle, Path, Line } from 'react-native-svg';
import { Point, polylinePath, seededRng, CardSymbolLayers } from './CardSymbol';
import { AnimatedSymbol } from './AnimatedCardSymbol';

// Thin-line construction geometry, same register as CardSymbol.tsx/
// PhilosopherObject.tsx — crisp wireframe, no fill except small marker
// dots, a primary trace plus fainter "rest" echo layers. Where CardSymbol
// deliberately draws physics/math abstractions ("no pre-loaded story," so a
// card's question stays the only source of meaning), this file draws
// natural events on purpose — a storm, still water, a sunrise — because
// recognizability IS the point here: the "vibrational dictionary" for
// someone who doesn't yet have words for what they feel (see
// docs/measure-experience-concept.md §4/§5). One symbol per vibration
// level, shown on that level's own detail page alongside its prose, so
// reading and recognizing can happen side by side.
//
// Reuses CardSymbol.tsx's pure, id-agnostic construction helpers
// (polylinePath, seededRng, the Point type, the CardSymbolLayers shape) —
// this is a second consumer of that toolkit, not a fork of it. Static
// geometry only, same split as CardSymbol: buildNatureSymbolLayers assembles
// each event's primary/rest/emphasis layers; AnimatedSymbol (in
// AnimatedCardSymbol.tsx, generalized to accept any buildLayers function)
// drives the draw-in animation.

function horizonProfile(cx: number, cy: number, y: number, width: number, roughness: number, seed: number): Point[] {
  const rng = seededRng(seed);
  const steps = 60;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    points.push({ x, y: cy + y + (rng() - 0.5) * roughness });
  }
  return points;
}

function radialScatter(cx: number, cy: number, rMin: number, rMax: number, count: number, seed: number): Point[] {
  const rng = seededRng(seed);
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const a = rng() * 2 * Math.PI;
    const r = rMin + rng() * (rMax - rMin);
    points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return points;
}

// 1. Shame — collapsed sinkhole: concentric rings that spiral toward one
// collapse point, not simple nested circles (that would read as an orbit,
// CardSymbol territory) — radius shrinks on an accelerating power curve and
// each ring's center is pulled down/in, so the stack tilts into a funnel.
// Rendered as open arcs (~300°, not closed loops) — a literal giving way.
function shameLayers(cx: number, cy: number) {
  const rings = 6;
  const rOuter = 80;
  const depth = 30;
  function ring(i: number): { path: string; opacity: number } {
    const t = i / rings;
    const r = rOuter * (1 - t) ** 1.6;
    const ringCx = cx;
    const ringCy = cy + depth * t ** 2;
    const steps = 60;
    const points: Point[] = [];
    const sweep = (300 / 360) * 2 * Math.PI;
    const start = -Math.PI / 2 - sweep / 2;
    for (let s = 0; s <= steps; s++) {
      const a = start + (s / steps) * sweep;
      points.push({ x: ringCx + r * Math.cos(a), y: ringCy + r * Math.sin(a) * 0.85 });
    }
    return { path: polylinePath(points), opacity: 0.15 + 0.5 * (1 - t) };
  }
  const outerRings = [];
  for (let i = 0; i < rings; i++) outerRings.push(ring(i));
  const innermost = ring(rings);
  const collapse = { x: cx, y: cy + depth };
  return { innermost: innermost.path, outerRings, collapse };
}

// 2. Guilt — low tide pulling back: a fixed shoreline plus a retreated
// waterline further from it, with exposed-ground ticks in the gap.
// Asymmetric, one side anchored — distinct by construction (retreat FROM a
// fixed reference) from Desire's climb TOWARD one.
function guiltLayers(cx: number, cy: number) {
  const shore = horizonProfile(cx, cy, -18, 190, 3, 101);
  const waterline = horizonProfile(cx, cy, 22, 190, 4, 102);
  const rng = seededRng(103);
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const x = cx - 90 + rng() * 180;
    const y = cy - 10 + rng() * 24;
    ticks.push({ x1: x, y1: y, x2: x, y2: y + 5 + rng() * 4 });
  }
  return { shorePath: polylinePath(shore), waterPath: polylinePath(waterline), ticks };
}

// 3. Apathy — dead calm: the flattest construction in the set, near-zero
// jitter, reading correctly only next to genuinely wavy neighbors. Three
// near-flat lines, no marker — absence of a distinguished moment.
function apathyLayers(cx: number, cy: number) {
  const main = horizonProfile(cx, cy, 0, 190, 1, 201);
  const above = horizonProfile(cx, cy, -22, 180, 1.2, 202);
  const below = horizonProfile(cx, cy, 22, 180, 1.2, 203);
  return { mainPath: polylinePath(main), abovePath: polylinePath(above), belowPath: polylinePath(below) };
}

// 4. Grief — steady, heavy rain: many short falling strokes with a shared
// slight rightward drift (wind), no single continuous trace — like
// CardSymbol's fixedPoint, this entry is genuinely all "rest," with one
// impact-point emphasis.
function griefLayers(cx: number, cy: number) {
  const rng = seededRng(301);
  const strokes: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  for (let i = 0; i < 36; i++) {
    const x = cx - 95 + rng() * 190;
    const yTop = cy - 85 + rng() * 110;
    const len = 14 + rng() * 18;
    const drift = 4 + rng() * 3;
    strokes.push({
      x1: x,
      y1: yTop,
      x2: x + drift,
      y2: yTop + len,
      opacity: 0.18 + rng() * 0.3,
    });
  }
  const ground = horizonProfile(cx, cy, 55, 190, 2, 302);
  const impact = { x: cx + 6, y: cy + 55 };
  return { strokes, groundPath: polylinePath(ground), impact };
}

// 5. Fear — lightning without the storm: one isolated jagged fork, sharp
// angular segments (not a smooth random walk), with one or two secondary
// branches. No storm context around it — isolation is the content.
function fearLayers(cx: number, cy: number) {
  const rng = seededRng(401);
  function fork(startX: number, startY: number, endY: number, segments: number): Point[] {
    const points: Point[] = [{ x: startX, y: startY }];
    let x = startX;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const y = startY + (endY - startY) * t;
      x += (rng() - 0.5) * 26 * (0.4 + t);
      points.push({ x, y });
    }
    return points;
  }
  const main = fork(cx - 6, cy - 82, cy + 78, 8);
  const branchStart = Math.round(main.length * 0.45);
  const branch = [main[branchStart], ...fork(main[branchStart].x, main[branchStart].y, cy + 40, 3).slice(1)];
  return { mainPath: polylinePath(main), branchPath: polylinePath(branch), origin: main[0] };
}

// 6. Desire — rising tide: mirror-opposite of Guilt's construction. A fixed
// shoreline reference plus three successive waterlines at increasing
// height, the highest is primary — a visible progression of reaching.
function desireLayers(cx: number, cy: number) {
  const shore = horizonProfile(cx, cy, -20, 190, 3, 501);
  const low = horizonProfile(cx, cy, 30, 180, 4, 502);
  const mid = horizonProfile(cx, cy, 8, 185, 4, 503);
  const high = horizonProfile(cx, cy, -8, 188, 4, 504);
  const touch = { x: cx, y: cy - 8 };
  return {
    shorePath: polylinePath(shore),
    lowPath: polylinePath(low),
    midPath: polylinePath(mid),
    highPath: polylinePath(high),
    touch,
  };
}

// 7. Anger — a storm breaking: several sharp, converging jagged strokes
// from different edges, colliding near center — the "loud" companion to
// Fear's "isolated" fork, same angular technique, different composition.
function angerLayers(cx: number, cy: number) {
  const rng = seededRng(601);
  function converge(seed: number, startAngle: number): Point[] {
    const r = seededRng(seed);
    const startR = 100;
    let x = cx + startR * Math.cos(startAngle);
    let y = cy + startR * Math.sin(startAngle);
    const points: Point[] = [{ x, y }];
    const segments = 5;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const targetX = cx + (r() - 0.5) * 20;
      const targetY = cy + (r() - 0.5) * 20;
      x = x + (targetX - x) * t * 0.5 + (r() - 0.5) * 14;
      y = y + (targetY - y) * t * 0.5 + (r() - 0.5) * 14;
      points.push({ x, y });
    }
    return points;
  }
  const primary = converge(602, -Math.PI / 2.2);
  const others = [
    converge(603, Math.PI / 6),
    converge(604, Math.PI - Math.PI / 5),
    converge(605, Math.PI + Math.PI / 3),
  ];
  const debris: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const a = rng() * 2 * Math.PI;
    const r = 8 + rng() * 20;
    debris.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return { primaryPath: polylinePath(primary), otherPaths: others.map(polylinePath), debris };
}

// 8. Pride — a lone peak above the clouds: an angular triangular peak
// (straight segments, not curves) drawn above a jittered cloud-band line
// with a scatter of small circles — the peak stays visibly separate.
function prideLayers(cx: number, cy: number) {
  const apex = { x: cx, y: cy - 78 };
  const peak: Point[] = [
    { x: cx - 60, y: cy - 6 },
    { x: cx - 24, y: cy - 46 },
    apex,
    { x: cx + 22, y: cy - 40 },
    { x: cx + 58, y: cy - 4 },
  ];
  const clouds = horizonProfile(cx, cy, 24, 190, 5, 701);
  const scatter = radialScatter(cx, cy + 24, 10, 90, 12, 702);
  return { peakPath: polylinePath(peak), cloudsPath: polylinePath(clouds), scatter, apex };
}

// 9. Courage — a fire catching wind: an upward-tapering flame outline
// (closed, asymmetric, leaning with height — "caught by wind") plus 2-3
// smaller echo-flames that haven't fully caught.
function courageLayers(cx: number, cy: number) {
  function flame(baseX: number, baseCy: number, height: number, lean: number): Point[] {
    const steps = 24;
    const left: Point[] = [];
    const right: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const taper = (1 - t) ** 0.7;
      const drift = lean * t ** 1.6;
      const w = 16 * taper * (1 - t * 0.3);
      const y = baseCy - t * height;
      left.push({ x: baseX - w + drift, y });
      right.push({ x: baseX + w + drift, y });
    }
    return [...left, ...right.reverse()];
  }
  const main = flame(cx, cy + 50, 130, 22);
  const echoA = flame(cx - 30, cy + 55, 70, 14);
  const echoB = flame(cx + 26, cy + 58, 55, 10);
  const tip = main[24];
  return {
    mainPath: `${polylinePath(main)} Z`,
    echoAPath: `${polylinePath(echoA)} Z`,
    echoBPath: `${polylinePath(echoB)} Z`,
    tip,
  };
}

// 10. Neutrality — flat open plain: a single, essentially straight line
// spanning nearly the full width, with evenly-spaced (not random) faint
// ticks — regularity itself is the distinguishing construction choice.
function neutralityLayers(cx: number, cy: number) {
  const line = horizonProfile(cx, cy, 0, 196, 0.6, 801);
  const ticks: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const count = 9;
  for (let i = 0; i < count; i++) {
    const x = cx - 90 + (i / (count - 1)) * 180;
    ticks.push({ x1: x, y1: cy - 3, x2: x, y2: cy + 3 });
  }
  return { linePath: polylinePath(line), ticks };
}

// 11. Willingness — a seedling breaking soil: a ground line with one small
// upward curve breaking through it, two leaf ticks, and a faint scatter of
// undisturbed soil below — mostly-empty canvas, "first motion."
function willingnessLayers(cx: number, cy: number) {
  const ground = horizonProfile(cx, cy, 20, 190, 3, 901);
  const stem: Point[] = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    stem.push({ x: cx - 4 + t * 10, y: cy + 20 - t * 46 + Math.sin(t * Math.PI) * 6 });
  }
  const tip = stem[stem.length - 1];
  const leafA = { x1: tip.x, y1: tip.y, x2: tip.x - 10, y2: tip.y - 6 };
  const leafB = { x1: tip.x, y1: tip.y, x2: tip.x + 9, y2: tip.y - 7 };
  const soil = radialScatter(cx, cy + 46, 20, 95, 14, 902);
  return { groundPath: polylinePath(ground), stemPath: polylinePath(stem), leafA, leafB, soil, tip };
}

// 12. Acceptance — a river finding its bed: a winding meander (damped
// random-walk, river-like) that visibly conforms to a straighter faint
// valley-line beneath it — settling into a KNOWN shape, made literal.
function acceptanceLayers(cx: number, cy: number) {
  const rng = seededRng(1001);
  const steps = 60;
  const width = 190;
  const river: Point[] = [];
  const valley: Point[] = [];
  let y = cy;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    const valleyY = cy + 14 * Math.sin(t * Math.PI * 1.3);
    y += (valleyY - y) * 0.25 + (rng() - 0.5) * 5;
    river.push({ x, y });
    valley.push({ x, y: valleyY });
  }
  const pebbles = radialScatter(cx, cy + 10, 30, 85, 6, 1002);
  return { riverPath: polylinePath(river), valleyPath: polylinePath(valley), pebbles };
}

// 13. Reason — clear sky after weather: several perfectly straight
// horizontal lines at different heights, no jitter at all — the set's only
// "multiple perfectly ruled lines" construction, distinct from Neutrality's
// one organically-jittered line.
function reasonLayers(cx: number, cy: number) {
  const near: Point[] = [{ x: cx - 95, y: cy + 20 }, { x: cx + 95, y: cy + 20 }];
  const mid: Point[] = [{ x: cx - 85, y: cy - 4 }, { x: cx + 85, y: cy - 4 }];
  const far: Point[] = [{ x: cx - 70, y: cy - 26 }, { x: cx + 70, y: cy - 26 }];
  const stars = radialScatter(cx, cy - 55, 5, 60, 5, 1101);
  return { nearPath: polylinePath(near), midPath: polylinePath(mid), farPath: polylinePath(far), stars };
}

// 14. Love — sunrise: a horizon line with a half-disc arc rising through
// it, plus straight rays radiating up and out — the set's first genuinely
// radiating construction.
function loveLayers(cx: number, cy: number) {
  const horizon = horizonProfile(cx, cy, 10, 190, 2, 1201);
  const arcSteps = 40;
  const arc: Point[] = [];
  const r = 46;
  for (let i = 0; i <= arcSteps; i++) {
    const a = Math.PI + (i / arcSteps) * Math.PI;
    arc.push({ x: cx + r * Math.cos(a), y: cy + 10 + r * Math.sin(a) });
  }
  const rng = seededRng(1202);
  const rays: { x1: number; y1: number; x2: number; y2: number; opacity: number }[] = [];
  const rayCount = 5;
  for (let i = 0; i < rayCount; i++) {
    const t = i / (rayCount - 1);
    const a = Math.PI + t * Math.PI + (rng() - 0.5) * 0.12;
    const len = 30 + t * 40 * Math.sin(t * Math.PI) + 30;
    rays.push({
      x1: cx + r * 0.5 * Math.cos(a),
      y1: cy + 10 + r * 0.5 * Math.sin(a),
      x2: cx + (r + len) * Math.cos(a),
      y2: cy + 10 + (r + len) * Math.sin(a),
      opacity: 0.2 + 0.2 * Math.sin(t * Math.PI),
    });
  }
  const origin = { x: cx, y: cy + 10 };
  return { horizonPath: polylinePath(horizon), arcPath: polylinePath(arc), rays, origin };
}

// 15. Unconditional Love — a wide, ever-flowing spring: many curved lines
// emanating outward in a full 360° spread from a single source, reaching
// the canvas edges — distinct from Love's straight, upward-only rays by
// curvature and omnidirectionality.
function unconditionalLoveLayers(cx: number, cy: number) {
  const rng = seededRng(1301);
  const count = 10;
  const flows: Point[][] = [];
  for (let i = 0; i < count; i++) {
    const baseAngle = (i / count) * 2 * Math.PI;
    const curve = (rng() - 0.5) * 0.9;
    const reach = 70 + rng() * 30;
    const steps = 24;
    const points: Point[] = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const a = baseAngle + curve * t * t;
      const r = t * reach;
      points.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
    flows.push(points);
  }
  const primaryIndex = 0;
  return {
    primaryPath: polylinePath(flows[primaryIndex]),
    restPaths: flows.filter((_, i) => i !== primaryIndex).map(polylinePath),
    origin: { x: cx, y: cy },
  };
}

// 16. Peace — still water: one flat, near-zero-jitter surface line with a
// single simple shape above it and its faint vertically-flipped mirror
// below — the set's only object+reflection construction, kept quiet.
function peaceLayers(cx: number, cy: number) {
  const water = horizonProfile(cx, cy, 0, 190, 0.8, 1401);
  const shape: Point[] = [
    { x: cx - 16, y: cy - 4 },
    { x: cx - 6, y: cy - 26 },
    { x: cx, y: cy - 32 },
    { x: cx + 6, y: cy - 26 },
    { x: cx + 16, y: cy - 4 },
  ];
  const reflection = shape.map((p) => ({ x: p.x, y: 2 * cy - p.y }));
  return { waterPath: polylinePath(water), shapePath: polylinePath(shape), reflectionPath: polylinePath(reflection) };
}

// 17. Enlightenment — open sky at night, full of stars: no horizon, no
// primary trace, pure structured scatter at two densities plus sparse
// constellation connectors — nothing more resolved than anything else.
function enlightenmentLayers(cx: number, cy: number) {
  const outer = radialScatter(cx, cy, 10, 96, 22, 1501);
  const inner = radialScatter(cx, cy, 4, 55, 18, 1502);
  const rng = seededRng(1503);
  const all = [...inner, ...outer];
  const connections: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const a = all[Math.floor(rng() * all.length)];
    const b = all[Math.floor(rng() * all.length)];
    connections.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y });
  }
  return { outer, inner, connections };
}

export type NatureSymbolId =
  | 'shame'
  | 'guilt'
  | 'apathy'
  | 'grief'
  | 'fear'
  | 'desire'
  | 'anger'
  | 'pride'
  | 'courage'
  | 'neutrality'
  | 'willingness'
  | 'acceptance'
  | 'reason'
  | 'love'
  | 'unconditionallove'
  | 'peace'
  | 'enlightenment';

export const NATURE_SYMBOL_IDS: NatureSymbolId[] = [
  'shame',
  'guilt',
  'apathy',
  'grief',
  'fear',
  'desire',
  'anger',
  'pride',
  'courage',
  'neutrality',
  'willingness',
  'acceptance',
  'reason',
  'love',
  'unconditionallove',
  'peace',
  'enlightenment',
];

export function buildNatureSymbolLayers(id: string, color: string): CardSymbolLayers {
  const cx = 100;
  const cy = 100;

  switch (id as NatureSymbolId) {
    case 'shame': {
      const { innermost, outerRings, collapse } = shameLayers(cx, cy);
      return {
        primaryPath: innermost,
        primaryStrokeWidth: 2,
        rest: (
          <>
            {outerRings.map((r, i) => (
              <Path key={i} d={r.path} fill="none" stroke={color} strokeWidth={1} strokeOpacity={r.opacity} strokeLinecap="round" />
            ))}
          </>
        ),
        emphasis: { cx: collapse.x, cy: collapse.y, r: 3 },
      };
    }
    case 'guilt': {
      const { shorePath, waterPath, ticks } = guiltLayers(cx, cy);
      return {
        primaryPath: waterPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={shorePath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.35} />
            {ticks.map((t, i) => (
              <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth={1} strokeOpacity={0.25} />
            ))}
          </>
        ),
      };
    }
    case 'apathy': {
      const { mainPath, abovePath, belowPath } = apathyLayers(cx, cy);
      return {
        primaryPath: mainPath,
        primaryStrokeWidth: 1.6,
        rest: (
          <>
            <Path d={abovePath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.18} />
            <Path d={belowPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.18} />
          </>
        ),
      };
    }
    case 'grief': {
      const { strokes, groundPath, impact } = griefLayers(cx, cy);
      return {
        primaryPath: '',
        primaryStrokeWidth: 0,
        rest: (
          <>
            {strokes.map((s, i) => (
              <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke={color} strokeWidth={1} strokeOpacity={s.opacity} strokeLinecap="round" />
            ))}
            <Path d={groundPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.3} />
          </>
        ),
        emphasis: { cx: impact.x, cy: impact.y, r: 2.4 },
      };
    }
    case 'fear': {
      const { mainPath, branchPath } = fearLayers(cx, cy);
      return {
        primaryPath: mainPath,
        primaryStrokeWidth: 2.2,
        rest: <Path d={branchPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.35} strokeLinecap="round" />,
      };
    }
    case 'desire': {
      const { shorePath, lowPath, midPath, highPath, touch } = desireLayers(cx, cy);
      return {
        primaryPath: highPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={shorePath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3} strokeDasharray="2,5" />
            <Path d={lowPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.18} />
            <Path d={midPath} fill="none" stroke={color} strokeWidth={1.1} strokeOpacity={0.3} />
          </>
        ),
        emphasis: { cx: touch.x, cy: touch.y, r: 2.2 },
      };
    }
    case 'anger': {
      const { primaryPath, otherPaths, debris } = angerLayers(cx, cy);
      return {
        primaryPath,
        primaryStrokeWidth: 2.4,
        rest: (
          <>
            {otherPaths.map((p, i) => (
              <Path key={i} d={p} fill="none" stroke={color} strokeWidth={1.3} strokeOpacity={0.32} strokeLinecap="round" />
            ))}
            {debris.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.2} fill={color} fillOpacity={0.35} />
            ))}
          </>
        ),
      };
    }
    case 'pride': {
      const { peakPath, cloudsPath, scatter, apex } = prideLayers(cx, cy);
      return {
        primaryPath: peakPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={cloudsPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3} />
            {scatter.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.3} fill={color} fillOpacity={0.22} />
            ))}
          </>
        ),
        emphasis: { cx: apex.x, cy: apex.y, r: 2.4 },
      };
    }
    case 'courage': {
      const { mainPath, echoAPath, echoBPath, tip } = courageLayers(cx, cy);
      return {
        primaryPath: mainPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={echoAPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.22} />
            <Path d={echoBPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.18} />
          </>
        ),
        emphasis: { cx: tip.x, cy: tip.y, r: 2 },
      };
    }
    case 'neutrality': {
      const { linePath, ticks } = neutralityLayers(cx, cy);
      return {
        primaryPath: linePath,
        primaryStrokeWidth: 1.6,
        rest: (
          <>
            {ticks.map((t, i) => (
              <Line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth={1} strokeOpacity={0.25} />
            ))}
          </>
        ),
      };
    }
    case 'willingness': {
      const { groundPath, stemPath, leafA, leafB, soil, tip } = willingnessLayers(cx, cy);
      return {
        primaryPath: stemPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={groundPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.32} />
            <Line x1={leafA.x1} y1={leafA.y1} x2={leafA.x2} y2={leafA.y2} stroke={color} strokeWidth={1.2} strokeOpacity={0.4} />
            <Line x1={leafB.x1} y1={leafB.y1} x2={leafB.x2} y2={leafB.y2} stroke={color} strokeWidth={1.2} strokeOpacity={0.4} />
            {soil.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1} fill={color} fillOpacity={0.14} />
            ))}
          </>
        ),
        emphasis: { cx: tip.x, cy: tip.y, r: 2 },
      };
    }
    case 'acceptance': {
      const { riverPath, valleyPath, pebbles } = acceptanceLayers(cx, cy);
      return {
        primaryPath: riverPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={valleyPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.22} strokeDasharray="1,4" />
            {pebbles.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.1} fill={color} fillOpacity={0.25} />
            ))}
          </>
        ),
      };
    }
    case 'reason': {
      const { nearPath, midPath, farPath, stars } = reasonLayers(cx, cy);
      return {
        primaryPath: nearPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={midPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.3} />
            <Path d={farPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.18} />
            {stars.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1} fill={color} fillOpacity={0.2} />
            ))}
          </>
        ),
      };
    }
    case 'love': {
      const { horizonPath, arcPath, rays, origin } = loveLayers(cx, cy);
      return {
        primaryPath: arcPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={horizonPath} fill="none" stroke={color} strokeWidth={1.1} strokeOpacity={0.28} />
            {rays.map((r, i) => (
              <Line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} stroke={color} strokeWidth={1} strokeOpacity={r.opacity} strokeLinecap="round" />
            ))}
          </>
        ),
        emphasis: { cx: origin.x, cy: origin.y, r: 2.4 },
      };
    }
    case 'unconditionallove': {
      const { primaryPath, restPaths, origin } = unconditionalLoveLayers(cx, cy);
      return {
        primaryPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            {restPaths.map((p, i) => (
              <Path key={i} d={p} fill="none" stroke={color} strokeWidth={1.1} strokeOpacity={0.28} strokeLinecap="round" />
            ))}
          </>
        ),
        emphasis: { cx: origin.x, cy: origin.y, r: 2.6 },
      };
    }
    case 'peace': {
      const { waterPath, shapePath, reflectionPath } = peaceLayers(cx, cy);
      return {
        primaryPath: waterPath,
        primaryStrokeWidth: 1.6,
        rest: (
          <>
            <Path d={shapePath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3} strokeLinecap="round" />
            <Path d={reflectionPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.18} strokeLinecap="round" />
          </>
        ),
      };
    }
    case 'enlightenment': {
      const { outer, inner, connections } = enlightenmentLayers(cx, cy);
      return {
        primaryPath: '',
        primaryStrokeWidth: 0,
        rest: (
          <>
            {outer.map((p, i) => (
              <Circle key={`o${i}`} cx={p.x} cy={p.y} r={1} fill={color} fillOpacity={0.2} />
            ))}
            {inner.map((p, i) => (
              <Circle key={`i${i}`} cx={p.x} cy={p.y} r={1.3} fill={color} fillOpacity={0.4} />
            ))}
            {connections.map((c, i) => (
              <Line key={i} x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2} stroke={color} strokeWidth={0.6} strokeOpacity={0.2} />
            ))}
          </>
        ),
      };
    }
    default:
      return { primaryPath: '', primaryStrokeWidth: 0, rest: null };
  }
}

export function NatureSymbol({ id, rgb, size = 120 }: { id: NatureSymbolId; rgb: string; size?: number }) {
  const color = `rgb(${rgb})`;
  const cx = 100;
  const cy = 100;
  const { primaryPath, primaryStrokeWidth, rest, emphasis } = buildNatureSymbolLayers(id, color);

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`nature-core-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.18} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={92} fill={`url(#nature-core-${id})`} />
      {rest}
      {primaryStrokeWidth > 0 && primaryPath && (
        <Path d={primaryPath} fill="none" stroke={color} strokeWidth={primaryStrokeWidth} strokeLinecap="round" />
      )}
      {emphasis && <Circle cx={emphasis.cx} cy={emphasis.cy} r={emphasis.r} fill={color} />}
    </Svg>
  );
}

export function AnimatedNatureSymbol({ id, rgb, size = 120 }: { id: NatureSymbolId; rgb: string; size?: number }) {
  return <AnimatedSymbol id={id} rgb={rgb} size={size} buildLayers={buildNatureSymbolLayers} gradientKey={`nature-${id}`} />;
}
