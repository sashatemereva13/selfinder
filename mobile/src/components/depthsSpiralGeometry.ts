import { Easing } from "react-native-reanimated";
import { fontSizes, lineHeights } from "../theme/typography";
import { type SphereKey } from "./AuraField";

// Depths' spiral, drawn as a golden-ratio cone rising above the aura figure
// — a forced 2D-perspective illusion (each successive winding a smaller,
// flatter ellipse than the one below, per Dürer's own 1525 conical-spiral
// construction) rather than a flat disc. Same construction discipline as
// AuraField.tsx (a pure geometry function, exported dot-position helper so
// nothing drifts out of sync with the drawing).
//
// 2026-08-29 redesign, then 2026-08-30 revision: this used to be a 3-turn,
// 7-slot NAVIGATION menu (Measure/Spill/Talk about it/Cards/Levels/Tune In/
// Breathing as tappable dots). A same-day pass first collapsed it to a
// 1-turn, 4-point SPHERE visualization to fit a compact first-viewport
// goal — but the 3-turn shape itself was judged more elegant on its own
// terms, so the NEXT day's revision restores the original 3-turn geometry
// (TOTAL_TURNS, SLOT_H's spread) while keeping the sphere-only CONTENT the
// first revision introduced: the spiral's points are Mind/Spirit/Heart/
// Body (the same four things AuraField's own rings represent), not tool
// destinations, and does no navigation. The tool destinations that used to
// live here stay in Depths' own intentionSection (Stay/Understand/Shift +
// a dedicated Measure-again row) — see depths/index.tsx.
//
// 2026-09-01: this single-canvas file was split in two —
// DepthsSpiralCore.tsx (h∈[0, H_CUT]: the aura's curve, the 4 sphere dots,
// the always-on 17-level wheel — rendered in Depths' new FIXED zone, never
// scrolls) and DepthsSpiralMenu.tsx (h∈[H_CUT, H_MAX]: the action points
// and the decorative top loop — rendered as the first thing in Depths' new
// SCROLLABLE zone). This module holds every piece of PURE geometry math
// both of those need, unmodified from the original single-file version —
// nothing here changed except where it lives. See DepthsSpiralCore.tsx's
// and DepthsSpiralMenu.tsx's own header comments for how the seam between
// them is kept visually continuous despite being two separate SVGs in two
// separate scroll contexts.
const PHI = 1.6180339887498948;

// Fixed slots — the same 4 spheres AuraField's own RING_ORDER draws, just
// in a different top-to-bottom READING order on the spiral itself
// (Heart, Mind, Spirit, Body — 2026-08-31, at the user's own request,
// moving Spirit's position between Mind and Body). Deliberately its own
// array, not a re-export of RING_ORDER: RING_ORDER also drives
// AuraField's own ring draw-order/radius and the arrival animation's
// color-stagger sequence, none of which the user asked to change — only
// where each sphere's LABEL sits along the spiral was the request.
// Exported so depths/index.tsx builds its own `points` prop in this same
// order — DepthsSpiralCore consumes `points` POSITIONALLY (points[i] pairs
// with geometry.points[i], built from SLOT_H[i]/SLOT_ORDER[i]'s own
// h-value), so the caller's array order must match this exactly or a
// sphere's data renders at the wrong h-slot entirely.
export const SLOT_ORDER: SphereKey[] = ["mind", "heart", "spirit", "body"];
const TOTAL_SLOTS = SLOT_ORDER.length;

// Spread across most of the tall 3-turn climb, apex down toward the
// ground — h=1 is the bare apex (no point there; Measure no longer lives
// on the spiral), h=0 is the bare terminus at the aura's chest (no point
// there either — the curve visibly continues past the last point and
// dissolves into the aura). Evenly spaced across [H_APEX, H_GROUND_POINT]
// exactly as the compact 1-turn version was — only TOTAL_TURNS (below)
// changed back, not this spacing logic, so the 4 points land at 4 clearly
// separated windings on the taller cone rather than clustering near the
// top or bottom.
// Foreshortening ratio for the elliptical offset around each winding's own
// center — kept less than 1 so a point's vertical displacement from its
// ring's center reads as sitting ON a foreshortened ellipse, not a full
// circle, consistent with the ground ellipse's own aspect ratio. Declared
// early (moved 2026-08-31, was much further down this file) — a worklet
// that references a module-level const declared AFTER the worklet's own
// definition can see it as undefined once compiled (confirmed on-device:
// wheelLoopTargetScales referencing this before its old declaration point
// produced a silent NaN, not a proper "used before defined" error).
const FORESHORTEN_Y = 0.85;

const H_APEX = 0.86;
const H_GROUND_POINT = 0.45;
const SLOT_H: number[] = SLOT_ORDER.map(
  (_, i) => H_APEX - (i / (TOTAL_SLOTS - 1)) * (H_APEX - H_GROUND_POINT),
);

export function hForSlot(slotIndex: number): number {
  "worklet";
  return SLOT_H[slotIndex];
}

const THETA_START = -Math.PI / 2; // 12 o'clock, at the apex
// b tuned so the ellipse-scale shrinks by φ every quarter turn (π/2
// radians) — the same proportion behind a nautilus shell, kept as the
// decay rate for ellipseScaleForH below.
const B = Math.log(PHI) / (Math.PI / 2);

// Three full turns across the whole climb — restored 2026-08-30 (see this
// file's header) after a same-day 1-turn compact version was judged less
// elegant than the original shape. A single linear formula across the
// ENTIRE h domain (not several per-wind formulas stitched together) is
// what keeps the curve kink-free by construction — no wind-boundary
// theming to preserve anymore (the 4 sphere points don't cluster into
// themed winds the way the old 7 tool dots did), so nothing else depends
// on this being exactly 3, but keeping one continuous formula (rather than
// hardcoding a shape-specific one) means every other geometry helper below
// (ellipseScaleForH, pointForH, etc.) still Just Works unchanged.
const TOTAL_TURNS = 3;
export function thetaForH(h: number): number {
  "worklet";
  return THETA_START + h * Math.PI * 2 * TOTAL_TURNS;
}

// Cubic ease, zero derivative at both t=0 and t=1 — the discipline that
// fixed a real, measured kink in this spiral's earlier flat taper-to-
// center curve (three different radius formulas meeting at hard
// boundaries with matching value but mismatched slope). Every curve below
// built from smoothstep() is a single continuous family, never spliced
// with a second formula at some h threshold.
export function smoothstep(t: number): number {
  "worklet";
  return t * t * (3 - 2 * t);
}

