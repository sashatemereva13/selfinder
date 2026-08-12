import { useMemo, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { estimatePathLength } from './AnimatedCardSymbol';
import { useThemeColors } from '../theme/useThemeColors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing } from '../theme/spacing';

// Depths' journey, drawn as a golden-ratio spiral RISING as a cone above
// the aura figure — a forced 2D-perspective illusion (each successive
// winding a smaller, flatter ellipse than the one below, per Dürer's own
// 1525 conical-spiral construction and a modern conical-helix parametric
// plot) rather than a flat disc. The cone's wide base sits at/around the
// aura; its narrow apex is Measure, the entry point of a session — the
// walk descends from there through Spill, Talk about it, Cards, Your
// Arc, Levels, Tune In, and finally dissolves into the aura's own center
// at Breathing. This is deliberate, not just a layout choice: it's
// RULES.md's own deepest product rule ("the answers are already inside
// the person — Selfinder never supplies them") expressed spatially — the
// walk ends where it started, inside the person, not in the app. Same
// construction discipline as VibrationSpectrum.tsx's ring (one pure
// geometry function, exported dot-position helper so nothing drifts out
// of sync with the drawing) and AuraField.tsx (a `buildXGeometry(size)`
// factory returning everything a caller needs, sized once, reused by
// both the static and animated render).
const PHI = 1.6180339887498948;

// Fixed angular slots, index 0..7 — always reserved, regardless of how
// many are actually present in a given render. This is deliberate: if
// slots were spaced evenly across only the currently-present points, the
// very first time a capability unlocks (Spill discovered, a first
// reading completes, a second reading unlocks Your Arc) every OTHER
// point would silently reflow to a new angle — motion with no meaning
// attached to the thing that actually changed. Fixed slots mean a new
// point simply appears at its own already-reserved angle; a returning
// user's spatial memory of "Tune In sits here" never gets disturbed by
// something unrelated unlocking.
export type SpiralSlotKey =
  | 'measure'
  | 'spill'
  | 'talkAboutIt'
  | 'cards'
  | 'yourArc'
  | 'levels'
  | 'tunein'
  | 'breathing';

const SLOT_ORDER: SpiralSlotKey[] = [
  'measure',
  'spill',
  'talkAboutIt',
  'cards',
  'yourArc',
  'levels',
  'tunein',
  'breathing',
];
const TOTAL_SLOTS = SLOT_ORDER.length;

// Only these three participate in the "today's walk" prefix trace — see
// depths/index.tsx's own resolution of this: measure is the permanent,
// always-full-brightness anchor; spill/talkAboutIt/cards/yourArc are
// either opt-in or ephemeral/reading-dependent session actions where
// "already visited today" isn't an honest, stable signal the way it is
// for a returning destination. Order matters — this is the sequence the
// solid trace walks as a strict prefix, stopping at the first tool not
// visited today.
export const PREFIX_WALK_KEYS: SpiralSlotKey[] = ['levels', 'tunein', 'breathing'];

const THETA_START = -Math.PI / 2; // 12 o'clock, at the apex
// Just under 3/4 turn across the whole climb — tight enough to read as
// one continuous pull, wide enough that early windings don't crowd.
const THETA_SWEEP_TOTAL = Math.PI * 1.5;
// b tuned so the ellipse-scale shrinks by φ every quarter turn (π/2
// radians) — the same proportion behind a nautilus shell, kept as the
// decay rate for ellipseScaleForH below.
const B = Math.log(PHI) / (Math.PI / 2);

// h=0 is the base (bottom, at/around the aura, slot 7/Breathing); h=1 is
// the apex (top, slot 0/Measure) — see this file's header comment for
// why this direction, not the reverse. Linear, same as thetaForH below,
// so both axes stay in lockstep — just running opposite to slotIndex.
function hForSlot(slotIndex: number): number {
  'worklet';
  return 1 - slotIndex / (TOTAL_SLOTS - 1);
}

// 'worklet'-annotated: called both from plain JS (building the static
// path/lookup table) and from inside travelMarkerStyle's useAnimatedStyle
// worklet on the UI thread — same dual-context precedent as
// ConsciousnessWheel.tsx's angleFor/polarToXY.
function thetaForH(h: number): number {
  'worklet';
  return THETA_START + h * THETA_SWEEP_TOTAL;
}

// Cubic ease, zero derivative at both t=0 and t=1 — the discipline that
// fixed a real, measured kink in this spiral's earlier flat taper-to-
// center curve (three different radius formulas meeting at hard
// boundaries with matching value but mismatched slope). Reused here for
// the new height axis: every curve below built from smoothstep() is a
// single continuous family, never spliced with a second formula at some
// h threshold.
function smoothstep(t: number): number {
  'worklet';
  return t * t * (3 - 2 * t);
}

// How far the widest, ground-level ellipse's rx/ry shrink by height h —
// ONE continuous formula for the whole 0..1 range (see smoothstep's own
// comment for why that matters). Feeds both rx and ry via this shared
// scale, plus ry gets an extra flatten term below so upper windings read
// as flatter, not just smaller — matching Dürer's own construction.
const APEX_SCALE = 0.22; // apex ellipse reads as small but not a vanishing dot
const SCALE_K = -Math.log(APEX_SCALE);
function ellipseScaleForH(h: number): number {
  'worklet';
  return Math.exp(-SCALE_K * smoothstep(h));
}

const FLATTEN_FACTOR = 0.45;
function rxScaleForH(h: number): number {
  'worklet';
  return ellipseScaleForH(h);
}
function ryScaleForH(h: number): number {
  'worklet';
  return ellipseScaleForH(h) * (1 - FLATTEN_FACTOR * smoothstep(h));
}

// The aura figure is tall and narrow (per AuraFigure.tsx's own BODY
// drawing space, ~200×380), not round — a single scalar minimum radius
// let the spiral's innermost (base) winding clip through the head and
// legs while clearing the shoulders fine. This returns the minimum safe
// distance from the base ellipse's own center at a given angle against
// an ELLIPSE matching the aura's real aspect ratio, so the spiral
// genuinely goes around the body's actual silhouette instead of a
// circle that's wrong in two directions at once (too tight sideways,
// too loose vertically). Only matters near h≈0 — higher windings are
// already well clear by construction (smaller ellipses higher up).
function ellipticalClearance(theta: number, clearanceX: number, clearanceY: number): number {
  'worklet';
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  // Standard polar-form ellipse radius: r(θ) = 1 / sqrt((cosθ/a)² + (sinθ/b)²)
  const denom = Math.sqrt((cos * cos) / (clearanceX * clearanceX) + (sin * sin) / (clearanceY * clearanceY));
  return denom > 0 ? 1 / denom : clearanceX;
}

interface Point {
  x: number;
  y: number;
}

// Foreshortening ratio for the elliptical offset around each winding's
// own center — kept less than 1 so a point's vertical displacement from
// its ring's center reads as sitting ON a foreshortened ellipse, not a
// full circle, consistent with the ground ellipse's own aspect ratio.
const FORESHORTEN_Y = 0.85;
// Small margins so the ground ellipse's outermost point and the apex's
// topmost point don't clip against the canvas edge.
const BASE_MARGIN = 4;
const TOP_MARGIN = 4;

// Produces one point on the conical spiral at a given normalized height
// h (0=base/aura, 1=apex/Measure) and canvas geometry. 'worklet' so both
// the static geometry builder (plain JS) and the travel-marker's
// useAnimatedStyle worklet (UI thread) can call the exact same function
// — never two independently-maintained copies of this math.
//
// The clearance floor is applied via Math.max UNCONDITIONALLY across the
// whole h domain, not gated by an h threshold — an earlier version only
// applied it below h<0.15 as an optimization, which produced a real,
// numerically-confirmed kink exactly at that boundary (the floor snapped
// off abruptly rather than being naturally exceeded by the unconstrained
// curve). Math.max against a fixed floor is cheap and, critically, safe:
// once ellipseScaleForH(h) makes rx/ry exceed the floor on their own, the
// max is a no-op with zero cost to continuity — same pattern the flat
// spiral's own (never-buggy) radius-vs-clearance max used.
function pointForH(
  h: number,
  baseCx: number,
  groundY: number,
  riseHeight: number,
  baseRx: number,
  baseRy: number,
  clearanceRx: number,
  clearanceRy: number,
): Point {
  'worklet';
  const theta = thetaForH(h);
  const scale = ellipseScaleForH(h);
  const clearance = ellipticalClearance(theta, clearanceRx, clearanceRy);
  const rx = Math.max(baseRx * rxScaleForH(h), clearance * scale);
  const ry = Math.max(baseRy * ryScaleForH(h), clearance * scale * FORESHORTEN_Y);
  const yCenter = groundY - h * riseHeight; // linear rise (option (a) — see file header)
  const x = baseCx + rx * Math.cos(theta);
  const y = yCenter + ry * Math.sin(theta) * FORESHORTEN_Y;
  return { x, y };
}

// Exported so anything positioning itself relative to a slot (a label, a
// future feature) can find the exact point without re-deriving the
// spiral math — same "one geometry function, many consumers" discipline
// vibrationSpectrumDotPosition already established.
export function spiralPointPosition(
  slotIndex: number,
  width: number,
  height: number,
  clearanceX: number,
  clearanceY: number,
): Point {
  const baseCx = width / 2;
  const groundY = height - BASE_MARGIN;
  const riseHeight = groundY - TOP_MARGIN;
  const h = hForSlot(slotIndex);
  return pointForH(h, baseCx, groundY, riseHeight, clearanceX, clearanceY, clearanceX, clearanceY);
}

interface SpiralGeometry {
  width: number;
  height: number;
  baseCx: number;
  groundY: number;
  riseHeight: number;
  pathD: string;
  // Cumulative polyline length at each slot's own sample index — lets a
  // caller find exactly how far along the drawn path a given slot sits,
  // without a closed-form arc-length integral (equal h steps do NOT
  // cover equal distance, so index/total would be visually dishonest —
  // this looks up the real distance instead).
  cumulativeLengthAtSlot: number[];
  totalLength: number;
  points: Point[]; // one per slot, in SLOT_ORDER order
}

// Built once per width/height/clearance (memoized by the caller) —
// samples the cone finely from base (h=0) to apex (h=1), building both
// the SVG path string and a lookup table of cumulative length at each
// slot's position, in one pass. The base ellipse's own rx/ry ARE the
// clearance ellipse (the ground ring sits exactly at the aura's own
// footprint) — see depths/index.tsx's DEPTHS_COMPOSITION_GEOMETRY for
// where clearanceX/clearanceY come from.
export function buildSpiralGeometry(width: number, height: number, clearanceX: number, clearanceY: number): SpiralGeometry {
  const baseCx = width / 2;
  const groundY = height - BASE_MARGIN;
  const riseHeight = groundY - TOP_MARGIN;
  const stepsPerSlot = 24;
  const totalSteps = (TOTAL_SLOTS - 1) * stepsPerSlot;

  // Sample index i walks in SLOT order (i=0 at slot 0/Measure, i=totalSteps
  // at the last slot/Breathing) so that cumulativeLengthAtSlot/points below
  // (indexed by `slot * stepsPerSlot`) line up correctly — but per
  // hForSlot, slot 0 is h=1 (apex) and the last slot is h=0 (base), so h
  // must run BACKWARD as i increases: h = 1 - i/totalSteps.
  const samples: Point[] = [];
  const cumulativeLengthAtStep: number[] = [0];
  for (let i = 0; i <= totalSteps; i++) {
    const h = 1 - i / totalSteps;
    const p = pointForH(h, baseCx, groundY, riseHeight, clearanceX, clearanceY, clearanceX, clearanceY);
    samples.push(p);
    if (i > 0) {
      const prev = samples[i - 1];
      const segLength = Math.hypot(p.x - prev.x, p.y - prev.y);
      cumulativeLengthAtStep.push(cumulativeLengthAtStep[i - 1] + segLength);
    }
  }

  const pathD = samples.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  const cumulativeLengthAtSlot: number[] = [];
  const points: Point[] = [];
  for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
    const step = slot * stepsPerSlot;
    cumulativeLengthAtSlot.push(cumulativeLengthAtStep[step]);
    points.push(samples[step]);
  }

  return {
    width,
    height,
    baseCx,
    groundY,
    riseHeight,
    pathD,
    cumulativeLengthAtSlot,
    totalLength: cumulativeLengthAtStep[cumulativeLengthAtStep.length - 1],
    points,
  };
}

