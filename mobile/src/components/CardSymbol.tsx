import type { ReactNode } from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle, Path, Line } from 'react-native-svg';

// Thin-line construction geometry, same register as PhilosopherObject.tsx —
// crisp wireframe diagrams, not flat illustration, no fill except small
// marker dots. Where PhilosopherObject draws platonic solids (cone, cube,
// sphere), Card symbols draw physics/math forms (waves, orbits, phase
// space) — see docs/cards-concept.md, "no pre-loaded story": a waveform or
// orbit carries structural meaning (resonance, decay, oscillation) without
// carrying cultural narrative the way an object (a door, a train) would,
// so the card's question stays the only source of meaning, not the shape.
//
// Each symbol is built from several layered passes (a faint construction
// layer, harmonics/echoes of the main trace, scattered field points) —
// more visual presence than a single stroke, still strictly wireframe: no
// fill except small marker dots, same opacity-for-depth technique
// PhilosopherObject already uses (e.g. its cube's back face, cone's cross
// sections).
//
// Static geometry only — no animation in this file. `CardSymbol` renders
// the finished, settled symbol; `buildCardSymbolLayers` exposes the same
// geometry split into a primary trace + a "rest" layer so
// AnimatedCardSymbol.tsx can drive a draw-in animation without
// duplicating any path math here. See that file for the animation
// itself, driven by Reanimated the same way ConsciousnessWheel.tsx
// animates its marker.

interface Point {
  x: number;
  y: number;
}

function polylinePath(points: Point[]): string {
  return `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`;
}

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return (s % 1000) / 1000;
  };
}

function sineTrace(cx: number, cy: number, width: number, amplitude: number, cycles: number, phase = 0): Point[] {
  const steps = 160;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    const y = cy + amplitude * Math.sin(t * cycles * 2 * Math.PI + phase);
    points.push({ x, y });
  }
  return points;
}

// The open system: a primary trace that never closes, plus two fainter
// harmonic echoes at different amplitude/frequency (overtones of the same
// open motion) and a scatter of drifting points along the frame edges —
// the sense of something continuing past what's shown, not just one line.
function openSystemLayers(cx: number, cy: number) {
  const primary = polylinePath(sineTrace(cx, cy, 210, 34, 2.4));
  const echoA = polylinePath(sineTrace(cx, cy - 46, 190, 14, 3.6, 0.6));
  const echoB = polylinePath(sineTrace(cx, cy + 50, 190, 10, 4.8, 1.4));
  const rng = seededRng(3);
  const drifters: Point[] = [];
  for (let i = 0; i < 10; i++) {
    const edge = rng() > 0.5 ? -5 : 205;
    drifters.push({ x: edge + (rng() - 0.5) * 14, y: 30 + rng() * 140 });
  }
  return { primary, echoA, echoB, drifters };
}

// Two nested elliptical orbits, the inner pulled off-center by an unseen
// second mass, plus a faint outer construction ellipse (the undistorted
// orbit that would exist without the pull) and a scatter of small debris
// points trailing the distorted path — visible gravitational history.
function whatYoureCarryingLayers(cx: number, cy: number) {
  const steps = 120;
  const outer: Point[] = [];
  const inner: Point[] = [];
  const ghost: Point[] = [];
  const rOuter = 78;
  const rInner = 34;
  const pull = 34;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    outer.push({ x: cx + rOuter * Math.cos(t), y: cy + rOuter * Math.sin(t) * 0.82 });
    inner.push({ x: cx + pull + rInner * Math.cos(t), y: cy + rInner * Math.sin(t) * 0.82 });
    ghost.push({ x: cx + rInner * 1.3 * Math.cos(t), y: cy + rInner * 1.3 * Math.sin(t) * 0.82 });
  }
  const rng = seededRng(11);
  const debris: Point[] = [];
  for (let i = 0; i < 7; i++) {
    const t = rng() * 2 * Math.PI;
    const r = rInner * (1.1 + rng() * 0.6);
    debris.push({ x: cx + pull * 0.6 + r * Math.cos(t), y: cy + r * Math.sin(t) * 0.82 });
  }
  return {
    outerPath: `${polylinePath(outer)} Z`,
    innerPath: `${polylinePath(inner)} Z`,
    ghostPath: `${polylinePath(ghost)} Z`,
    debris,
  };
}

