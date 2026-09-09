import Svg, { Defs, RadialGradient, Stop, Circle, Path, Line } from 'react-native-svg';
import {
  Point,
  polylinePath,
  seededRng,
  CardSymbolLayers,
  incompleteResonanceLayers,
  thresholdLayers,
} from '../depths/CardSymbol';

// JourneySymbol — a third symbol family alongside CardSymbol.tsx (Cards'
// "draw a symbol" deck) and NatureSymbol.tsx (level pages), reusing the
// exact same construction discipline and shared primitives (Point,
// polylinePath, seededRng, CardSymbolLayers — see CardSymbol.tsx's own
// header comment for why this split exists). One symbol per Journey,
// added 2026-09-09 at the user's own request, to replace pure text on
// each Journeys-catalog card the same way CardSymbol replaced illustrated
// tarot-style imagery on Cards.
//
// Same hard rule as CardSymbol (see docs/cards-concept.md, "Physics/math
// vocabulary" — "the shape can't pre-load a story"): every symbol here is
// a physics/math FORM (an orbit, a wave, a branching trajectory, a
// boundary), never a literal illustration of the question (no padlock for
// Control, no door for The Threshold, no scale for Enough) — a drawn
// object carries cultural narrative before the question is even read,
// which competes with the person's own answer for what supplies meaning.
// Each form here is chosen to structurally MATCH the real psychological
// mechanism docs/journeys-concept.md documents for that Journey (e.g.
// Control's orbiting points pulled toward a center that keeps drifting —
// the actual shape of grasping at something that won't hold still), the
// same "physics concept that IS the archetype, not an illustration of it"
// principle CardSymbol.tsx's own archetype cards use.
//
// Two Journeys reuse an existing CardSymbol form outright rather than a
// new one, because the underlying psychological mechanism is genuinely
// the same concept, not just adjacent: The Threshold (approach-avoidance)
// is CardSymbol's own 'threshold' double-well/saddle-point form; The Loop
// (repetition compulsion) is CardSymbol's own 'incompleteResonance' near-
// closed loop. Rendered here via JourneySymbol so callers use one
// component regardless of which family backs a given id — see
// buildJourneySymbolLayers' own delegation for those two ids.
export type JourneySymbolId =
  | 'control'
  | 'theChoice'
  | 'theLoop'
  | 'whoseVoice'
  | 'theRoadNotTaken'
  | 'lettingGo'
  | 'theMirror'
  | 'theUnsaid'
  | 'becoming'
  | 'theThreshold'
  | 'possibleSelves'
  | 'enough';

// Control — "what am I really trying to control?" A center that keeps
// drifting (never quite where it last was), with several points held in
// orbit around it, their own paths distorted as they continuously
// re-correct toward a target that won't hold still — grasping at
// something, rather than resting near it.
function controlLayers(cx: number, cy: number) {
  const driftPath: Point[] = [];
  const steps = 140;
  const driftR = 14;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI * 1.3;
    driftPath.push({ x: cx + driftR * Math.cos(t) * 0.7, y: cy + driftR * Math.sin(t * 1.4) });
  }
  const centerTrace = polylinePath(driftPath);
  const rng = seededRng(83);
  const orbiters: string[] = [];
  for (let o = 0; o < 3; o++) {
    const baseR = 46 + o * 16;
    const phase = rng() * Math.PI * 2;
    const wobble = 6 + rng() * 4;
    const pts: Point[] = [];
    for (let i = 0; i <= 90; i++) {
      const t = (i / 90) * 2 * Math.PI;
      const driftT = t * 1.3;
      const driftCx = cx + driftR * Math.cos(driftT) * 0.7;
      const driftCy = cy + driftR * Math.sin(driftT * 1.4);
      const r = baseR + wobble * Math.sin(t * 3 + phase);
      pts.push({ x: driftCx + r * Math.cos(t + phase), y: driftCy + r * Math.sin(t + phase) * 0.85 });
    }
    orbiters.push(polylinePath(pts));
  }
  return { centerTrace, orbiters };
}

// The Choice — "what do I actually want?" One path splitting into two at
// a single fork point: one branch bold and continuing (what's actually
// chosen, moment to moment), the other faint and receding (the option
// being passed over) — not two equal paths, since a choice is exactly the
// asymmetry between what's lived and what's foregone.
function theChoiceLayers(cx: number, cy: number) {
  const forkX = cx - 30;
  const trunk: Point[] = [];
  for (let i = 0; i <= 40; i++) {
    const t = i / 40;
    trunk.push({ x: cx - 90 + t * 60, y: cy + 4 * Math.sin(t * Math.PI) });
  }
  const chosen: Point[] = [];
  for (let i = 0; i <= 70; i++) {
    const t = i / 70;
    chosen.push({ x: forkX + t * 110, y: cy - t * 46 - 6 * Math.sin(t * Math.PI * 1.4) });
  }
  const foregone: Point[] = [];
  for (let i = 0; i <= 70; i++) {
    const t = i / 70;
    foregone.push({ x: forkX + t * 108, y: cy + t * 40 + 8 * Math.sin(t * Math.PI * 1.2) });
  }
  return {
    trunkPath: polylinePath(trunk),
    chosenPath: polylinePath(chosen),
    foregonePath: polylinePath(foregone),
    fork: { x: forkX, y: cy },
  };
}

