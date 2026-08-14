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

// The spiral winds three full turns, not one partial sweep — each turn is
// a theme, not just a shape: "find yourself" (Measure, Spill, Talk about
// it, Cards — the reflective/expressive tools), "learn" (Your Arc,
// Levels — the pattern/knowledge tools), "regulate" (Tune In, Breathing —
// the calming tools). Slot→h is a lookup table, not a formula, because
// the three winds don't get equal shares of the curve (4 tools in the
// first wind, 2 each in the other two) — h still runs 0..1 monotonically
// DECREASING with slot index (h=1 at slot 0/Measure, h→0 toward the
// curve's own bare endpoint), just not evenly spaced per slot.
//
// h=0 is reserved for the curve's own bare terminus at the aura's exact
// center (no tool sits there) — Breathing sits at H_BREATHING, a little
// before that, so the line visibly continues past the last labeled point
// and dissolves into the aura, rather than a tool's own dot being the
// literal last pixel drawn.
//
// Wind boundaries, each a single h value the curve passes through between
// themes: WIND_1_START=1 (Measure, apex) → WIND_1_END (Cards, end of
// "find yourself") → WIND_2_END (Levels, end of "learn") →
// H_BREATHING (just before the bare tail to h=0, end of "regulate").
// Each slot's own h is placed by simple linear interpolation WITHIN its
// own wind's [start, end] range — verified numerically to be strictly
// decreasing slot-over-slot (see collaboration notes; an earlier
// arithmetic version of this table was NOT monotonic and has been
// replaced with this explicit, checked one).
const WIND_1_START = 1;
const WIND_1_END = 0.66;
const WIND_2_END = 0.34;
const H_BREATHING = 0.08;
const SLOT_H: number[] = [
  WIND_1_START,                                              // measure — apex
  WIND_1_START - (WIND_1_START - WIND_1_END) * 0.3,          // spill
  WIND_1_START - (WIND_1_START - WIND_1_END) * 0.65,         // talkAboutIt
  WIND_1_END,                                                 // cards — end of wind 1
  // yourArc — was the exact midpoint of wind 2 (0.5 fraction), which put
  // its dot only ~40px from levels' own dot on a real device (well under
  // HIT's own 44px minimum touch target, so their tap zones directly
  // overlapped — confirmed by the direct geometry math, not just eyeballing
  // the screenshot; see collaboration notes on IMG_3945/3946, "easy to
  // accidentally press Levels instead of Your Arc"). 0.35 (biased toward
  // cards instead of dead-center) opens that to ~105px from levels and
  // ~94px from cards — both comfortably clear, and reasonably balanced
  // between its two neighbors rather than skewed hard to one side.
  WIND_1_END - (WIND_1_END - WIND_2_END) * 0.35,              // yourArc — biased toward cards within wind 2
  WIND_2_END,                                                 // levels — end of wind 2
  WIND_2_END - (WIND_2_END - H_BREATHING) * 0.5,              // tunein — mid wind 3
  H_BREATHING,                                                 // breathing — just before the bare terminus
];

function hForSlot(slotIndex: number): number {
  'worklet';
  return SLOT_H[slotIndex];
}

const THETA_START = -Math.PI / 2; // 12 o'clock, at the apex
// b tuned so the ellipse-scale shrinks by φ every quarter turn (π/2
// radians) — the same proportion behind a nautilus shell, kept as the
// decay rate for ellipseScaleForH below.
const B = Math.log(PHI) / (Math.PI / 2);

