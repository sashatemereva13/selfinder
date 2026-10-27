import { Dimensions } from "react-native";
import { spacing } from "../../theme/spacing";
import { buildAuraFieldGeometry } from "./AuraField";
import { getAuraFigureMetrics } from "../shared/AuraFigure";
import {
  H_CUT,
  H_MAX,
  WHEEL_SIZE,
  TOP_LOOP_TARGET_PX,
  TOP_MARGIN,
} from "./depthsSpiralGeometry";

// Pre-baked assets, not the live AuraFigure component — react-native-svg's
// filter engine doesn't reproduce the same result on-device, leaving the
// body visibly tinted (see auraLevelImages.ts).
// 130 — briefly shrunk to 108 on 2026-08-29 as part of a same-day compact-
// first-viewport pass, restored 2026-08-30 once the spiral itself went
// back to its original 3-turn shape (see DepthsSpiral.tsx's own header
// comment) and the compactness goal was dropped in favor of that shape's
// own elegance — the freed vertical room is used to spread other text out
// instead, not fought against. Shrunk again to 108 (2026-09-01, fixed/
// scroll split) — this time the goal is different: the fixed zone can no
// longer scroll or trim itself, so a genuinely smaller aura+ring
// composition (not just reclaimed empty margin) is what actually buys
// scrollZone more real, permanent screen space below it.
// BASE_AURA_DISPLAY_SIZE (was AURA_DISPLAY_SIZE, a flat module-level
// constant) — the TUNED, full-scale value; still the number every comment
// in this file referring to "108" describes. 2026-09-01: renamed and
// demoted from "the" size to "the base size a live scale factor multiplies"
// once the CSS-transform-scale shrink mechanism (see fixedZoneScale's own
// comment, further down) turned out not to work — react-native-web's
// `transform: scale()` does not reliably resize a plain <Image>'s own
// rendered box (confirmed via direct getBoundingClientRect measurement:
// the aura image's position/size was pixel-identical at two different
// scales). The fix is to make the actual GEOMETRY reactive to a computed
// scale (buildDepthsGeometry, below) instead of visually squashing
// already-fixed-size content after the fact — this constant is now only
// the scale-1 anchor that computation starts from, never rendered
// directly.
// 2026-09-02 — shrunk from 108, at the user's own request ("further
// away from the viewer... would literally just look like they are
// smaller") — the whole composition (aura + concentric rings + spiral)
// scales together from this one anchor. The user's own screenshot at
// the old size also showed the outermost ring clipped by the device's
// own bottom edge — belowFeetClearance (below) already derives its
// margin from the rings' real footprint (spiralAuraHalfHeight, matched
// to AuraField's own ring geometry, not just the aura silhouette), so
// this wasn't a clearance-math bug — the composition was simply taller
// than the visible viewport at that scale. Shrinking it here is the
// direct fix.
export const BASE_AURA_DISPLAY_SIZE = 170;
// The figure alone, drawn at this size within the composition laid out for
// BASE_AURA_DISPLAY_SIZE (2026-10-16 — shrinking the base size shrank and
// lowered everything with it; this makes only the figure smaller, standing
// on the same ground). Tune this to change the figure's size; tune
// BASE_AURA_DISPLAY_SIZE to change the whole composition.
export const AURA_FIGURE_SIZE = 180;
// 2026-09-02 — how much of the spiral's own topmost region (curve +
// wheel, whichever sits highest) is allowed to render past the fixed
// zone's own visible top edge and get cropped there — at the user's own
// request, framed as a deliberate visual metaphor ("the energy that goes
// outside the app"), not a bug to prevent. Fixed/constant on every
// screen size (the user's explicit choice: "always clip a fixed
// amount," not just on tall screens with spare room) — never derived
// from rootHeight/SPIRAL_HEIGHT_STRETCH/naturalContentHeight. Module-
// level (not a component-local const) since both the component body
// (the onLayout measurement fix) and makeStyles (auraCoreWrap's own
// negative marginTop) need it, and makeStyles is a separate top-level
// function, not a closure over the component's own locals.
export const BLEED_AMOUNT_PX = 0;
// The composition's own canvas — width fills a real 390px phone's content
// budget (columnWidth minus horizontal padding) the same way the old flat
// spiral did, so the shape itself reads as a real, spacious presence
// rather than a small diagram. Height is now taller than width (the cone
// rises above the aura's ground plane) — DepthsSpiralCore's own canvas
// (h∈[0, H_CUT]) sits in Depths' fixed zone, never scrolls; the rest of
// the cone (h∈[H_CUT, H_MAX], DepthsSpiralMenu) lives in the
// independently-scrollable zone below it (2026-09-01 fixed/scroll split
// — see this screen's own render comment). Point labels are allowed to
// extend slightly past this box (React Native doesn't clip children
// unless told to) — auraCoreWrap has no overflow:hidden, so a label near
// the canvas edge isn't cut off.
// Was a flat 342 — confirmed on a real device (iPhone-class, ~430pt
// logical width) that the four ground rings (AuraField, paired with this
// constant via SPIRAL_AURA_HALF_WIDTH below) sat with noticeably less
// margin from the canvas edge than the spiral's own loops directly above
// them (see collaboration notes on IMG_3945) — even though nothing was
// truly clipped by the phone bezel. But 342 flat was ALSO already too
// wide for the smallest supported phone: iPhone SE is 375pt, minus 48pt
// of horizontal padding (spacing[6] each side) leaves only a 327pt
// budget, so the old constant already silently overflowed there by 15pt
// before this change. Read once at module load via Dimensions.get
// ('window', matching useReadingColumnWidth's own choice, not 'screen' —
// see MessageCard.tsx for why 'screen' exists as a different, deliberate
// choice for a wallpaper-capture target, not a content column) rather
// than useWindowDimensions — this composition doesn't need to react
// live to rotation, so a static read avoids converting ~40 downstream
// geometry constants (AURA_FIELD_GEOMETRY, CORE_GEOMETRY, MENU_GEOMETRY,
// the arrival-animation timing) from module-level to per-render values,
// a much larger refactor than this fix warrants. Clamped between 327
// (SE's real safe budget) and 380 (a generous cap for large phones,
// paired with AuraField's own GROUND_RX_RATIO bump to 1.65) so every
// device gets a canvas that both fits its own screen AND gives the rings
// real room, rather than one flat number that was wrong at both ends.
export const SCREEN_WIDTH = Dimensions.get("window").width;
const SPIRAL_WIDTH = Math.min(
  Math.max(SCREEN_WIDTH - spacing[6] * 2, 327),
  380,
);
// 1.8 — briefly dropped to 1.1 on 2026-08-29 when the spiral collapsed to
// a 1-turn/4-sphere-point shape, then restored to 1.8 later that day once
// the spiral went back to its original 3-turn geometry (see
// DepthsSpiral.tsx's own header comment). Squeezed to 1.5 (2026-08-30,
// same day) at the user's own request — "shorter, but not by cutting it,
// squeezing it": every turn/point still exists (TOTAL_TURNS/SLOT_H in
// DepthsSpiral.tsx are unchanged), the windings just pack into less
// vertical room, an accordion compression rather than a truncation. Grown
// to 1.95, then 2.15, then 2.5, then 2.65 later the same day to fit the
// spiral's new h>1 action-point extension (DepthsSpiral.tsx's H_MAX,
// itself grown 1.5→1.9→2.05 the same day — the last bump specifically to
// widen the sphere/action gap for a meaningfully bigger vibration wheel,
// WHEEL_SIZE). Grown once more to 3.1 (2026-08-31) alongside H_MAX's own
// push to 2.55 — the user wanted the spiral to read as genuinely longer/
// taller, not just tighter-packed at the same scale. Grown once more to
// 3.6 the same day when H_MAX grew again (to 3.53) to fit a small closed
// loop past "Measure again" (DepthsSpiral.tsx's TOP_LOOP_*). Grown once
// more to 3.8 the same day when TOP_LOOP_TARGET_PX itself grew (55→100px)
// so the loop's own top edge would reach the quote bubble that used to sit
// above it (QuoteBubble.tsx, dropped 2026-09-01 — the top loop itself is
// kept, just decorative now, see DepthsSpiral.tsx's own TOP_LOOP_TARGET_PX
// comment) — see BASE_SPIRAL_TOTAL_HEIGHT below for why this growth does
// NOT also stretch riseHeight/chestY.
// 2026-09-01 — the single tall canvas (h∈[0, H_MAX]) was split into two:
// DepthsSpiralCore's own canvas (h∈[0, H_CUT], the aura/sphere/wheel zone,
// rendered in Depths' new FIXED middle zone) and DepthsSpiralMenu's own
// canvas (h∈[H_CUT, H_MAX], the action-point/top-loop zone, rendered as
// the first thing in Depths' new independently-SCROLLABLE bottom zone).
// See DepthsSpiralMenu.tsx's own header comment for the full seam-
// continuity derivation this geometry implements.
//
// This canvas used to be sized off a separate width-derived vertical
// BUDGET constant (baseSpiralTotalHeight, itself descended from the old
// single-canvas SPIRAL_TOTAL_HEIGHT), tuned independently of riseHeight —
// which drifted out of sync once riseHeight stopped being derived from
// that same budget (2026-09-02: riseHeight is now solved directly from
// feetToHeadSpan/H_CUT, see spiralRiseHeight's own comment below) and
// became a large unused excess once the curve itself got dramatically
// more compact — confirmed on-device as real empty canvas above the
// wheel that no margin-only fix could remove, since the excess lived in
// this budget constant, not in any single margin. The budget constant is
// gone; groundY/coreTotalHeight (below) are now built directly from what
// the content actually needs — see groundY's own comment.
// The spiral's inner clearance (and now also the cone's own base-ellipse
// dimensions — see depthsSpiralGeometry.ts) is an ELLIPSE, not a circle,
// matching AuraField's real footprint (its four concentric sphere-rings,
// which only render once a reading exists — the larger, safer case to
// clear; the plain neutral aura alone is smaller). A flat margin on top
// so the spiral's own base winding sits visibly outside the body/rings,
// not flush against their edge. See depthsSpiralGeometry.ts's own
// ellipticalClearance for why an ellipse: the aura figure is tall and
// narrow, so a single scalar radius was either too tight sideways or too
// loose vertically.
const AURA_CLEARANCE_MARGIN = 60;