// A standing wave with several visible partial harmonics stacked behind
// the main damped trace (the overtone series a real standing wave
// actually carries), not just one clean curve.
function standingWaveLayers(cx: number, cy: number) {
  const width = 200;
  const amplitude = 30;
  const nodes = 6;
  const liveNode = 4;
  const nodePos = (liveNode + 0.5) / nodes;
  function trace(nodeCount: number, amp: number, yOffset: number): Point[] {
    const steps = 200;
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = cx - width / 2 + t * width;
      const envelope = Math.exp(-((t - nodePos) ** 2) / (2 * 0.16 ** 2));
      const damped = 0.18 + envelope * 0.82;
      const y = cy + yOffset + amp * damped * Math.sin(t * nodeCount * Math.PI);
      points.push({ x, y });
    }
    return points;
  }
  const main = polylinePath(trace(nodes, amplitude, 0));
  const overtone1 = polylinePath(trace(nodes * 2, amplitude * 0.35, 0));
  const overtone2 = polylinePath(trace(Math.round(nodes * 0.5), amplitude * 0.5, 0));
  return { main, overtone1, overtone2 };
}

// Two source waves plus their real summed interference, with a faint
// third harmonic pass added beneath for texture (a higher-frequency
// component riding on the same beat), plus a few marker points at the
// interference sum's peaks.
function interferenceLayers(cx: number, cy: number) {
  const width = 190;
  const amplitude = 15;
  const steps = 200;
  const a: Point[] = [];
  const b: Point[] = [];
  const sum: Point[] = [];
  const texture: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    const ya = amplitude * Math.sin(t * 5 * Math.PI);
    const yb = amplitude * Math.sin(t * 5.8 * Math.PI);
    a.push({ x, y: cy - 40 + ya });
    b.push({ x, y: cy - 40 + yb });
    sum.push({ x, y: cy + 40 + (ya + yb) * 0.55 });
    texture.push({ x, y: cy + 40 + (ya + yb) * 0.55 + 5 * Math.sin(t * 22 * Math.PI) });
  }
  return {
    aPath: polylinePath(a),
    bPath: polylinePath(b),
    sumPath: polylinePath(sum),
    texturePath: polylinePath(texture),
  };
}

// A scattered phase-space field, layered: a faint outer scatter (distant
// noise), a denser inner scatter (nearer the fixed point), a couple of
// short trailing strokes hinting at motion on a few of the points, and
// one fixed point held still.
function fixedPointLayers(cx: number, cy: number) {
  const rng = seededRng(7);
  const outer: Point[] = [];
  const inner: Point[] = [];
  const trails: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < 16; i++) {
    const a = rng() * 2 * Math.PI;
    const r = 60 + rng() * 30;
    outer.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  for (let i = 0; i < 14; i++) {
    const a = rng() * 2 * Math.PI;
    const r = 18 + rng() * 38;
    const px = cx + r * Math.cos(a);
    const py = cy + r * Math.sin(a);
    inner.push({ x: px, y: py });
    if (i % 3 === 0) {
      trails.push({ x1: px, y1: py, x2: px + (rng() - 0.5) * 16, y2: py + (rng() - 0.5) * 16 });
    }
  }
  return { outer, inner, trails };
}

// A near-closed Lissajous-style loop, layered with a faint second pass at
// a slightly different radius/detune (an echo of the same near-resonance,
// one revolution apart) so the "almost closing" quality reads as
// recurring, not a single attempt.
function incompleteResonanceLayers(cx: number, cy: number) {
  function loop(r: number, detune: number, steps: number, turns: number): string {
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * 2 * Math.PI * turns;
      const rr = r * (0.7 + 0.3 * (i / steps));
      const x = cx + rr * Math.cos(t + detune * t * t);
      const y = cy + rr * Math.sin(t);
      points.push({ x, y });
    }
    return polylinePath(points);
  }
  const primary = loop(62, 0.008, 400, 3);
  const echo = loop(46, 0.011, 300, 3);
  return { primary, echo };
}