// Whose Voice? — several distinct traces at the left edge (different
// frequencies/phases, standing for different voices), converging onto one
// shared trace by the right edge — same phase-locking construction as
// CardSymbol's own 'union', but with three sources instead of two
// (several external voices, not one relationship), and framed as a
// question of ORIGIN — which of the converged voices is actually theirs
// is left open, since the trace by the end genuinely is just one line.
function whoseVoiceLayers(cx: number, cy: number) {
  const width = 200;
  const steps = 160;
  const voices: Point[][] = [[], [], []];
  const freqs = [3.2, 4.6, 5.8];
  const phases = [0, 1.3, 2.6];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    const convergeFreq = 4.4;
    voices.forEach((v, vi) => {
      const freq = freqs[vi] + (convergeFreq - freqs[vi]) * t;
      const phase = phases[vi] * (1 - t);
      const amp = 20 * (1 - 0.3 * t);
      v.push({ x, y: cy - 20 + amp * Math.sin(t * freq * Math.PI + phase) });
    });
  }
  return voices.map((v) => polylinePath(v));
}

// The Road Not Taken — the same fork construction as The Choice, but
// inverted: the ghost/foregone branch is drawn LONGER and more
// developed than the lived one (imagination keeps extending an unlived
// path further than the real one has actually gone), with a faint dotted
// continuation past the frame implying it never resolves.
function theRoadNotTakenLayers(cx: number, cy: number) {
  const forkX = cx - 20;
  const lived: Point[] = [];
  for (let i = 0; i <= 50; i++) {
    const t = i / 50;
    lived.push({ x: forkX + t * 60, y: cy + 10 + 6 * Math.sin(t * Math.PI) });
  }
  const imagined: Point[] = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90;
    imagined.push({ x: forkX + t * 118, y: cy - 10 - t * 52 + 10 * Math.sin(t * Math.PI * 1.8) });
  }
  const rng = seededRng(59);
  const driftDots: Point[] = [];
  for (let i = 0; i < 6; i++) {
    const t = 0.78 + rng() * 0.2;
    driftDots.push({
      x: forkX + t * 118 + rng() * 10,
      y: cy - 10 - t * 52 + 10 * Math.sin(t * Math.PI * 1.8) + (rng() - 0.5) * 14,
    });
  }
  return { livedPath: polylinePath(lived), imaginedPath: polylinePath(imagined), driftDots, fork: { x: forkX, y: cy + 10 } };
}

// Letting Go — an object drifting steadily away from a fixed point, still
// connected by a single thread that stays taut rather than slack the
// whole distance — what's "held onto" isn't the object itself (which is
// visibly, continuously leaving) but the thread's own tension.
function lettingGoLayers(cx: number, cy: number) {
  const anchor = { x: cx - 50, y: cy + 40 };
  const steps = 60;
  const drift: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    drift.push({ x: anchor.x + t * 130, y: anchor.y - t * 90 - 8 * Math.sin(t * Math.PI) });
  }
  const objectPos = drift[drift.length - 1];
  const threadPath = polylinePath([anchor, objectPos]);
  const driftTrailPath = polylinePath(drift);
  return { anchor, objectPos, threadPath, driftTrailPath };
}

// The Mirror — one oscillator's trace, and a second trace nearby whose
// amplitude and phase visibly track the first's without ever fully
// matching it — the second reacting TO the first (transference: someone
// else's motion setting off a response in you that's disproportionate to
// its own, small driving cause), not two independent equal waves.
function theMirrorLayers(cx: number, cy: number) {
  const width = 200;
  const steps = 180;
  const driver: Point[] = [];
  const response: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    const driverY = 10 * Math.sin(t * 4 * Math.PI);
    driver.push({ x, y: cy - 26 + driverY });
    // Response amplitude is amplified relative to the driver (a small
    // cause, an outsized reaction) and phase-lagged, the two hallmarks of
    // a driven-resonance response rather than an independent signal.
    const lag = 0.3;
    const responseY = 26 * Math.sin((t - lag) * 4 * Math.PI);
    response.push({ x, y: cy + 30 + responseY });
  }
  return { driverPath: polylinePath(driver), responsePath: polylinePath(response) };
}