// How far the widest, ground-level ellipse's rx/ry shrink by height h. Two
// things taper to a point: the apex (h=1) AND the aura's own exact center
// (h=0) — the curve doesn't stop at the ground ellipse's own radius, it
// keeps winding inward past it, shrinking the rest of the way to a true
// zero-radius point exactly at the aura's center. H_GROUND is the h value
// where the ring is at its FULL ground-ellipse size (matching AuraField's
// own rings) — the curve is widest there, not at h=0. Below H_GROUND (down
// to h=0) it tapers back down to zero; above it (up to h=1) it tapers to
// APEX_SCALE. A single smoothstep-shaped "tent" built from two mirrored
// halves, each continuous and zero-derivative at its own three anchor
// points (0, H_GROUND, 1).
const H_GROUND = 0.1;
const APEX_SCALE = 0.2; // apex ellipse reads as small but not a vanishing dot
const SCALE_K = -Math.log(APEX_SCALE);
// 2026-08-30 — the spiral extends past its old apex (h=1) to h=H_MAX,
// carrying 4 new "action" points (Stay/Understand/Shift/Measure again —
// see depths/index.tsx's own intentionSection migration). The h∈[0,1]
// formula below is left COMPLETELY UNTOUCHED (the 4 sphere points must
// stay pixel-identical to before this change) — this is a genuinely NEW
// `if (h > 1)` branch, not a rescale of the existing one. It's safe
// specifically because smoothstep has ZERO DERIVATIVE at both t=0 and
// t=1 (see smoothstep's own comment) — at h=1 the existing branch's
// value is exactly APEX_SCALE and its SLOPE is exactly 0, so any new
// branch that starts at APEX_SCALE with its own t=0 (zero slope) matches
// both value AND slope at the seam automatically, by construction, not
// by solving anything — the same "match value and slope, not just
// value" discipline this file's own comments already describe as the
// fix for a real, confirmed kink bug elsewhere in this file.
// Grown from 1.5 (2026-08-30) alongside ACTION_H_START's own push to 1.4 —
// keeping H_MAX at 1.5 while ACTION_H_START moved to 1.4 would have
// compressed all 4 action points into a 0.1-wide h-span, too cramped for
// 4 real label+description boxes to space out along. Grown proportionally
// so the action points keep roughly the same spacing they had before,
// just shifted further from the sphere zone as a whole band. Grown again
// to 2.05 (from 1.9) the same day, alongside ACTION_H_START's own push
// to 1.55, to make room for a meaningfully bigger wheel (WHEEL_SIZE) in
// the sphere/action gap. Grown once more to 2.55 (2026-08-31), alongside
// ACTION_H_START's own push to 1.85 and WHEEL_H's own push to 1.31 — the
// user wanted the spiral to read as genuinely longer/taller (more visible
// winding), not just tighter breathing room between the same 3 zones at
// the same scale. TOTAL_TURNS itself stays 3 (turns-PER-unit-h, not a
// total count) — extending H_MAX alone already adds the extra winding,
// entirely within the h>0.86 region, with zero effect on the sphere
// zone's own theta/pixel positions below it.
// Grown once more, to 3.5333 (from 2.95, 2026-08-31) — makes room for
// TOP_LOOP's own closed bubble past "Measure again" (see TOP_LOOP_* below
// for the actual loop geometry): a 0.15-wide buffer gap above
// ACTION_H_END (2.95, declared below), then TOP_LOOP_BLEND_H (0.1) of
// blend-in, then one full turn (1/TOTAL_TURNS ≈ 0.333) of flat loop,
// ending exactly at H_MAX (the curve's true terminus — no blend-out
// needed here, unlike the wheel-loop, since nothing continues above it).
// ACTION_H_END (not H_MAX) is what bounds the action points' own span, so
// this growth doesn't move Stay/Understand/Shift/Measure again at all —
// it only extends the curve further, into brand-new territory above
// them. (Written as a literal, not derived from ACTION_H_END, only
// because ACTION_H_END is declared further down this file — keep them in
// sync if either changes: H_MAX = ACTION_H_END + 0.15 + 0.1 + 1/3.)
// Grown again to 4.266666666666667 (2026-09-02), following that SAME
// formula against ACTION_H_END's own new value (3.6833333333333336, see
// its own comment — widened to fit 2 new points, exploreMap/
// feelingLucky). This is a pure TRANSLATION of the loop's position, not
// a resize — the +0.15/+0.1/+1/3 terms are unchanged, so TOP_LOOP_CORE_HI
// /LO/TOP_LOOP_BLEND_LO (all derived FROM H_MAX below, not independent)
// keep the loop's exact shape/size, just later in the scroll, past the
// new 6th point instead of the old 4th.
export const H_MAX = 4.266666666666667;
// Was 0.1 — recomputed for the taller apex (H_MAX grown to 2.55, 2026-08-
// 31): keeping the SAME decay rate per unit h as before (rate = old
// EXT_SCALE_K / old (H_MAX-1) = 0.751/unit-h) applied over the new,
// longer 1.55-wide extension span gives EXT_SCALE_K ≈ 1.145, i.e.
// EXT_APEX_SCALE ≈ 0.07 — the new, taller apex ellipse tapers a bit
// further than before, consistent with a taller cone's own perspective.
const EXT_APEX_SCALE = 0.1;
const EXT_SCALE_K = -Math.log(EXT_APEX_SCALE / APEX_SCALE);

// 2026-09-01, added for the fixed/scroll split — the h-boundary between
// DepthsSpiralCore (h∈[0, H_CUT], the fixed zone: aura curve, 4 sphere
// dots, the always-on wheel) and DepthsSpiralMenu (h∈[H_CUT, H_MAX], the
// scrollable zone: action points + top loop). Chosen comfortably clear of
// WHEEL_H=1.31's own fixed pixel position/bounding box (WHEEL_SIZE=170,
// bounding box with ticks/marker roughly ~140-190px — see WHEEL_SIZE's own
// comment) and well before ACTION_H_START=1.85, so neither the wheel's own
// clearance nor the action points' spacing need to change. Verified
// numerically (not just eyeballed): at H_CUT=1.55 the curve point sits
// 19-44px above the wheel's own bounding-box top depending on which bbox
// estimate (140px vs 190px) is used — comfortably clear either way. The
// curve shape at any h is a pure function of h alone (see pointForH's own
// comment) — H_CUT only decides where DepthsSpiralCore's canvas ends and
// DepthsSpiralMenu's begins, not anything about the curve's own math.
export const H_CUT = 1.5;