// High-frequency chaotic noise (two overlapping noise bands at different
// density) with one clean low-frequency signal visible underneath, plus a
// few isolated noise points that have drifted clear of the band.
function signalBeneathNoiseLayers(cx: number, cy: number) {
  const width = 200;
  const steps = 220;
  const rngA = seededRng(11);
  const rngB = seededRng(29);
  const noiseA: Point[] = [];
  const noiseB: Point[] = [];
  const signal: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    noiseA.push({ x, y: cy + (rngA() - 0.5) * 44 });
    noiseB.push({ x, y: cy + (rngB() - 0.5) * 26 });
    signal.push({ x, y: cy + 18 * Math.sin(t * 3 * Math.PI) });
  }
  const strays: Point[] = [];
  const rngC = seededRng(41);
  for (let i = 0; i < 6; i++) {
    strays.push({ x: cx - width / 2 + rngC() * width, y: cy + (rngC() - 0.5) * 70 });
  }
  return {
    noiseAPath: polylinePath(noiseA),
    noiseBPath: polylinePath(noiseB),
    signalPath: polylinePath(signal),
    strays,
  };
}

// An activation-energy curve, layered with two fainter "prior attempts"
// at lower reach (echoes of the same shape that fell further short),
// alongside the closest approach — a small history of approaching the
// same barrier, not just one trajectory.
function belowThresholdLayers(cx: number, cy: number) {
  const width = 190;
  const barrierHeight = 60;
  const cyShifted = cy + 46;
  function curve(reach: number): string {
    const steps = 100;
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = cx - width / 2 + t * width;
      const rise = Math.sin(t * Math.PI) * reach * barrierHeight;
      points.push({ x, y: cyShifted - rise });
    }
    return polylinePath(points);
  }
  return {
    mainPath: curve(0.94),
    priorA: curve(0.62),
    priorB: curve(0.4),
    barrierY: cyShifted - barrierHeight,
  };
}

// ============================================================================
// Archetype cards — six physics concepts chosen because each one is ALSO a
// recognized archetypal motif (the way simple harmonic motion IS the
// archetype of return/oscillation), not because a physics form was bent to
// illustrate an archetype after the fact. Same discipline as the rest of the
// deck: pure wireframe construction geometry, no pre-loaded story shape (no
// doors, masks, or figures) — see docs/cards-concept.md, "Physics/math
// vocabulary." Six separate constructions, not one shared base the way the
// cycle-phase cards share cycleRing() — each archetype maps to a distinct
// physical picture (a critical point isn't built from the same geometry as
// a phase-locked pair), so there's no natural single shared form here.

// The Threshold — a double-well potential with the system's trajectory
// balanced exactly at the saddle point between the two wells, not yet
// committed to either side. The two wells themselves are drawn faint (the
// two possible futures), the trajectory's approach to the saddle is the
// primary trace, and a small scatter of points shows past attempts that
// fell back into the near well before reaching center.
function thresholdLayers(cx: number, cy: number) {
  const width = 220;
  const depth = 58;
  // Quartic double-well normalized so u=0 (edges AND center) sits at the
  // rim and u=±0.707 (the two minima) sits at the true bottom — the raw
  // u^4-u^2 shape has that minimum at -0.25, so dividing by 0.25 scales
  // the actual trough to the full `depth`, not a barely-visible fraction
  // of it (the earlier version's flatness bug).
  function wellY(u: number): number {
    return cy + depth * ((u ** 4 - u ** 2) / 0.25) + depth * 0.55;
  }
  function wellCurve(): Point[] {
    const steps = 160;
    const points: Point[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const u = -1 + t * 2;
      points.push({ x: cx + u * (width / 2), y: wellY(u) });
    }
    return points;
  }
  const wellPath = polylinePath(wellCurve());
  // The trajectory: climbs out of the left well toward the saddle at
  // center, slowing visibly as it nears it (steps bunch up near u=0 —
  // the "critical slowing down" a real system shows near a tipping
  // point) rather than crossing decisively into the right well.
  const steps = 70;
  const traj: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Eased toward 0 with a power curve so points bunch near the saddle.
    const u = -0.86 + 0.8 * t ** 1.6;
    traj.push({ x: cx + u * (width / 2), y: wellY(u) });
  }
  const trajPath = polylinePath(traj);
  const saddle = { x: cx, y: wellY(0) };
  const rng = seededRng(17);
  const fallbacks: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const u = -0.95 + rng() * 0.3;
    fallbacks.push({ x: cx + u * (width / 2), y: wellY(u) - 5 - rng() * 6 });
  }
  return { wellPath, trajPath, saddle, fallbacks };
}