// buildDepthsGeometry — 2026-09-02: the entire AURA_METRICS/AURA_FIELD_
// GEOMETRY/SPIRAL_AURA_HALF_*/SPIRAL_RISE_HEIGHT/CORE_*/MENU_* constant
// chain above used to be flat module-level consts, all derived (directly
// or transitively) from the single fixed BASE_AURA_DISPLAY_SIZE. That
// worked as long as the composition always rendered at one true size and
// any needed shrink was applied visually afterward (CSS transform:
// scale on a wrapping View). That visual-only shrink turned out not to
// work: react-native-web's transform:scale does not resize a plain
// <Image>'s own rendered box (confirmed via direct DOM measurement — the
// aura <img>'s getBoundingClientRect stayed pixel-identical at two very
// different computed scales), so on a short screen the aura kept
// rendering at full size regardless and clipped past the fixed zone's
// own bottom edge / under the tab bar.
//
// The fix: make the composition's actual SIZE reactive to a scale factor
// — everything below is now a pure function of one input,
// `auraDisplaySize` (BASE_AURA_DISPLAY_SIZE * a computed scale, see
// fixedZoneScale further down this file), called from inside the
// component via useMemo, not evaluated once at module load. SPIRAL_WIDTH
// stays OUTSIDE this function, unchanged, on purpose — it's derived from
// screen WIDTH, a completely separate axis from the aura's own display
// size, and the width axis never had a shrink problem (only vertical
// content, driven by the aura's height, could overflow). baseSpiralTotal
// Height, despite its width-derived formula (SPIRAL_WIDTH * 1.5), is NOT
// hoisted out the same way — it's the vertical canvas BUDGET the rest of
// this function fits into, and a first pass at this fix that left it
// fixed while only auraDisplaySize shrank was itself a bug (confirmed:
// spiralRiseHeight actually GREW as the aura shrank, since fewer pixels
// were needed for the aura's own clearance/margin terms, leaving MORE of
// the fixed budget for the curve to spend — the composition got TALLER,
// not shorter). All the
// derivation comments that used to sit beside each flat constant
// (SPIRAL_AURA_HALF_*, SPIRAL_RISE_HEIGHT, CORE_HEIGHT_GROWTH/
// CORE_TOTAL_HEIGHT, CORE_GEOMETRY's own groundY/chestY, MENU_TOTAL_
// HEIGHT, MENU_RISE_HEIGHT's flipped sign, MENU_GEOMETRY's own chestY
// derivation) are preserved verbatim inside this function — none of that
// MATH changed, only that it now runs per-scale instead of once.
export function buildDepthsGeometry(auraDisplaySize: number) {
  const auraMetrics = getAuraFigureMetrics(auraDisplaySize);
  // AuraField's own rings render absolutely-positioned (pulled out of
  // normal layout flow, so they can center on the aura's feet rather
  // than its geometric center — see AuraField's own groundNudge comment:
  // the aura stands inside the rings like a figure standing in a
  // summoning circle, not wrapped waist-high by them), which means
  // ringWrap has nothing left in normal flow to size itself against
  // except the aura image alone — smaller than the full ring set.
  // Without an explicit height here, ringWrap collapsed to the aura's
  // own size and everything below it (the level name, the sphere
  // buttons) started overlapping the rings' own lower half instead of
  // clearing them.
  const auraFieldGeometry = buildAuraFieldGeometry(auraDisplaySize);
  // The spiral's inner clearance (and now also the cone's own base-
  // ellipse dimensions — see depthsSpiralGeometry.ts) is an ELLIPSE, not
  // a circle, matching AuraField's real footprint (its four concentric
  // sphere-rings, which only render once a reading exists — the larger,
  // safer case to clear; the plain neutral aura alone is smaller). A
  // flat margin on top so the spiral's own base winding sits visibly
  // outside the body/rings, not flush against their edge. See
  // depthsSpiralGeometry.ts's own ellipticalClearance for why an
  // ellipse: the aura figure is tall and narrow, so a single scalar
  // radius was either too tight sideways or too loose vertically.
  const spiralAuraHalfWidth =
    auraFieldGeometry.svgWidth / 3 + AURA_CLEARANCE_MARGIN;
  const spiralAuraHalfHeight =
    auraFieldGeometry.svgHeight / 2 + AURA_CLEARANCE_MARGIN;
  // 2026-09-02 — the spiral's own h=0 destination moved from the aura's
  // CHEST to its FEET, and riseHeight is now derived directly from a
  // pixel TARGET (h=H_CUT should land at the aura's own HEAD) rather than
  // from a width-derived vertical budget (baseSpiralTotalHeight, still
  // used elsewhere — e.g. groundY below — but no longer what determines
  // riseHeight). At the user's own request: "make it start at the bottom
  // of aura-body and end at the head of the aura-body" — the curve should
  // occupy exactly the aura figure's own head-to-feet span, not several
  // times that. Measured before this change: the spiral canvas was
  // ~475px tall against an aura only ~227px tall (AURA_DISPLAY_SIZE=108)
  // — over 2x the figure's own height, the single largest reclaimable
  // chunk of the fixed zone found in this pass. feetToHeadSpan is exactly
  // that target span; spiralRiseHeight is solved so pointForH(H_CUT, ...)
  // lands there.
  const feetToHeadSpan = auraMetrics.legsBottomY - auraMetrics.headY;
  // SPIRAL_HEIGHT_STRETCH (2026-09-02, at the user's own request — "I
  // would increase the spiral's height too") — grows the curve's own
  // climb rate WITHOUT growing the aura figure itself (a separate ask
  // from BASE_AURA_DISPLAY_SIZE above, which scales the whole figure and
  // was tried first but clipped "Body" off the right edge at the size
  // needed to reach the top of the screen). 1 = feetToHeadSpan exactly
  // (today's default, the curve reaches exactly the aura's own head);
  // >1 = the curve keeps climbing past the head by that multiple,
  // reaching further up the fixed zone while the aura's own size and the
  // wheel's own h-position (WHEEL_H, unchanged) stay exactly where they
  // are — only the RATE the curve climbs at changes, so the wheel now
  // sits further from the feet in real pixels, giving the composition
  // more presence without the aura itself growing or Body's dot clipping.
  const SPIRAL_HEIGHT_STRETCH = 3;
  const spiralRiseHeight = (feetToHeadSpan * SPIRAL_HEIGHT_STRETCH) / H_CUT;
  // The wheel's own pixel diameter, scaled down together with the rest
  // of the composition (2026-09-02) — WHEEL_SIZE is a fixed constant
  // (170px) sized for BASE_AURA_DISPLAY_SIZE; scaling it by the same
  // ratio auraDisplaySize itself is scaled by is what keeps the wheel's
  // own required headroom (below) consistent with the rest of this
  // function's math at any scale, including when Depths' own shrink-to-
  // fit mechanism calls this with a smaller auraDisplaySize. Without
  // this, the wheel stayed full-size while riseHeight shrank around it,
  // producing a real, confirmed broken layout (see wheelSize's own prop
  // comment in DepthsSpiralCore.tsx for the exact failure).
  const auraScale = auraDisplaySize / BASE_AURA_DISPLAY_SIZE;
  const wheelSize = WHEEL_SIZE * auraScale;
  // The ring/base-ellipse clearance the aura itself needs BELOW its own
  // feet, inside the canvas's own bottom margin (auraCoreWrap's negative
  // marginBottom below reclaims everything past this, back up to the
  // canvas's true bottom edge — see that style's own comment). Not to be
  // confused with groundY (below), which is measured from the canvas's
  // TOP edge instead — 2026-09-02 found and fixed a real bug where these
  // two were briefly conflated (groundY was set equal to this value,
  // which is far too small to contain the curve above it — pointForH's
  // own yCenter went NEGATIVE at h=H_CUT, meaning the curve, and the
  // wheel along with it, rendered above the canvas's own top edge no
  // matter how tall coreTotalHeight grew, since the real problem was
  // groundY's value, not the canvas's total size).
  const belowFeetClearance = spiralAuraHalfHeight + spacing[8];
  // How much room DepthsSpiralCore's own canvas needs above the feet.
  // Used to take whichever was taller of (a) H_CUT's own curve extent or
  // (b) the WHEEL's own full bounding circle straight above WHEEL_H —
  // back when the wheel needed to stay fully on-screen, clipping it was
  // a hard bug. 2026-09-02: the wheel is now DELIBERATELY bled/cropped
  // (only its bottom-left quarter ever visible — see DepthsSpiralCore
  // .tsx's own wheelPos/WHEEL_LIFT_RATIO comment), so reserving its full
  // bounding-circle headroom here is no longer correct — it was
  // reserving real vertical space for a wheel extent that's supposed to
  // be cropped, not shown, producing a large dead gap between the quote
  // and the curve (confirmed via the user's own screenshot). Sized off
  // the curve's own extent alone now; the wheel's bleed is fixedZone's
  // own overflow:'hidden' to handle, not this canvas's height.
  const coreHeightGrowth = H_CUT * spiralRiseHeight + TOP_MARGIN;
  const coreTotalHeight = belowFeetClearance + coreHeightGrowth;
  // groundY — the aura's own feet position within the canvas, measured
  // DOWN from the canvas's own top edge — is coreHeightGrowth itself, NOT
  // belowFeetClearance (a real bug found and fixed 2026-09-02: an earlier
  // draft of this function set groundY = belowFeetClearance, the
  // clearance BELOW the feet — the wrong quantity entirely, small enough
  // that pointForH's own yCenter = chestY - h·riseHeight went NEGATIVE at
  // h=H_CUT, meaning the curve's own canvas-top point, and the wheel
  // along with it, rendered ABOVE y=0 regardless of coreTotalHeight —
  // confirmed via direct DOM measurement, a wheel SVG box at top:-2px
  // that never moved no matter how much coreHeightGrowth grew, since the
  // real problem was groundY's own value, not the canvas's total size).
  // groundY must be exactly how far the canvas's own top edge sits above
  // the feet — which is precisely what coreHeightGrowth (above) already
  // computes.
  const groundY = coreHeightGrowth;
  const coreGeometry = {
    width: SPIRAL_WIDTH,
    totalHeight: coreTotalHeight,
    groundY,
    // The curve's own true destination (h=0) is now the aura's own FEET
    // — groundY itself — not the chest (2026-09-02, see feetToHeadSpan's
    // own comment above for why). The ring/feet level and the curve's own
    // base both land at exactly the same point now, by construction.
    chestY: groundY,
    riseHeight: spiralRiseHeight,
    wheelSize,
  };
  // DepthsSpiralMenu's own canvas — h∈[H_CUT, H_MAX], rendered as the
  // first child of Depths' scrollable bottom zone, immediately below
  // CORE_GEOMETRY's own canvas in the fixed zone above it. Sized to
  // comfortably contain that h-span (riseHeight * (H_MAX - H_CUT)
  // pixels) plus the top loop's own radius (TOP_LOOP_TARGET_PX, since
  // the loop is a ~100px-radius circle centered at h=H_MAX, not a point)
  // and a small margin on both ends.
  const menuTotalHeight =
    spiralRiseHeight * (H_MAX - H_CUT) + TOP_LOOP_TARGET_PX + TOP_MARGIN * 2;
  // riseHeight's SIGN is deliberately flipped from Core's own (negative,
  // not +spiralRiseHeight) — same MAGNITUDE (keeping the curve's rate-of-
  // climb visually consistent across the seam, per the plan this
  // implements), but the opposite orientation, because Menu's canvas
  // sits BELOW Core in DOM/scroll order while the curve's h keeps
  // climbing (visually "up") past H_CUT. For the seam to look
  // continuous, whatever renders at MENU's own DOM-TOP (physically
  // adjacent to Core's own DOM-bottom) must be h=H_CUT — the same h
  // Core's own bottom already is. In Core's own convention (yCenter =
  // chestY - h·riseHeight, riseHeight>0), increasing h means DECREASING
  // y (rising up the screen) — reusing that same sign for Menu would put
  // h=H_CUT (the smaller of Menu's two h bounds) at a LARGER y than
  // h=H_MAX, i.e. H_CUT would land near Menu's own DOM-BOTTOM, not its
  // top — exactly backwards, confirmed visually (an earlier version of
  // this file had unflipped riseHeight here, and the seam showed a large
  // gap: Core's bottom met empty canvas space, not Menu's own H_CUT
  // point, until scrolling all the way past the action points to Menu's
  // own far bottom edge). Flipping the sign makes y increase WITH h in
  // Menu's own local space instead — h=H_CUT at local y≈0 (Menu's
  // DOM-top, meeting Core's bottom), h=H_MAX (the top loop) at local
  // y≈menuTotalHeight (Menu's own DOM-bottom, reached only after
  // scrolling past the action points) — which also reads naturally as
  // UX: the action points (h just above H_CUT) appear first, right
  // after Core, and the purely decorative loop (h=H_MAX) is the last
  // thing reached.
  const menuRiseHeight = -spiralRiseHeight;
  const menuGeometry = {
    width: SPIRAL_WIDTH,
    height: menuTotalHeight,
    riseHeight: menuRiseHeight,
    // Solves menuChestY so pointForH(H_CUT, ..., menuChestY,
    // menuRiseHeight, ...)'s own yCenter lands at local y=0 (this
    // canvas's own top edge, right where Core's bottom edge sits
    // immediately above it):
    //   yCenter(H_CUT) = menuChestY - H_CUT·menuRiseHeight
    //                  = menuChestY + H_CUT·spiralRiseHeight  (want = 0)
    //     => menuChestY = -H_CUT · spiralRiseHeight
    // (Not coreGeometry.chestY-derived at all — chestY here is this
    // canvas's own LOCAL virtual "h=0" reference point, unrelated to
    // Core's own chestY value; only riseHeight's shared MAGNITUDE and
    // matching h at the shared boundary matter for continuity, not any
    // direct arithmetic relationship between the two chestY values
    // themselves.)
    chestY: -H_CUT * spiralRiseHeight,
  };
  return {
    auraDisplaySize,
    auraMetrics,
    auraFieldGeometry,
    spiralAuraHalfWidth,
    spiralAuraHalfHeight,
    core: coreGeometry,
    menu: menuGeometry,
  };
}

export type DepthsGeometry = ReturnType<typeof buildDepthsGeometry>;