export interface SpiralPoint {
  key: SpiralSlotKey;
  // Already-translated display name — DepthsSpiral stays pure/prop-driven
  // (no useTranslation of its own, matching AuraField.tsx's own contract),
  // so depths/index.tsx resolves the string before passing it down.
  label: string;
  isPresent: boolean;
  // Full brightness regardless of visited-today state — true for
  // measure and the three ephemeral/reading-dependent extras (spill,
  // talkAboutIt, cards, yourArc), false for the three prefix-tracked
  // tools (levels/tunein/breathing), which dim once their own dot has
  // been visited today (independent of whether the SOLID LINE has
  // reached them yet — see visitedToday below).
  alwaysFull: boolean;
  visitedToday: boolean;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

interface DepthsSpiralProps {
  width: number;
  height: number;
  points: SpiralPoint[]; // one entry per SLOT_ORDER key, always 8 long
  accentRgb: string;
  onPointPress: (key: SpiralSlotKey) => void;
  // 0 → all three prefix tools untouched today, 3 → all visited today as
  // a strict prefix (see PREFIX_WALK_KEYS) — depths/index.tsx computes
  // this by walking levels→tunein→breathing and stopping at the first
  // not-visited-today tool, so an out-of-order visit never extends the
  // line past a gap.
  prefixCount: number;
  // Fires the traveling first-run highlight (aura → Levels) once, then
  // calls onFirstRunTravelSettled. Absent/false on every normal render.
  playFirstRunTravel: boolean;
  onFirstRunTravelSettled?: () => void;
  // The aura's own ground-ellipse half-width/half-height, in this
  // component's own pixel space (same units as width/height) — used both
  // as the cone's base ellipse dimensions AND its inner clearance floor
  // near h≈0. The real reason this is ELLIPTICAL, not circular: the aura
  // figure is tall and narrow (see AuraFigure.tsx's BODY, ~200×380), so a
  // single scalar radius cleared the shoulders fine but let the base
  // winding clip through the head/legs. depths/index.tsx computes these
  // from the same geometry it already sizes AuraField's rings with, so
  // "the cone's base wraps the body" holds by construction.
  auraHalfWidth: number;
  auraHalfHeight: number;
}

const HIT = 44; // iOS/Android minimum recommended touch target
const DOT_RADIUS = 4.5;

export function DepthsSpiral({
  width,
  height,
  points,
  accentRgb,
  onPointPress,
  prefixCount,
  playFirstRunTravel,
  onFirstRunTravelSettled,
  auraHalfWidth,
  auraHalfHeight,
}: DepthsSpiralProps) {
  const colors = useThemeColors();
  const geometry = useMemo(
    () => buildSpiralGeometry(width, height, auraHalfWidth, auraHalfHeight),
    [width, height, auraHalfWidth, auraHalfHeight]
  );

  // Precomputes each point's label position/alignment in one pass (not
  // inline in the render .map below) so the anti-overlap nudge below can
  // check each new label's rough bounding box against every PREVIOUSLY
  // placed one — consecutive slots near the base sit on a wide, flat
  // ellipse where equal angular steps can land two dots (and their
  // same-side-offset labels) close enough on screen to overlap,
  // inheriting the same risk the old flat spiral had at its innermost
  // turns (see this file's own header comment). An earlier version only
  // compared Y against the immediately-preceding label, which missed
  // diagonal near-collisions (e.g. "Your Arc" sitting up-left of "Levels"
  // rather than directly above it — different Y, overlapping X ranges)
  // confirmed on-device; this checks a real 2D box against ALL earlier
  // labels, not just the last one in slot order.
  const LABEL_BOX_W = 90;
  const LABEL_BOX_H = fontSizes.xs * 3.2; // sized for the numberOfLines={2} worst case
  const labelLayout = useMemo(() => {
    const placed: { x: number; y: number }[] = [];
    return points.map((point, i) => {
      if (!point.isPresent) return null;
      const { x, y } = geometry.points[i];
      const h = hForSlot(i);
      const windingCenterX = geometry.baseCx;
      const windingCenterY = geometry.groundY - h * geometry.riseHeight;
      const dx = x - windingCenterX;
      const dy = y - windingCenterY;
      const dist = Math.hypot(dx, dy) || 1;
      const labelOffset = (DOT_RADIUS + 6) / Math.max(ellipseScaleForH(h), 0.35);
      const labelX = x + (dx / dist) * labelOffset;
      let labelY = y + (dy / dist) * labelOffset;
      // Push straight down, away from the aura (not sideways), until this
      // label's box no longer overlaps any earlier one — a small, capped
      // number of steps so this can never loop unboundedly.
      for (let guard = 0; guard < 8; guard++) {
        const collides = placed.some(
          (p) => Math.abs(labelX - p.x) < LABEL_BOX_W && Math.abs(labelY - p.y) < LABEL_BOX_H
        );
        if (!collides) break;
        labelY += LABEL_BOX_H * 0.6;
      }
      placed.push({ x: labelX, y: labelY });
      const isLeftHalf = dx < -4;
      const isRightHalf = dx > 4;
      const align: 'left' | 'right' | 'center' = isLeftHalf ? 'right' : isRightHalf ? 'left' : 'center';
      return { labelX, labelY, align };
    });
  }, [points, geometry]);

  const dashLength = useMemo(() => estimatePathLength(geometry.pathD) || geometry.totalLength, [geometry]);

  // Prefix tools sit at slots 5/6/7 (levels/tunein/breathing) — prefixCount
  // 0..3 maps to "traced up through slot 4 (nothing)/5/6/7."
  const targetLength = useMemo(() => {
    if (prefixCount <= 0) return 0;
    const slotIndex = 4 + prefixCount; // 5, 6, or 7
    return geometry.cumulativeLengthAtSlot[slotIndex] ?? 0;
  }, [prefixCount, geometry]);

  const traceProgress = useSharedValue(0);
  useEffect(() => {
    traceProgress.value = withTiming(targetLength / geometry.totalLength, {
      duration: 900,
      easing: SOFT_EASE,
    });
  }, [targetLength, geometry.totalLength]);

  const traceAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashLength * (1 - traceProgress.value),
  }));

  // Traveling first-run marker: aura (slot 0) → Levels (slot 5), along
  // the real sampled polyline (not a straight chord) — see
  // depths/index.tsx's onSettled wiring for the trigger condition.
  const travelProgress = useSharedValue(0);
  const travelOpacity = useSharedValue(0);
  const travelScale = useSharedValue(0.6);
  const TRAVEL_DURATION_MS = 1100;
  const TRAVEL_FADE_IN_MS = 250;
  const TRAVEL_ARRIVAL_SCALE_MS = 220;
  const TRAVEL_ARRIVAL_FADE_MS = 400;
  useEffect(() => {
    if (!playFirstRunTravel) return;
    travelOpacity.value = withTiming(1, { duration: TRAVEL_FADE_IN_MS, easing: SOFT_EASE });
    travelProgress.value = withTiming(1, { duration: TRAVEL_DURATION_MS, easing: SOFT_EASE });
    travelScale.value = withDelay(
      TRAVEL_DURATION_MS,
      withTiming(1.4, { duration: TRAVEL_ARRIVAL_SCALE_MS, easing: SOFT_EASE })
    );
    travelOpacity.value = withDelay(
      TRAVEL_DURATION_MS + TRAVEL_ARRIVAL_SCALE_MS,
      withTiming(0, { duration: TRAVEL_ARRIVAL_FADE_MS })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playFirstRunTravel]);

  useEffect(() => {
    if (!playFirstRunTravel || !onFirstRunTravelSettled) return;
    const total = TRAVEL_FADE_IN_MS + TRAVEL_DURATION_MS + TRAVEL_ARRIVAL_SCALE_MS + TRAVEL_ARRIVAL_FADE_MS;
    const timer = setTimeout(onFirstRunTravelSettled, total);
    return () => clearTimeout(timer);
  }, [playFirstRunTravel, onFirstRunTravelSettled]);

  const levelsSlotIndex = SLOT_ORDER.indexOf('levels');
  const travelMarkerStyle = useAnimatedStyle(() => {
    'worklet';
    // Re-derives the point directly via pointForH rather than sending the
    // full sampled-points array across the JS/UI bridge — cheap, and
    // keeps the marker walking the real curve (not a straight chord)
    // between the aura (h=0) and Levels' own winding (h=hForSlot(5)).
    const targetH = hForSlot(levelsSlotIndex);
    const h = travelProgress.value * targetH;
    const { x, y } = pointForH(
      h,
      geometry.baseCx,
      geometry.groundY,
      geometry.riseHeight,
      auraHalfWidth,
      auraHalfHeight,
      auraHalfWidth,
      auraHalfHeight,
    );
    return {
      opacity: travelOpacity.value,
      transform: [{ translateX: x - 5 }, { translateY: y - 5 }, { scale: travelScale.value }],
    };
  });

  const strokeColor = `rgb(${accentRgb})`;

  return (
    <View style={styles.outer}>
      <View pointerEvents="box-none" style={[styles.wrap, { width, height }]}>
        <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={StyleSheet.absoluteFill}>
          <Path d={geometry.pathD} fill="none" stroke={strokeColor} strokeOpacity={0.16} strokeWidth={1} strokeLinecap="round" />
          <AnimatedPath
            d={geometry.pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeDasharray={[dashLength, dashLength]}
            animatedProps={traceAnimatedProps}
          />
        </Svg>

        {playFirstRunTravel && (
          <Animated.View pointerEvents="none" style={[styles.travelDot, { backgroundColor: strokeColor }, travelMarkerStyle]} />
        )}

        {points.map((point, i) => {
          if (!point.isPresent) return null;
          const layout = labelLayout[i];
          if (!layout) return null;
          const dotOpacity = point.alwaysFull ? 0.95 : point.visitedToday ? 0.4 : 0.95;
          const { x, y } = geometry.points[i];
          const { labelX, labelY, align } = layout;
          const labelOpacity = point.alwaysFull ? 1 : point.visitedToday ? 0.55 : 1;

          return (
            <View key={point.key}>
              <Pressable
                style={[styles.hitArea, { left: x - HIT / 2, top: y - HIT / 2 }]}
                onPress={() => onPointPress(point.key)}
                hitSlop={i === 0 ? 10 : 4}
              >
                <View style={[styles.dot, { backgroundColor: strokeColor, opacity: dotOpacity }]} />
              </Pressable>
              <Text
                pointerEvents="none"
                numberOfLines={2}
                style={[
                  styles.pointLabel,
                  {
                    color: colors.text.secondary,
                    opacity: labelOpacity,
                    top: labelY - fontSizes.xs * 0.7,
                    textAlign: align,
                    // Width is generous, not tightly clamped to the space
                    // between the dot and the spiral canvas's own edge —
                    // a dot near 9/3 o'clock can sit close enough to that
                    // edge that the strict remaining space is too narrow
                    // for a real label ("Breathing" wrapped to two lines
                    // at ~40px). auraSpiralWrap has no overflow:hidden, so
                    // a label is safe to extend slightly past the canvas
                    // into the screen's own padding gutter when needed —
                    // two lines (numberOfLines={2} above) is the actual
                    // fallback for anything still too long at this width.
                    ...(align === 'right'
                      ? { right: width - labelX, left: undefined, width: 96 }
                      : align === 'left'
                        ? { left: labelX, right: undefined, width: 96 }
                        : { left: labelX - 60, width: 120 }),
                  },
                ]}
              >
                {point.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center' },
  wrap: { position: 'relative' },
  hitArea: { position: 'absolute', width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT_RADIUS * 2, height: DOT_RADIUS * 2, borderRadius: DOT_RADIUS },
  travelDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  pointLabel: {
    position: 'absolute',
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    maxWidth: 130,
  },
});