// The Unsaid — a wave building amplitude steadily, then hitting a hard
// clip well short of its own natural peak (a flat ceiling cutting off
// exactly where the curve was still rising) — pressure with nowhere left
// to go, rather than a wave that simply settles on its own.
function theUnsaidLayers(cx: number, cy: number) {
  const width = 190;
  const steps = 160;
  const ceilingY = cy - 44;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    const naturalY = cy - 18 * Math.sin(t * 3.4 * Math.PI) * (0.4 + t * 0.9);
    points.push({ x, y: Math.max(naturalY, ceilingY) });
  }
  const clipStartIndex = points.findIndex((p) => p.y <= ceilingY + 0.5);
  return {
    tracePath: polylinePath(points),
    ceilingY,
    clipRange:
      clipStartIndex >= 0
        ? { x1: points[clipStartIndex].x, x2: cx - width / 2 + width }
        : null,
  };
}

// Becoming — a single open trajectory that keeps extending past the
// frame's own right edge, direction visibly changing (curving, not
// straight) but never arriving anywhere fixed — trajectory without a
// destination, unlike a closed orbit or a path that resolves to a point.
function becomingLayers(cx: number, cy: number) {
  const steps = 140;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - 92 + t * 210;
    const y = cy + 40 - t * 70 + 14 * Math.sin(t * 2.2 * Math.PI);
    points.push({ x, y });
  }
  const rng = seededRng(97);
  const echoes: Point[] = [];
  for (let i = 0; i < 8; i++) {
    const t = rng();
    const idx = Math.min(steps, Math.round(t * steps));
    const p = points[idx];
    echoes.push({ x: p.x + (rng() - 0.5) * 8, y: p.y + (rng() - 0.5) * 8 });
  }
  return { tracePath: polylinePath(points), echoes, start: points[0] };
}

// Possible Selves — one point branching into several distinct forward
// paths (not two, like The Choice/The Road Not Taken — several genuinely
// live options), none drawn heavier than the others, since the whole
// point is that no single branch yet reads as "the" future.
function possibleSelvesLayers(cx: number, cy: number) {
  const originX = cx - 70;
  const angles = [-0.62, -0.22, 0.14, 0.5];
  const branches = angles.map((angle) => {
    const points: Point[] = [];
    const steps = 70;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const dist = t * 140;
      const curve = Math.sin(t * Math.PI * 0.6) * 10;
      points.push({
        x: originX + dist * Math.cos(angle),
        y: cy + dist * Math.sin(angle) + curve,
      });
    }
    return polylinePath(points);
  });
  return { branches, origin: { x: originX, y: cy } };
}

// Enough — one trace that keeps climbing without ever settling (each
// step smaller than the last, but never reaching zero — a hedonic
// treadmill, always a little further to go), drawn alongside a flat
// plateau line it visibly approaches but never actually touches.
function enoughLayers(cx: number, cy: number) {
  const width = 190;
  const steps = 140;
  const plateauY = cy - 50;
  const points: Point[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = cx - width / 2 + t * width;
    // Approaches plateauY asymptotically — 1 - e^-kt never truly reaches 1.
    const progress = 1 - Math.exp(-3.2 * t);
    const y = cy + 44 - progress * 94;
    points.push({ x, y });
  }
  return { tracePath: polylinePath(points), plateauY, width };
}