// The 4 new "action" points — Stay with it / Understand it / Shift it /
// Measure again — occupying the new h>1 winding, evenly spaced the same
// way SLOT_H spaces the 4 sphere points. Kept as a fully separate
// ordering/lookup from SLOT_ORDER/SLOT_H so nothing about the sphere
// points' own indexing changes.
// 2026-09-02 — "exploreMap"/"feelingLucky" added, at the user's own
// request: the two former plain-row menu items ("Explore the map," "A
// message for right now") moved onto the curve itself, continuing this
// same sequence, rather than sitting below it as a visually generic
// settings-style list (see depths/index.tsx's own comment on why —
// "not a part of the Selfinder world"). Their own dot renders as their
// existing DepthsMenuSymbol icon instead of the plain filled circle the
// other 4 use (DepthsSpiralMenu.tsx's own ActionRow), marking them as a
// different CATEGORY (open-ended exploration, not this reading's own
// next steps) without a second competing color.
export type SpiralActionKey =
  | "stay"
  | "understand"
  | "shift"
  | "measure"
  | "exploreMap"
  | "feelingLucky";
export const ACTION_ORDER: SpiralActionKey[] = [
  "stay",
  "understand",
  "shift",
  "measure",
  "exploreMap",
  "feelingLucky",
];
// Was 1.1, then 1.2 (2026-08-30) — neither cleared "Measure again"'s label
// (the lowest action point) from the sphere labels (Heart/Mind) on-device;
// small h nudges don't reliably translate to real pixel separation here
// because the winding curve's own geometry near the old apex (h≈1) can
// put a small-h-difference point in roughly the same SCREEN region as the
// topmost sphere points, not a purely-higher one. Pushed further, to 1.4
// — compressing all 4 action points into a shorter span near H_MAX
// instead — so the closest one clears the sphere zone by a wide margin
// rather than by a small, unreliable-in-practice increment.
// Pushed further still, to 1.55 (2026-08-30), alongside H_MAX's own push
// to 2.05 — makes room for a meaningfully bigger vibration wheel
// (WHEEL_SIZE) in the widened sphere/action gap, without shrinking the
// action points' own 0.5-wide span (still ACTION_H_START to H_MAX).
// Pushed once more to 1.85 (2026-08-31), alongside H_MAX's own push to
// 2.55 — widens BOTH the sphere/action gap (now 0.99 in h, was 0.69,
// giving the wheel more clearance) AND the action points' own span
// (0.70, was 0.5, spreading Stay/Understand/Shift/Measure again a little
// further apart too) — part of making the whole spiral read as genuinely
// longer, not just adding room in one specific spot.
export const ACTION_H_START = 1.85;
// The action points' own span ceiling — kept as its OWN constant, not
// H_MAX directly, once H_MAX grew again (2026-08-31) to fit a new closed
// loop past Measure again (see TOP_LOOP_* below): action points must stay
// exactly where they already were, not stretch to fill the newly grown
// domain.
// Widened from 2.95 to fit 2 new points (exploreMap/feelingLucky, see
// ACTION_ORDER's own comment) at the SAME per-point spacing as before,
// not more cramped: old gap = (2.95-1.85)/3 ≈ 0.3667 (4 points, 3 gaps);
// new value = ACTION_H_START + oldGap*5 (6 points, 5 gaps, same gap
// size). H_MAX below is recomputed from THIS value via this file's own
// documented formula, so the decorative loop translates to make room
// rather than being resized or overlapped — verify that formula is still
// followed if ACTION_H_END ever changes again.
export const ACTION_H_END = 3.6833333333333336;
// 2026-09-02 — "Measure again" pulled further down the spiral (further
// FROM ACTION_H_START, i.e. a larger h — h increases going DOWN into
// Menu's own canvas, see this file's own seam-continuity comment) than
// the other 3 action points' even spacing would place it, at the user's
// own request. Kept as its own named offset, not a change to
// ACTION_H_END itself — the top loop is anchored at ACTION_H_END/H_MAX
// (see TOP_LOOP_* below) and must stay exactly where it is; only Measure
// again's own position moves, independent of that domain ceiling.
// Capped at 0.1 — TOP_LOOP_BLEND_LO (the top loop's own blend-in start)
// sits only ~0.15 past ACTION_H_END; a larger offset here was confirmed
// (by hand-checking the actual numbers) to push Measure again's own h
// PAST that blend threshold, risking a real overlap with the decorative
// loop above it, not just crowding it visually.
const MEASURE_AGAIN_H_EXTRA = 0.1;
const ACTION_H: number[] = ACTION_ORDER.map((key, i) => {
  const evenH =
    ACTION_H_START +
    (i / (ACTION_ORDER.length - 1)) * (ACTION_H_END - ACTION_H_START);
  return key === "measure" ? evenH + MEASURE_AGAIN_H_EXTRA : evenH;
});
export function hForAction(actionIndex: number): number {
  "worklet";
  return ACTION_H[actionIndex];
}
// Shift's own 2 sub-points (Tune In, Breathing) only exist once Shift is
// tapped (see depths/index.tsx's shiftRevealed state) — not part of
// ACTION_H, computed relative to Shift's own h at reveal time so they
// visually "unfold from" that one point rather than living at fixed
// positions of their own. "Just above and below Shift, hugging the
// curve" (confirmed placement) — a small delta, tuned visually.
export type SpiralShiftSubKey = "tuneIn" | "breathing";
// Was 0.09 — with adjacent action points 0.1667 apart (h evenly spaced
// across ACTION_H_START..H_MAX), 0.09 put Tune In/Breathing's own
// NATURAL position (before any collision avoidance even runs) more than
// half the way to the neighboring action point — confirmed on-device:
// "the options appear on the other side of the spiral," landing right on
// top of Measure again/Understand it instead of near Shift. Shrunk to
// 0.04 (≈24% of the then-0.1667 gap), then re-tuned to 0.056 once
// ACTION_H_START/H_MAX grew again (2026-08-31) and the adjacent-action
// gap widened to 0.2333 — reusing the SAME 24%-of-gap ratio that already
// proved safe at the old spacing, not the old absolute delta (which would
// now read disproportionately close relative to the wider gap).
const SHIFT_SUB_DELTA = 0.2;
export function hForShiftSub(key: SpiralShiftSubKey): number {
  "worklet";
  const shiftH = ACTION_H[ACTION_ORDER.indexOf("shift")];
  return key === "tuneIn" ? shiftH + SHIFT_SUB_DELTA : shiftH - SHIFT_SUB_DELTA;
}

