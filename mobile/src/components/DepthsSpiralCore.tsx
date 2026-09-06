import { useEffect, useMemo, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  cancelAnimation,
} from "react-native-reanimated";
import { useThemeColors } from "../theme/useThemeColors";
import { fonts, fontSizes } from "../theme/typography";
import { type SphereKey } from "./AuraField";
import { VibrationSpectrum, levelIndex } from "./VibrationSpectrum";
import {
  SLOT_ORDER,
  H_CUT,
  WHEEL_H,
  WHEEL_SIZE,
  WHEEL_SIDE_MARGIN,
  WHEEL_LIFT_RATIO,
  TOP_MARGIN,
  HIT,
  DOT_RADIUS,
  LABEL_BOX_W,
  LABEL_BOX_H,
  CURVE_AVOID_DIST,
  CURVE_AVOID_STEP_GAP,
  SOFT_EASE,
  hForSlot,
  ellipseScaleForH,
  pointForH,
  buildSpiralCoreGeometry,
  type SpiralSpherePoint,
} from "./depthsSpiralGeometry";

// DepthsSpiralCore — the FIXED-zone half of what used to be one
// DepthsSpiral component (split 2026-09-01, see depthsSpiralGeometry.ts's
// own header comment for the full split rationale). Draws only h∈[0,
// H_CUT]: the aura's own curve as it rises out of the chest, the 4 sphere
// dots (Heart/Mind/Spirit/Body), and the always-on 17-level wheel. Renders
// inside Depths' new fixed middle zone (never scrolls) — the sphere-tap →
// pulse → aura-recolor animation stays entirely within this one component,
// same as before the split, since both ends of that travel (the tapped
// sphere and the aura's own chest) are h≤H_CUT.
//
// What's DELETED from the pre-split DepthsSpiral: the action points
// (Stay/Understand/Shift/Measure again), Shift's sub-points, the top loop,
// and pulseToAction/actionPulseMarkerStyle/onActionPulseSettled entirely —
// all of that now lives in DepthsSpiralMenu.tsx, in Depths' independently-
// scrollable zone. See DepthsSpiralMenu.tsx for the seam-continuity
// approach that keeps the curve looking unbroken across the fixed/scroll
// boundary despite being two separate SVGs.
export function DepthsSpiralCore({
  width,
  height,
  points,
  accentRgb,
  onPointPress,
  interactive,
  playArrivalDescent,
  arrivalDescentDelayMs,
  arrivalDescentDurationMs,
  pulseToSphere,
  onPulseSettled,
  auraHalfWidth,
  auraHalfHeight,
  auraFigureHeight,
  auraChestOffsetFromTop,
  chestY,
  riseHeight,
  wheelSize = WHEEL_SIZE,
  selectedWheelLevelSlug,
  selectedWheelLevelName,
  onWheelLevelPress,
}: DepthsSpiralCoreProps) {
  const colors = useThemeColors();
  // 2026-09-02 — the wheel now sits at the canvas's own right edge with
  // its CENTER landing there (not WHEEL_SIZE/2 inside it, the old fully-
  // on-screen placement) — roughly half its own diameter deliberately
  // bleeds off-canvas, at the user's own request (the "perfect world"
  // wheel: much bigger, only its left half ever visible, rotating to
  // bring the active level to that visible side — see VibrationSpectrum
  // .tsx's own rotateToIndex/VISIBLE_ANGLE). WHEEL_SIDE_MARGIN
  // previously existed to keep the wheel CLEAR of the edge (absorbing
  // pointForH's own residual rx*cos(theta) term past the bend target) —
  // now it does the opposite job, nudging the center slightly INSIDE the
  // edge so the visible crescent isn't razor-thin from that same
  // residual pushing the real rendered wheel further right than
  // bendTargetX alone implies. Fixed zone's own overflow:'hidden' (see
  // depths/index.tsx's fixedZone style) is what actually crops the
  // bled half — this is only the target CENTER position, not clipping.
  // WHEEL_EXTRA_LEFT_PX (2026-09-02, user's own tuning pass) nudges the
  // center a bit further left than WHEEL_SIDE_MARGIN alone, growing the
  // visible crescent a little more.
  const WHEEL_EXTRA_LEFT_PX = 20;
  const bendTargetX = width - WHEEL_SIDE_MARGIN - WHEEL_EXTRA_LEFT_PX;
  // Computed here, BEFORE geometry — buildSpiralCoreGeometry needs it to
  // trim the drawn path at the wheel's own circumference (see that
  // function's own comment for why) rather than continuing all the way
  // to H_CUT and visibly piercing the ring's interior. Uses width/2
  // directly rather than geometry.baseCx purely to avoid a circular
  // dependency (geometry's own useMemo now needs wheelPos as an input) —
  // the two are identical (geometry.baseCx is exactly width/2, see
  // buildSpiralCoreGeometry's own first line).
  const wheelPosOnCurve = pointForH(
    WHEEL_H,
    width / 2,
    chestY,
    riseHeight ?? chestY - TOP_MARGIN,
    auraHalfWidth,
    auraHalfHeight,
    auraHalfWidth,
    auraHalfHeight,
    bendTargetX,
  );
  // 2026-09-02 — lifts the wheel's own center by roughly half its own
  // radius, so (combined with bendTargetX's own horizontal bleed above)
  // only the BOTTOM-LEFT QUARTER of the wheel stays visible, at the
  // user's own follow-up request ("since we already moved the wheel
  // horizontally... lift the wheel up so only the bottom half... quarter
  // is visible"). A plain pixel offset, not a WHEEL_H change — WHEEL_H
  // is coupled to H_CUT/the fixed-scroll seam math (see its own comment
  // in depthsSpiralGeometry.ts), and this bleed has nothing to do with
  // where the curve's own h-parameterization places things; it's purely
  // "shift the already-computed wheel position up before anything reads
  // it," same pattern as bendTargetX's own horizontal shift.
  // Was a flat wheelSize/2 lift (2026-09-02); reduced slightly at the
  // user's own follow-up tuning request ("move the wheel a bit lower")
  // — still a real bleed, just leaving a bit more of the wheel's own
  // lower portion visible than the full half-radius lift did.
  // WHEEL_LIFT_RATIO is a shared export (depthsSpiralGeometry.ts), not a
  // local const, because depths/index.tsx's own canvas-sizing math
  // (wheelTopAboveFeet) needs this SAME number — a local-only version
  // here silently drifted out of sync with that file's own now-stale
  // +wheelSize/2 assumption, leaving dead empty space reserved above the
  // curve (confirmed via the user's own screenshot 2026-09-02).
  const wheelPos = {
    ...wheelPosOnCurve,
    y: wheelPosOnCurve.y - wheelSize * WHEEL_LIFT_RATIO,
  };
  const geometry = useMemo(
    () =>
      buildSpiralCoreGeometry(
        width,
        height,
        chestY,
        auraHalfWidth,
        auraHalfHeight,
        riseHeight,
        bendTargetX,
        wheelPos,
        wheelSize / 2,
      ),
    [
      width,
      height,
      chestY,
      auraHalfWidth,
      auraHalfHeight,
      riseHeight,
      bendTargetX,
      wheelPos,
      wheelSize,
    ],
  );

  // Precomputes each sphere label's position/alignment in one pass — with
  // 3 full turns restored (2026-08-30), the curve legitimately loops close
  // to itself at several points again (same risk the old 7-point version
  // guarded against, just fewer points to place now), so the curve-self-
  // avoidance check is back alongside the aura-silhouette push-out and
  // label-vs-label overlap checks. Unchanged from the pre-split version —
  // this pass never touched the action points at all.
  const AURA_BODY_HALF_W = auraHalfWidth * 0.75;
  // The aura's own silhouette span in this canvas's coordinate space —
  // top = chestY minus the image's own top-to-chest offset, bottom = top
  // + the image's full height. Orientation-agnostic (works the same
  // whether the aura sits at the top or bottom of the larger
  // composition) since it's derived purely from where the chest is and
  // the image's own fixed internal proportions.
  const AURA_BODY_TOP = geometry.chestY - auraChestOffsetFromTop;
  const AURA_BODY_BOTTOM = AURA_BODY_TOP + auraFigureHeight;
  const labelLayout = useMemo(() => {
    const placed: { x: number; y: number }[] = [];
    return points.map((point, i) => {
      const { x, y } = geometry.points[i];
      const h = hForSlot(i);
      const windingCenterX = geometry.baseCx;
      // - not + (matches pointForH's own sign): the winding's own center
      // moves UP as h increases, the spiral rising above the aura.
      const windingCenterY = geometry.chestY - h * geometry.riseHeight;
      const dx = x - windingCenterX;
      const dy = y - windingCenterY;
      const dist = Math.hypot(dx, dy) || 1;
      const labelOffset =
        (DOT_RADIUS + 6) / Math.max(ellipseScaleForH(h), 0.35);
      let labelX = x + (dx / dist) * labelOffset;
      let labelY = y + (dy / dist) * labelOffset;
      // If this label would land on/near the aura's own silhouette, push
      // it OUTWARD horizontally, away from baseCx, until clear.
      if (
        labelY > AURA_BODY_TOP &&
        labelY < AURA_BODY_BOTTOM &&
        Math.abs(labelX - geometry.baseCx) < AURA_BODY_HALF_W
      ) {
        const sign = labelX >= geometry.baseCx ? 1 : -1;
        labelX = geometry.baseCx + sign * AURA_BODY_HALF_W;
      }
      // Push further out, radially (same direction as the offset above,
      // not straight down — a loop can approach from any side), while
      // this label's anchor point sits too close to some OTHER stretch of
      // the curve — a small, capped number of steps so this can never
      // loop unboundedly.
      const ownStep = Math.round(
        (1 - h / H_CUT) * (geometry.samples.length - 1),
      );
      for (let guard = 0; guard < 8; guard++) {
        let collides = false;
        for (let s = 0; s < geometry.samples.length; s += 4) {
          if (Math.abs(s - ownStep) < CURVE_AVOID_STEP_GAP) continue;
          const sample = geometry.samples[s];
          if (
            Math.hypot(labelX - sample.x, labelY - sample.y) < CURVE_AVOID_DIST
          ) {
            collides = true;
            break;
          }
        }
        if (!collides) break;
        labelX += (dx / dist) * labelOffset * 0.5;
        labelY += (dy / dist) * labelOffset * 0.5;
      }
      // Push straight down, away from the aura, until this label's box no
      // longer overlaps any earlier one — a small, capped number of steps
      // so this can never loop unboundedly.
      for (let guard = 0; guard < 8; guard++) {
        const collides = placed.some(
          (p) =>
            Math.abs(labelX - p.x) < LABEL_BOX_W &&
            Math.abs(labelY - p.y) < LABEL_BOX_H,
        );
        if (!collides) break;
        labelY += LABEL_BOX_H * 0.6;
      }
      const isLeftHalf = dx < -4;
      const isRightHalf = dx > 4;
      const align: "left" | "right" | "center" = isLeftHalf
        ? "right"
        : isRightHalf
          ? "left"
          : "center";
      // Clamp to the canvas's own bounds (2026-09-03) — confirmed
      // on-device at the narrowest supported width (SPIRAL_WIDTH's own
      // 327px floor): Body's own label could push past the canvas's
      // right edge and clip, once SPIRAL_HEIGHT_STRETCH (added earlier
      // this session) grew the curve's own radius at low h. Matches the
      // EXACT box math the render below uses per align (align="right":
      // box extends LEFT of labelX by 96; align="left": box extends
      // RIGHT of labelX by 96; "center": box is 120 wide, centered on
      // labelX-60+60) — an earlier version of this clamp assumed a
      // centered box for every align and under-clamped "left"/"right"
      // rows (Body's own real box needs 96px clear to its right, not
      // half that), confirmed still clipping on-device after that fix.
      if (align === "left") {
        labelX = Math.min(labelX, width - 96);
      } else if (align === "right") {
        labelX = Math.max(labelX, 96);
      } else {
        labelX = Math.max(60, Math.min(width - 60, labelX));
      }
      // Spirit-specific nudge (2026-09-02, at the user's own request) —
      // push it further left/away from the curve than the shared
      // geometry above would place it on its own. Applied AFTER the
      // canvas-bounds clamp above (not before) so this can't reintroduce
      // the clipping that clamp exists to prevent — re-clamped
      // afterward for the same reason.
      if (point.key === "spirit") {
        labelX = Math.max(0, labelX - 4);
      }
      return { labelX, labelY, align };
    });
  }, [points, geometry]);

  // Traveling arrival-descent marker: bare apex (h=1) → chest (h=0), along
  // the real sampled polyline (not a straight chord). Reuses the exact
  // primitive the old first-run travel marker used (worklet-driven
  // pointForH), just retargeted — see depths/index.tsx's own wiring for
  // the trigger condition and timing. Unchanged from the pre-split
  // version — entirely h≤1, well inside this canvas's own h≤H_CUT domain.
  const descentProgress = useSharedValue(0);
  const descentOpacity = useSharedValue(0);
  const DESCENT_FADE_MS = 250;
  useEffect(() => {
    if (!playArrivalDescent) return;
    descentOpacity.value = withDelay(
      arrivalDescentDelayMs,
      withTiming(1, { duration: DESCENT_FADE_MS, easing: SOFT_EASE }),
    );
    descentProgress.value = withDelay(
      arrivalDescentDelayMs,
      withTiming(1, { duration: arrivalDescentDurationMs, easing: SOFT_EASE }),
    );
    descentOpacity.value = withDelay(
      arrivalDescentDelayMs + arrivalDescentDurationMs,
      withTiming(0, { duration: DESCENT_FADE_MS }),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playArrivalDescent]);

  const descentMarkerStyle = useAnimatedStyle(() => {
    "worklet";
    const h = 1 - descentProgress.value;
    const { x, y } = pointForH(
      h,
      geometry.baseCx,
      geometry.chestY,
      geometry.riseHeight,
      auraHalfWidth,
      auraHalfHeight,
      auraHalfWidth,
      auraHalfHeight,
      bendTargetX,
    );
    return {
      opacity: descentOpacity.value,
      transform: [{ translateX: x - 5 }, { translateY: y - 5 }],
    };
  });

  // Sphere-tap confirmation pulse: the tapped point's own h → chest (h=0).
  // Was 380ms — slowed to 700ms then 1000ms at the user's own request
  // ("the dot travels across the spiral, which looks pretty cool, but
  // can it move slower?" / "make it a bit slower"), still a confirmation
  // pulse rather than the ceremonial ~1700ms arrival descent, just given
  // enough time to actually be watched traveling the curve. Unchanged
  // from the pre-split version.
  const pulseProgress = useSharedValue(0);
  const pulseOpacity = useSharedValue(0);
  const PULSE_DURATION_MS = 4000;
  const PULSE_FADE_MS = 180;
  useEffect(() => {
    if (!pulseToSphere) return;
    const slotIndex = SLOT_ORDER.indexOf(pulseToSphere);
    if (slotIndex === -1) return;
    cancelAnimation(pulseProgress);
    cancelAnimation(pulseOpacity);
    pulseProgress.value = 0;
    pulseOpacity.value = withTiming(1, {
      duration: PULSE_FADE_MS,
      easing: SOFT_EASE,
    });
    pulseProgress.value = withTiming(1, {
      duration: PULSE_DURATION_MS,
      easing: SOFT_EASE,
    });
    pulseOpacity.value = withDelay(
      PULSE_DURATION_MS,
      withTiming(0, { duration: PULSE_FADE_MS }),
    );
    // Fires exactly when the dot reaches the aura's center (PULSE_
    // DURATION_MS), not after its own fade-out finishes too — the aura's
    // color change is the dot ARRIVING, not the dot having fully
    // disappeared. Was gated on PULSE_DURATION_MS + PULSE_FADE_MS, which
    // read as "changes color a bit too late" once PULSE_DURATION_MS grew
    // large enough (3000ms) that the extra ~180ms fade delay became
    // noticeable as its own separate beat instead of an imperceptible
    // rounding error.
    const timer = setTimeout(() => onPulseSettled?.(), PULSE_DURATION_MS * 0.4);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulseToSphere]);

  const pulseStartH = pulseToSphere
    ? hForSlot(SLOT_ORDER.indexOf(pulseToSphere))
    : 0;
  const pulseMarkerStyle = useAnimatedStyle(() => {
    "worklet";
    const h = pulseStartH * (1 - pulseProgress.value);
    const { x, y } = pointForH(
      h,
      geometry.baseCx,
      geometry.chestY,
      geometry.riseHeight,
      auraHalfWidth,
      auraHalfHeight,
      auraHalfWidth,
      auraHalfHeight,
    );
    return {
      opacity: pulseOpacity.value,
      transform: [{ translateX: x - 4 }, { translateY: y - 4 }],
    };
  });

  // The 17-level wheel — 2026-09-01: a permanent landmark on the spiral,
  // not a reveal gated on tapping a sphere. It shows the OVERALL reading's
  // level by default (selectedWheelLevelSlug/Name already carry that
  // fallback — see depths/index.tsx's own wheelLevelSlug/Name, which now
  // falls back to the combined reading the same way ringLevelSlug does)
  // and re-points to a tapped sphere's own level, but never goes blank:
  // this is the screen's "status readout," always legible, the menu of
  // next actions (Stay/Understand/Shift/Measure again) now a whole
  // separate, independently-scrollable canvas below it. The only fade
  // left is the ONE-TIME entrance once a reading first exists
  // (selectedWheelLevelSlug is null pre-reading) — every later change
  // (tapping a different sphere, deselecting back to the overall reading)
  // just updates the ring's marker/label in place, no fade, since the
  // wheel itself never disappears again.
  const hasWheelContent = Boolean(selectedWheelLevelSlug);
  const wheelOpacity = useSharedValue(hasWheelContent ? 1 : 0);
  const EMPHASIS_DURATION_MS = 380;
  useEffect(() => {
    if (!hasWheelContent) return;
    cancelAnimation(wheelOpacity);
    wheelOpacity.value = withTiming(1, {
      duration: EMPHASIS_DURATION_MS,
      easing: SOFT_EASE,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasWheelContent]);
  const wheelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: wheelOpacity.value,
  }));
  // Keeps the last real level on screen across any brief gap between
  // selectedWheelLevelSlug updates (e.g. a re-render mid-transition) so
  // the wheel never has to go blank — VibrationSpectrum needs a real
  // levelSlug to render at all.
  const lastWheelSlug = useRef<string | null>(null);
  const lastWheelName = useRef<string | null>(null);
  if (selectedWheelLevelSlug) {
    lastWheelSlug.current = selectedWheelLevelSlug;
    lastWheelName.current = selectedWheelLevelName;
  }
  const strokeColor = `rgb(${accentRgb})`;

  return (
    <View style={styles.outer}>
      <View pointerEvents="box-none" style={[styles.wrap, { width, height }]}>
        <Svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={StyleSheet.absoluteFill}
        >
          <Path
            d={geometry.pathD}
            fill="none"
            stroke={strokeColor}
            strokeOpacity={0.16}
            strokeWidth={1}
            strokeLinecap="round"
          />
        </Svg>

        {playArrivalDescent && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.travelDot,
              { backgroundColor: strokeColor },
              descentMarkerStyle,
            ]}
          />
        )}
        {pulseToSphere && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.pulseDot,
              { backgroundColor: strokeColor },
              pulseMarkerStyle,
            ]}
          />
        )}

        {/* The 17-level wheel — fixed position, fades in ONCE when a
            reading first appears (see wheelOpacity's own comment above)
            and then stays visible permanently, re-pointing in place as
            selectedWheelLevelSlug changes (a tapped sphere, or back to
            the overall reading) rather than fading out and back in.
            Only the center label itself is tappable (onWheelLevelPress,
            the level's own detail page — same destination the removed
            ringLevelName link below the aura used to lead to); box-none
            so the ring/dots around it stay non-interactive, matching this
            component's other decorative overlays. */}
        {(selectedWheelLevelSlug || lastWheelSlug.current) && (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.wheelWrap,
              {
                left: wheelPos.x - wheelSize / 2,
                top: wheelPos.y - wheelSize / 2,
              },
              wheelAnimatedStyle,
            ]}
          >
            <VibrationSpectrum
              levelSlug={selectedWheelLevelSlug ?? lastWheelSlug.current!}
              size={wheelSize}
              // 2026-09-02 — physically rotates the ring so the active
              // level's own tick lands at VibrationSpectrum's own fixed
              // VISIBLE_ANGLE, the one point on the ring guaranteed to
              // stay inside the visible slice regardless of the bleed
              // above. labelOffset anchors centerLabel at
              // geometry.curveTouchPoint — the exact point the drawn
              // curve stops at, on the wheel's own circumference — per
              // the user's own request to move the label OUTSIDE the
              // wheel, right where the spiral touches it, rather than
              // floating inside the ring's own visible slice. Converted
              // from canvas-space (curveTouchPoint, wheelPos are both in
              // DepthsSpiralCore's own coordinate space) to wheel-local
              // space (what VibrationSpectrum's labelOffset expects,
              // relative to ITS OWN size/2,size/2 center) by subtracting
              // wheelPos.
              rotateToIndex={levelIndex(
                selectedWheelLevelSlug ?? lastWheelSlug.current!,
              )}
              labelOffset={{
                x: geometry.curveTouchPoint.x - wheelPos.x + 100,
                y: geometry.curveTouchPoint.y - wheelPos.y - 10,
              }}
              // 2026-09-02, at the user's own request — the wheel's own
              // dots read as too large once the whole ring grew (per
              // WHEEL_SIZE). Scoped to Depths only (dotScale defaults to
              // 1, i.e. unchanged, everywhere else VibrationSpectrum is
              // used).
              dotScale={0.7}
              centerLabel={
                selectedWheelLevelName ?? lastWheelName.current ?? fonts.light
              }
              onCenterLabelPress={onWheelLevelPress}
            />
          </Animated.View>
        )}

        {points.map((point, i) => {
          const layout = labelLayout[i];
          if (!layout) return null;
          const { x, y } = geometry.points[i];
          const { labelX, labelY, align } = layout;
          const dotColor = interactive ? point.color : `rgb(${accentRgb})`;
          const dotOpacity = interactive ? (point.isSelected ? 1 : 0.85) : 0.45;

          return (
            <View key={point.key}>
              <Pressable
                style={[
                  styles.hitArea,
                  { left: x - HIT / 2, top: y - HIT / 2 },
                ]}
                onPress={() => interactive && onPointPress(point.key)}
                hitSlop={4}
              >
                <View
                  style={[
                    styles.dot,
                    {
                      width: DOT_RADIUS * 2,
                      height: DOT_RADIUS * 2,
                      borderRadius: DOT_RADIUS,
                      backgroundColor: dotColor,
                      opacity: dotOpacity,
                    },
                  ]}
                />
              </Pressable>
              {/* The label itself is its own separate tap target, not just
                  a caption over the dot's — a dot alone is a small, fiddly
                  target on a real screen. Same onPointPress, same key, so
                  tapping either the dot OR its full label text does the
                  same thing. */}
              <Pressable
                onPress={() => interactive && onPointPress(point.key)}
                hitSlop={4}
                style={[
                  styles.pointLabelHit,
                  {
                    top: labelY - fontSizes.xs * 0.7,
                    minHeight: fontSizes.xs * 2.4,
                    ...(align === "right"
                      ? { right: width - labelX, left: undefined, width: 96 }
                      : align === "left"
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
                      color: interactive ? dotColor : colors.text.faint,
                      fontSize: fontSizes.xs,
                      textAlign: align,
                      // 2026-09-02, at the user's own request — the
                      // selected sphere's own label reads as genuinely
                      // heavier than the rest. First tried as RN's
                      // synthetic bold (fontWeight alone) — no visible
                      // contrast, confirmed by the user ("all look
                      // pretty bold all the time"), since fonts.medium
                      // (styles.pointLabel's own base fontFamily) is
                      // already a fairly heavy face and faking heavier
                      // on top barely changes it. Real fontFamily swap
                      // instead: unselected uses fonts.trueLight (the
                      // genuinely lighter face, loaded specifically for
                      // this — see typography.ts's own comment),
                      // selected keeps styles.pointLabel's own fonts
                      // .medium as-is.
                      fontFamily: point.isSelected
                        ? fonts.light
                        : fonts.trueLight,
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

interface DepthsSpiralCoreProps {
  width: number;
  height: number;
  points: SpiralSpherePoint[]; // length 4, SLOT_ORDER order
  accentRgb: string; // the LINE's own color — stays the one screen accent
  onPointPress: (key: SphereKey) => void;
  // Neutral/pre-reading mode: points render but are inert (no per-sphere
  // data exists yet) — position continuity with the post-reading render,
  // just undifferentiated and non-interactive.
  interactive: boolean;
  // Plays the traveling-point arrival descent once, right after a reading
  // completes — a marker travels from the bare apex (h=1) down to the
  // chest (h=0), timed to land exactly as the aura body finishes forming
  // (see depths/index.tsx's AuraArrival: arrivalDescentDelayMs should be
  // COLOR_START_MS, arrivalDescentDurationMs should be ARRIVAL_DURATION_MS
  // — the same instant/duration the aura body itself uses, so the point's
  // arrival and the body's completion coincide). Never replays on a later
  // revisit — the caller gates this on the same "fresh arrival only" flag
  // that already governs the rest of the reveal.
  playArrivalDescent: boolean;
  arrivalDescentDelayMs: number;
  arrivalDescentDurationMs: number;
  // A quick confirmation pulse — set to a sphere key right after that
  // point is tapped, travels from that point's own h down to the chest
  // (a few hundred ms, not a ceremonial reveal), then calls
  // onPulseSettled. depths/index.tsx toggles selectedSphere at/just before
  // the pulse lands, so AuraField's ring-dimming reads as CAUSED by the
  // pulse arriving, not simultaneous-but-unrelated.
  pulseToSphere: SphereKey | null;
  onPulseSettled?: () => void;
  // The aura's own ground-ellipse half-width/half-height, in this
  // component's own pixel space — used both as the cone's base ellipse
  // dimensions AND its inner clearance floor near h≈0. Elliptical, not
  // circular, because the aura figure is tall and narrow (see
  // AuraFigure.tsx's BODY, ~200×380) — a single scalar radius cleared the
  // shoulders fine but let the base winding clip through the head/legs.
  auraHalfWidth: number;
  auraHalfHeight: number;
  // The aura FIGURE's own visible height (not the ring's — much taller),
  // used only to keep labels from landing on top of the body.
  auraFigureHeight: number;
  // Distance from the aura image's own top edge down to its chest point
  // (AURA_METRICS.chestY at the call site) — used with auraFigureHeight
  // and chestY (below) to derive exactly where the aura's silhouette
  // spans in this canvas's coordinate space (top = chestY - this value,
  // bottom = top + auraFigureHeight), so the label-avoidance check knows
  // where to push labels away from regardless of whether the aura sits
  // at the top or bottom of the composition.
  auraChestOffsetFromTop: number;
  // The curve's own true destination (h=0) — the aura's glowing chest
  // point, in this component's own pixel space (measured from the
  // canvas's own top edge, NOT the aura image's own top).
  chestY: number;
  // Pixels-per-unit-h — how far the spiral climbs above chestY for each
  // unit of h. Optional, defaults to chestY - TOP_MARGIN (the original
  // formula). depths/index.tsx passes this explicitly — see
  // DEPTHS_COMPOSITION_GEOMETRY's own riseHeight getter for why it must
  // stay pinned to a fixed pre-growth basis even as chestY itself is free
  // to move with the canvas's own height.
  riseHeight?: number;
  // The wheel's own pixel diameter — was the module-level WHEEL_SIZE
  // constant (170), used directly; now passed explicitly by the caller
  // (2026-09-02) so it can scale down together with the rest of the
  // composition (auraDisplaySize, riseHeight, etc.) when Depths' own
  // fixed-zone shrink-to-fit kicks in on a short screen. Confirmed as a
  // real bug when this WASN'T threaded through: the shrink mechanism
  // scaled auraDisplaySize/riseHeight down but WHEEL_SIZE stayed a fixed
  // 170px, so the wheel's own required headroom (computed from the
  // now-smaller riseHeight but the still-full-size wheel) diverged from
  // what the shrink math expected, producing a broken, wildly-off layout
  // (a measured `top: -9970` on one affected element). Optional, defaults
  // to the base WHEEL_SIZE constant for any caller that hasn't been
  // updated to pass it explicitly.
  wheelSize?: number;
  // The 17-level wheel, permanently visible in the gap between the sphere
  // points and (now, off-canvas) the action points once a reading exists
  // (2026-09-01 — was a reveal gated on tapping a sphere; see
  // depthsSpiralGeometry.ts's own WHEEL_H comment for why that changed) —
  // teaches, at a glance and without words, that the 4 measured states
  // sit on a wider 17-level map. null (pre-reading) keeps the wheel
  // hidden entirely; once a reading exists the caller always passes a
  // real level — either the tapped sphere's own level, or (no sphere
  // selected) the OVERALL reading's level, the same fallback ringLevelSlug
  // already uses elsewhere on this screen — never null again once a
  // reading exists. Already resolved/translated by the caller (this
  // component has no locale access of its own, same reasoning as
  // SpiralSpherePoint's own label field).
  selectedWheelLevelSlug: string | null;
  selectedWheelLevelName: string | null;
  // Tapping the wheel's own center label — the level's own detail page,
  // same destination the old ringLevelName link below the aura used to
  // lead to before it was removed as redundant with the wheel itself.
  onWheelLevelPress?: () => void;
}

const styles = StyleSheet.create({
  outer: { alignItems: "center" },
  wrap: { position: "relative" },
  hitArea: {
    position: "absolute",
    width: HIT,
    height: HIT,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: DOT_RADIUS * 2,
    height: DOT_RADIUS * 2,
    borderRadius: DOT_RADIUS,
  },
  travelDot: { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  pulseDot: { position: "absolute", width: 8, height: 8, borderRadius: 4 },
  wheelWrap: { position: "absolute" },
  // The tap target — positioned absolutely, sized to the label's own
  // reserved width/height rather than the dot's fixed 44×44 hitArea, since
  // a two-line label reasonably needs a taller target than a single dot.
  pointLabelHit: {
    position: "absolute",
    justifyContent: "center",
  },
  pointLabel: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    maxWidth: 130,
  },
});