// The Guardian — a bounded field: a dense scatter contained within a
// closed boundary curve, with the boundary itself drawn as the primary
// trace (thicker where it's doing real containing work, thinner where the
// field presses less against it) rather than a uniform circle. A few
// points sit just outside, having crossed — the boundary holds, but isn't
// absolute.
function guardianLayers(cx: number, cy: number) {
  const steps = 140;
  const boundary: Point[] = [];
  const r = 66;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    // Irregular but closed — a real containing membrane, not a perfect
    // circle (which would read as an abstract ring rather than a
    // boundary doing work against pressure from inside).
    const wobble = 1 + 0.08 * Math.sin(t * 3) + 0.05 * Math.sin(t * 7 + 1.4);
    boundary.push({ x: cx + r * wobble * Math.cos(t), y: cy + r * wobble * Math.sin(t) });
  }
  const boundaryPath = `${polylinePath(boundary)} Z`;
  const rng = seededRng(23);
  const contained: Point[] = [];
  for (let i = 0; i < 20; i++) {
    const a = rng() * 2 * Math.PI;
    const rr = rng() ** 0.5 * (r * 0.82);
    contained.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
  }
  const escaped: Point[] = [];
  for (let i = 0; i < 3; i++) {
    const a = rng() * 2 * Math.PI;
    const rr = r * (1.12 + rng() * 0.2);
    escaped.push({ x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a) });
  }
  return { boundaryPath, contained, escaped };
}

// The Hidden Root — a visible trace that only tells part of the story: a
// real curve on the surface (the primary trace) whose actual shape is
// governed by a second, unseen component drawn faint beneath it (the
// hidden root of the underlying equation) — the visible line dips and
// distorts exactly where the hidden component is closest, but the
// component itself is only ever shown as that distortion, never directly.
function hiddenRootLayers(cx: number, cy: number) {
  const width = 200;
  const steps = 180;
  const hiddenX = cx - 18;
  const hiddenY = cy + 34;
  const surface: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    // Base gentle wave, pulled/distorted by a smooth dipole-style tug
    // toward the hidden point — dx/dist^3 (not dx>0?1:-1 with 1/dist^2,
    // the earlier version) changes sign continuously through dx=0 rather
    // than jumping, so the surface line bends smoothly instead of
    // spiking at the point directly above the hidden component.
    const dx = x - hiddenX;
    const dy = cy - hiddenY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const pull = (2200 * dx) / (dist ** 3 + 900);
    const y = cy + 10 * Math.sin(t * 4 * Math.PI) - pull;
    surface.push({ x, y });
  }
  const surfacePath = polylinePath(surface);
  // The hidden component itself: drawn as a small, closed loop around its
  // own position — faint relative to the surface trace (it's inferred,
  // never confirmed directly) but still clearly a real, deliberate shape,
  // not a barely-there smudge.
  const hiddenSteps = 60;
  const hidden: Point[] = [];
  for (let i = 0; i <= hiddenSteps; i++) {
    const t = (i / hiddenSteps) * 2 * Math.PI;
    hidden.push({ x: hiddenX + 18 * Math.cos(t), y: hiddenY + 18 * Math.sin(t) * 0.7 });
  }
  const hiddenPath = `${polylinePath(hidden)} Z`;
  return { surfacePath, hiddenPath, hiddenPoint: { x: hiddenX, y: hiddenY } };
}

