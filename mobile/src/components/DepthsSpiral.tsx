import { useMemo, useEffect, useState } from 'react';
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

// Depths' journey, drawn as a golden-ratio (logarithmic) spiral rather than
// a vertical list — see docs/depths-structure-concept.md. r(θ) = r₀ ·
// φ^(−θ/(π/2)): radius shrinks by φ every quarter turn, the same
// proportion behind a nautilus shell, not an arbitrary curve. Winds
// clockwise and inward from Measure (the fixed, always-present outer
// start) to the aura at center — moving along the spiral toward the
// center IS the journey. Same construction discipline as
// VibrationSpectrum.tsx's ring (one pure geometry function, exported dot-
// position helper so nothing drifts out of sync with the drawing) and
// AuraField.tsx (a `buildXGeometry(size)` factory returning everything a
// caller needs, sized once, reused by both the static and animated
// render).
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

const THETA_START = -Math.PI / 2; // 12 o'clock
// Just under 3/4 turn to the last slot — tight enough to read as one
// continuous inward pull within a 342px content column, wide enough that
// early slots (Measure, Spill) don't crowd the outer rim.
const THETA_PER_SLOT = (Math.PI * 1.5) / (TOTAL_SLOTS - 1);
// b tuned so r shrinks by φ every quarter turn (π/2 radians) — the
// defining property of a golden/logarithmic spiral.
const B = Math.log(PHI) / (Math.PI / 2);

// 'worklet'-annotated: called both from plain JS (building the static
// path/lookup table) and from inside travelMarkerStyle's useAnimatedStyle
// worklet on the UI thread — same dual-context precedent as
// ConsciousnessWheel.tsx's angleFor/polarToXY.
function thetaForSlot(slotIndex: number): number {
  'worklet';
  return THETA_START + slotIndex * THETA_PER_SLOT;
}

function radiusForTheta(theta: number, r0: number): number {
  'worklet';
  return r0 * Math.exp(-B * (theta - THETA_START));
}

interface Point {
  x: number;
  y: number;
}

function polarToXY(cx: number, cy: number, r: number, theta: number): Point {
  return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
}

// Exported so anything positioning itself relative to a slot (a label, a
// future feature) can find the exact point without re-deriving the
// spiral math — same "one geometry function, many consumers" discipline
// vibrationSpectrumDotPosition already established.
export function spiralPointPosition(slotIndex: number, size: number, innerClearance: number): Point {
  const cx = size / 2;
  const cy = size / 2;
  const r0 = size / 2 - 4; // small margin so the outermost point doesn't clip
  const theta = thetaForSlot(slotIndex);
  const r = Math.max(radiusForTheta(theta, r0), innerClearance);
  return polarToXY(cx, cy, r, theta);
}

interface SpiralGeometry {
  size: number;
  cx: number;
  cy: number;
  pathD: string;
  // Cumulative polyline length at each slot's own sample index — lets a
  // caller find exactly how far along the drawn path a given slot sits,
  // without a closed-form arc-length integral (a log spiral's equal
  // angular steps do NOT cover equal distance, so index/total would be
  // visually dishonest — this looks up the real distance instead).
  cumulativeLengthAtSlot: number[];
  totalLength: number;
  points: Point[]; // one per slot, in SLOT_ORDER order
}

// Built once per size/innerClearance (memoized by the caller) — samples
// the spiral finely between slot 0 and the last slot, building both the
// SVG path string and a lookup table of cumulative length at each slot's
// position, in one pass.
export function buildSpiralGeometry(size: number, innerClearance: number): SpiralGeometry {
  const cx = size / 2;
  const cy = size / 2;
  const r0 = size / 2 - 4;
  const thetaMax = thetaForSlot(TOTAL_SLOTS - 1);
  const stepsPerSlot = 24;
  const totalSteps = (TOTAL_SLOTS - 1) * stepsPerSlot;

  const samples: Point[] = [];
  const cumulativeLengthAtStep: number[] = [0];
  for (let i = 0; i <= totalSteps; i++) {
    const theta = THETA_START + (i / totalSteps) * (thetaMax - THETA_START);
    const r = Math.max(radiusForTheta(theta, r0), innerClearance);
    const p = polarToXY(cx, cy, r, theta);
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
    size,
    cx,
    cy,
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
  size: number;
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
}

// Minimum radius any slot is allowed to shrink to — keeps inner slots
// (Regulate's tools, tightest on the curve) from crowding the aura image
// itself or from bunching close enough to make adjacent taps ambiguous.
const INNER_CLEARANCE_RATIO = 0.34;
const HIT = 44; // iOS/Android minimum recommended touch target
const DOT_RADIUS = 4.5;

export function DepthsSpiral({
  size,
  points,
  accentRgb,
  onPointPress,
  prefixCount,
  playFirstRunTravel,
  onFirstRunTravelSettled,
}: DepthsSpiralProps) {
  const colors = useThemeColors();
  const innerClearance = size * INNER_CLEARANCE_RATIO;
  const geometry = useMemo(() => buildSpiralGeometry(size, innerClearance), [size, innerClearance]);

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
    // Re-derives the point directly from theta/radius rather than sending
    // the full sampled-points array across the JS/UI bridge — cheap, and
    // keeps the marker walking the real curve (not a straight chord)
    // between the aura and Levels' own slot.
    const targetTheta = thetaForSlot(levelsSlotIndex);
    const theta = THETA_START + travelProgress.value * (targetTheta - THETA_START);
    const r0 = size / 2 - 4;
    const r = Math.max(radiusForTheta(theta, r0), innerClearance);
    const cx = size / 2;
    const cy = size / 2;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    return {
      opacity: travelOpacity.value,
      transform: [{ translateX: x - 5 }, { translateY: y - 5 }, { scale: travelScale.value }],
    };
  });

  const strokeColor = `rgb(${accentRgb})`;
  // Which point is currently pressed-in — reveals its name below the
  // spiral, same "the shape stays quiet until you're pointing at
  // something" convention ConsciousnessWheel.tsx already established
  // (see aesthetic.md's Interaction section) — no labels crowd the curve
  // itself at rest.
  const [focusedKey, setFocusedKey] = useState<SpiralSlotKey | null>(null);
  const focusedPoint = points.find((p) => p.key === focusedKey);

  return (
    <View style={styles.outer}>
      <View pointerEvents="box-none" style={[styles.wrap, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={StyleSheet.absoluteFill}>
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
          const dotOpacity = point.alwaysFull ? 0.95 : point.visitedToday ? 0.4 : 0.95;
          const { x, y } = geometry.points[i];
          return (
            <Pressable
              key={point.key}
              style={[styles.hitArea, { left: x - HIT / 2, top: y - HIT / 2 }]}
              onPress={() => onPointPress(point.key)}
              onPressIn={() => setFocusedKey(point.key)}
              onPressOut={() => setFocusedKey((k) => (k === point.key ? null : k))}
              hitSlop={i === 0 ? 10 : 4}
            >
              <View style={[styles.dot, { backgroundColor: strokeColor, opacity: dotOpacity }]} />
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.focusLabel, { color: colors.text.secondary, opacity: focusedPoint ? 1 : 0 }]}>
        {focusedPoint?.label ?? ' '}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { alignItems: 'center' },
  wrap: { position: 'relative' },
  hitArea: { position: 'absolute', width: HIT, height: HIT, alignItems: 'center', justifyContent: 'center' },
  dot: { width: DOT_RADIUS * 2, height: DOT_RADIUS * 2, borderRadius: DOT_RADIUS },
  travelDot: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  focusLabel: {
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[3],
    minHeight: fontSizes.sm * 1.3,
  },
});