// The 17-level wheel's own fixed anchor — sits in the open gap between
// the sphere points (end at H_APEX=0.86) and the action points (start at
// ACTION_H_START=1.85), roughly the gap's midpoint. A FIXED point, not
// derived from ellipseScaleForH's own taper — that taper belongs to the
// spiral's own winding radius, not to a fixed-size wheel sitting near it
// (same principle AuraField.tsx's own buildAuraFieldGeometry uses: sized
// independently of any h-taper). The curve used to bend into a matching
// loop right at this h (see git history, "wheel-loop") so the wheel read
// as the spiral itself becoming a circle — removed 2026-09-01: with the
// wheel now ALWAYS visible (not just on a sphere tap, see DepthsSpiralCore's
// own selectedWheelLevelSlug contract) rather than a momentary reveal,
// having the curve visibly fuse into its exact outline read as tangled,
// not connected — the curve now just tapers past it at its normal radius,
// and the wheel reads as its own fixed landmark the path visits, the way
// a game's status readout sits apart from the menu below it rather than
// being woven into the menu's own artwork. Sits comfortably within
// DepthsSpiralCore's own h∈[0, H_CUT] canvas (H_CUT=1.55 > WHEEL_H=1.31).
export const WHEEL_H = 1.41;
// Passed as VibrationSpectrum's own `size` prop — its bounding box (with
// ticks/marker) comes out a little larger than this, roughly ~140px.
// Grown from 92 (2026-08-30, "much bigger") once the gap itself was
// widened (ACTION_H_START/H_MAX above) to fit it with real margin at the
// smallest supported SPIRAL_WIDTH (~138px gap before the widening,
// ~180px+ after). Grown again to 280, then 380 (both 2026-09-02, at the
// user's own request — the "perfect world" wheel: much bigger, sitting
// at the canvas's own right edge with only its bottom-left QUARTER
// visible — see DepthsSpiralCore.tsx's own wheelPos comment for the
// vertical bleed added alongside the horizontal one). Only a quarter
// ever showing is what makes a size this large work at all — the
// visible slice stays a normal, legible size even as the full circle
// grows well past the canvas's own bounds. This only works now that the
// wheel no longer needs to fit fully on-screen beside the quote — see
// depths/index.tsx's own comment on why the quote moved back to its own
// full-width line once this changed.
export const WHEEL_SIZE = 340;
// How far the wheel's own center sits from the canvas's right edge
// (bendTargetX = width - WHEEL_SIZE/2 - WHEEL_SIDE_MARGIN, computed in
// DepthsSpiralCore.tsx). 2026-09-03 — moved here from being a local
// const duplicated in TWO places (DepthsSpiralCore.tsx's own
// bendTargetX calculation, and depths/index.tsx's own quoteColumnWidth
// calculation, which needs to know where the wheel's left edge lands so
// the quote's own column stops short of it) — the two copies drifted out
// of sync in practice (one was tuned down to 0, the other stayed at its
// old value of 40, silently leaving the quote's column too narrow/with
// dead space once the wheel moved closer to the edge). One named export
// here is the only value either file should read.
export const WHEEL_SIDE_MARGIN = 12;
// How far the wheel's own center is lifted above its curve-anchored
// position (WHEEL_H) — a fraction of WHEEL_SIZE, so it scales with the
// wheel rather than a flat pixel count. 2026-09-02 — shared export for
// the same reason WHEEL_SIDE_MARGIN is: depths/index.tsx's own
// wheelTopAboveFeet (canvas headroom sizing) needs to agree with
// DepthsSpiralCore.tsx's own real lift, or the canvas reserves the WRONG
// amount of vertical space above the aura — confirmed as a real bug
// (dead empty space between the quote and the curve, since
// wheelTopAboveFeet was still assuming a flat +wheelSize/2 straight
// above WHEEL_H, not this lift).
export const WHEEL_LIFT_RATIO = 0.09;

// A closed loop, at the very TOP of the curve past "Measure again"
// (2026-08-31) — originally sized to visually connect with a quote-bubble
// shape rendered above the spiral (QuoteBubble.tsx, dropped 2026-09-01);
// kept as a purely decorative flourish now that that shape is gone, at
// the user's own request ("I really like it visually"). Only a BLEND-IN
// is needed here (unlike the wheel, which no longer bends the curve at
// all — see WHEEL_H's own comment) — nothing continues above H_MAX, so
// the loop simply ends once it closes. Matches both value and slope
// against the live h>1 taper at the blend boundary (the taper's slope
// there is not zero, so smoothstep's own "zero-derivative" shortcut
// doesn't apply — full Hermite blend instead, same discipline used
// elsewhere in this file). Lives entirely inside DepthsSpiralMenu's own
// h∈[H_CUT, H_MAX] canvas.
export const TOP_LOOP_TARGET_PX = 100;
export const TOP_LOOP_CORE_HI = H_MAX;
export const TOP_LOOP_CORE_LO = TOP_LOOP_CORE_HI - 1 / TOTAL_TURNS;
const TOP_LOOP_BLEND_H = 0.1;
export const TOP_LOOP_BLEND_LO = TOP_LOOP_CORE_LO - TOP_LOOP_BLEND_H;

export function ellipseScaleForH(h: number): number {
  "worklet";
  if (h > 1) {
    const t2 = (h - 1) / (H_MAX - 1); // 0 at the old apex, 1 at the new one
    return APEX_SCALE * Math.exp(-EXT_SCALE_K * smoothstep(t2));
  }
  if (h >= H_GROUND) {
    // Upper half: 1 at H_GROUND, APEX_SCALE at h=1.
    const t = (h - H_GROUND) / (1 - H_GROUND);
    return Math.exp(-SCALE_K * smoothstep(t));
  }
  // Lower half: 1 at H_GROUND, 0 at h=0 — smoothstep itself (already
  // zero-derivative at both its own ends) taken directly as the scale, so
  // the ring shrinks smoothly all the way to a true point at the aura's
  // center rather than stopping at the ground ellipse's radius.
  const t = h / H_GROUND;
  return smoothstep(t);
}

// Closed-form derivative of ellipseScaleForH's h>1 branch — callers must
// only invoke this for h>1 (the wheel-loop band never touches h≤1).
// Needed so the Hermite blend below can match the live taper's SLOPE, not
// just its value, at each blend boundary — smoothstep's own zero-
// derivative-at-both-ends trick only works when the neighboring formula's
// own slope happens to already be zero at the seam (true at h=1 itself,
// NOT true at an arbitrary h>1 point like the wheel-loop's blend
// boundaries), so this file's usual smoothstep-blend approach can't be
// reused here without reintroducing a kink.
function ellipseScaleForH_dHdh(h: number): number {
  "worklet";
  const t2 = (h - 1) / (H_MAX - 1);
  const sPrime = 6 * t2 * (1 - t2); // smoothstep'(t) = 6t(1-t)
  return ellipseScaleForH(h) * (-EXT_SCALE_K * sPrime * (1 / (H_MAX - 1)));
}