// The Seeker — a random walk that hasn't yet settled into any attractor:
// a genuinely undirected path (each step a random turn, not aimed at
// anything), drawn as the primary trace, with a faint scatter of several
// OTHER possible walks from the same start (paths not taken) underneath,
// and no endpoint marker — unlike fixedPoint or the cycle cards, nothing
// here is emphasized as "arrived," because the seeker hasn't.
function seekerLayers(cx: number, cy: number) {
  function walk(seed: number, steps: number): Point[] {
    const rng = seededRng(seed);
    let x = cx;
    let y = cy;
    let angle = rng() * 2 * Math.PI;
    const points: Point[] = [{ x, y }];
    for (let i = 0; i < steps; i++) {
      angle += (rng() - 0.5) * 1.8;
      const step = 9 + rng() * 5;
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      // Soft containment so the walk stays roughly on-card without a hard
      // clip — a gentle pull back toward center, not a wall.
      x += (cx - x) * 0.02;
      y += (cy - y) * 0.02;
      points.push({ x, y });
    }
    return points;
  }
  const primary = polylinePath(walk(31, 46));
  const ghostA = polylinePath(walk(52, 40));
  const ghostB = polylinePath(walk(67, 40));
  return { primary, ghostA, ghostB };
}

// The Return — a hysteresis loop: a path driven out from a starting point
// and back again, but along a visibly different curve than it went out
// on, so the loop doesn't retrace itself — it encloses real area, the
// signature of a system that came back changed by having gone around. The
// start/end point (the only point the outbound and return paths share) is
// marked, since it's the one thing that's literally the same as before.
function returnLayers(cx: number, cy: number) {
  const steps = 120;
  const out: Point[] = [];
  const back: Point[] = [];
  const width = 150;
  const startX = cx - width / 2;
  const endX = cx + width / 2;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = startX + t * width;
    // Outbound: rises via one curve shape.
    out.push({ x, y: cy - 32 * Math.sin(t * Math.PI) - 10 * t });
  }
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = endX - t * width;
    // Return: a visibly different curve back — dips lower before
    // recovering, the classic hysteresis lag rather than a mirrored path.
    const tt = 1 - t;
    back.push({ x, y: cy + 20 * Math.sin(tt * Math.PI * 0.8) - 10 * tt + 14 });
  }
  const outPath = polylinePath(out);
  const backPath = polylinePath(back);
  const start = out[0];
  const end = out[out.length - 1];
  return { outPath, backPath, start, end };
}

// The Union — phase-locking: two independent oscillators with visibly
// different phase/frequency at the start (left edge), gradually
// synchronizing until they trace the same curve by the right edge — shown
// as two traces that begin apart and converge, not two identical traces
// from the start (which would show agreement, not the process of
// arriving at it).
function unionLayers(cx: number, cy: number) {
  const width = 210;
  const steps = 200;
  const a: Point[] = [];
  const b: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    // Frequency and phase of B converge toward A's as t increases — the
    // locking process itself, not just two waves that happen to match.
    const freqB = 5.6 - 1.8 * t;
    const phaseB = 1.1 * (1 - t);
    const ya = 24 * Math.sin(t * 5.6 * Math.PI);
    const yb = 24 * Math.sin(t * freqB * Math.PI + phaseB);
    a.push({ x, y: cy - 22 + ya });
    b.push({ x, y: cy - 22 + yb });
  }
  const aPath = polylinePath(a);
  const bPath = polylinePath(b);
  // A faint marker where the two traces are already within a hair of each
  // other (the lock point), roughly the last quarter of the card.
  const lockIndex = Math.round(steps * 0.86);
  const lock = { x: a[lockIndex].x, y: (a[lockIndex].y + b[lockIndex].y) / 2 };
  return { aPath, bPath, lock };
}

