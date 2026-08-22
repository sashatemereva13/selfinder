import { useMemo, useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import Svg, { Defs, Filter, FeGaussianBlur, RadialGradient, Stop, G, Path, Circle } from 'react-native-svg';
import { ReadingLogEntry } from '../store/measureStore';
import { useLevelColors } from '../content/measureConfig';
import { buildKaleidoscopeSegments, seedFromLog, KaleidoscopeSegment } from '../utils/kaleidoscopeData';

// A generated visualization, unique per person, built entirely from their
// own real reading-history colors — "a kaleidoscope of their past self."
// Confirmed via scratchpad mockup (two rounds — a first flat-ring-segment
// pass read as "a pie chart wearing a kaleidoscope costume" and was
// rejected; organic overlapping petal/tendril shapes were approved
// directly). This does NOT need to be legible or study-able — the real
// data already lives in Your Arc's facts section and sparkline elsewhere
// on the page. Its only job is to feel unmistakably like this person's
// own history, which licenses real artistic latitude in HOW colors are
// arranged (organic, layered, seeded-random shapes) — but not in WHICH
// colors appear: every color here comes from useLevelColors(), the same
// real per-reading color map used everywhere else in the app. No invented
// hues, no color-to-color gradient blending (the one gradient used, the
// background glow, is opacity-only on a single hue — same register as
// AmbientGlow.tsx, PhilosopherObject.tsx's core glow, AuraFigure.tsx's
// chest glow — never a new technique).
//
// Same "gather, condense, become" motion language as the rest of the app
// (SOFT_EASE, the one standing easing curve for entrance motion) — one
// clean scale/opacity beat on mount, not a slide or pop.
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const ENTRANCE_DURATION_MS = 900;

const MIRROR_COUNT = 8;
const WEDGE_ANGLE = 360 / MIRROR_COUNT;

// Simple deterministic RNG (mulberry32-style) seeded from the reading
// history itself (see kaleidoscopeData.ts's seedFromLog) — the same
// history always produces the same kaleidoscope; two people's pieces
// differ because their readings differ, not because of an unrelated
// random draw. Never used for anything that changes WHICH colors appear,
// only WHERE/how the real colors are shaped and layered.
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Point {
  x: number;
  y: number;
}

function polar(r: number, angleDeg: number): Point {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

// One irregular petal — a closed loop through jittered control points
// along a "narrow near center, wide in the middle, tapered toward the
// rim" envelope. Deliberately not a geometric primitive (circle/ellipse/
// clean arc) — this is what reads as an organic shard catching light
// rather than a pie-chart wedge.
function petalPath(baseAngle: number, angleSpread: number, rInner: number, rOuter: number, rand: () => number): string {
  const pointCount = 5 + Math.floor(rand() * 3);
  const front: Point[] = [];
  for (let i = 0; i < pointCount; i++) {
    const t = i / pointCount;
    const widthEnvelope = Math.sin(t * Math.PI);
    const angle = baseAngle + (t - 0.5) * angleSpread * (0.4 + widthEnvelope * 0.6);
    const jitterA = (rand() - 0.5) * angleSpread * 0.15;
    const radius = rInner + (rOuter - rInner) * t + (rand() - 0.5) * (rOuter - rInner) * 0.08;
    front.push(polar(Math.max(rInner * 0.3, radius), angle + jitterA));
  }
  const back: Point[] = [];
  for (let i = pointCount - 1; i >= 0; i--) {
    const t = i / pointCount;
    const widthEnvelope = Math.sin(t * Math.PI);
    const angle = baseAngle - (t - 0.5) * angleSpread * (0.4 + widthEnvelope * 0.6) - angleSpread * widthEnvelope * 0.5;
    const radius = rInner + (rOuter - rInner) * t;
    back.push(polar(Math.max(rInner * 0.3, radius), angle));
  }
  const all = [...front, ...back];
  let d = `M ${all[0].x.toFixed(2)},${all[0].y.toFixed(2)} `;
  for (let i = 1; i < all.length; i++) {
    const p = all[i];
    const prev = all[i - 1];
    const midX = (prev.x + p.x) / 2;
    const midY = (prev.y + p.y) / 2;
    d += `Q ${prev.x.toFixed(2)},${prev.y.toFixed(2)} ${midX.toFixed(2)},${midY.toFixed(2)} `;
  }
  d += 'Z';
  return d;
}

// A thin wobbly filament — the wispy trailing lines visible in real
// kaleidoscope imagery, stroked not filled.
function tendrilPath(baseAngle: number, rInner: number, rOuter: number, rand: () => number): string {
  const steps = 6;
  let d = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = rInner + (rOuter - rInner) * t;
    const wobble = Math.sin(t * Math.PI * (1.5 + rand())) * (rOuter - rInner) * 0.06;
    const a = baseAngle + wobble * 0.3;
    const p = polar(r, a);
    d += i === 0 ? `M ${p.x.toFixed(2)},${p.y.toFixed(2)} ` : `L ${p.x.toFixed(2)},${p.y.toFixed(2)} `;
  }
  return d;
}

interface Shape {
  kind: 'petal' | 'tendril';
  d: string;
  color: string; // level slug
  opacity: number;
}

// Builds the ONE source wedge's shapes from the real data segments — 2-3
// overlapping petals per segment (fewer/tighter for recent 'detail'
// segments near the rim, slightly more for grouped 'band' segments since
// they represent more underlying readings), plus an occasional tendril.
// Every shape's color is exactly one segment's own real level color —
// layering/density is what builds up richer color, never a blended hue.
function buildWedgeShapes(segments: KaleidoscopeSegment[], innerR: number, outerR: number, rand: () => number): Shape[] {
  const shapes: Shape[] = [];
  const n = segments.length;
  if (n === 0) return shapes;
  const ringThickness = (outerR - innerR) / n;

  segments.forEach((seg, i) => {
    const rIn = innerR + ringThickness * i;
    const rOut = Math.min(outerR, innerR + ringThickness * (i + 1) * (seg.kind === 'detail' ? 1.15 : 1.35));
    const petalCount = seg.kind === 'detail' ? 2 : 3;
    for (let p = 0; p < petalCount; p++) {
      const baseAngle = (rand() - 0.5) * WEDGE_ANGLE * 0.7;
      const spread = WEDGE_ANGLE * (0.35 + rand() * 0.35);
      shapes.push({
        kind: 'petal',
        d: petalPath(baseAngle, spread, rIn, rOut, rand),
        color: seg.color,
        opacity: 0.16 + rand() * 0.22,
      });
    }
    if (rand() > 0.3) {
      const a = (rand() - 0.5) * WEDGE_ANGLE * 0.8;
      shapes.push({
        kind: 'tendril',
        d: tendrilPath(a, rIn, Math.min(outerR, rOut * 1.05), rand),
        color: seg.color,
        opacity: 0.35 + rand() * 0.25,
      });
    }
  });
  return shapes;
}

export function ArcKaleidoscope({
  readingLog,
  size,
}: {
  readingLog: ReadingLogEntry[];
  size: number;
}) {
  const levelColors = useLevelColors();

  // Computed unconditionally (never skipped by the readingLog.length === 0
  // guard below) so every hook in this component runs on every render,
  // regardless of props — the guard only affects what's RETURNED, never
  // which hooks are called, per React's rules of hooks.
  const { shapes, outerR } = useMemo(() => {
    const segments = buildKaleidoscopeSegments(readingLog);
    const seed = seedFromLog(readingLog);
    const rand = makeRng(seed);
    const inner = size * 0.03;
    const outer = size * 0.49;
    return { shapes: buildWedgeShapes(segments, inner, outer, rand), outerR: outer };
  }, [readingLog, size]);

  const cx = size / 2;
  const cy = size / 2;
  const filterId = 'arc-kaleidoscope-soften';
  const glowId = 'arc-kaleidoscope-glow';

  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0);
  // "A living record" (the Cover page's own title, directly under this
  // image) reads as an inert picture without some sign of being alive —
  // reusing AmbientGlow.tsx's own breathing technique (a slow sine-eased
  // opacity/scale cycle, withRepeat + Easing.inOut(Easing.sin)) rather
  // than inventing new motion language, matching aesthetic.md's "a
  // breathing ambient pulse is fine on the aura figure specifically (it's
  // alive)" — the kaleidoscope is this page's own version of that same
  // idea. Deliberately animates the already-rendered Animated.View
  // (transform/opacity on a composited layer), never the SVG shapes
  // themselves — the per-shape blur filter fix just above this exists
  // specifically because re-rendering those shapes is expensive; a
  // transform/opacity animation on the outer view costs nothing close to
  // that, so breathing doesn't reintroduce the hang that fix removed.
  const breathe = useSharedValue(0);
  useEffect(() => {
    scale.value = withTiming(1, { duration: ENTRANCE_DURATION_MS, easing: SOFT_EASE });
    opacity.value = withTiming(1, { duration: ENTRANCE_DURATION_MS, easing: SOFT_EASE }, (finished) => {
      // Starts only once the entrance itself has settled — a breathing
      // cycle overlapping the "gather, condense, become" entrance beat
      // would read as two competing motions rather than one clean
      // arrival followed by a quiet, ongoing "it's alive" signal.
      if (finished) {
        breathe.value = withRepeat(withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }), -1, true);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({
    // Barely perceptible on purpose — same restraint AmbientGlow's own
    // comment calls for ("if you can describe it without squinting, it's
    // too strong"): 0.94-1 scale, 0.9-1 opacity, not a pronounced pulse.
    opacity: opacity.value * (0.9 + breathe.value * 0.1),
    transform: [{ scale: scale.value * (0.94 + breathe.value * 0.06) }],
  }));

  if (readingLog.length === 0) return null;

  return (
    <Animated.View style={[{ width: size, height: size }, entranceStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="rgb(239,227,207)" stopOpacity={0.14} />
            <Stop offset="55%" stopColor="rgb(239,227,207)" stopOpacity={0.04} />
            <Stop offset="100%" stopColor="rgb(239,227,207)" stopOpacity={0} />
          </RadialGradient>
          <Filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
            <FeGaussianBlur in="SourceGraphic" stdDeviation={0.6} />
          </Filter>
        </Defs>

        <Circle cx={cx} cy={cy} r={outerR * 1.1} fill={`url(#${glowId})`} />

        {/* The blur filter is applied ONCE per mirrored wedge (on the <G>
            itself), not per shape — confirmed via on-device log capture
            (2026-08-22) that the previous per-Path filter was the actual
            cause of a ~9.8s main-thread hang on Your Arc's first open:
            ~35-50 shapes (buildWedgeShapes, up to 17 segments' worth) ×
            MIRROR_COUNT (8) each carrying their own `filter` prop meant
            iOS's Core Image pipeline ran up to ~400 separate offscreen
            Gaussian-blur passes (one per filtered element — react-native-
            svg/Core Image don't batch per-element SVG filters), visible
            in syslog as hundreds of repeated "image to use as an input
            for the effect" CoreImage filter-bundle lookups spanning the
            entire hang window. Filtering the <G> instead blurs the whole
            composited wedge in one pass — visually equivalent (the blur
            still softens every shape in it, just as a group rather than
            individually) at 8 passes total instead of ~400. */}
        {Array.from({ length: MIRROR_COUNT }).map((_, i) => {
          const rotation = i * WEDGE_ANGLE;
          const mirrored = i % 2 === 1;
          return (
            <G
              key={i}
              transform={`translate(${cx} ${cy}) rotate(${rotation}) ${mirrored ? 'scale(-1,1)' : ''}`}
              filter={`url(#${filterId})`}
            >
              {shapes.map((s, si) =>
                s.kind === 'tendril' ? (
                  <Path
                    key={si}
                    d={s.d}
                    fill="none"
                    stroke={`rgb(${levelColors[s.color]})`}
                    strokeOpacity={s.opacity + 0.15}
                    strokeWidth={0.9}
                    strokeLinecap="round"
                  />
                ) : (
                  <Path
                    key={si}
                    d={s.d}
                    fill={`rgb(${levelColors[s.color]})`}
                    fillOpacity={s.opacity}
                  />
                )
              )}
            </G>
          );
        })}
      </Svg>
    </Animated.View>
  );
}