// Standard cubic Hermite interpolation — the one blend primitive in this
// file that matches BOTH value and slope at both ends (smoothstep only
// guarantees zero slope at t=0/t=1, not a match to some other nonzero
// target slope), which is exactly what's needed to blend into/out of the
// wheel-loop's flat plateau without a kink.
export function cubicHermite(
  h: number,
  h0: number,
  h1: number,
  v0: number,
  m0: number,
  v1: number,
  m1: number,
): number {
  "worklet";
  const w = h1 - h0;
  const t = (h - h0) / w;
  const t2 = t * t;
  const t3 = t2 * t;
  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + t;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;
  return h00 * v0 + h10 * w * m0 + h01 * v1 + h11 * w * m1;
}

// TOP_LOOP_TARGET_PX is an absolute pixel radius, so it has to be divided
// back through THIS call's own baseRx/baseRy (the aura's base ellipse, in
// caller-supplied pixels) to get the fractional scale rxScaleForH/
// ryScaleForH are expected to return. rx and ry need genuinely DIFFERENT
// fractional targets: ry's real on-screen radius also gets multiplied by
// FORESHORTEN_Y downstream (see pointForH), so its target fraction must be
// inflated by 1/FORESHORTEN_Y to compensate — without this the "circle"
// would render as an ellipse, visibly narrower vertically than intended.
function topLoopTargetScales(baseRx: number, baseRy: number) {
  "worklet";
  return {
    rx: TOP_LOOP_TARGET_PX / baseRx,
    ry: TOP_LOOP_TARGET_PX / (baseRy * FORESHORTEN_Y),
  };
}

const FLATTEN_FACTOR = 0.45;
export function rxScaleForH(h: number, baseRx: number, baseRy: number): number {
  "worklet";
  // Top-loop: blend-in only — h=H_MAX (TOP_LOOP_CORE_HI) is the curve's
  // own true end, so there's no "blend back out" side to handle.
  if (h > TOP_LOOP_BLEND_LO) {
    const target = topLoopTargetScales(baseRx, baseRy).rx;
    if (h <= TOP_LOOP_CORE_LO) {
      const v0 = ellipseScaleForH(TOP_LOOP_BLEND_LO);
      const m0 = ellipseScaleForH_dHdh(TOP_LOOP_BLEND_LO);
      return cubicHermite(
        h,
        TOP_LOOP_BLEND_LO,
        TOP_LOOP_CORE_LO,
        v0,
        m0,
        target,
        0,
      );
    }
    return target;
  }
  return ellipseScaleForH(h);
}

// 2026-08-30: rounds out the 4th visible loop from the top (counting each
// left/right lobe of the winding as its own loop — 3 full 360° turns read
// as 6 such loops in this 2D projection; confirmed numerically via where
// the curve crosses its own vertical centerline). That loop's own h range
// is roughly [0.333, 0.5] — its ellipse ratio (ry/rx) was already one of
// the rounder bands on the spiral (~0.83, vs. ~0.57 near the apex), so the
// "sharp" read there wasn't really about aspect ratio — this bump softens
// FLATTEN_FACTOR's effect specifically across that band, pushing the ratio
// closer to 1 (more circular) right where that loop peaks, while blending
// smoothly back to the unmodified formula at both edges so no new kink is
// introduced (same "single continuous family, zero-derivative at the
// blend boundaries" discipline as smoothstep's own use elsewhere in this
// file). A pure decoration on top of the existing taper, not a formula
// replacement — every other loop is completely unaffected.
const LOOP4_BUMP_LO = 0.31;
const LOOP4_BUMP_HI = 0.52;
const LOOP4_ROUNDING = 0.5; // 0 = no effect, 1 = fully circular at the bump's peak
function loop4RoundingBump(h: number): number {
  "worklet";
  if (h <= LOOP4_BUMP_LO || h >= LOOP4_BUMP_HI) return 0;
  const mid = (LOOP4_BUMP_LO + LOOP4_BUMP_HI) / 2;
  const halfWidth = (LOOP4_BUMP_HI - LOOP4_BUMP_LO) / 2;
  const t = 1 - Math.abs(h - mid) / halfWidth;
  return smoothstep(Math.max(0, t));
}

// ry's own "real curve" value (before the wheel-loop plateau) — same
// formula ryScaleForH used to compute unconditionally; factored out so
// the wheel-loop's Hermite blend can call it directly at its own blend
// boundaries (both are always h>1 in this file's own domain, where
// loop4RoundingBump is always 0 and flatten is just the constant
// FLATTEN_FACTOR — see ryBase_dHdh's own comment for why that keeps the
// derivative simple).
function ryBase(h: number): number {
  "worklet";
  const flatten = FLATTEN_FACTOR * (1 - LOOP4_ROUNDING * loop4RoundingBump(h));
  return ellipseScaleForH(h) * (1 - flatten * smoothstep(Math.min(h, 1)));
}

// Derivative of ryBase, valid only for h>1 (where loop4RoundingBump is
// always 0 and smoothstep(min(h,1))=1, so flatten collapses to the
// constant FLATTEN_FACTOR and factors cleanly out of the product rule).
function ryBase_dHdh(h: number): number {
  "worklet";
  return ellipseScaleForH_dHdh(h) * (1 - FLATTEN_FACTOR);
}

export function ryScaleForH(h: number, baseRx: number, baseRy: number): number {
  "worklet";
  // Top-loop: blend-in only, same reasoning as rxScaleForH's own top-loop
  // branch — H_MAX is the curve's true end, nothing to blend back out to.
  if (h > TOP_LOOP_BLEND_LO) {
    const target = topLoopTargetScales(baseRx, baseRy).ry;
    if (h <= TOP_LOOP_CORE_LO) {
      const v0 = ryBase(TOP_LOOP_BLEND_LO);
      const m0 = ryBase_dHdh(TOP_LOOP_BLEND_LO);
      return cubicHermite(
        h,
        TOP_LOOP_BLEND_LO,
        TOP_LOOP_CORE_LO,
        v0,
        m0,
        target,
        0,
      );
    }
    return target;
  }
  // Clamped to 1 (2026-08-30, for the h>1 extension) — smoothstep(t) is
  // only well-behaved for t∈[0,1]; past that it's non-monotonic. Holding
  // the flatten factor steady at its own h=1 value for h>1 is a flat
  // continuation from a point smoothstep already has zero derivative at
  // — trivially smooth, no new kink risk.
  return ryBase(h);
}