export function buildJourneySymbolLayers(id: JourneySymbolId, color: string): CardSymbolLayers {
  const cx = 100;
  const cy = 100;

  switch (id) {
    case 'control': {
      const { centerTrace, orbiters } = controlLayers(cx, cy);
      return {
        primaryPath: orbiters[0],
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={orbiters[1]} fill="none" stroke={color} strokeWidth={1.2} strokeOpacity={0.32} />
            <Path d={orbiters[2]} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.2} />
            <Path d={centerTrace} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} strokeDasharray="1,3" />
          </>
        ),
      };
    }
    case 'theChoice': {
      const { trunkPath, chosenPath, foregonePath } = theChoiceLayers(cx, cy);
      return {
        primaryPath: chosenPath,
        primaryStrokeWidth: 2.2,
        rest: (
          <>
            <Path d={trunkPath} fill="none" stroke={color} strokeWidth={1.4} strokeOpacity={0.4} strokeLinecap="round" />
            <Path d={foregonePath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.2} strokeLinecap="round" />
          </>
        ),
      };
    }
    case 'theLoop': {
      // Reuses CardSymbol's own 'incompleteResonance' — a near-closed loop
      // that returns close to, but not exactly onto, its own start each
      // revolution, is the same structural picture as repetition
      // compulsion: recognizably returning, never quite resolving.
      const { primary, echo } = incompleteResonanceLayers(cx, cy);
      return {
        primaryPath: primary,
        primaryStrokeWidth: 1.8,
        rest: <Path d={echo} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.25} strokeLinecap="round" />,
      };
    }
    case 'whoseVoice': {
      const [a, b, c] = whoseVoiceLayers(cx, cy);
      return {
        primaryPath: c,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={a} fill="none" stroke={color} strokeWidth={1.1} strokeOpacity={0.3} />
            <Path d={b} fill="none" stroke={color} strokeWidth={1.1} strokeOpacity={0.3} />
          </>
        ),
      };
    }
    case 'theRoadNotTaken': {
      const { livedPath, imaginedPath, driftDots } = theRoadNotTakenLayers(cx, cy);
      return {
        primaryPath: imaginedPath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            <Path d={livedPath} fill="none" stroke={color} strokeWidth={1.6} strokeOpacity={0.42} strokeLinecap="round" />
            {driftDots.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1} fill={color} fillOpacity={0.22} />
            ))}
          </>
        ),
      };
    }
    case 'lettingGo': {
      const { anchor, objectPos, threadPath, driftTrailPath } = lettingGoLayers(cx, cy);
      return {
        primaryPath: driftTrailPath,
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={threadPath} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} strokeDasharray="1,3" />
            <Circle cx={anchor.x} cy={anchor.y} r={2} fill={color} fillOpacity={0.5} />
          </>
        ),
        emphasis: { cx: objectPos.x, cy: objectPos.y, r: 2.6 },
      };
    }
    case 'theMirror': {
      const { driverPath, responsePath } = theMirrorLayers(cx, cy);
      return {
        primaryPath: responsePath,
        primaryStrokeWidth: 2,
        rest: <Path d={driverPath} fill="none" stroke={color} strokeWidth={1.3} strokeOpacity={0.4} />,
      };
    }
    case 'theUnsaid': {
      const { tracePath, ceilingY, clipRange } = theUnsaidLayers(cx, cy);
      return {
        primaryPath: tracePath,
        primaryStrokeWidth: 2,
        rest: clipRange ? (
          <Line
            x1={clipRange.x1}
            y1={ceilingY}
            x2={clipRange.x2}
            y2={ceilingY}
            stroke={color}
            strokeWidth={1.2}
            strokeOpacity={0.42}
            strokeDasharray="2,5"
          />
        ) : null,
      };
    }
    case 'becoming': {
      const { tracePath, echoes, start } = becomingLayers(cx, cy);
      return {
        primaryPath: tracePath,
        primaryStrokeWidth: 2,
        rest: (
          <>
            {echoes.map((p, i) => (
              <Circle key={i} cx={p.x} cy={p.y} r={1} fill={color} fillOpacity={0.2} />
            ))}
          </>
        ),
        emphasis: { cx: start.x, cy: start.y, r: 1.8 },
      };
    }
    case 'theThreshold': {
      // Reuses CardSymbol's own 'threshold' double-well — approach-
      // avoidance IS a saddle-point trajectory, the same underlying
      // dynamical picture, not a coincidental visual similarity.
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
    case 'possibleSelves': {
      const { branches } = possibleSelvesLayers(cx, cy);
      return {
        primaryPath: branches[1],
        primaryStrokeWidth: 1.8,
        rest: (
          <>
            <Path d={branches[0]} fill="none" stroke={color} strokeWidth={1.3} strokeOpacity={0.32} />
            <Path d={branches[2]} fill="none" stroke={color} strokeWidth={1.3} strokeOpacity={0.32} />
            <Path d={branches[3]} fill="none" stroke={color} strokeWidth={1.3} strokeOpacity={0.32} />
          </>
        ),
      };
    }
    case 'enough': {
      const { tracePath, plateauY, width } = enoughLayers(cx, cy);
      return {
        primaryPath: tracePath,
        primaryStrokeWidth: 2,
        rest: (
          <Line
            x1={cx - width / 2}
            y1={plateauY}
            x2={cx + width / 2}
            y2={plateauY}
            stroke={color}
            strokeWidth={1}
            strokeOpacity={0.3}
            strokeDasharray="2,6"
          />
        ),
      };
    }
    default:
      return { primaryPath: '', primaryStrokeWidth: 0, rest: null };
  }
}

export function JourneySymbol({
  id,
  rgb,
  size = 56,
}: {
  id: JourneySymbolId;
  rgb: string;
  size?: number;
}) {
  const color = `rgb(${rgb})`;
  const cx = 100;
  const cy = 100;
  const { primaryPath, primaryStrokeWidth, rest, emphasis } = buildJourneySymbolLayers(id, color);

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`journey-core-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.16} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={92} fill={`url(#journey-core-${id})`} />
      {rest}
      {primaryStrokeWidth > 0 && primaryPath && (
        <Path d={primaryPath} fill="none" stroke={color} strokeWidth={primaryStrokeWidth} strokeLinecap="round" />
      )}
      {emphasis && <Circle cx={emphasis.cx} cy={emphasis.cy} r={emphasis.r} fill={color} />}
    </Svg>
  );
}