// Shared construction for the six cycle-phase cards (Beginning, Rising,
// Peak, Turning, Releasing, Rest) — a full ring, always drawn faint and
// complete, with ONE arc segment emphasized at a different position per
// phase, plus a small leading-edge marker dot. Deliberately never shows
// more than one phase's position at once — this is not a wheel/map (that
// would be the same instrument as ConsciousnessWheel/VibrationSpectrum,
// which show every position at once because they ARE maps). A cycle card
// only ever shows its own arc, alone, so it can't be read as "here's
// where Beginning sits relative to Rest" — there is no way to reconstruct
// the whole cycle from one card, only to sit with the one phase it names.
// See docs/cards-concept.md, "Cycle-phase cards" for the full rationale.
function cycleRing(cx: number, cy: number, r: number, arcStart: number, arcLength: number) {
  const steps = 120;
  const full: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    full.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  const arcSteps = 60;
  const arc: Point[] = [];
  for (let i = 0; i <= arcSteps; i++) {
    const t = arcStart + (i / arcSteps) * arcLength;
    arc.push({ x: cx + r * Math.cos(t), y: cy + r * Math.sin(t) });
  }
  const leadingAngle = arcStart + arcLength;
  const marker = { x: cx + r * Math.cos(leadingAngle), y: cy + r * Math.sin(leadingAngle) };
  return { fullPath: `${polylinePath(full)} Z`, arcPath: polylinePath(arc), marker };
}

// Each phase's arc sits at a different position around the ring, roughly
// clockwise from the top (12 o'clock = -PI/2), in cycle order — Beginning
// at the very start of the arc's sweep, Rest completing it. Arc length is
// deliberately short (a quarter-turn or less) relative to the full ring,
// so it always reads as "a moment within the cycle," never as "most of
// the cycle" (which would start to imply duration/dominance — a judgment
// this card format doesn't make).
const CYCLE_PHASES: Record<string, { start: number; length: number }> = {
  cycleBeginning: { start: -Math.PI / 2, length: Math.PI / 5 },
  cycleRising: { start: -Math.PI / 2 + Math.PI / 3, length: Math.PI / 5 },
  cyclePeak: { start: -Math.PI / 2 + (2 * Math.PI) / 3, length: Math.PI / 5 },
  cycleTurning: { start: Math.PI / 2, length: Math.PI / 5 },
  cycleReleasing: { start: Math.PI / 2 + Math.PI / 3, length: Math.PI / 5 },
  cycleRest: { start: Math.PI / 2 + (2 * Math.PI) / 3, length: Math.PI / 5 },
};

export type CardSymbolId =
  | 'openSystem'
  | 'whatYoureCarrying'
  | 'standingWave'
  | 'interference'
  | 'fixedPoint'
  | 'incompleteResonance'
  | 'signalBeneathNoise'
  | 'belowThreshold'
  | 'cycleBeginning'
  | 'cycleRising'
  | 'cyclePeak'
  | 'cycleTurning'
  | 'cycleReleasing'
  | 'cycleRest'
  | 'threshold'
  | 'guardian'
  | 'hiddenRoot'
  | 'seeker'
  | 'theReturn'
  | 'union';

// Every card's geometry splits into exactly one "primary" trace (the
// element the eye should land on first) and a "rest" layer (fainter
// echoes/harmonics/scatter that give the primary its texture). This
// split is consumed by AnimatedCardSymbol.tsx to stagger the draw-in:
// primary strokes itself on first, rest fades in after — see that file
// for why animation lives there and not here. `primaryPath` is the raw
// `d` string so the animated wrapper can compute its length for a
// stroke-dashoffset draw; `rest` is the already-built static JSX for
// everything else, unanimated (opacity-faded as one group instead).
export interface CardSymbolLayers {
  primaryPath: string;
  primaryStrokeWidth: number;
  rest: ReactNode;
  // Optional: a single small marker (e.g. a center/leading dot) that pops
  // in last, after the rest layer has settled — gives cards with a short
  // or absent primary trace (fixedPoint, the cycle-phase ring) a second,
  // clearly visible beat of motion instead of just one flat opacity fade.
  emphasis?: { cx: number; cy: number; r: number };
}