// The aura figure is tall and narrow (per AuraFigure.tsx's own BODY
// drawing space, ~200×380), not round. This used to return the minimum
// safe distance from the base ellipse's own center at a given angle
// against an ELLIPSE matching the aura's real aspect ratio, so the
// spiral's lowest windings were routed AROUND the body's silhouette
// rather than through it (a single scalar minimum radius let the base
// winding clip through the head/legs while clearing the shoulders fine —
// the elliptical shape fixed THAT, but the clearance floor itself is what
// changed 2026-09-02: the user asked for the lowest winding(s) to cross
// freely through the aura's silhouette, to reclaim vertical space in
// Depths' fixed zone, rather than being detoured around it). See
// clearanceFadeForH below, now permanently 0 — this function is kept
// (not deleted) only because pointForH's call sites still pass
// clearanceRx/clearanceRy through and multiply by clearanceFadeForH; a
// future revert just needs to change clearanceFadeForH back, without
// re-deriving this math.
function ellipticalClearance(
  theta: number,
  clearanceX: number,
  clearanceY: number,
): number {
  "worklet";
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  // Standard polar-form ellipse radius: r(θ) = 1 / sqrt((cosθ/a)² + (sinθ/b)²)
  const denom = Math.sqrt(
    (cos * cos) / (clearanceX * clearanceX) +
      (sin * sin) / (clearanceY * clearanceY),
  );
  return denom > 0 ? 1 / denom : clearanceX;
}

export interface Point {
  x: number;
  y: number;
}

// Small margins so the ground ellipse's outermost point and the apex's
// topmost point don't clip against the canvas edge.
export const BASE_MARGIN = 4;
export const TOP_MARGIN = 4;

// The clearance floor used to be applied via Math.max in pointForH below,
// scaled by this fade so it only ever acted right at the ground (h<
// H_GROUND) and nowhere else — see clearanceFadeForH's OLD comment history
// in git for the full story: with 3 full turns, clearance's own
// oscillation (tied to theta, which cycles 3× per unit h) crossed the main
// taper curve repeatedly far from the ground when applied unconditionally,
// and Math.max between two curves whose VALUES cross but whose SLOPES
// differ produced a real, confirmed direction-reversal cusp at each
// crossing (verified on-device — visible sharp corners at h≈0.744 and
// h≈0.107). Fading the floor to zero at H_GROUND removed those extra
// crossings and was the fix at the time.
//
// 2026-09-02: this now permanently returns 0, at the user's own request —
// "let it cross freely through the body silhouette" — reclaiming the
// vertical space that used to be reserved so the curve could detour
// around the aura's silhouette near h≈0. This is SAFE from the exact kink
// class described above: with the floor's own contribution zeroed out,
// pointForH's Math.max(baseRx * rxScaleForH(...), clearance * scale * 0)
// always resolves to the LEFT operand (baseRx * rxScaleForH), i.e. the
// clearance term drops out of the max entirely rather than sometimes
// winning and sometimes losing — there is no more crossing between two
// competing curves for Math.max to produce a cusp at, because only one
// curve (the ordinary taper) is ever live. Verified visually — see this
// change's own verification notes; no new kink appeared at h≈0.744 or
// h≈0.107 or anywhere else along the curve.
function clearanceFadeForH(_h: number): number {
  "worklet";
  return 0;
}

// Produces one point on the conical spiral at a given normalized height h
// (0=base/aura, 1=apex) and canvas geometry. 'worklet' so both the static
// geometry builder (plain JS) and any UI-thread useAnimatedStyle worklet
// (the arrival descent, the sphere-tap pulse) can call the exact same
// function — never two independently-maintained copies of this math. This
// is the ONE function that must produce identical output given identical
// arguments in both DepthsSpiralCore and DepthsSpiralMenu — the seam
// continuity between the two canvases rests entirely on both of them
// calling this exact function (never reimplementing it) with correctly
// chosen chestY/riseHeight for their own local coordinate space.
// 2026-09-03 — the wheel moved off the aura's own head to sit beside the
// quote (wheel right, quote left, same row), and the curve's upper section
// (h∈(H_APEX, H_CUT]) now visibly BENDS toward the wheel's new position
// instead of the wheel detaching into an independent element. Below this,
// `baseCx` was a flat x-center for every h; xCenterForH keeps that exactly
// true for h≤H_APEX (the 4 sphere points and everything below — pixel-
// identical, per the plan's own "what stays exactly as-is") and smoothstep-
// blends the center itself toward `bendTargetX` over h∈(H_APEX, H_CUT],
// holding there past H_CUT. Same discipline as every other blend in this
// file (smoothstep, zero-derivative at both ends — see smoothstep's own
// comment) rather than a spliced Math.max/branch, which is exactly the
// class of bug this file's own kink-history comments warn against.
// `bendTargetX` defaults to `baseCx` (no bend) so every existing call site
// that doesn't pass it renders identically to before this change.
function xCenterForH(h: number, baseCx: number, bendTargetX: number): number {
  "worklet";
  if (h <= H_APEX) return baseCx;
  const t = Math.min((h - H_APEX) / (H_CUT - H_APEX), 1);
  return baseCx + (bendTargetX - baseCx) * smoothstep(t);
}

export function pointForH(
  h: number,
  baseCx: number,
  chestY: number,
  riseHeight: number,
  baseRx: number,
  baseRy: number,
  clearanceRx: number,
  clearanceRy: number,
  bendTargetX: number = baseCx,
): Point {
  "worklet";
  const theta = thetaForH(h);
  const scale = ellipseScaleForH(h);
  const clearance =
    ellipticalClearance(theta, clearanceRx, clearanceRy) * clearanceFadeForH(h);
  const rx = Math.max(
    baseRx * rxScaleForH(h, baseRx, baseRy),
    clearance * scale,
  );
  const ry = Math.max(
    baseRy * ryScaleForH(h, baseRx, baseRy),
    clearance * scale * FORESHORTEN_Y,
  );
  // Linear rise from the CHEST (h=0, the curve's true destination — the
  // aura's glowing focal point) up to the apex (h=1). The aura sits at
  // the base of the composition; the curve's own path rises above it
  // toward a bare apex, visibly climbing up out of the aura toward the
  // chest glow. `riseHeight` is "how far the spiral extends above
  // chestY," computed by the caller as (chestY - a small top margin).
  // The old `groundY` parameter stays dropped from this function's
  // signature — it was computed by callers but never actually read
  // inside this function, a leftover from an earlier version.
  const yCenter = chestY - h * riseHeight;
  const x = xCenterForH(h, baseCx, bendTargetX) + rx * Math.cos(theta);
  const y = yCenter + ry * Math.sin(theta) * FORESHORTEN_Y;
  return { x, y };
}