// Three full turns (2π each) across the whole climb, not one partial
// sweep — each wind's own h-span (see SLOT_H's wind boundaries above,
// each spanning roughly a third of the 0..1 range) works out to roughly
// one full turn per theme, so a viewer can feel "this is a new loop, a
// new theme" rather than the whole curve reading as one continuous
// sweep the way the single-wind version did. A single linear formula
// across the ENTIRE h domain (not three separately-tuned per-wind
// formulas stitched together) — this is what keeps the curve kink-free
// by construction, same discipline as ellipseScaleForH's single-formula
// requirement: a linear function has no discontinuity to introduce in
// the first place, so wind boundaries are felt only through the theming
// of WHICH tools cluster on a turn, never through a bend in the curve
// itself.
const TOTAL_TURNS = 3;
function thetaForH(h: number): number {
  'worklet';
  return THETA_START + h * Math.PI * 2 * TOTAL_TURNS;
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

// How far the widest, ground-level ellipse's rx/ry shrink by height h.
// Two things taper to a point now, not one: the apex (h=1, Measure) AND
// the aura's own exact center (h=0) — the curve doesn't stop at the
// ground ellipse's own radius anymore, it keeps winding inward past it,
// shrinking the rest of the way to a true zero-radius point exactly at
// the aura's center (see this file's own header comment on the bare
// tail past Breathing). H_GROUND is the h value where the ring is at
// its FULL ground-ellipse size (matching AuraField's own rings) — the
// curve is widest there, not at h=0. Below H_GROUND (down to h=0) it
// tapers back down to zero; above it (up to h=1) it tapers to
// APEX_SCALE. A single smoothstep-shaped "tent" built from two
// mirrored halves, each continuous and zero-derivative at its own
// three anchor points (0, H_GROUND, 1) — same discipline as before,
// just two tapering ends instead of one.
const H_GROUND = 0.14;
const APEX_SCALE = 0.22; // apex ellipse reads as small but not a vanishing dot
const SCALE_K = -Math.log(APEX_SCALE);
function ellipseScaleForH(h: number): number {
  'worklet';
  if (h >= H_GROUND) {
    // Upper half: 1 at H_GROUND, APEX_SCALE at h=1 — same exponential
    // taper the single-ended version always used, just re-based to
    // start its own t=0 at H_GROUND instead of literal 0.
    const t = (h - H_GROUND) / (1 - H_GROUND);
    return Math.exp(-SCALE_K * smoothstep(t));
  }
  // Lower half: 1 at H_GROUND, 0 at h=0 — smoothstep itself (already
  // zero-derivative at both its own ends) taken directly as the scale,
  // so the ring shrinks smoothly all the way to a true point at the
  // aura's center rather than stopping at the ground ellipse's radius.
  const t = h / H_GROUND;
  return smoothstep(t);
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
// The clearance floor is applied via Math.max, but SCALED DOWN toward 0
// as h moves away from the ground — an earlier single-turn version
// applied the floor unconditionally across the whole h domain with no
// fade, which was safe there because ellipticalClearance's own theta-
// dependence only completed a partial turn total, so it never had a
// chance to independently cross the main taper curve more than once.
// With 3 full turns (see this file's header), clearance's oscillation
// (tied to theta, which now cycles 3× per unit h) crosses the main
// taper curve repeatedly far from the ground, and Math.max between two
// curves whose VALUES cross but whose SLOPES differ produces a real,
// confirmed direction-reversal cusp at each crossing (verified on-
// device — visible sharp corners at h≈0.744 and h≈0.107, matching this
// exact mechanism). Fading the floor to zero exactly where the main
// taper's own "ground" reference point is (H_GROUND — clearance is only
// ever a real, needed constraint right at the ground, nowhere else)
// removes the extra crossings entirely. Using a SEPARATE fade-end value
// here (tried first) left a residual smaller cusp right where the two
// boundaries didn't quite line up — reusing H_GROUND exactly, not a
// second independently-tuned constant, is what actually closed it.
function clearanceFadeForH(h: number): number {
  'worklet';
  if (h >= H_GROUND) return 0;
  return 1 - smoothstep(h / H_GROUND);
}

function pointForH(
  h: number,
  baseCx: number,
  groundY: number,
  chestY: number,
  riseHeight: number,
  baseRx: number,
  baseRy: number,
  clearanceRx: number,
  clearanceRy: number,
): Point {
  'worklet';
  const theta = thetaForH(h);
  const scale = ellipseScaleForH(h);
  const clearance = ellipticalClearance(theta, clearanceRx, clearanceRy) * clearanceFadeForH(h);
  const rx = Math.max(baseRx * rxScaleForH(h), clearance * scale);
  const ry = Math.max(baseRy * ryScaleForH(h), clearance * scale * FORESHORTEN_Y);
  // Linear rise from the CHEST (h=0, the curve's true destination — the
  // aura's glowing focal point, confirmed against the ground/ring level
  // which sits lower at the feet) up to the apex (h=1). The ring/ground
  // ellipse itself still sits at groundY (used only for the clearance
  // floor above, which is about RADIUS not vertical position) — the
  // curve's own path rises from a higher point than the ring does, so it
  // visibly climbs up out of the ring toward the chest glow rather than
  // hugging the ground the whole way, per the confirmed direction.
  const yCenter = chestY - h * riseHeight;
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
  chestY: number,
  clearanceX: number,
  clearanceY: number,
): Point {
  const baseCx = width / 2;
  const groundY = height - BASE_MARGIN;
  const riseHeight = chestY - TOP_MARGIN;
  const h = hForSlot(slotIndex);
  return pointForH(h, baseCx, groundY, chestY, riseHeight, clearanceX, clearanceY, clearanceX, clearanceY);
}

interface SpiralGeometry {
  width: number;
  height: number;
  baseCx: number;
  groundY: number;
  chestY: number;
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
  // The full dense polyline (same points pathD draws from) — exposed so
  // label placement can check for/avoid the curve's own nearby loops, not
  // just other labels or the aura's silhouette. 3 full turns of winding
  // means the curve legitimately passes close to itself at several
  // points (visible tight loops near "Your Arc"/"Levels" and
  // "Breathing" — confirmed on-device), which a purely radial per-point
  // label offset can't anticipate on its own.
  samples: Point[];
}

// Built once per width/height/clearance (memoized by the caller) —
// samples the cone finely from base (h=0) to apex (h=1), building both
// the SVG path string and a lookup table of cumulative length at each
// slot's position, in one pass. The base ellipse's own rx/ry ARE the
// clearance ellipse (the ground ring sits exactly at the aura's own
// footprint) — see depths/index.tsx's DEPTHS_COMPOSITION_GEOMETRY for
// where clearanceX/clearanceY come from. `chestY` is the curve's own
// true destination (h=0) — the aura's glowing chest point, confirmed
// against the ring/ground level which sits lower at the feet (groundY
// stays only as the clearance-floor reference, a radius concern, not a
// vertical-position one — see pointForH's own comment).
export function buildSpiralGeometry(width: number, height: number, chestY: number, clearanceX: number, clearanceY: number): SpiralGeometry {
  const baseCx = width / 2;
  const groundY = height - BASE_MARGIN;
  const riseHeight = chestY - TOP_MARGIN;
  // Fixed total resolution (not stepsPerSlot × TOTAL_SLOTS) — SLOT_H
  // isn't evenly spaced anymore (3 turns' worth of curve, non-uniform
  // wind sizes), so sampling must walk h uniformly across the WHOLE
  // 0..1 range independent of where slots happen to fall, then look up
  // each slot's own sample afterward (below) rather than assuming
  // `slot * stepsPerSlot` lands on the right step.
  const totalSteps = 400;

  // Samples the FULL h range, 1 (apex/Measure) down to 0 (the curve's own
  // bare terminus at the aura's chest glow) — not just down to the last
  // slot's own h (H_BREATHING) — so the line visibly continues past
  // Breathing's dot and dissolves into the aura, per this file's own
  // header comment.
  const samples: Point[] = [];
  const cumulativeLengthAtStep: number[] = [0];
  for (let i = 0; i <= totalSteps; i++) {
    const h = 1 - i / totalSteps;
    const p = pointForH(h, baseCx, groundY, chestY, riseHeight, clearanceX, clearanceY, clearanceX, clearanceY);
    samples.push(p);
    if (i > 0) {
      const prev = samples[i - 1];
      const segLength = Math.hypot(p.x - prev.x, p.y - prev.y);
      cumulativeLengthAtStep.push(cumulativeLengthAtStep[i - 1] + segLength);
    }
  }

  const pathD = samples.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Each slot's own sample index is the step nearest its SLOT_H value
  // (h = 1 - step/totalSteps, solved for step) — a direct lookup, not a
  // fixed stride, since slots no longer sit at uniform h intervals.
  const cumulativeLengthAtSlot: number[] = [];
  const points: Point[] = [];
  for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
    const step = Math.round((1 - hForSlot(slot)) * totalSteps);
    cumulativeLengthAtSlot.push(cumulativeLengthAtStep[step]);
    points.push(samples[step]);
  }

  return {
    width,
    height,
    baseCx,
    groundY,
    chestY,
    riseHeight,
    pathD,
    cumulativeLengthAtSlot,
    totalLength: cumulativeLengthAtStep[cumulativeLengthAtStep.length - 1],
    points,
    samples,
  };
}

export interface SpiralPoint {
  key: SpiralSlotKey;
  // Already-translated display name — DepthsSpiral stays pure/prop-driven
  // (no useTranslation of its own, matching AuraField.tsx's own contract),
  // so depths/index.tsx resolves the string before passing it down.
  label: string;
  isPresent: boolean;
  // NOT read by this component's own render anymore (dot/label opacity is
  // fixed, see the render below) — an earlier version dimmed a tool's dot
  // once visited today, but that read as discouraging a real, wanted
  // return visit (e.g. opening Tune In a second time in one day) rather
  // than offering a path. Kept on the data contract (not deleted) since
  // depths/index.tsx still computes real visited-state signals for other
  // purposes (prefixCount, the "today's walk" trace) — this field just
  // isn't one of the things that changes how a point LOOKS anymore.
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
  // The aura FIGURE's own visible height (not the ring's — much taller;
  // AuraFigure.tsx's real drawn silhouette), used only to keep labels
  // from landing on top of the body. With 3 turns of winding (see this
  // file's header), several windings now legitimately pass behind/through
  // the aura's silhouette at mid-heights — that's the intended "spins
  // around the person" effect, not a bug — but a LABEL landing there
  // still reads as a real readability bug (confirmed on-device: "Levels"
  // clipped by the figure). auraHalfWidth/Height alone aren't enough
  // here since they describe the flat ground ring, not the tall body.
  auraFigureHeight: number;
  // The curve's own true destination (h=0) — the aura's glowing chest
  // point, in this component's own pixel space (same units as
  // width/height, measured from the canvas's own top edge, NOT the aura
  // image's own top). Confirmed directly: the ring/ground ellipse stays
  // at the feet, but the curve itself should rise up out of the ring and
  // dissolve into the figure's bright focal point higher up, not stop at
  // the ring's own level.
  chestY: number;
}

const HIT = 44; // iOS/Android minimum recommended touch target
const DOT_RADIUS = 4.5;
// yourArc reads as an extra, not an equal peer to the other seven tools —
// it's the Selfinder+ seed (RULES.md, Product/positioning: "a next step
// some users are meant to genuinely adopt... gets full row weight"). Per
// aesthetic.md's "position and size carry differentiation, not boxes or
// color" rule, a slightly larger dot (not a new hue) is the right lever —
// same visual language every other point already uses, just turned up on
// this one. Modest on purpose: this is a hint, not a badge.
const YOUR_ARC_DOT_RADIUS = DOT_RADIUS * 1.4;

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
  auraFigureHeight,
  chestY,
}: DepthsSpiralProps) {
  const colors = useThemeColors();
  const geometry = useMemo(
    () => buildSpiralGeometry(width, height, chestY, auraHalfWidth, auraHalfHeight),
    [width, height, chestY, auraHalfWidth, auraHalfHeight]
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
  // The aura figure's own silhouette bounding box, roughly — centered
  // horizontally on baseCx, standing on groundY, auraFigureHeight tall.
  // Widened a bit past auraHalfWidth*2 since a label butting right up
  // against the figure's edge still read as cramped, not just literally
  // overlapping it.
  const AURA_BODY_HALF_W = auraHalfWidth * 0.75;
  const AURA_BODY_TOP = geometry.groundY - auraFigureHeight;
  // How close a label's own anchor point can sit to any OTHER part of the
  // curve (not the point's own dot, which is obviously right there) before
  // treating it as a collision to push away from — 3 full turns of
  // winding means the curve legitimately loops close to itself at several
  // points (confirmed on-device: "Your Arc"'s label sitting right where
  // the curve loops back near "Levels", "Breathing"'s label crossed by
  // its own loop's return path). A purely radial offset from the dot
  // can't anticipate this; it needs to check the actual nearby geometry.
  const CURVE_AVOID_DIST = 16;
  // Only check samples reasonably far (in curve-length terms) from this
  // slot's own step — otherwise every label "collides" with the handful
  // of samples immediately next to its own dot, which is expected and
  // not a real problem.
  const CURVE_AVOID_STEP_GAP = 20;
  const labelLayout = useMemo(() => {
    const placed: { x: number; y: number }[] = [];
    return points.map((point, i) => {
      if (!point.isPresent) return null;
      const { x, y } = geometry.points[i];
      const h = hForSlot(i);
      const windingCenterX = geometry.baseCx;
      const windingCenterY = geometry.chestY - h * geometry.riseHeight;
      const dx = x - windingCenterX;
      const dy = y - windingCenterY;
      const dist = Math.hypot(dx, dy) || 1;
      const labelOffset = (DOT_RADIUS + 6) / Math.max(ellipseScaleForH(h), 0.35);
      let labelX = x + (dx / dist) * labelOffset;
      let labelY = y + (dy / dist) * labelOffset;
      // Breathing sits at H_BREATHING, right where the curve dissolves
      // into the aura's own chest/center by design (see this file's own
      // header comment) — its label was landing partly behind the aura's
      // silhouette because the generic radial offset above places it only
      // a few px from a dot that's already almost on top of the figure.
      // Confirmed on a real device (2026-08-14 collaboration notes):
      // "the 'Breathing' gets covered by the spiral, partially." A
      // straight-up nudge (not radial, not the generic horizontal-only
      // aura-avoidance below) is the direct fix — Breathing's dot is close
      // enough to center that "outward" and "upward" are nearly the same
      // direction anyway, so this doesn't fight the radial placement,
      // it's just a stronger version of it for this one label.
      if (point.key === 'breathing') {
        labelY -= 14;
      }
      // If this label would land on/near the aura's own silhouette (only
      // possible now that 3 turns of winding legitimately pass behind the
      // body at mid-heights — see this file's header comment), push it
      // OUTWARD horizontally, away from baseCx, until clear — a label
      // reads as broken when clipped by the figure even though the curve
      // itself passing behind the body there is the intended effect.
      if (labelY > AURA_BODY_TOP && labelY < geometry.groundY && Math.abs(labelX - geometry.baseCx) < AURA_BODY_HALF_W) {
        const sign = labelX >= geometry.baseCx ? 1 : -1;
        labelX = geometry.baseCx + sign * AURA_BODY_HALF_W;
      }
      // Push further out, radially (same direction as the offset above,
      // not straight down — a loop can approach from any side), while
      // this label's anchor point sits too close to some OTHER stretch
      // of the curve — a small, capped number of steps so this can never
      // loop unboundedly.
      const ownStep = Math.round((1 - h) * (geometry.samples.length - 1));
      for (let guard = 0; guard < 8; guard++) {
        let collides = false;
        for (let s = 0; s < geometry.samples.length; s += 4) {
          if (Math.abs(s - ownStep) < CURVE_AVOID_STEP_GAP) continue;
          const sample = geometry.samples[s];
          if (Math.hypot(labelX - sample.x, labelY - sample.y) < CURVE_AVOID_DIST) {
            collides = true;
            break;
          }
        }
        if (!collides) break;
        labelX += (dx / dist) * labelOffset * 0.5;
        labelY += (dy / dist) * labelOffset * 0.5;
      }
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
      geometry.chestY,
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
          // Dot/label brightness no longer dims once a tool is visited
          // today — a returning-today visit to Tune In is exactly as
          // valid a thing to want as a first one, so treating "already
          // visited" as a reason to fade it read as discouraging a real
          // path the user might want, not offering one. The solid/dashed
          // prefix TRACE (traceAnimatedProps, above) still shows today's
          // walk — that's informational, not a judgment on any one dot.
          const { x, y } = geometry.points[i];
          const { labelX, labelY, align } = layout;
          const isYourArc = point.key === 'yourArc';
          const dotRadius = isYourArc ? YOUR_ARC_DOT_RADIUS : DOT_RADIUS;

          return (
            <View key={point.key}>
              <Pressable
                style={[styles.hitArea, { left: x - HIT / 2, top: y - HIT / 2 }]}
                onPress={() => onPointPress(point.key)}
                hitSlop={i === 0 ? 10 : 4}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: dotRadius * 2,
                      height: dotRadius * 2,
                      borderRadius: dotRadius,
                      backgroundColor: strokeColor,
                      opacity: 0.95,
                    },
                  ]}
                />
              </Pressable>
              {/* The label itself is its own separate tap target, not just
                  a caption over the dot's — a dot alone is a small, fiddly
                  target on a real screen, and the label sits right next to
                  it doing nothing when tapped, which reads as broken once
                  you notice it. Same onPointPress, same key, so tapping
                  either the dot OR its full label text does the same
                  thing. hitSlop widens the touch area slightly past the
                  text's own tight bounding box, same reasoning as the
                  dot's own hitSlop. */}
              <Pressable
                onPress={() => onPointPress(point.key)}
                hitSlop={isYourArc ? 8 : 4}
                style={[
                  styles.pointLabelHit,
                  // yourArc's label renders at fontSizes.sm, not the
                  // shared fontSizes.xs every other point uses (see
                  // pointLabel below) — this Pressable's own top offset
                  // and minHeight were still computed from xs, so the
                  // actual rendered (larger) text could sit partly
                  // outside its own tap zone. Confirmed on a real device:
                  // "Your arc"'s dot worked but its label text didn't
                  // (2026-08-13 collaboration notes) — this is why.
                  {
                    top: labelY - (isYourArc ? fontSizes.sm : fontSizes.xs) * 0.7,
                    minHeight: (isYourArc ? fontSizes.sm : fontSizes.xs) * 2.4,
                    ...(align === 'right'
                      ? { right: width - labelX, left: undefined, width: 96 }
                      : align === 'left'
                        ? { left: labelX, right: undefined, width: 96 }
                        : { left: labelX - 60, width: 120 }),
                  },
                ]}
              >
                <Text
                  numberOfLines={2}
                  style={[
                    styles.pointLabel,
                    {
                      color: isYourArc ? colors.text.primary : colors.text.secondary,
                      fontSize: isYourArc ? fontSizes.sm : fontSizes.xs,
                      textAlign: align,
                    },
                  ]}
                >
                  {point.label}
                </Text>
              </Pressable>
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
  // The tap target — positioned absolutely (same left/right/width/top
  // logic the old bare Text used), sized to the label's own reserved
  // width/height rather than the dot's fixed 44×44 hitArea, since a
  // two-line label reasonably needs a taller target than a single dot.
  // minHeight/top are set per-instance above (font-size-aware — see the
  // isYourArc branch), not here, since yourArc's label renders larger
  // than every other point's.
  pointLabelHit: {
    position: 'absolute',
    justifyContent: 'center',
  },
  pointLabel: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    maxWidth: 130,
  },
});