export function buildCardSymbolLayers(id: CardSymbolId, color: string): CardSymbolLayers {
  const cx = 100;
  const cy = 100;

  switch (id) {
    case 'openSystem': {
      const { primary, echoA, echoB, drifters } = openSystemLayers(cx, cy);
      return {
        primaryPath: primary,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={echoA} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.28} />
            <Path d={echoB} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.22} />
            {drifters.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.3} fill={color} fillOpacity={0.35} />
            ))}
          </>
        ),
      };
    }
    case 'whatYoureCarrying': {
      const { outerPath, innerPath, ghostPath, debris } = whatYoureCarryingLayers(cx, cy);
      return {
        primaryPath: innerPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={outerPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.35} />
            <Path d={ghostPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.22} strokeDasharray="1,4" />
            {debris.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.2} fill={color} fillOpacity={0.4} />
            ))}
            <Circle cx={cx} cy={cy} r={3} fill={color} />
          </>
        ),
      };
    }
    case 'standingWave': {
      const { main, overtone1, overtone2 } = standingWaveLayers(cx, cy);
      return {
        primaryPath: main,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={overtone2} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.2} />
            <Path d={overtone1} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.28} />
          </>
        ),
      };
    }
    case 'interference': {
      const { aPath, bPath, sumPath, texturePath } = interferenceLayers(cx, cy);
      return {
        primaryPath: sumPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={aPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.4} />
            <Path d={bPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.4} />
            <Path d={texturePath} fill="none" stroke={color} strokeWidth={0.9} strokeOpacity={0.22} />
          </>
        ),
      };
    }
    case 'fixedPoint': {
      const { outer, inner, trails } = fixedPointLayers(cx, cy);
      // No single dominant path here — the field fades in as `rest`, and
      // the center marker pops in separately as `emphasis` afterward, so
      // "one thing stays still while everything around it moves" has an
      // actual visible second beat instead of appearing all at once.
      return {
        primaryPath: '',
        primaryStrokeWidth: 0,
        rest: (
          <>
            {outer.map((p, i) => (
              <Circle key={`o${i}`} cx={p.x} cy={p.y} r={1.1} fill={color} fillOpacity={0.22} />
            ))}
            {trails.map((t, i) => (
              <Line key={`t${i}`} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={color} strokeWidth={0.8} strokeOpacity={0.25} />
            ))}
            {inner.map((p, i) => (
              <Circle key={`i${i}`} cx={p.x} cy={p.y} r={1.6} fill={color} fillOpacity={0.45} />
            ))}
          </>
        ),
        emphasis: { cx, cy, r: 3.6 },
      };
    }
    case 'incompleteResonance': {
      const { primary, echo } = incompleteResonanceLayers(cx, cy);
      return {
        primaryPath: primary,
        primaryStrokeWidth: 1.8,
        rest: <Path d={echo} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.25} strokeLinecap="round" />,
      };
    }
    case 'signalBeneathNoise': {
      const { noiseAPath, noiseBPath, signalPath, strays } = signalBeneathNoiseLayers(cx, cy);
      return {
        primaryPath: signalPath,
        primaryStrokeWidth: 2.2,
        rest: (
          <>
            <Path d={noiseAPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.32} />
            <Path d={noiseBPath} fill="none" stroke={color} strokeWidth={0.8} strokeOpacity={0.2} />
            {strays.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.2} fill={color} fillOpacity={0.3} />
            ))}
          </>
        ),
      };
    }
    case 'belowThreshold': {
      const { mainPath, priorA, priorB, barrierY } = belowThresholdLayers(cx, cy);
      return {
        primaryPath: mainPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Line
              x1={cx - 100}
              y1={barrierY}
              x2={cx + 100}
              y2={barrierY}
              stroke={color}
              strokeWidth={1.4}
              strokeOpacity={0.5}
              strokeDasharray="2,6"
            />
            <Path d={priorB} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.2} strokeLinecap="round" />
            <Path d={priorA} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.3} strokeLinecap="round" />
          </>
        ),
      };
    }
    case 'threshold': {
      const { wellPath, trajPath, saddle, fallbacks } = thresholdLayers(cx, cy);
      return {
        primaryPath: trajPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={wellPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.28} />
            {fallbacks.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1.1} fill={color} fillOpacity={0.28} />
            ))}
          </>
        ),
        emphasis: { cx: saddle.x, cy: saddle.y, r: 2.6 },
      };
    }
    case 'guardian': {
      const { boundaryPath, contained, escaped } = guardianLayers(cx, cy);
      return {
        primaryPath: boundaryPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            {contained.map((p, i) => (
              <Circle key={`c${i}`} cx={p.x} cy={p.y} r={1.3} fill={color} fillOpacity={0.4} />
            ))}
            {escaped.map((p, i) => (
              <Circle key={`e${i}`} cx={p.x} cy={p.y} r={1.1} fill={color} fillOpacity={0.22} />
            ))}
          </>
        ),
      };
    }
    case 'hiddenRoot': {
      const { surfacePath, hiddenPath } = hiddenRootLayers(cx, cy);
      return {
        primaryPath: surfacePath,
        primaryStrokeWidth: 2,
        rest: <Path d={hiddenPath} fill="none" stroke={color} strokeWidth={1.1} strokeOpacity={0.3} strokeDasharray="1,3" />,
      };
    }
    case 'seeker': {
      const { primary, ghostA, ghostB } = seekerLayers(cx, cy);
      return {
        primaryPath: primary,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={ghostA} fill="none" stroke={color} strokeWidth={0.9} strokeOpacity={0.18} strokeLinecap="round" />
            <Path d={ghostB} fill="none" stroke={color} strokeWidth={0.9} strokeOpacity={0.14} strokeLinecap="round" />
          </>
        ),
      };
    }
    case 'theReturn': {
      const { outPath, backPath, start, end } = returnLayers(cx, cy);
      return {
        primaryPath: backPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={outPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.4} strokeLinecap="round" />
            <Circle cx={start.x} cy={start.y} r={1.6} fill={color} fillOpacity={0.5} />
            <Circle cx={end.x} cy={end.y} r={1.6} fill={color} fillOpacity={0.5} />
          </>
        ),
      };
    }
    case 'union': {
      const { aPath, bPath, lock } = unionLayers(cx, cy);
      return {
        primaryPath: bPath,
        primaryStrokeWidth: 1.8,
        rest: <Path d={aPath} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.38} />,
        emphasis: { cx: lock.x, cy: lock.y, r: 2.2 },
      };
    }
    case 'cycleBeginning':
    case 'cycleRising':
    case 'cyclePeak':
    case 'cycleTurning':
    case 'cycleReleasing':
    case 'cycleRest': {
      const phase = CYCLE_PHASES[id];
      const { fullPath, arcPath, marker } = cycleRing(cx, cy, 78, phase.start, phase.length);
      return {
        primaryPath: arcPath,
        primaryStrokeWidth: 2.4,
        rest: <Path d={fullPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.22} />,
        emphasis: { cx: marker.x, cy: marker.y, r: 3.2 },
      };
    }
    default:
      return { primaryPath: '', primaryStrokeWidth: 0, rest: null };
  }
}

export function CardSymbol({
  id,
  rgb,
  size = 120,
}: {
  id: CardSymbolId;
  rgb: string;
  size?: number;
}) {
  const color = `rgb(${rgb})`;
  const cx = 100;
  const cy = 100;
  const { primaryPath, primaryStrokeWidth, rest, emphasis } = buildCardSymbolLayers(id, color);

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`card-core-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.18} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={92} fill={`url(#card-core-${id})`} />
      {rest}
      {primaryStrokeWidth > 0 && primaryPath && (
        <Path d={primaryPath} fill="none" stroke={color} strokeWidth={primaryStrokeWidth} strokeLinecap="round" />
      )}
      {emphasis && <Circle cx={emphasis.cx} cy={emphasis.cy} r={emphasis.r} fill={color} />}
    </Svg>
  );
}