// Exported so anything positioning itself relative to a slot (a label, a
// future feature) can find the exact point without re-deriving the spiral
// math.
export function spiralPointPosition(
  slotIndex: number,
  width: number,
  height: number,
  chestY: number,
  clearanceX: number,
  clearanceY: number,
  riseHeight: number = chestY - TOP_MARGIN,
): Point {
  const baseCx = width / 2;
  const h = hForSlot(slotIndex);
  return pointForH(
    h,
    baseCx,
    chestY,
    riseHeight,
    clearanceX,
    clearanceY,
    clearanceX,
    clearanceY,
  );
}

export interface SpiralCoreGeometry {
  width: number;
  height: number;
  baseCx: number;
  chestY: number;
  riseHeight: number;
  pathD: string;
  points: Point[]; // one per slot, in SLOT_ORDER order
  // The full dense polyline (same points pathD draws from) — exposed so
  // label placement can check for/avoid the curve's own nearby loops, not
  // just other labels or the aura's silhouette.
  samples: Point[];
  // Where the drawn curve stops — the wheel's own circumference, once
  // wheelPos/wheelRadius are given (see buildSpiralCoreGeometry's own
  // drawStart trim). Lets a caller anchor content exactly at that touch
  // point without re-deriving the trim.
  curveTouchPoint: Point;
}

// Built once per width/height/clearance (memoized by the caller) — samples
// the CORE band only, h∈[0, H_CUT], building the SVG path string for
// DepthsSpiralCore. `chestY` is the curve's own true destination (h=0) —
// the aura's glowing chest point. Split out of the old buildSpiralGeometry
// (which sampled h∈[0, H_MAX] in one pass) so DepthsSpiralCore's own
// canvas only ever renders — and only ever needs to size itself for — the
// slice of curve it actually owns.
export function buildSpiralCoreGeometry(
  width: number,
  height: number,
  chestY: number,
  clearanceX: number,
  clearanceY: number,
  riseHeight: number = chestY - TOP_MARGIN,
  // 2026-09-03 — the wheel's new bend target (see xCenterForH's own
  // comment above pointForH). Defaults to baseCx (computed just below,
  // once width is known) via the `?? baseCx` at each call site inside this
  // function — passing it through here is what makes the DRAWN curve
  // actually bend, not just the independently-computed wheelPos in
  // DepthsSpiralCore.tsx; both must be given the exact same value by the
  // caller or the curve and the wheel will visibly disagree.
  bendTargetX?: number,
  // 2026-09-02 — where the wheel actually sits and how big it is, so the
  // drawn path can stop at its CIRCUMFERENCE instead of continuing all
  // the way to H_CUT (past WHEEL_H, the wheel's own anchor) and visibly
  // piercing into the ring's interior toward the center label. Optional
  // (defaults to no trim) so callers that don't care about the wheel —
  // none today, but keep the function total — aren't forced to pass it.
  wheelPos?: Point,
  wheelRadius?: number,
): SpiralCoreGeometry {
  const baseCx = width / 2;
  const resolvedBendTargetX = bendTargetX ?? baseCx;
  // Was 200 (for h∈[0,1]) — bumped proportionally (2026-08-30) so the
  // per-unit-LENGTH sample density (what the label-collision system's
  // step-based CURVE_AVOID_STEP_GAP actually depends on) stays consistent
  // across different sampled-range lengths. Kept proportional to H_CUT
  // (this canvas's own sampled span) rather than H_MAX now that the two
  // canvases sample disjoint ranges.
  const totalSteps = Math.round(200 * H_CUT);

  // Samples h∈[H_CUT, 0] (top of this canvas's slice down to the curve's
  // own bare terminus at the aura's chest glow) — so the line visibly
  // continues past the last sphere point and dissolves into the aura.
  const samples: Point[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const h = H_CUT * (1 - i / totalSteps);
    const p = pointForH(
      h,
      baseCx,
      chestY,
      riseHeight,
      clearanceX,
      clearanceY,
      clearanceX,
      clearanceY,
      resolvedBendTargetX,
    );
    samples.push(p);
  }

  // Trim the leading (highest-h, i.e. lowest-index) samples that fall
  // INSIDE the wheel's own circle — walk forward from i=0 (h=H_CUT, the
  // end closest to/past the wheel) until the first sample that's
  // actually outside the circle, and start the drawn path there. This is
  // a trim of the DRAWN path only — `samples` (used elsewhere for
  // curve-avoidance collision checks) stays the full, untrimmed set, so
  // label placement logic that scans `samples` for proximity is
  // unaffected by where the visible line happens to start.
  let drawStart = 0;
  if (wheelPos && wheelRadius) {
    while (
      drawStart < samples.length &&
      Math.hypot(
        samples[drawStart].x - wheelPos.x,
        samples[drawStart].y - wheelPos.y,
      ) < wheelRadius
    ) {
      drawStart++;
    }
  }

  const pathD = samples
    .slice(drawStart)
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // h → sample-index, given h = H_CUT * (1 - i/totalSteps) — solved for i.
  const stepForH = (h: number) => Math.round((1 - h / H_CUT) * totalSteps);

  const points: Point[] = [];
  for (let slot = 0; slot < TOTAL_SLOTS; slot++) {
    points.push(samples[stepForH(hForSlot(slot))]);
  }

  return {
    width,
    height,
    baseCx,
    chestY,
    riseHeight,
    pathD,
    points,
    samples,
    // The exact point the drawn curve stops at — where it touches the
    // wheel's own circumference (see drawStart's own comment above), or
    // samples[0] (h=H_CUT) when no wheelPos/wheelRadius was given.
    // Exported so a caller (DepthsSpiralCore.tsx) can anchor the wheel's
    // centerLabel here — "right where the spiral touches the wheel," at
    // the user's own request (2026-09-02) — without re-deriving the trim
    // math a second time.
    curveTouchPoint: samples[drawStart] ?? samples[0],
  };
}

