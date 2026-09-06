import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, Href } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Ellipse as SvgEllipse } from "react-native-svg";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  runOnJS,
  cancelAnimation,
  Easing,
  type SharedValue,
} from "react-native-reanimated";
import { useThemeColors } from "../../../src/theme/useThemeColors";
import { useThemeStore } from "../../../src/store/themeStore";
import { type Colors } from "../../../src/theme/colors";
import {
  fonts,
  fontSizes,
  letterSpacings,
  lineHeights,
} from "../../../src/theme/typography";
import { spacing } from "../../../src/theme/spacing";
import { useWideColumnWidth } from "../../../src/theme/responsive";
import { useMeasureStore } from "../../../src/store/measureStore";
import { usePhilosopherStore } from "../../../src/store/philosopherStore";
import { useGuideChatStore } from "../../../src/store/guideChatStore";
import {
  useEngagementStore,
  DiscoverableFeature,
} from "../../../src/store/engagementStore";
import {
  getLevelBySlug,
  getLocalizedLevel,
} from "../../../src/content/levelsContent";
import {
  useLevelColors,
  getLocalizedLevelName,
} from "../../../src/content/measureConfig";
import { useLocaleStore } from "../../../src/store/localeStore";
import { Sphere } from "../../../src/types";
import { LongPressToSave } from "../../../src/components/LongPressToSave";
import { AmbientGlow } from "../../../src/components/AmbientGlow";
import { PhilosopherPresence } from "../../../src/components/PhilosopherPresence";
import { PhilosopherEnergy } from "../../../src/components/PhilosopherEnergy";
import { ProfileIcon } from "../../../src/components/ProfileIcon";
import {
  buildAuraFieldGeometry,
  RING_ORDER,
  type SphereKey,
} from "../../../src/components/AuraField";
import {
  getAuraFigureMetrics,
  AURA_NEUTRAL_COLOR,
} from "../../../src/components/AuraFigure";
import {
  AURA_LEVEL_IMAGES,
  AURA_NEUTRAL_IMAGE,
  AURA_LEVEL_IMAGES_LIGHT,
  AURA_NEUTRAL_IMAGE_LIGHT,
} from "../../../src/content/auraLevelImages";
import { useAppAccentRgb } from "../../../src/utils/appAccent";
import { track } from "../../../src/utils/analytics";
import { formatRelativeDay } from "../../../src/utils/relativeTime";
import { DepthsSpiralCore } from "../../../src/components/DepthsSpiralCore";
import { DepthsSpiralMenu } from "../../../src/components/DepthsSpiralMenu";
import {
  SLOT_ORDER,
  H_CUT,
  H_MAX,
  WHEEL_SIZE,
  TOP_LOOP_TARGET_PX,
  TOP_MARGIN,
  type SpiralSpherePoint,
  type SpiralActionPoint,
  type SpiralActionKey,
  type SpiralShiftSubPoint,
  type SpiralShiftSubKey,
} from "../../../src/components/depthsSpiralGeometry";

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
const BASE_AURA_DISPLAY_SIZE = 93;
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
const BLEED_AMOUNT_PX = 10;
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
const SCREEN_WIDTH = Dimensions.get("window").width;
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
const AURA_CLEARANCE_MARGIN = 45;

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
function buildDepthsGeometry(auraDisplaySize: number) {
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
    auraFieldGeometry.svgWidth / 2 + AURA_CLEARANCE_MARGIN;
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
  const SPIRAL_HEIGHT_STRETCH = 3.2;
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

type DepthsGeometry = ReturnType<typeof buildDepthsGeometry>;

// Same slow-decelerate easing as onboarding's own "gather, condense,
// become" motion (see app/onboarding/index.tsx's SOFT_EASE) — reused here
// rather than redeclared with different tuning, so a reading's arrival on
// Depths feels like the same hand as the very first bloom-in, not a
// separate, unrelated animation system.
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// PHASE B — the reveal animation for the concentric-rings field (see
// AuraField.tsx for why this replaced the earlier 17-dot wheel entirely).
// Two acts, same discipline as the wheel version: suspense before payoff,
// each beat visibly causing the next rather than coincidental timing.
// Act 1 (draw): the four rings grow outward from radius 0 to their true
// size, one at a time in RING_ORDER (heart → mind → body → spirit), all
// in a dim neutral tone — no color shown yet, so watching them draw
// themselves carries the suspense the old wheel spin used to. Each ring's
// grow-in overshoots and settles with a few decaying bounces rather than
// a plain smooth grow, the bounce RATE set by that sphere's own
// vibration score (buildRingGrowSequence) — this is where "frequency"
// lives, as a property of the entrance motion, not a perpetual idle
// ripple (an earlier version had every settled ring continuously
// wobbling forever, which read as noise rather than a moment that
// resolves). Act 2 (reveal): a brief anticipation dip, then each ring
// crossfades from neutral to its true sphere color, staggered the same
// order — you watch each "layer" of the reading confirm itself
// individually. The aura's own materialization starts the instant the
// FIRST ring begins settling into color, so it reads as caused by the
// rings resolving, not a parallel coincidence.
// Slower than the first pass — a quick grow read as mechanical/UI-ish
// rather than matching the unhurried, ceremonial pace the rest of this
// app's motion uses (see SOFT_EASE's own "gather, condense, become"
// framing above).
const RING_GROW_DURATION_MS = 950;
const RING_GROW_STAGGER_MS = 420;
const RING_COLOR_DURATION_MS = 850;
const RING_COLOR_STAGGER_MS = 380;
const ANTICIPATION_DURATION_MS = 400;
const ARRIVAL_DURATION_MS = 1700;
const COLOR_SETTLE_DURATION_MS = 1100;
const CONTENT_DURATION_MS = 800;

// Derived — every ring-count-dependent instant in the sequence, computed
// once here rather than re-derived per-render inside AuraArrival's own
// effect, so ArrivalReveal (a separate component, with no access to
// AuraArrival's internal per-ring shared values) can time its own fade-in
// off the same numbers without needing them passed down as a prop.
const RING_COUNT = 4;
const ALL_RINGS_GROWN_MS =
  (RING_COUNT - 1) * RING_GROW_STAGGER_MS + RING_GROW_DURATION_MS;
const COLOR_START_MS = ALL_RINGS_GROWN_MS + ANTICIPATION_DURATION_MS;
const LAST_RING_COLOR_SETTLED_MS =
  COLOR_START_MS +
  (RING_COUNT - 1) * RING_COLOR_STAGGER_MS +
  RING_COLOR_DURATION_MS;
const CONTENT_DELAY_MS = Math.max(
  LAST_RING_COLOR_SETTLED_MS,
  COLOR_START_MS + COLOR_SETTLE_DURATION_MS,
);

const SPHERE_LABEL_KEYS: Record<string, string> = {
  body: "common.sphereBody",
  mind: "common.sphereMind",
  heart: "common.sphereHeart",
  spirit: "common.sphereSpirit",
};

// Never Spill here, deliberately — it already has its two dedicated homes
// (the fork on Measure's entry screen, and Guide's rare invitation); adding
// a third, generic "try this" nudge for it would undercut exactly the
// positioning fix that gave it those two instead. Priority order matters:
// understanding what a level means is more foundational than a regulation
// tool, so it's offered first.
const DISCOVERY_NUDGES: {
  feature: DiscoverableFeature;
  labelKey: string;
  route: Href;
}[] = [
  {
    feature: "levels",
    labelKey: "depths.nudgeLevels",
    route: "/(tabs)/depths/levels",
  },
  {
    feature: "tuneIn",
    labelKey: "depths.nudgeTuneIn",
    route: "/(tabs)/depths/tunein",
  },
  {
    feature: "breathing",
    labelKey: "depths.nudgeBreathing",
    route: "/(tabs)/depths/breathing",
  },
];

type Tool = {
  key: string;
  labelKey: string;
  descriptionKey: string;
  route: Href;
};

// 2026-08-29: the spiral no longer does navigation (see DepthsSpiral.tsx's
// own header comment — it's sphere-only now). Tool routes still live here,
// just no longer framed as "spiral slots" — they're read directly by
// intentionSection's own rows below (Measure's new dedicated row, Shift's
// expanded Tune In/Breathing choice) and by Talk about it's own handler.
const TOOL_META = {
  measure: {
    labelKey: "depths.measureLabel",
    descriptionKey: "depths.measureDescription",
    route: "/(tabs)/depths/measure" as Href,
  },
  breathing: {
    labelKey: "depths.breathingLabel",
    descriptionKey: "depths.breathingDescription",
    route: "/(tabs)/depths/breathing" as Href,
  },
};
// Moon ('Understand your timing') is deliberately pulled out of the current
// flow, not deleted — its actual value (and a possible Sun/planets
// expansion) needs to be worked through before it earns a place next to
// Tune In. The screen still exists at app/(tabs)/depths/moon, unlinked, for
// when that's ready — likely as paid content.

// Kept outside the sequence and styled quieter — this one isn't a step, it's
// an alternative to the whole thing: skip finding out, let a message find
// you. "Feeling Lucky" (the old label) read as a random-internet-button
// idiom that didn't belong in this world; this says the same thing in
// Selfinder's own voice.
const FEELING_LUCKY: Tool = {
  key: "feeling-lucky",
  labelKey: "depths.feelingLuckyLabel",
  descriptionKey: "depths.feelingLuckyDescription",
  route: "/(tabs)/depths/feeling-lucky",
};

export default function DepthsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  const theme = useThemeStore((s) => s.theme);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useWideColumnWidth();
  const currentResult = useMeasureStore((s) => s.currentResult);
  const totalMeasureCount = useEngagementStore((s) => s.totalMeasureCount);
  const discovered = useEngagementStore((s) => s.discovered);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const setPendingMeasureResultId = useGuideChatStore(
    (s) => s.setPendingMeasureResultId,
  );
  // Read synchronously (safe — no store mutation) so the very first paint
  // already starts hidden/scaled-down when arriving; the flag itself is
  // cleared in the effect below, not here, since calling the store's set()
  // during render (inside a useState initializer) trips React's "cannot
  // update a component while rendering a different component" check.
  const [isArriving, setIsArriving] = useState(
    () => useMeasureStore.getState().justCompleted,
  );
  // Set true by a tap anywhere on the reveal — tells AuraArrival/
  // ArrivalReveal to cancel their in-flight timelines and jump straight to
  // the settled end state, then reset back to false once onSettled fires
  // (see the Pressable wrapping AuraArrival below).
  const [skipArrival, setSkipArrival] = useState(false);
  // Starts fully opaque black ONLY when arriving fresh from Measure — the
  // mirror image of interview.tsx's own exitFade: that screen fades TO
  // black and holds before navigating here, so this screen needs to
  // already be covered in black on its very first frame (or there'd be a
  // flash of the settled/empty page underneath before this fades in) and
  // then fade FROM black once mounted, completing the same beat of
  // stillness from the other side. A normal revisit (isArriving false)
  // never carries this — it stays fully transparent from frame one.
  const entryFade = useSharedValue(isArriving ? 1 : 0);
  useEffect(() => {
    if (isArriving) useMeasureStore.getState().consumeJustCompleted();
    if (entryFade.value > 0) {
      entryFade.value = withTiming(0, {
        duration: 500,
        easing: Easing.out(Easing.quad),
      });
    }
    // Only ever needs to run once, right after mount — isArriving flipping
    // back to false later (via onSettled) shouldn't re-fire this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // At most one nudge, for the highest-priority thing not yet found — never
  // stacked, never repeated once discovered. Only surfaced for someone who's
  // already established the core habit, not a first-timer still on Measure.
  const discoveryNudge =
    totalMeasureCount >= 2
      ? DISCOVERY_NUDGES.find((n) => !discovered[n.feature])
      : undefined;
  const rawLastLevel = currentResult
    ? getLevelBySlug(currentResult.vibrationLevel.slug)
    : undefined;
  const lastLevel = rawLastLevel
    ? getLocalizedLevel(rawLastLevel, locale)
    : undefined;
  // ONE accent color for the whole screen — the current level's, same as
  // everywhere else in the app since the per-philosopher/per-axis color
  // system was retired. The four sphere readings below used to each carry
  // their own LEVEL_COLORS hue (four different colors competing in one
  // screen); they're neutral text now, this single color is what's "yours"
  // here.
  const levelRgb = lastLevel
    ? (levelColors[lastLevel.slug] ?? accentRgb)
    : accentRgb;
  const levelColor = `rgb(${levelRgb})`;
  // combinationMessage was also shown again on the old reveal screen — that
  // was the literal duplicate (this is its one home now). The reveal
  // screen's OTHER line, a locally-computed "X reads highest, Y reads
  // lowest" sentence, isn't recreated here either: with the four rows sitting
  // right below in wheel form, restating their relationship in words was
  // just saying aloud what the rows already show — the wheel is the "actions
  // speak louder than words" version of that idea, not a sentence.
  const headlineMessage = lastLevel
    ? (currentResult?.combinationMessage ??
      lastLevel.personalFrame ??
      lastLevel.frame)
    : undefined;

  // Depths' aura field (AuraField/AuraArrival) only ever shows THIS
  // reading's four sphere colors — one concentric ring per sphere,
  // colored by that sphere's own LEVEL_COLORS hue — not the shared
  // 17-level map (Levels and a level's own detail page keep the full
  // VibrationSpectrum wheel, unchanged; this is a Depths-specific
  // personalization). Falls back to the level-agnostic accent color if a
  // given sphere's line is somehow missing.
  const sphereColors: Record<SphereKey, string> = useMemo(() => {
    const colorFor = (key: SphereKey) => {
      const slug = currentResult?.lines.find((l) => l.key === key)
        ?.vibrationLevel.slug;
      return `rgb(${(slug && levelColors[slug]) ?? accentRgb})`;
    };
    return {
      spirit: colorFor("spirit"),
      mind: colorFor("mind"),
      heart: colorFor("heart"),
      body: colorFor("body"),
    };
  }, [currentResult, accentRgb]);
  // Each sphere's own numeric vibrationScore — drives that ring's grow-in
  // BOUNCE RATE as it first appears (see AuraArrival's
  // buildRingGrowSequence). Frequency-only, never amplitude/shape, is a
  // deliberate choice: mapping score to how FAST a ring bounces into
  // place mirrors Hawkins' own "vibrational frequency" framing (the whole
  // 17-level scale this app already uses) without implying rank — a
  // faster bounce isn't "better" than a slower one any more than a high
  // musical note is better than a low one, which is NOT true of
  // amplitude/jaggedness (an app precedent — HeartMath's coherence
  // visualization — renders "low" states as jagged and "high" states as
  // smooth sine waves, which is exactly the good/bad visual hierarchy
  // RULES.md forbids; deliberately not doing that here). Once a ring
  // finishes settling it holds perfectly still — the frequency only ever
  // shapes the entrance, never a perpetual idle wobble.
  const sphereScores: Record<SphereKey, number> = useMemo(() => {
    const scoreFor = (key: SphereKey) =>
      currentResult?.lines.find((l) => l.key === key)?.vibrationScore ?? 400;
    return {
      spirit: scoreFor("spirit"),
      mind: scoreFor("mind"),
      heart: scoreFor("heart"),
      body: scoreFor("body"),
    };
  }, [currentResult]);

  // Which sphere's level is shown on the ring — null means the ring shows
  // the overall/combined reading (the default, idle state). Tapping one of
  // the four sphere buttons swaps the ring's marker AND the name text to
  // that sphere's own level; there's only ever one marker on the ring at a
  // time, not the overall reading plus a second highlight.
  const [selectedSphere, setSelectedSphere] = useState<Sphere | null>(null);
  const selectedLine = currentResult?.lines.find(
    (l) => l.key === selectedSphere,
  );
  const ringLevelSlug = selectedLine
    ? selectedLine.vibrationLevel.slug
    : currentResult?.vibrationLevel.slug;
  // For DepthsSpiral's own 17-level wheel (see its own header comment) —
  // 2026-09-01: now the SAME fallback pattern as ringLevelSlug/Name above
  // (was: null when no sphere selected, keeping the wheel hidden). The
  // wheel is a permanent landmark now, not a reveal-on-tap — with no
  // sphere selected it shows the overall/combined reading, exactly like
  // the aura's own ring does, rather than going blank.
  const wheelLevelSlug = selectedLine
    ? selectedLine.vibrationLevel.slug
    : (currentResult?.vibrationLevel.slug ?? null);
  // lastLevel?.title, NOT lastLevel?.name — LevelContent (levelsContent.ts)
  // keeps two separate fields: `name` is the lowercase internal slug-like
  // identifier ("neutrality"), `title` is the real capitalized display
  // string ("Neutrality"), same distinction VibrationLevel/measureConfig.ts
  // doesn't have (its own .name IS the display string there, just also
  // lowercase — getLocalizedLevelName's own English branch returns it
  // as-is). Using .name here was a real, confirmed bug: every OTHER level
  // name on this screen displays capitalized via .title somewhere else
  // in that same content object, except this one fallback path, which
  // read the wrong field and showed the raw lowercase identifier instead
  // (confirmed by the user's own screenshot: "neutrality" was the one
  // level reading lowercase while all 16 others were capitalized).
  const wheelLevelName = selectedLine
    ? getLocalizedLevelName(selectedLine.vibrationLevel, locale)
    : (lastLevel?.title ?? null);
  // 2026-08-29: the spiral's own points, now the four spheres (see
  // DepthsSpiral.tsx's own header comment) — built in SLOT_ORDER, NOT
  // RING_ORDER: DepthsSpiral consumes `points` POSITIONALLY (points[i]
  // pairs with its own geometry.points[i], built from SLOT_ORDER[i]'s own
  // h-slot), so this array's order must match SLOT_ORDER exactly, not
  // AuraField's own ring draw-order (RING_ORDER — a different ordering,
  // on purpose, since 2026-08-31: Heart/Mind/Spirit/Body on the spiral vs
  // Heart/Mind/Body/Spirit on the rings). Labels use the same
  // SPHERE_LABEL_KEYS translation the button row used to (see below) —
  // there is no separate spiral-specific copy anymore.
  const spherePoints: SpiralSpherePoint[] = useMemo(
    () =>
      SLOT_ORDER.map((key) => ({
        key,
        label: t(SPHERE_LABEL_KEYS[key] ?? key),
        color: sphereColors[key],
        isSelected: selectedSphere === key,
      })),
    [sphereColors, selectedSphere, t],
  );

  // Pre-reading equivalent — points still render (position continuity with
  // the post-reading render), just neutral-colored and non-interactive,
  // since no per-sphere data exists yet. `color`/`isSelected` are unused by
  // DepthsSpiral when `interactive` is false (it falls back to the accent
  // color and a flat dim opacity itself), kept here only to satisfy the
  // prop type.
  const neutralSpherePoints: SpiralSpherePoint[] = useMemo(
    () =>
      SLOT_ORDER.map((key) => ({
        key,
        label: t(SPHERE_LABEL_KEYS[key] ?? key),
        color: accentColor,
        isSelected: false,
      })),
    [t, accentColor],
  );

  // A quick confirmation pulse plays from the tapped point down into the
  // aura's chest, THEN selectedSphere toggles (see onPulseSettled below) —
  // so AuraField's ring-dimming reads as caused by the pulse landing, not
  // simultaneous-but-unrelated (causality over coincidence, per aesthetic.
  // md's own motion rule). Cleared once the pulse settles.
  const [pulsingSphere, setPulsingSphere] = useState<SphereKey | null>(null);
  const handleSpherePointPress = (key: SphereKey) => {
    if (pulsingSphere) return; // one pulse at a time
    setPulsingSphere(key);
  };
  const handlePulseSettled = () => {
    setSelectedSphere((s) => (s === pulsingSphere ? null : pulsingSphere));
    setPulsingSphere(null);
  };

  // The former intentionSection rows (Stay/Understand/Shift/Measure again),
  // folded onto the spiral's own upper h>1 extension 2026-08-30 — see
  // DepthsSpiral.tsx's SpiralActionKey. "Understand" only appears once a
  // philosopher is set, mirroring the old intentionRow's own guard.
  const actionSpiralPoints: SpiralActionPoint[] = useMemo(() => {
    const list: SpiralActionPoint[] = [
      {
        key: "stay",
        label: t("depths.stayWithIt"),
        description: discovered.spill
          ? t("depths.stayWithItCardsAndSpill")
          : t("depths.stayWithItCardsOnly"),
        // 2026-09-03 — symbolId wires up DepthsMenuSymbol's own
        // already-designed "stay" glyph (stayPath in that file), which
        // existed but was never actually rendered as a dot until now.
        symbolId: "stay",
      },
    ];
    if (philosopher) {
      list.push({
        key: "understand",
        label: t("depths.understandIt"),
        description: t("depths.understandItDescription", {
          name: philosopher.name,
        }),
        // "Understand it" reuses the current philosopher's OWN
        // PhilosopherObject mark, not a DepthsMenuSymbol glyph — this
        // row literally means "talk with them," so its own symbol
        // should BE them (see DepthsMenuSymbol.tsx's own header comment,
        // which documented this exact plan when the symbol set was
        // first designed).
        philosopherId: philosopher.id,
      });
    }
    list.push(
      {
        key: "shift",
        label: t("depths.shiftIt"),
        description: t("depths.shiftItDescription"),
        symbolId: "shift",
      },
      {
        key: "measure",
        label: t("depths.measureAgain"),
        description: t("depths.measureAgainDescription"),
        symbolId: "measure",
      },
      // 2026-09-02 — moved onto the curve from their own plain wideMenuRow
      // rows (now removed), at the user's own request: everything else on
      // this screen has the spiral's own visual language, and these two
      // read as a generic settings-style list by comparison. Same exact
      // translated strings, just relocated. (2026-09-03: every point now
      // has its own symbol, not just these two — see stay/understand/
      // shift/measure above — but exploreMap/feelingLucky's own symbols
      // still mark a genuinely different CATEGORY, open-ended exploration
      // rather than this reading's own next steps.)
      {
        key: "exploreMap",
        label: t("depths.exploreTheMap"),
        description: t("depths.exploreTheMapDescription"),
        symbolId: "exploreMap",
      },
      {
        key: "feelingLucky",
        label: t(FEELING_LUCKY.labelKey),
        description: t(FEELING_LUCKY.descriptionKey),
        symbolId: "feelingLucky",
      },
    );
    return list;
  }, [t, discovered.spill, philosopher]);

  const shiftSubSpiralPoints: SpiralShiftSubPoint[] = useMemo(
    () => [
      {
        key: "tuneIn",
        label: t("depths.tuneInLabel"),
        description: t("depths.tuneInDescription"),
      },
      {
        key: "breathing",
        label: t(TOOL_META.breathing.labelKey),
        description: t(TOOL_META.breathing.descriptionKey),
      },
    ],
    [t],
  );

  const [pulsingAction, setPulsingAction] = useState<
    SpiralActionKey | SpiralShiftSubKey | null
  >(null);
  const [shiftRevealed, setShiftRevealed] = useState(false);

  const handleActionPress = (key: SpiralActionKey) => {
    if (pulsingAction) return;
    if (key === "shift") {
      setShiftRevealed((r) => !r);
      return;
    }
    setPulsingAction(key);
  };
  const handleShiftSubPress = (key: SpiralShiftSubKey) => {
    if (pulsingAction) return;
    setPulsingAction(key);
  };
  const handleActionPulseSettled = () => {
    const settled = pulsingAction;
    setPulsingAction(null);
    setShiftRevealed(false);
    switch (settled) {
      case "stay":
        router.push("/(tabs)/depths/cards");
        break;
      case "understand":
        handleTalkAboutIt();
        break;
      case "measure":
        router.push(TOOL_META.measure.route);
        break;
      case "exploreMap":
        router.push("/(tabs)/depths/levels");
        break;
      case "feelingLucky":
        router.push(FEELING_LUCKY.route);
        break;
      case "tuneIn":
        router.push("/(tabs)/depths/tunein");
        break;
      case "breathing":
        router.push(TOOL_META.breathing.route);
        break;
      default:
        break;
    }
  };

  // Traveling arrival-descent marker (see DepthsSpiral.tsx's own
  // playArrivalDescent prop) — plays once, right after a reading completes,
  // timed to land exactly as the aura body finishes forming (COLOR_START_MS
  // /ARRIVAL_DURATION_MS, the same instant/duration AuraArrival's own body
  // animation uses below). Gated on isArriving alone — the same flag that
  // already governs "fresh arrival only, never replay on revisit" for the
  // rest of the reveal, so no separate first-run-only guard is needed here
  // (this plays on EVERY fresh arrival now, not just someone's very first
  // reading ever, which is what the old aura→Levels travel marker was
  // gated on).
  const playArrivalDescent = isArriving && !skipArrival;

  const goToLevel = (slug: string) => {
    router.push({
      pathname: "/(tabs)/depths/level/[id]",
      params: { id: slug },
    });
  };

  // Was reveal's own action, keyed to the reading that had just finished;
  // here it just reads off currentResult directly, since that's always the
  // most recent reading regardless of how someone arrived at this screen.
  // Always sends to Guide, plain and unnudged — the past-threshold upsell
  // nudge that used to live on the not-subscribed Your Arc preview screen
  // was removed 2026-08-28 along with that screen, once Selfinder went
  // fully free and there was nothing left to nudge toward.
  const AXIS_LABEL_KEYS: Record<string, string> = {
    calm: "common.axisCalm",
    clarity: "common.axisClarity",
    intensity: "common.axisIntensity",
    grounding: "common.axisGrounding",
  };

  const handleTalkAboutIt = () => {
    if (!philosopher || !currentResult) return;
    track("reveal_talk_about_it");
    recordTalkAboutIt();
    setPendingMeasureResultId(philosopher.id, currentResult.measureResultId);
    sendGuideMessage(
      philosopher,
      t("depths.iJustMeasuredMyself", {
        level: getLocalizedLevelName(
          currentResult.vibrationLevel,
          locale,
        ).toLowerCase(),
        axis: t(
          AXIS_LABEL_KEYS[currentResult.dominantAxis] ??
            currentResult.dominantAxis,
        ),
      }),
    );
    router.push("/guide");
  };

  const entryFadeStyle = useAnimatedStyle(() => ({ opacity: entryFade.value }));

  // 2026-09-02 — fixedZone (the fixed/scroll split's own never-scrolling
  // zone) can no longer shrink or scroll its own content, unlike the old
  // single ScrollView. Its natural height (kicker + PhilosopherPresence +
  // quote + core geometry's own canvas) comfortably fits taller phones,
  // but on the shortest supported device (iPhone SE, 667pt) it exceeds
  // the screen's own available height entirely, clipping behind the tab
  // bar with zero room left for scrollZone underneath (confirmed via a
  // 375×667 web viewport test — the fixed zone alone needed more height
  // than the whole screen had).
  //
  // A first version of this fix applied a CSS `transform: scale()` to a
  // wrapping View around the already-full-size content, the same trick a
  // photo/map view uses to fit-to-viewport. That did NOT work: confirmed
  // via direct DOM measurement (getBoundingClientRect on the aura <img>
  // element) that react-native-web's transform:scale does not resize a
  // plain <Image>'s own rendered box — the aura kept rendering at full,
  // untransformed size and clipped regardless of the computed scale. The
  // fix here instead makes the underlying GEOMETRY genuinely reactive to
  // a computed scale (buildDepthsGeometry, see its own header comment) —
  // not a visual squash applied after the fact.
  //
  // Two-pass measurement, not an analytical estimate: this screen's own
  // natural content height depends on the philosopher's quote text (its
  // length, and therefore its wrapped line count, varies per reading),
  // which can't be predicted from constants alone without a fragile
  // character-count/line-height guess. So the first render pass renders
  // at the BASE (unscaled, tuned) size, measures its true natural height
  // via onLayout (same technique this file already used before this
  // change), computes the scale needed to fit, and — only if that scale
  // is < 1 — a second render pass rebuilds the geometry at the scaled
  // size via useMemo. React re-rendering here is cheap and expected (the
  // codebase already uses this measure-then-recompute pattern elsewhere,
  // e.g. useWideColumnWidth), and avoids a fragile analytical height
  // estimate. The one-frame flash this could cause on a short device
  // (natural size, then a snap down to scaled size) is a strictly better
  // failure mode than the bug being fixed (content permanently clipped
  // behind the tab bar) and is not visible in practice since it resolves
  // within the same layout pass before paint on both web and native.
  const [rootHeight, setRootHeight] = useState(0);
  const [naturalContentHeight, setNaturalContentHeight] = useState(0);
  const MIN_SCROLL_ZONE_HEIGHT = 120;
  // Natural (scale-1) geometry — always built, used both for the first
  // measurement pass and as the render output whenever no shrink is
  // needed (the common case: taller phones never touch the branch
  // below).
  const naturalGeometry = useMemo(
    () => buildDepthsGeometry(BASE_AURA_DISPLAY_SIZE),
    [],
  );
  const fixedZoneScale =
    rootHeight > 0 && naturalContentHeight > 0
      ? Math.min(
          1,
          (rootHeight - MIN_SCROLL_ZONE_HEIGHT) / naturalContentHeight,
        )
      : 1;
  // Guards the onLayout below from a feedback loop: once a shrink has
  // been applied, the measured View is rendering SCALED content (not
  // natural/scale-1 content anymore), so its own onLayout would report a
  // smaller-than-natural height — feeding that back in would compute an
  // even smaller scale next render, snowballing the aura toward zero
  // over a few renders. Only the first (always-natural-scale) pass is
  // allowed to write naturalContentHeight; once fixedZoneScale has
  // committed to a value below 1, it's frozen for the rest of this
  // screen's lifetime (a rotation/font-scale change would need a fresh
  // mount to re-measure, same limitation the old transform-based
  // version already had via its own one-shot fixedContentHeight state).
  const hasShrunkRef = useRef(false);
  useEffect(() => {
    if (fixedZoneScale < 1) hasShrunkRef.current = true;
  }, [fixedZoneScale]);
  // Only recompute a second, scaled geometry object once a real shrink is
  // actually needed — on every taller device this just returns
  // naturalGeometry again (fixedZoneScale === 1), so there's no
  // second object identity churn on the common path.
  const geometry = useMemo(
    () =>
      fixedZoneScale < 1
        ? buildDepthsGeometry(BASE_AURA_DISPLAY_SIZE * fixedZoneScale)
        : naturalGeometry,
    [fixedZoneScale, naturalGeometry],
  );
  const CORE_GEOMETRY = geometry.core;
  const MENU_GEOMETRY = geometry.menu;
  const AURA_METRICS = geometry.auraMetrics;
  const SPIRAL_AURA_HALF_WIDTH = geometry.spiralAuraHalfWidth;
  const SPIRAL_AURA_HALF_HEIGHT = geometry.spiralAuraHalfHeight;
  // Depends on `geometry` now too (not just `colors`) — several styles
  // below (auraCoreWrap, arrivalSkipWrap, groundWrap, menuWrap, ringWrap)
  // are sized/positioned directly off CORE_GEOMETRY/MENU_GEOMETRY/
  // AURA_METRICS, which are no longer fixed module constants once a
  // short screen shrinks them (see buildDepthsGeometry's own header
  // comment) — re-memo whenever either input changes.
  const styles = useMemo(
    () => makeStyles(colors, geometry),
    [colors, geometry],
  );

  return (
    <View
      style={styles.root}
      onLayout={(e) => setRootHeight(e.nativeEvent.layout.height)}
    >
      {theme === "dark" && <AmbientGlow />}
      <ProfileIcon />
      {/* 2026-09-01 — replaces the old single root ScrollView with a
          fixed/scroll split (see the plan this implements: "the aura
          figure — 'the main event' — always on screen, never scrolled
          away, while the action menu below it scrolls independently
          underneath it"). fixedZone holds the quote and
          DepthsSpiralCore's own canvas (aura curve, 4 sphere dots, the
          always-on wheel) — NEVER scrolls. scrollZone holds everything
          else, starting with DepthsSpiralMenu's own canvas (action
          points + top loop) so the two canvases sit visually flush at
          scroll position 0 (see MENU_GEOMETRY's own chestY comment for
          why that flushness is what the seam math depends on).
          2026-09-02 — fixedZone no longer visually scales via CSS
          transform (see fixedZoneScale's own comment above for why that
          didn't work); its content now genuinely IS the right size
          (built from `geometry`, itself built at a shrunk
          auraDisplaySize when needed), so this View just measures its
          own natural height and renders at that real size — no
          transform needed since there's no oversized content being
          visually squeezed into an undersized box anymore.
          overflow:'hidden' WAS removed at that point for the same
          reason, but came back later the same day (see fixedZone's own
          style comment) for a deliberate, unrelated purpose: cropping
          the spiral's own top-bleed effect, not squeezing oversized
          content — a real, current need, not a leftover. */}
      <View
        style={[
          styles.fixedZone,
          {
            width: columnWidth,
            alignSelf: "center",
          },
        ]}
      >
        <View
          onLayout={(e) => {
            // See hasShrunkRef's own comment above — ignore any layout
            // report once this zone has already committed to rendering
            // at a shrunk scale, so a scaled render's own (smaller)
            // height never gets mistaken for a new "natural" height.
            if (hasShrunkRef.current) return;
            // Subtracting BLEED_AMOUNT_PX here (not resizing the actual
            // View) is what stops the shrink mechanism from fighting the
            // deliberate top-bleed — without this, letting the spiral
            // bleed upward would just make this measurement taller,
            // triggering MORE shrinking to compensate, canceling the
            // bleed out. This tells fixedZoneScale "pretend the content
            // is this much shorter," which is exactly true once that
            // same amount is meant to render past the visible top edge
            // instead of pushing the rest of the zone down.
            setNaturalContentHeight(
              Math.max(0, e.nativeEvent.layout.height - BLEED_AMOUNT_PX),
            );
          }}
          style={{
            // insets.top is a hardware safe-area constraint, kept fixed
            // at any scale — shrinking it would let content sit under
            // the real notch/status-bar area, which isn't a "smaller"
            // composition, just a broken one. Only the spacing[4]
            // breathing-room portion scales down with the rest of the
            // zone (2026-09-01 fix, preserved here): at fixedZoneScale=1
            // this is identical to insets.top + spacing[4] as before; as
            // the zone shrinks, the gap between the status bar and
            // "DEPTHS" shrinks proportionally with it instead of staying
            // fixed-size and reading as a big, wrong-looking gap on a
            // short device.
            paddingTop: insets.top + spacing[4] * fixedZoneScale,
          }}
        >
          <View style={styles.kickerRow}>
            <Text style={styles.kicker}>{t("depths.kicker")}</Text>
          </View>
          {/* The standing orientation line ("What's happening inside you
            right now.") was removed 2026-08-30 — the goal now is for the
            screen itself (the spiral, the aura, the sphere points) to
            communicate what this place is without needing words to
            explain it; see the same reasoning applied to Journeys'
            products.intro/products.groupPresentDescription below. */}

          {/* Guide's real entry point now that it's off the bottom tab bar
            — always visible, always routes to Guide, no reading required.
            See docs/app-architecture-concept.md, "What Guide's demotion
            actually means." */}
          <PhilosopherPresence />

          {currentResult && lastLevel ? (
            <>
              {/* The philosopher's own reflection — moved here, to the very
                top of the screen, 2026-08-30 (was down near the bottom of
                the aura/spiral block, after the transcript/wish toggles).
                This is the philosopher speaking about THIS reading; it now
                reads first, before the visualization itself, rather than
                being buried under everything else on the page. Long-press
                to save it (2026-08-20 — replaces the old visible Save/
                Share buttons app-wide, see LongPressToSave's own header
                comment) — unchanged. */}
              {/* The bubble ring that used to sit around this quote
                (QuoteBubble.tsx) was dropped 2026-09-01 — the user didn't
                like how it looked. The "story continues from the top of
                the page" feeling it was reaching for is still carried by
                PhilosopherEnergy's own small spirals just above (see its
                render further down this screen), so nothing replaces it
                here. */}
              {/* The reading's own timestamp — moved here 2026-09-02 from a
                lone row far below the aura (past the whole spiral), where
                it read as an orphaned caption disconnected from the
                reflection it actually describes. A timestamp belongs next
                to the message it dates, the same relationship a chat
                thread's own timestamp has to the message beneath it — not
                as a separate "chrome" row elsewhere on the page. Small and
                quiet (faint, not part of the reading's own reflection),
                same register the old standalone row used. 2026-09-03 —
                moved AGAIN, from its own full-width line directly above
                readingRow, into readingRow itself (above the quote text,
                inside quoteBubbleWrap) — the user noticed its own line was
                reading as extra empty vertical space above the quote/wheel
                row, since a short faint date line still claims a full line
                height even at this small font. Folding it into the same
                column as the quote keeps the "dates the message beneath
                it" relationship this move originally established, just
                without a whole separate row's worth of height. */}
              {/* 2026-09-03 — the quote and DepthsSpiralCore's own canvas now
                sit in the SAME row (quote left, wheel right — see the
                curve's own new bend toward the wheel in
                depthsSpiralGeometry.ts/DepthsSpiralCore.tsx), instead of
                the canvas starting in normal flow below the quote. The
                quote's own height is capped (numberOfLines on `title`
                below) rather than measured, deliberately avoiding a two-
                pass measure-then-layout approach — see this file's own
                header comments on buildDepthsGeometry for why that pattern
                caused real, confirmed bugs earlier this session. auraCoreWrap
                keeps its existing full width (still needs room for the
                sphere labels on both sides) and simply starts at this row's
                own top instead of below the quote — the quote column sits
                narrower, in front of/beside the same canvas, not squeezing
                it. */}
              <View style={styles.readingRow}>
                {/* The aura figure lives inside AuraField's four concentric
                rings — one per sphere, sharing the aura's own chest as
                their center, colored by that sphere's own reading (see
                AuraField.tsx). Idle, all four are equally visible; tapping
                a spiral point pulses into the figure and dims the other
                three rings while that sphere's own ring (and the aura
                image itself) stays bright — see handleSpherePointPress. */}
                {/* Tapping anywhere on the reveal while it's still arriving jumps
                every stage straight to its settled state — a way out for
                anyone who doesn't want to sit through the ~5s ritual every
                time, without adding a visible "skip" button that would
                compete with the reveal itself. No-op once settled (the
                Pressable stops intercepting taps via pointerEvents below). */}
                <View style={styles.auraCoreWrap}>
                  <View style={styles.spiralOverlay} pointerEvents="box-none">
                    <DepthsSpiralCore
                      width={CORE_GEOMETRY.width}
                      height={CORE_GEOMETRY.totalHeight}
                      points={spherePoints}
                      accentRgb={accentRgb}
                      onPointPress={handleSpherePointPress}
                      interactive
                      playArrivalDescent={playArrivalDescent}
                      arrivalDescentDelayMs={COLOR_START_MS}
                      arrivalDescentDurationMs={ARRIVAL_DURATION_MS}
                      pulseToSphere={pulsingSphere}
                      onPulseSettled={handlePulseSettled}
                      auraHalfWidth={SPIRAL_AURA_HALF_WIDTH}
                      auraHalfHeight={SPIRAL_AURA_HALF_HEIGHT}
                      auraFigureHeight={AURA_METRICS.height}
                      auraChestOffsetFromTop={AURA_METRICS.chestY}
                      chestY={CORE_GEOMETRY.chestY}
                      riseHeight={CORE_GEOMETRY.riseHeight}
                      wheelSize={CORE_GEOMETRY.wheelSize}
                      selectedWheelLevelSlug={wheelLevelSlug}
                      selectedWheelLevelName={wheelLevelName}
                      onWheelLevelPress={
                        wheelLevelSlug
                          ? () => goToLevel(wheelLevelSlug)
                          : undefined
                      }
                    />
                  </View>
                  <Pressable
                    style={styles.arrivalSkipWrap}
                    pointerEvents={isArriving ? "auto" : "none"}
                    onPress={() => setSkipArrival(true)}
                  >
                    <AuraArrival
                      arriving={isArriving}
                      skip={skipArrival}
                      onSettled={() => {
                        setIsArriving(false);
                        setSkipArrival(false);
                      }}
                      ringOnlySlugs={sphereColors}
                      sphereScores={sphereScores}
                      selectedSphere={selectedSphere}
                      geometry={geometry}
                      neutralAura={
                        <AuraWithDots
                          source={
                            theme === "light"
                              ? AURA_NEUTRAL_IMAGE_LIGHT
                              : AURA_NEUTRAL_IMAGE
                          }
                          overlay
                          geometry={geometry}
                        />
                      }
                      settledAura={
                        <AuraWithDots
                          source={
                            theme === "light"
                              ? (AURA_LEVEL_IMAGES_LIGHT[ringLevelSlug!] ??
                                AURA_LEVEL_IMAGES_LIGHT[lastLevel.slug])
                              : (AURA_LEVEL_IMAGES[ringLevelSlug!] ??
                                AURA_LEVEL_IMAGES[lastLevel.slug])
                          }
                          overlay
                          geometry={geometry}
                        />
                      }
                    />
                  </Pressable>
                </View>
                {/* The quote overlays the canvas's own top-left, in front of
                  it (rendered after auraCoreWrap so it paints on top) —
                  confined to a flat left-side column (quoteBubbleWrap's
                  own width) so it reads as its own contained block, not
                  full-width sprawl, now that it no longer needs to dodge
                  the wheel's exact position (2026-09-02: the wheel is
                  much bigger now and bleeds mostly off the canvas's
                  right/top edges, leaving only its bottom-left quarter
                  visible — see DepthsSpiralCore.tsx's own wheelPos
                  comment). */}
                <View style={styles.quoteBubbleWrap} pointerEvents="box-none">
                  {headlineMessage ? (
                    <LongPressToSave
                      message={headlineMessage}
                      accentRgb={levelRgb}
                    >
                      <Text
                        numberOfLines={4}
                        style={[styles.title, { color: levelColor }]}
                      >
                        {headlineMessage}
                      </Text>
                    </LongPressToSave>
                  ) : (
                    <Text
                      numberOfLines={4}
                      style={[styles.title, { color: levelColor }]}
                    >
                      {headlineMessage}
                    </Text>
                  )}
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.lastReadingLabel}>
                {t("depths.beforeFirstReading")}
              </Text>
              {/* Same overlay approach as the reading branch above — the
                spiral is absolutely positioned inside a wrapper sized/
                positioned identically to how AuraWithDots itself sits
                (both pinned to CORE_GEOMETRY.groundY), so both branches'
                spiral coincides with the aura's own center by
                construction, not by measurement. */}
              <View style={styles.auraCoreWrap}>
                <View style={styles.spiralOverlay} pointerEvents="box-none">
                  <DepthsSpiralCore
                    width={CORE_GEOMETRY.width}
                    height={CORE_GEOMETRY.totalHeight}
                    points={neutralSpherePoints}
                    accentRgb={accentRgb}
                    onPointPress={() => {}}
                    interactive={false}
                    playArrivalDescent={false}
                    arrivalDescentDelayMs={0}
                    arrivalDescentDurationMs={0}
                    pulseToSphere={null}
                    auraHalfWidth={SPIRAL_AURA_HALF_WIDTH}
                    auraHalfHeight={SPIRAL_AURA_HALF_HEIGHT}
                    auraFigureHeight={AURA_METRICS.height}
                    auraChestOffsetFromTop={AURA_METRICS.chestY}
                    chestY={CORE_GEOMETRY.chestY}
                    riseHeight={CORE_GEOMETRY.riseHeight}
                    wheelSize={CORE_GEOMETRY.wheelSize}
                    selectedWheelLevelSlug={null}
                    selectedWheelLevelName={null}
                  />
                </View>
                <View style={styles.groundWrap}>
                  <AuraWithDots
                    source={
                      theme === "light"
                        ? AURA_NEUTRAL_IMAGE_LIGHT
                        : AURA_NEUTRAL_IMAGE
                    }
                    overlay
                    geometry={geometry}
                  />
                </View>
              </View>
              <Text style={styles.title}>{t("depths.firstReadingCopy")}</Text>
            </>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollZone}
        contentContainerStyle={[
          styles.scrollContent,
          { width: columnWidth, alignSelf: "center" },
        ]}
      >
        {/* DepthsSpiralMenu — the action points (Stay/Understand/Shift/
            Measure again) + the decorative top loop, h∈[H_CUT, H_MAX].
            Deliberately the FIRST thing in the scroll content (both
            branches — pre-reading action points are already independent
            of reading state, see actionSpiralPoints' own comment) so it
            sits visually flush against DepthsSpiralCore's own canvas
            directly above it in the fixed zone, at scroll position 0 —
            see MENU_GEOMETRY's own header comment for why that flushness
            is exactly what the seam-continuity math assumes. The
            timestamp/explore-map/wish rows (below) come AFTER this, not
            before — they're "what happened"/"what's elsewhere" content,
            not part of the curve, so they belong under the visual join,
            not wedged between the two halves of it. */}
        <View style={styles.menuWrap}>
          <DepthsSpiralMenu
            width={MENU_GEOMETRY.width}
            height={MENU_GEOMETRY.height}
            chestY={MENU_GEOMETRY.chestY}
            riseHeight={MENU_GEOMETRY.riseHeight}
            auraHalfWidth={SPIRAL_AURA_HALF_WIDTH}
            auraHalfHeight={SPIRAL_AURA_HALF_HEIGHT}
            accentRgb={accentRgb}
            actionPoints={actionSpiralPoints}
            onActionPress={handleActionPress}
            shiftRevealed={shiftRevealed}
            shiftSubPoints={shiftSubSpiralPoints}
            onShiftSubPress={handleShiftSubPress}
            pulseKey={pulsingAction}
            onPulseSettled={handleActionPulseSettled}
          />
        </View>

        <View style={styles.sectionDivider} />

        {/* 2026-09-02 — the unified "what to do next" menu: the 4 curve
            points above (Stay/Understand/Shift/Measure again — this
            reading's own next steps) plus a second, visually distinct
            group for open-ended exploration not tied to this specific
            reading (Explore the map, Feeling lucky). Both groups now
            share the SAME row weight (label + description, left-aligned)
            as the curve points, rather than the second group reading as
            a smaller afterthought/footer — a deliberate hierarchy choice
            (see this session's own design discussion): one continuous
            hub of real choices, not a menu plus three different kinds of
            footnote. "Explore the map" moved here from a small link
            right under the quote (a real duplication risk once discussed
            with "Show conversation," see the old comment history) — this
            is its first appearance as a full menu row. The wish
            disclosure that used to sit near here was removed the same
            day: it duplicated what Your Arc's own DetailPage already
            shows for this reading (see aesthetic.md's "one reading, one
            screen" reasoning — the same logic that already removed
            "Show conversation" from this spot applies here too). */}
        <View style={styles.stack}>
          {discoveryNudge && (
            <Pressable
              style={styles.discoveryNudge}
              onPress={() => router.push(discoveryNudge.route)}
            >
              <Text style={styles.discoveryNudgeText}>
                {t(discoveryNudge.labelKey)}
              </Text>
            </Pressable>
          )}

          {/* 2026-09-03 — a quiet closing line, so the scroll ends on a
              deliberate moment of stillness instead of trailing off into
              genuinely empty space. Before this, once discoveryNudge had
              nothing to show (most returning visits — see its own "at most
              one, for the highest-priority thing not yet found" gating)
              and Explore the Map/Feeling Lucky had already moved onto the
              curve above (2026-09-02), this whole stack could render
              completely empty: sectionDivider, then nothing. Never a
              call-to-action or a summary of what's above — just a plain
              permission to leave, same register as firstReadingCopy
              ("whatever you're feeling right now is information, not a
              problem to fix"): no diagnosis, no "you should," nothing
              claimed about this specific person's state. */}
          <Text style={styles.closingLine}>{t("depths.closingLine")}</Text>

          {/* Explore the map / Feeling Lucky moved onto the curve itself
              (2026-09-02, see actionSpiralPoints' own comment) — no
              longer separate wideMenuRow rows here. */}

          {/* Bottom energy spirals — commented out for now (2026-08-30),
              pending further review; kept intact (bottomEnergyWrap style,
              the PhilosopherEnergy import) so this is a one-line restore.
              Was meant to bookend PhilosopherPresence's own descending
              spirals at the top of the page — same motif, flipped to rise
              rather than descend. See PhilosopherEnergy's own header
              comment. */}
          {/* {philosopher && (
            <View style={styles.bottomEnergyWrap} pointerEvents="none">
              <PhilosopherEnergy
                seed={philosopher.id}
                width={SCREEN_WIDTH}
                height={38}
                color={`rgb(${accentRgb})`}
                spiralCount={9}
                direction="up"
              />
            </View>
          )} */}
        </View>
      </ScrollView>

      {/* topFade (the gradient that used to cover content sliding under
          the status bar/notch from behind) was removed 2026-09-01, once
          the fixed/scroll split landed: the kicker/quote/aura now live in
          fixedZone, which never scrolls — nothing slides up under the
          status bar from behind it anymore (fixedZone's own paddingTop
          already reserves the safe-area inset as static space, not
          scroll content that could pass underneath it). scrollZone's own
          content starts BELOW fixedZone's bottom edge, nowhere near the
          notch, so there's nothing left for a top fade to cover. */}

      {/* Only opaque when arriving fresh from Measure — see entryFade's
          own comment. Sits above everything (including topFade), covering
          the whole screen on the very first frame, then fades away to
          complete the beat of stillness interview.tsx's own exit fade
          started. */}
      <Animated.View
        style={[styles.entryFade, entryFadeStyle]}
        pointerEvents="none"
      />
    </View>
  );
}

// Plays once, right after Measure finishes — everything before this used to
// just appear, already-settled, the instant Depths mounted, with nothing
// marking "this just happened." See the timing constants' own comment
// above for the full two-act breakdown (rings draw in neutral, then
// settle into their true colors in sequence, the aura forming from that
// resolution). `onSettled` fires once, at the very end, so the caller can
// drop back to the plain static render for every future visit to this
// screen.
//
// Replaced an earlier version built around VibrationSpectrum's single
// 17-dot wheel (spin → land → four sphere-dots converge toward the
// landed marker) once Depths' own reveal moved to AuraField's concentric-
// rings shape instead — a spinning wheel has no equivalent in a shape
// with no single marker to land on, so this reveal is genuinely new
// rather than adapted from the old one.
function AuraArrival({
  arriving,
  skip,
  onSettled,
  ringOnlySlugs,
  sphereScores,
  neutralAura,
  settledAura,
  selectedSphere,
  geometry,
}: {
  arriving: boolean;
  // Flips true on a tap anywhere on the reveal (see the wrapping Pressable
  // at the call site) — cancels every in-flight timeline below and jumps
  // straight to the settled end state, then fires onSettled immediately
  // instead of waiting out the rest of the sequence's own timers.
  skip: boolean;
  onSettled: () => void;
  // The four sphere-result slugs, keyed spirit/mind/heart/body — same
  // shape AuraField's own `colors` prop expects.
  ringOnlySlugs: Record<SphereKey, string>;
  // Each sphere's own numeric vibrationScore — drives that ring's grow-in
  // bounce rate (see buildRingGrowSequence). See the call site's own
  // comment for why this is frequency-only, never amplitude/shape.
  sphereScores: Record<SphereKey, number>;
  neutralAura: React.ReactNode;
  settledAura: React.ReactNode;
  selectedSphere: SphereKey | null;
  // 2026-09-02 — the live (possibly shrunk) geometry, threaded down from
  // the screen's own useMemo rather than read off a module constant, so
  // the ring/aura genuinely resize on a short screen (see
  // buildDepthsGeometry's own header comment for why a CSS transform
  // could not do this instead).
  geometry: DepthsGeometry;
}) {
  const colors = useThemeColors();
  const styles = useMemo(
    () => makeStyles(colors, geometry),
    [colors, geometry],
  );
  // Unlike the other progress values, anticipation has no "settled" state
  // to hold at — it's a one-shot dip that always starts and ends at 0,
  // whether or not arriving is true, so a non-arriving render never
  // carries the -30% opacity/scale dip from the formulas below.
  const anticipation = useSharedValue(0);
  // Starts at a small nonzero floor rather than 0 when arriving — the
  // figure needs to already be faintly visible, small, and turned away
  // during the anticipation window (before this value starts moving
  // toward 1), or there'd be nothing onscreen for the pull-back to
  // visibly pull back FROM.
  const bodyProgress = useSharedValue(arriving ? 0.08 : 1);
  const colorProgress = useSharedValue(arriving ? 0 : 1);
  // Act 1 — each of the four rings grows from radius 0 to its true radius,
  // one at a time in RING_ORDER (heart → mind → body → spirit), all in a
  // dim/neutral tone. This is the new suspense beat — no wheel to spin
  // now that the ring shape itself is four concentric circles rather than
  // a single spinning wheel; watching each ring draw itself, in sequence,
  // without yet knowing its true color, carries the same "something is
  // being decided" tension the old spin did.
  const growHeart = useSharedValue(arriving ? 0 : 1);
  const growMind = useSharedValue(arriving ? 0 : 1);
  const growBody = useSharedValue(arriving ? 0 : 1);
  const growSpirit = useSharedValue(arriving ? 0 : 1);
  // Act 2 — each ring, in the same order, crossfades from neutral to its
  // true sphere color, staggered a beat apart — you watch each "layer" of
  // the reading confirm itself individually rather than all four
  // snapping to color at once.
  const colorHeart = useSharedValue(arriving ? 0 : 1);
  const colorMind = useSharedValue(arriving ? 0 : 1);
  const colorBody = useSharedValue(arriving ? 0 : 1);
  const colorSpirit = useSharedValue(arriving ? 0 : 1);
  const growValues: Record<SphereKey, SharedValue<number>> = {
    heart: growHeart,
    mind: growMind,
    body: growBody,
    spirit: growSpirit,
  };
  const colorValues: Record<SphereKey, SharedValue<number>> = {
    heart: colorHeart,
    mind: colorMind,
    body: colorBody,
    spirit: colorSpirit,
  };
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!arriving) return;
    // Act 1: each ring grows in turn, RING_GROW_STAGGER_MS apart — but
    // not as a plain smooth grow. Each ring overshoots its own true size
    // and settles with a few decaying bounces, the RATE of those bounces
    // set by that sphere's own vibration score (scoreToRippleFrequency) —
    // this is where "frequency" now lives: as a property of the ENTRANCE
    // motion (how a ring vibrates into existence), not as a perpetual
    // idle wobble that continued forever after the reveal (the earlier
    // version of this). Once a ring finishes settling it holds
    // perfectly still — no continued ripple, simpler and more legible.
    RING_ORDER.forEach((key, i) => {
      growValues[key].value = withDelay(
        i * RING_GROW_STAGGER_MS,
        buildRingGrowSequence(sphereScores[key], () => {
          if (Platform.OS !== "web") runOnJS(fireTickHaptic)();
        }),
      );
    });

    // Act 2: anticipation dip, then each ring settles into its true color
    // in turn, then the aura/bloom/wave beats — all timed from the moment
    // Act 1 finishes (ALL_RINGS_GROWN_MS), the same "downstream beats
    // derive from when the previous act actually ends" discipline the old
    // spin sequence used. These constants are shared with ArrivalReveal
    // (a separate component) via the module-level derivation above, so
    // both stay in sync without passing timing down as props.
    anticipation.value = withDelay(
      ALL_RINGS_GROWN_MS,
      withSequence(
        withTiming(1, {
          duration: ANTICIPATION_DURATION_MS * 0.6,
          easing: Easing.in(Easing.quad),
        }),
        withTiming(0, {
          duration: ANTICIPATION_DURATION_MS * 0.4,
          easing: Easing.out(Easing.quad),
        }),
      ),
    );
    RING_ORDER.forEach((key, i) => {
      const isLast = i === RING_ORDER.length - 1;
      colorValues[key].value = withDelay(
        COLOR_START_MS + i * RING_COLOR_STAGGER_MS,
        withTiming(
          1,
          { duration: RING_COLOR_DURATION_MS, easing: SOFT_EASE },
          (finished) => {
            if (!finished || Platform.OS === "web") return;
            // Soft tick as each ring settles into color; a firmer one at
            // the last ring, marking the whole picture as complete.
            runOnJS(isLast ? fireSettleHaptic : fireTickHaptic)();
          },
        ),
      );
    });

    // The aura itself starts forming once the FIRST ring begins settling
    // into color — its own arrival reads as caused by the rings resolving,
    // not an independent parallel event.
    bodyProgress.value = withDelay(
      COLOR_START_MS,
      withTiming(1, { duration: ARRIVAL_DURATION_MS, easing: SOFT_EASE }),
    );
    colorProgress.value = withDelay(
      COLOR_START_MS,
      withTiming(1, { duration: COLOR_SETTLE_DURATION_MS, easing: SOFT_EASE }),
    );
    doneTimerRef.current = setTimeout(
      onSettled,
      CONTENT_DELAY_MS + CONTENT_DURATION_MS * 0.3,
    );
    return () => {
      if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    };
    // Runs once, for the single mount where `arriving` starts true — this
    // effect intentionally does not react to `arriving` flipping back to
    // false (that happens via onSettled, not by re-running the sequence).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tapping the reveal cancels every in-flight timeline above and jumps
  // straight to the settled values, then fires onSettled right away rather
  // than waiting for the timers scheduled in the effect above.
  useEffect(() => {
    if (!skip) return;
    if (doneTimerRef.current) clearTimeout(doneTimerRef.current);
    [
      anticipation,
      bodyProgress,
      colorProgress,
      ...RING_ORDER.map((k) => growValues[k]),
      ...RING_ORDER.map((k) => colorValues[k]),
    ].forEach((v) => cancelAnimation(v));
    anticipation.value = 0;
    bodyProgress.value = 1;
    colorProgress.value = 1;
    RING_ORDER.forEach((key) => {
      growValues[key].value = 1;
      colorValues[key].value = 1;
    });
    onSettled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  // Deliberately large ranges — scale starts at half size, a third of the
  // way down the ring, and turned a quarter-turn away, so the figure
  // visibly travels and turns to arrive rather than just nudging into
  // place. The anticipation pull-back (a small extra dim + inward nudge)
  // runs BEFORE bodyProgress starts moving, layered on top of
  // bodyProgress's own small nonzero starting value so there's something
  // faintly onscreen to see pull back, rather than nothing.
  const bodyStyle = useAnimatedStyle(() => ({
    opacity: bodyProgress.value * (1 - anticipation.value * 0.25),
    transform: [
      { perspective: 600 },
      { translateY: (1 - bodyProgress.value) * 36 + anticipation.value * 4 },
      {
        scale:
          (0.5 + bodyProgress.value * 0.5) * (1 - anticipation.value * 0.08),
      },
      { rotateY: `${(1 - bodyProgress.value) * 100}deg` },
    ],
  }));
  const neutralStyle = useAnimatedStyle(() => ({
    opacity: 1 - colorProgress.value,
  }));
  // Neutral and settled images crossfade — the level-colored version fades
  // in exactly as the neutral one fades out.
  const settledStyle = useAnimatedStyle(() => ({
    opacity: colorProgress.value,
  }));

  return (
    <View style={styles.ringWrap}>
      <AnimatedAuraField
        size={geometry.auraDisplaySize}
        colors={ringOnlySlugs}
        selectedSphere={selectedSphere}
        growValues={growValues}
        colorValues={colorValues}
      />
      <Animated.View style={[styles.auraArrivalBody, bodyStyle]}>
        <Animated.View style={[styles.auraArrivalLayer, neutralStyle]}>
          {neutralAura}
        </Animated.View>
        <Animated.View style={[styles.auraArrivalLayer, settledStyle]}>
          {settledAura}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// The animated counterpart to AuraField's own static render — same
// geometry (buildAuraFieldGeometry, RING_ORDER), but each lobe's rx/ry
// grow from 0 (via growValues) and crossfade from a neutral tone to their
// true color (via colorValues) instead of rendering already-settled.
// Kept as a separate component from AuraField itself rather than adding
// animation props to it directly, since AuraField's job (a plain static
// renderer usable anywhere, including a future non-arrival context) stays
// simpler without arrival-specific plumbing baked in.
const AnimatedSvgEllipse = Animated.createAnimatedComponent(SvgEllipse);

// Hawkins' own scale runs roughly 20 (Shame) to 700+ (Enlightenment) — maps
// linearly to a ripple rate of RIPPLE_CYCLES_MIN–RIPPLE_CYCLES_MAX per
// second. Frequency ONLY: every ring uses the exact same amplitude
// (RIPPLE_AMPLITUDE) and the exact same smooth sine shape regardless of
// score — see sphereScores' own comment at the call site for why holding
// those two constant is what keeps this from implying rank (a faster
// ripple reads as different, not better, the way a high musical note
// isn't "better" than a low one — unlike amplitude/jaggedness, which
// would read as calm-vs-agitated).
const RIPPLE_CYCLES_MIN = 0.4;
const RIPPLE_CYCLES_MAX = 1.6;
function scoreToRippleFrequency(score: number) {
  const t = Math.min(1, Math.max(0, (score - 20) / (700 - 20)));
  return RIPPLE_CYCLES_MIN + t * (RIPPLE_CYCLES_MAX - RIPPLE_CYCLES_MIN);
}

// Builds the Act 1 grow-in motion for one ring: overshoots 1 and settles
// with a few decaying bounces rather than a plain smooth withTiming — the
// bounce RATE is set by scoreToRippleFrequency(score), so a higher-
// frequency sphere visibly settles in with quicker, tighter bounces and a
// lower-frequency one with slower, looser ones. This is where "frequency"
// now lives (see sphereScores' own comment at the call site for why
// frequency-only, never amplitude/shape, is what keeps this from implying
// rank) — as a property of the ENTRANCE motion, not a perpetual idle
// ripple that continued after the reveal (the version this replaced).
// Amplitude decays geometrically each bounce so the ring visibly comes to
// rest, holding at exactly 1 once finished — no residual wobble.
const RING_BOUNCE_COUNT = 3;
const RING_BOUNCE_START_AMPLITUDE = 0.16;
function buildRingGrowSequence(score: number, onDone: () => void) {
  const frequency = scoreToRippleFrequency(score);
  // One full bounce (out past 1, back through 1) takes 1000ms/frequency —
  // half that per leg (up, then down), so higher frequency means faster
  // legs, same mapping AnimatedFieldLobe's old rippleFrequency used.
  const legDuration = 500 / frequency;
  const steps: number[] = [];
  for (let i = 0; i < RING_BOUNCE_COUNT; i++) {
    const amplitude = RING_BOUNCE_START_AMPLITUDE * Math.pow(0.45, i);
    steps.push(1 + amplitude, 1 - amplitude * 0.5);
  }
  steps.push(1);
  return withSequence(
    ...steps.map((target, i) =>
      i === steps.length - 1
        ? withTiming(
            target,
            { duration: legDuration, easing: Easing.out(Easing.quad) },
            (finished) => {
              if (finished) runOnJS(onDone)();
            },
          )
        : withTiming(target, {
            duration: legDuration,
            easing: Easing.inOut(Easing.quad),
          }),
    ),
  );
}

function AnimatedAuraField({
  size,
  colors,
  selectedSphere,
  growValues,
  colorValues,
}: {
  size: number;
  colors: Record<SphereKey, string>;
  selectedSphere: SphereKey | null;
  growValues: Record<SphereKey, SharedValue<number>>;
  colorValues: Record<SphereKey, SharedValue<number>>;
}) {
  const {
    svgWidth,
    svgHeight,
    svgCenterX,
    svgCenterY,
    groundUpOffset,
    ryFor,
    rxFor,
  } = buildAuraFieldGeometry(size);
  return (
    <Svg
      width={svgWidth}
      height={svgHeight}
      style={{ position: "absolute", bottom: groundUpOffset - svgHeight / 2 }}
      pointerEvents="none"
    >
      {RING_ORDER.map((key, i) => {
        const rx = rxFor(i);
        const ry = ryFor(i);
        const emphasis = !selectedSphere || selectedSphere === key ? 1 : 0.25;
        return (
          <AnimatedFieldLobe
            key={key}
            cx={svgCenterX}
            cy={svgCenterY}
            fullRx={rx}
            fullRy={ry}
            color={colors[key]}
            emphasis={emphasis}
            grow={growValues[key]}
            colorSettle={colorValues[key]}
          />
        );
      })}
    </Svg>
  );
}

// One lobe (half of one sphere's ring — see AuraField.tsx for why lobes
// come in mirrored left/right pairs rather than one shared circle).
function AnimatedFieldLobe({
  cx,
  cy,
  fullRx,
  fullRy,
  color,
  emphasis,
  grow,
  colorSettle,
}: {
  cx: number;
  cy: number;
  fullRx: number;
  fullRy: number;
  color: string;
  emphasis: number;
  grow: SharedValue<number>;
  colorSettle: SharedValue<number>;
}) {
  // Two overlaid ellipses (neutral-toned, true-colored) crossfading via
  // colorSettle — same "two flat tones, crossfade the opacity" approach
  // the aura's own neutral/settled images already use, rather than trying
  // to interpolate an arbitrary rgb string frame-by-frame. grow.value
  // itself now carries the bounce (see buildRingGrowSequence) — no live
  // sin()-based ripple read here anymore, so a settled ring is genuinely
  // static, not continuously recomputed every frame.
  const neutralProps = useAnimatedProps(() => ({
    rx: grow.value * fullRx,
    ry: grow.value * fullRy,
    opacity: (1 - colorSettle.value) * 0.55 * emphasis,
  }));
  const colorProps = useAnimatedProps(() => ({
    rx: grow.value * fullRx,
    ry: grow.value * fullRy,
    opacity: colorSettle.value * 0.55 * emphasis,
  }));
  return (
    <>
      <AnimatedSvgEllipse
        cx={cx}
        cy={cy}
        fill="none"
        stroke={AURA_NEUTRAL_COLOR}
        strokeWidth={1}
        animatedProps={neutralProps}
      />
      <AnimatedSvgEllipse
        cx={cx}
        cy={cy}
        fill="none"
        stroke={color}
        strokeWidth={1}
        animatedProps={colorProps}
      />
    </>
  );
}

// Softer/shorter than fireSettleHaptic — this fires as each ring grows in
// (Act 1) or settles into color (Act 2), so it needs to read as a light,
// repeated confirmation rather than one big event each time.
function fireTickHaptic() {
  Haptics.selectionAsync();
}

// Fires once, as the LAST ring settles into its true color — firmer than
// the per-ring ticks (fireTickHaptic), marking the whole four-ring
// picture as complete.
function fireSettleHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}

// Fades/settles the sphere-identity block (level name, sphere-talk link,
// sphere buttons) in just after the ring completes — the "rest of the page
// condenses in around it" beat. Only animated while a reading is arriving;
// every other render (a normal visit to Depths) shows this at rest, with
// no wrapper cost beyond the plain View.
function ArrivalReveal({
  arriving,
  skip,
  children,
}: {
  arriving: boolean;
  skip: boolean;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(arriving ? 0 : 1);

  useEffect(() => {
    if (!arriving) return;
    progress.value = withDelay(
      CONTENT_DELAY_MS,
      withTiming(1, { duration: CONTENT_DURATION_MS, easing: SOFT_EASE }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!skip) return;
    cancelAnimation(progress);
    progress.value = 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skip]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// The aura figure image itself — the current reading's color (or the
// neutral tone pre-reading). This used to also render a SECOND, separately
// animatable dot field on top of the image (see auraBodyToPixel/HOME_DOTS,
// removed) — that extra layer was cut once it became clear it wasn't
// carrying any meaning of its own beyond what's already baked into the
// image ("every detail must carry a purpose"). The dots visible around
// the figure now come from the pre-baked PNG art itself (see
// auraLevelImages.ts) — generateAuraDots' own original intent (still
// true of these) is "energy escaping the body," scattered outward from
// the body's edge rather than sitting as noise inside it.
// `overlay` positions it absolutely, centered — for layering on top of
// ringWrap's ring (the post-reading composition). Without it, this renders
// in normal document flow — the pre-reading branch has no ring to overlay,
// and absolute-positioning it there floated it over the surrounding text
// instead of sitting in its own space between the two lines around it.
function AuraWithDots({
  source,
  overlay = false,
  geometry,
}: {
  source: number;
  overlay?: boolean;
  // 2026-09-02 — see AuraArrival's own `geometry` prop comment: the aura
  // image's own box must genuinely shrink on a short screen, not just
  // get visually squashed by a parent transform, so its size now comes
  // from the live geometry object rather than a fixed module constant.
  geometry: DepthsGeometry;
}) {
  const colors = useThemeColors();
  const styles = useMemo(
    () => makeStyles(colors, geometry),
    [colors, geometry],
  );
  const AURA_METRICS = geometry.auraMetrics;
  return (
    <View
      style={[styles.auraWrap, overlay && styles.auraWrapOverlay]}
      pointerEvents="none"
    >
      <View style={{ width: AURA_METRICS.width, height: AURA_METRICS.height }}>
        <Image
          source={source}
          style={{ width: AURA_METRICS.width, height: AURA_METRICS.height }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function makeStyles(colors: Colors, geometry: DepthsGeometry) {
  const CORE_GEOMETRY = geometry.core;
  const MENU_GEOMETRY = geometry.menu;
  const AURA_METRICS = geometry.auraMetrics;
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    // 2026-09-01 — the fixed-zone half of the new fixed/scroll split (see
    // this screen's own render comment). Never scrolls: the kicker,
    // PhilosopherPresence, the reading's quote, and DepthsSpiralCore's own
    // canvas (aura + sphere dots + wheel) all live here, permanently on
    // screen. A plain View, not a ScrollView — height comes from its own
    // content (the quote's text height plus CORE_GEOMETRY.totalHeight),
    // same as any normal flex column.
    fixedZone: {
      paddingHorizontal: spacing[6],
      // 2026-09-02 — overflow:hidden so the spiral's own deliberate top
      // bleed (auraCoreWrap's own negative marginTop, BLEED_AMOUNT_PX)
      // actually crops at this zone's own visible top edge instead of
      // just rendering past it uncropped (RN's own default is
      // overflow:visible). Scoped to fixedZone specifically, not root —
      // root also contains scrollZone/the tab bar below, which must never
      // be clipped by this.
      overflow: "hidden",
      // A thin line marking the fixed/scroll seam — signals "this part
      // scrolls" without a generic scroll-indicator widget or a fade at
      // the edge (the user explicitly didn't want a fade: the curve
      // itself visibly continues from the scrollable menu up into the
      // aura's own body, "the source of energy," and a fade would read
      // as cutting that connection rather than just marking a boundary
      // it passes through). Same colors.bg.border stroke already used
      // for the wheel's own ring outline (VibrationSpectrum.tsx) — one
      // shared thin-line register, not a new one. Deliberately NOT a
      // gradient/fade — a flat 1px line the curve crosses over, same as
      // any other line it crosses on its way down.
      borderBottomWidth: 1,
      borderBottomColor: colors.bg.border,
    },
    // The independently-scrollable bottom zone — DepthsSpiralMenu's own
    // canvas (action points + top loop), then the timestamp/explore-map/
    // wish rows, discovery nudge, and Feeling Lucky. flex:1 so it fills
    // whatever vertical space fixedZone doesn't claim, and scrolls its own
    // content independently of fixedZone above it.
    scrollZone: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[12],
    },
    // Absolutely fills the same area ringWrap occupies (see ringWrap's own
    // `top` computed from groundY) rather than sizing itself from normal
    // flow — ringWrap is itself absolutely positioned now (the aura sits at
    // the base of a much taller composition, not centered in it), so
    // without this the Pressable's own hit area would collapse to nothing.
    // Sized to the AURA IMAGE's own height (not the ring's — the ring is
    // now a small flat ellipse anchored at the feet, always smaller than
    // the standing figure it surrounds), with its BOTTOM edge — not its
    // center — pinned to groundY, so the aura's own feet land on the
    // ground the ring/cone are also built from, and the figure stands
    // normally above that line rather than being bisected by it.
    arrivalSkipWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      top: CORE_GEOMETRY.groundY - AURA_METRICS.height,
      height: AURA_METRICS.height,
      alignItems: "center",
    },
    // Pre-reading branch's own equivalent of arrivalSkipWrap/ringWrap — no
    // AuraArrival/AnimatedAuraField here (nothing to animate in before a
    // first reading exists), just AuraWithDots pinned to the same groundY
    // so both branches' aura lands at the identical point the spiral's own
    // base ellipse is built from.
    groundWrap: {
      position: "absolute",
      left: 0,
      right: 0,
      top: CORE_GEOMETRY.groundY - AURA_METRICS.height,
      height: AURA_METRICS.height,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    // Shared positioning parent for both branches' aura + DepthsSpiralCore's
    // own canvas overlay — sized to that canvas exactly (CORE_GEOMETRY, not
    // the old full-height DEPTHS_COMPOSITION_GEOMETRY) so spiralOverlay
    // (below) can center within it and land on the exact same point the
    // aura itself is centered on, by construction rather than measurement.
    // Renamed from auraSpiralWrap (2026-09-01) — now specifically the
    // CORE canvas's own wrapper, distinct from DepthsSpiralMenu's own
    // menuWrap further down in the scroll zone.
    // 2026-09-03 — the quote and this canvas now sit in the SAME row (see
    // this screen's own render comment above the quote), so the top margin
    // that used to live on auraCoreWrap itself (below) moved up to the row
    // wrapper instead — it was always "breathing room above this whole
    // block," not something specific to the canvas, and a row's own two
    // children need to share one top edge, not each carry their own
    // separate offset. flexDirection: 'row' with a flexed quote column on
    // the left and this canvas anchored full-width on the right — width
    // stays the full canvas width (still needs room for both sphere-label
    // sides), only its starting Y moved up to align with the quote's own
    // top instead of stacking below it.
    readingRow: {
      position: "relative",
      marginTop: spacing[2],
    },
    auraCoreWrap: {
      width: CORE_GEOMETRY.width,
      height: CORE_GEOMETRY.totalHeight,
      // 2026-09-02 — shifts the WHOLE canvas (curve + wheel + aura) up by
      // BLEED_AMOUNT_PX so that amount of its own topmost region (the
      // wheel/curve, since nothing else in this canvas extends that high)
      // renders past fixedZone's own visible top edge and gets cropped
      // there (fixedZone now has overflow:'hidden', see its own comment) —
      // the deliberate "energy extends beyond the app" effect, at the
      // user's own request. quoteBubbleWrap (the sibling absolutely
      // positioned over readingRow, top:0) is UNAFFECTED by this — it's
      // not in the same flow position, so it stays exactly where it is;
      // only this canvas moves. Paired with the onLayout measurement fix
      // above (naturalContentHeight subtracts this same amount) so the
      // shrink-to-fit mechanism doesn't fight this by shrinking everything
      // else to compensate.
      marginTop: -BLEED_AMOUNT_PX,
      // Negative — auraCoreWrap's own height reserves the full CORE canvas
      // (CORE_GEOMETRY.totalHeight), but nothing ever renders below the
      // aura's own feet (groundY) — no h<0 content exists — so everything
      // from groundY down to the canvas's own bottom edge is genuinely
      // empty, reclaimable space, not visible content this margin could
      // clip. Was -spacing[10] (partial reclaim, tuned pre-split when the
      // canvas held the WHOLE h∈[0,H_MAX] curve and this space was cheap to
      // leave alone); widened to reclaim the full empty span
      // (2026-09-01, fixed/scroll split) because fixedZone can no longer
      // scroll — every pixel of true dead space left in its own canvas is
      // now permanently-visible screen real estate taken away from
      // scrollZone below, confirmed on-device (an 844pt-tall viewport left
      // scrollZone with under 30px of visible height without this).
      marginBottom: -(CORE_GEOMETRY.totalHeight - CORE_GEOMETRY.groundY - 5),
    },
    // Fills the whole tall wrapper — DepthsSpiralCore's own width/height
    // match this exactly, so its base ellipse lands at
    // CORE_GEOMETRY.groundY by construction, not by measuring this View. No
    // alignItems/justifyContent centering here (unlike the old flat/square
    // version): the cone is NOT vertically centered in this box, it rises
    // from the bottom, so centering would float it wrong.
    spiralOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    // DepthsSpiralMenu's own wrapper — the first thing in scrollZone's
    // content, sized to MENU_GEOMETRY exactly so the seam-continuity math
    // (see MENU_GEOMETRY's own chestY comment) holds: no extra
    // margin/padding above this View, so it renders flush against
    // auraCoreWrap's own bottom edge at scroll position 0.
    menuWrap: {
      width: MENU_GEOMETRY.width,
      height: MENU_GEOMETRY.height,
      alignSelf: "center",
    },
    entryFade: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bg.base,
    },
    kickerRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    kicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: "uppercase",
    },
    // Relocated here (2026-08-28) from beside the top kicker, where it was
    // sitting in the same corner ProfileIcon now occupies. Still chrome —
    // same faint weight as before, just under the sphere buttons instead of
    // up top, in a part of the screen nothing else claims.
    // 2026-09-03 — was centered, full device width, its own line directly
    // above readingRow (a real cost: a whole line height of vertical space
    // for a short faint date, confirmed as visible "extra empty space" on
    // real device). Now sits inside quoteBubbleWrap itself, above the
    // quote text, in the same left-aligned column — no more marginTop
    // (readingRow's own marginTop already provides the gap above this
    // whole block; a second top margin here would just re-add space back).
    readingTimestamp: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    sectionDivider: {
      height: 1,
      backgroundColor: colors.bg.border,
      marginTop: spacing[10],
      marginBottom: spacing[8],
    },
    // A sentence, styled like one — warm ivory (AURA_NEUTRAL_COLOR, the same
    // tone onboarding uses for "you feel" / "is an experience" before any
    // reading gives the app its accent color) rather than colors.text's
    // lavender-tinted gray, so this line reads as continuous with the first
    // screens instead of the app's generic UI-chrome color.
    lastReadingLabel: {
      color: AURA_NEUTRAL_COLOR,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[2],
    },
    // Absolutely positioned over the ring (ringWrap's own center), not laid
    // out beside it — the figure sits INSIDE the ring, not next to it.
    auraWrap: { alignItems: "center", marginVertical: spacing[8] },
    // Only applied when layered over ringWrap's ring — see AuraWithDots'
    // `overlay` prop. Fills and centers within the nearest positioned
    // ancestor rather than relying on inherited flex centering from
    // whatever wraps it — AuraArrival nests this inside extra Animated.View
    // layers for the arrival animation, none of which set alignItems, so a
    // bare `position: absolute` (no top/left/right/bottom) previously left
    // it pinned to its flex-computed position in an unpositioned ancestor
    // instead of centered, which is what put the aura in the wrong place.
    auraWrapOverlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // The animated body wrapper AuraArrival scales/fades/rotates as a whole —
    // fills and centers over the ring the same way auraWrapOverlay does, so
    // its own children (the neutral/settled aura layers) have a positioning
    // context to resolve against.
    auraArrivalBody: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // Stacks the settled (level-colored) aura directly on top of the neutral
    // one during arrival, both filling/centering over auraArrivalBody, so
    // crossfading their opacity reads as one figure changing color rather
    // than two figures swapping places.
    auraArrivalLayer: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
    },
    // 2026-09-02 — a flat left-side column again, not full-width and not
    // derived from the wheel's own exact geometry (that fragile
    // wheelLeftEdge/quoteColumnWidth math was removed once the wheel
    // stopped sharing horizontal space with the quote at all — see the
    // wheel's own bleed, DepthsSpiralCore.tsx's wheelPos comment). Full-
    // width read wrong regardless of the wheel not overlapping it — the
    // user's own request: the quote should stay confined to the screen's
    // LEFT side so it reads as its own contained block, not sprawl edge-
    // to-edge. A plain, static percentage (tuned by the user directly to
    // 45%) — no per-render computation, no dependency on wheel size/
    // position.
    quoteBubbleWrap: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "45%",
      alignItems: "flex-start",
      justifyContent: "flex-start",
    },
    // Deliberately not styled as a heading — this is the philosopher speaking,
    // a reflection to read, not a screen title to scan. Lighter weight and
    // smaller size than a real title (see lastReadingLabel/kicker above it)
    // keeps it quiet and personal rather than declarative — a large bold
    // headline here read as closer to a verdict than a reflection.
    // 2026-09-03 — was fontSizes.sm (14px). Shrunk one more step (the user's
    // own framing: "the quote doesn't need to be bold and the font size can
    // be smaller") to free real horizontal room in the quote's own column —
    // this is part of making space for the reading's date to sit in the gap
    // between the quote and the wheel, without narrowing the column itself
    // (a real column-width cut was the other option considered, but this
    // reads as gentler: same words fit in less width at a smaller size,
    // rather than the same size wrapping onto more lines in a tighter box).
    title: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * lineHeights.normal,
      marginTop: spacing[2],
    },
    // The ring (AuraField's rings) and the aura share this one center
    // point — ring renders first so the aura sits visually on top of/
    // inside it. `position: 'relative'` makes this the positioning context
    // the aura's `overlay` (position: 'absolute') resolves against —
    // AuraArrival nests the aura inside two extra Animated.View layers (for
    // the arrival animation) that carry no positioning of their own, so
    // without this the "nearest positioned ancestor" search skips straight
    // past ringWrap to whatever wraps it further up, landing the aura
    // somewhere else on the page entirely instead of centered on the ring.
    // Fills its parent (arrivalSkipWrap — sized/positioned so its own
    // BOTTOM edge lands at CORE_GEOMETRY.groundY) rather than centering
    // within the FULL tall auraCoreWrap (the old approach, which would
    // float the aura in the middle of the whole rising-cone composition
    // instead of at its base). justifyContent 'flex-end' (not
    // 'center') so the aura image's own bottom edge — its feet — lands
    // exactly on groundY, with the ring/cone's shared ground plane, rather
    // than the aura's geometric center landing there and bisecting the
    // figure.
    ringWrap: {
      position: "relative",
      width: "100%",
      height: AURA_METRICS.height,
      alignItems: "center",
      justifyContent: "flex-end",
    },
    // Still used by discoveryNudge/the wide menu rows below the spiral. position:
    // relative so bottomEnergyWrap (below) can break out to the full
    // screen width rather than being clipped to content's own padding.
    stack: { position: "relative" },
    // Breaks out of content's paddingHorizontal (spacing[6]) the same way
    // PhilosopherPresence's own energyWrap does at the top of the page —
    // the spirals should span the full device width, not just luckyWrap's
    // own narrow column.
    bottomEnergyWrap: {
      position: "relative",
      left: -spacing[6],
      width: SCREEN_WIDTH,
      marginTop: spacing[6],
    },
    discoveryNudge: {
      alignItems: "center",
      paddingVertical: spacing[3],
      marginBottom: spacing[4],
    },
    discoveryNudgeText: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: "center",
    },
    // 2026-09-03 — the closing line after sectionDivider. faint, not
    // muted — quieter than discoveryNudgeText above (which is a real,
    // occasionally-tappable row) since this is pure stillness, nothing to
    // act on. Generous paddingVertical gives it real presence as an
    // ending rather than reading as one more compressed row.
    closingLine: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontStyle: "italic",
      fontSize: fontSizes.sm,
      textAlign: "center",
      paddingVertical: spacing[6],
    },
    // The unified action-menu row style, in normal document flow below the
    // spiral (2026-09-02) — Explore the map / Feeling lucky both use this.
    // Left-aligned and same label/description size relationship the old
    // centered luckyLabel/luckyDescription used (base/sm), just re-aligned
    // to match the curve's own action rows (Stay with it/etc.) rather than
    // reading as a smaller, centered footer — the deliberate "same weight,
    // second group" hierarchy this pass introduced (see this block's own
    // header comment above).
    wideMenuRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: spacing[4],
      paddingVertical: spacing[3],
    },
    // Text column — was the row's own direct children before the row
    // became flexDirection:'row' to make space for DepthsMenuSymbol at the
    // trailing edge (2026-09-02); wrapping label+description in their own
    // flexed column keeps them left-aligned and lets the icon claim a
    // fixed slot on the right without the text stretching to fill it.
    wideMenuText: {
      flex: 1,
    },
    wideMenuLabel: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
    },
    wideMenuDescription: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      marginTop: spacing[1],
    },
  });
}