export interface SpiralMenuGeometry {
  width: number;
  height: number;
  baseCx: number;
  // This canvas's own LOCAL chestY/riseHeight — NOT the same numbers
  // DepthsSpiralCore uses. See DepthsSpiralMenu.tsx's own header comment
  // for the seam-continuity derivation: this chestY is chosen so that
  // pointForH(H_CUT, baseCx, chestY, riseHeight, ...) lands at this
  // canvas's own local y=height (its bottom edge), matching where
  // DepthsSpiralCore's own h=H_CUT point sits at ITS canvas's bottom edge
  // — so the two curves meet with zero visible gap when Menu's canvas
  // renders immediately below Core's in the layout.
  chestY: number;
  riseHeight: number;
  pathD: string;
  actionPoints: Point[]; // one per ACTION_ORDER entry
  samples: Point[];
}

// Built once per width/height (memoized by the caller) — samples the MENU
// band only, h∈[H_CUT, H_MAX], building the SVG path string for
// DepthsSpiralMenu. Reuses the exact same pointForH/ellipseScaleForH/etc.
// as buildSpiralCoreGeometry above — the curve SHAPE at any h is a pure
// function of h alone (see pointForH's own comment: rx/ry never depend on
// chestY/riseHeight/baseCx, only on h), so passing this canvas's own local
// chestY/riseHeight here is what remaps that same shape into this
// canvas's own local pixel space without changing it.
export function buildSpiralMenuGeometry(
  width: number,
  height: number,
  chestY: number,
  riseHeight: number,
  clearanceX: number,
  clearanceY: number,
): SpiralMenuGeometry {
  const baseCx = width / 2;
  const totalSteps = Math.round(200 * (H_MAX - H_CUT));

  // Samples h∈[H_MAX, H_CUT] (this canvas's own top down to its own
  // bottom) — the mirror image of Core's own top-to-chest sampling, just
  // over this canvas's own slice of the domain.
  const samples: Point[] = [];
  for (let i = 0; i <= totalSteps; i++) {
    const h = H_MAX - (i / totalSteps) * (H_MAX - H_CUT);
    const p = pointForH(
      h,
      baseCx,
      chestY,
      riseHeight,
      clearanceX,
      clearanceY,
      clearanceX,
      clearanceY,
    );
    samples.push(p);
  }

  const pathD = samples
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // h → sample-index, given h = H_MAX - (i/totalSteps)*(H_MAX-H_CUT).
  const stepForH = (h: number) =>
    Math.round(((H_MAX - h) / (H_MAX - H_CUT)) * totalSteps);

  const actionPoints: Point[] = [];
  for (let i = 0; i < ACTION_ORDER.length; i++) {
    actionPoints.push(samples[stepForH(hForAction(i))]);
  }

  return {
    width,
    height,
    baseCx,
    chestY,
    riseHeight,
    pathD,
    actionPoints,
    samples,
  };
}

export interface SpiralSpherePoint {
  key: SphereKey;
  // Already-translated display name — DepthsSpiralCore stays pure/prop-
  // driven (no useTranslation of its own, matching AuraField.tsx's own
  // contract), so depths/index.tsx resolves the string before passing it
  // down.
  label: string;
  // This sphere's own hue (from sphereColors, same as AuraField's rings)
  // — RULES.md carves out a documented exception for Depths' sphere
  // visualization specifically to use 4 distinct colors, since the ring
  // already does this; the spiral's points now represent the same four
  // things, so matching is more consistent than defaulting to the single
  // screen accent.
  color: string;
  isSelected: boolean;
}

// One of the 4 "action" points on the spiral's upper extension (h>1) —
// Stay/Understand/Shift/Measure-again, replacing depths/index.tsx's old
// text-stack intentionSection. Deliberately NOT SpiralSpherePoint-shaped:
// no per-sphere color (these render in the one screen accent, per
// aesthetic.md's "no per-item color variety on a reading-scoped screen"
// — they aren't sphere readings, so they don't get that rule's narrow
// exception either), no isSelected (nothing here is ever "the current
// selection" the way a sphere reading is), and a fundamentally different
// tap contract — navigate away, not pulse-and-recolor-the-aura.
export interface SpiralActionPoint {
  key: SpiralActionKey;
  label: string; // already-translated, same contract as SpiralSpherePoint
  description: string; // already-translated/interpolated
  // 2026-09-02, extended 2026-09-03 — every point's own dot can now
  // render as a real symbol instead of the plain filled circle, per
  // DepthsMenuSymbol.tsx's own header comment (which already documented
  // this exact plan: Stay/Shift/Measure get their own DepthsMenuSymbol
  // glyphs, Understand it reuses the current philosopher's own
  // PhilosopherObject mark since that row means "talk with them").
  // `symbolId` names a DepthsMenuSymbol id (stay/shift/measure/
  // exploreMap/feelingLucky); `philosopherId` (used instead, for
  // "understand" only) names a PhilosopherObject id — the two are
  // mutually exclusive, DepthsSpiralMenu's ActionRow checks
  // philosopherId first. Both typed as bare strings (not their real
  // union types) to avoid this geometry-only file importing from
  // component files — DepthsSpiralMenu.tsx narrows/casts where it's
  // actually rendered. Undefined on both = the original plain dot,
  // unchanged (no current point actually leaves both undefined anymore,
  // but the fallback stays correct/total either way).
  symbolId?: string;
  philosopherId?: string;
}

// Shift's own 2 sub-points, revealed only after Shift is tapped (see
// depths/index.tsx's shiftRevealed state) — same label+description shape
// as SpiralActionPoint, kept as its own type since these are never part
// of the base actionPoints array.
export interface SpiralShiftSubPoint {
  key: SpiralShiftSubKey;
  label: string;
  description: string;
}

export const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const HIT = 44; // iOS/Android minimum recommended touch target — the
// sole tap surface for sphere-switching now that the button row beneath
// the aura has been removed (2026-08-29), so this is deliberately
// generous.
export const DOT_RADIUS = 5;

// Label-layout tuning shared between DepthsSpiralCore (sphere labels) and
// DepthsSpiralMenu (action/shift-sub labels) — kept here rather than
// duplicated so both files' collision-avoidance passes stay tuned
// identically.
export const LABEL_BOX_W = 90;
export const LABEL_BOX_H = fontSizes.xs * 2.4;
export const CURVE_AVOID_DIST = 16;
export const CURVE_AVOID_STEP_GAP = 20;
export const ACTION_LABEL_BOX_W = 140;
export const ACTION_LABEL_BOX_H =
  fontSizes.xs * 2.4 + fontSizes.xs * lineHeights.normal * 1.6;
export const SHIFT_SUB_LABEL_BOX_W = 110;
export const SHIFT_SUB_LABEL_BOX_H =
  fontSizes.xs * 2.4 + fontSizes.xs * lineHeights.normal * 1.1;
