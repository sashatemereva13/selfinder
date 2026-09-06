import { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  cancelAnimation,
} from "react-native-reanimated";
import { useThemeColors } from "../theme/useThemeColors";
import { fonts, fontSizes } from "../theme/typography";
import { DepthsMenuSymbol, type DepthsMenuSymbolId } from "./DepthsMenuSymbol";
import { PhilosopherObject } from "./PhilosopherObject";
import {
  DOT_RADIUS,
  ACTION_LABEL_BOX_W,
  ACTION_LABEL_BOX_H,
  SHIFT_SUB_LABEL_BOX_W,
  SHIFT_SUB_LABEL_BOX_H,
  CURVE_AVOID_DIST,
  CURVE_AVOID_STEP_GAP,
  H_CUT,
  H_MAX,
  SOFT_EASE,
  ACTION_ORDER,
  hForAction,
  hForShiftSub,
  ellipseScaleForH,
  pointForH,
  buildSpiralMenuGeometry,
  type SpiralActionPoint,
  type SpiralActionKey,
  type SpiralShiftSubPoint,
  type SpiralShiftSubKey,
} from "./depthsSpiralGeometry";

// DepthsSpiralMenu — the SCROLLABLE-zone half of what used to be one
// DepthsSpiral component (split 2026-09-01, see depthsSpiralGeometry.ts's
// own header comment for the full split rationale). Draws only h∈[H_CUT,
// H_MAX]: the 4 action points (Stay/Understand/Shift/Measure again),
// Shift's own 2 sub-points, and the decorative top loop past Measure
// again. Renders as the FIRST thing inside Depths' new independently-
// scrollable bottom zone — directly below DepthsSpiralCore's own fixed
// canvas, at scroll position 0.
//
// SEAM CONTINUITY — the hard part of this split, worth spelling out here
// since it's not obvious from the code alone:
//
// pointForH's own rx/ry (the curve's SHAPE at a given h) are a pure
// function of h alone — they never read chestY/riseHeight/baseCx (see
// pointForH's own comment in depthsSpiralGeometry.ts). Only the curve's
// POSITION (yCenter = chestY - h*riseHeight, x = baseCx + rx*cos(theta))
// depends on those three. So the shape at h=H_CUT is automatically
// identical between Core and Menu (same formulas, same h) — the only
// thing that has to be engineered is PIXEL POSITION.
//
// Both canvases share the same baseCx (same width, centered the same
// way) and the same riseHeight MAGNITUDE (|menuRiseHeight| === Core's own
// SPIRAL_RISE_HEIGHT, keeping the curve's rate-of-climb visually
// consistent across the seam) — but NOT the same SIGN. Core's own
// convention (riseHeight > 0) makes y DECREASE as h increases (the curve
// visually rises up the screen as it climbs toward the apex/loop) — the
// right convention for a canvas whose OWN top is the "high" end. Menu's
// canvas is different: it sits BELOW Core in the DOM/scroll order, but
// h keeps climbing right where Core's own bottom (h=H_CUT) leaves off —
// so for the two curves to look continuous, Menu's own DOM-TOP (the row
// physically adjacent to Core's own bottom) must render h=H_CUT, and h
// must increase GOING DOWN into Menu's canvas from there (toward the
// action points, then finally the decorative loop at h=H_MAX, deepest in
// the scroll). That requires y to INCREASE with h in Menu's own local
// space — the opposite sign from Core's own riseHeight. depths/index.tsx
// computes this as MENU_RISE_HEIGHT = -SPIRAL_RISE_HEIGHT.
//
// With riseHeight's magnitude pinned and its sign resolved, the only
// remaining free variable is menuChestY (this canvas's own local, purely
// virtual "yCenter at h=0" reference — Menu never actually draws that
// low). Solve it by requiring pointForH(H_CUT, ...)'s own yCenter to land
// at local y=0 (this canvas's own top edge):
//   yCenter(H_CUT) = menuChestY - H_CUT·MENU_RISE_HEIGHT
//                   = menuChestY + H_CUT·SPIRAL_RISE_HEIGHT   (want = 0)
//   =>  menuChestY = -H_CUT · SPIRAL_RISE_HEIGHT
// This is a property of Menu's OWN local geometry alone — it doesn't
// reference Core's own chestY at all, unlike an earlier draft of this
// derivation. What actually keeps the two canvases visually joined is
// (a) both being h=H_CUT at the shared boundary row, (b) the same
// riseHeight magnitude on both sides (so the curve's rate of climb
// doesn't visibly kink at the seam), and (c) Menu's canvas rendering with
// zero gap directly below Core's own canvas in the layout (see
// depths/index.tsx's fixedZone/scrollZone — Menu is the FIRST child of
// scrollZone's content, immediately below fixedZone, so there is no
// spacer between them at scroll position 0). The two chestY VALUES
// themselves have no direct arithmetic relationship — each is local to
// its own canvas's own coordinate system.
// Fixed vertical distance an action label's natural (pre-collision-
// avoidance) position sits above its own dot — see actionLabelLayout's
// own comment for why this replaced a radial (curve-direction-following)
// offset. labelY anchors near the label's OWN FIRST LINE (the label box
// renders with `top: labelY - fontSizes.xs*0.7`, see ActionRow), so for
// the dot to sit close to the label's bottom edge — not floating well
// below a multi-line label, confirmed too far in an initial 31px attempt
// — this needs to cover nearly the label box's full height, not roughly
// half of it.
const ACTION_LABEL_Y_OFFSET = ACTION_LABEL_BOX_H * 0.01;

export function DepthsSpiralMenu({
  width,
  height,
  chestY,
  riseHeight,
  auraHalfWidth,
  auraHalfHeight,
  accentRgb,
  actionPoints,
  onActionPress,
  shiftRevealed,
  shiftSubPoints,
  onShiftSubPress,
  pulseKey,
  onPulseSettled,
}: DepthsSpiralMenuProps) {
  const colors = useThemeColors();
  // 2026-09-01 — shiftRevealed is a plain boolean owned by depths/index.tsx
  // (toggled instantly on tap, cleared instantly once any pulse settles —
  // see that file's handleActionPress/handleActionPulseSettled). Gating
  // shiftSubPoints's render directly on that boolean means the rows vanish
  // the instant it flips false, with no chance for an exit animation to
  // play. Keep rendering them locally for one extra beat on a false-edge,
  // just long enough for ShiftSubRow's own exit fade (below) to finish,
  // then actually drop them from the tree.
  //
  // The false-edge itself must be detected DURING render, not in a
  // useEffect — an effect only runs after commit, so by the time it set
  // lingeringShift the false-edge render had already committed with
  // showShiftSubPoints still false, unmounting ShiftSubRow before the
  // linger could take effect (confirmed 2026-09-02: disappearance wasn't
  // animating at all, only appearance was — this was why). Comparing
  // against a ref updated inline, in the render body itself, means the
  // very render where shiftRevealed flips false is also the render where
  // lingeringShift flips true.
  const [, forceRerender] = useState(0);
  const wasRevealedRef = useRef(shiftRevealed);
  const lingerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lingeringRef = useRef(false);
  if (wasRevealedRef.current && !shiftRevealed && !lingeringRef.current) {
    lingeringRef.current = true;
  }
  wasRevealedRef.current = shiftRevealed;
  useEffect(() => {
    if (!lingeringRef.current) return;
    if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
    lingerTimerRef.current = setTimeout(() => {
      lingeringRef.current = false;
      forceRerender((n) => n + 1);
    }, SHIFT_SUB_EXIT_MS);
    return () => {
      if (lingerTimerRef.current) clearTimeout(lingerTimerRef.current);
    };
  }, [shiftRevealed]);
  const showShiftSubPoints = shiftRevealed || lingeringRef.current;
  const geometry = useMemo(
    () =>
      buildSpiralMenuGeometry(
        width,
        height,
        chestY,
        riseHeight,
        auraHalfWidth,
        auraHalfHeight,
      ),
    [width, height, chestY, riseHeight, auraHalfWidth, auraHalfHeight],
  );

  // A SECOND collision-avoidance pass, structurally identical to
  // DepthsSpiralCore's own sphere-label pass (radial push, curve-
  // avoidance, box-overlap-avoidance) but with larger boxes (a label+
  // description PAIR needs real width/height, not a short single-line
  // sphere name). No aura-silhouette check here (unchanged from the
  // pre-split version) — action points sit well above the aura, h>1.
  const actionLabelLayout = useMemo(() => {
    const placed: { x: number; y: number }[] = [];
    return actionPoints.map((point, i) => {
      const { x, y } = geometry.actionPoints[i];
      const h = hForAction(i);
      const windingCenterX = geometry.baseCx;
      const windingCenterY = geometry.chestY - h * geometry.riseHeight;
      const dx = x - windingCenterX;
      const dy = y - windingCenterY;
      const dist = Math.hypot(dx, dy) || 1;
      const labelOffset =
        (DOT_RADIUS + 6) / Math.max(ellipseScaleForH(h), 0.35);
      // labelX still follows the curve's local radial direction (dx) —
      // that's what decides which SIDE of the curve a label sits on and
      // reads sensibly there. labelY used to follow the radial dy too,
      // which put each dot at a different position relative to its own
      // label depending on which way the spiral happened to be winding
      // at that h (Stay's dot near its label's middle, Shift's dot well
      // below its own label, nearly at "Measure again" — confirmed by
      // the user's own screenshot 2026-09-02). Anchoring labelY a FIXED
      // distance above the dot, regardless of winding direction, makes
      // every row read the same way.
      let labelX = x + (dx / dist) * labelOffset;
      let labelY = y - ACTION_LABEL_Y_OFFSET;
      // Same step-index lookup as buildSpiralMenuGeometry's own stepForH,
      // reproduced here (rather than exported/imported) since this pass
      // only needs the integer index, not a Point — matches the
      // pre-split file's own pattern of a local ownStep computation.
      const ownStep = Math.round(
        ((H_MAX - h) / (H_MAX - H_CUT)) * (geometry.samples.length - 1),
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
      // Pushes away from whatever it's colliding with (up OR down,
      // whichever direction the offending label ISN'T in) rather than
      // always downward — an unconditional downward push had no ceiling,
      // so a label crowded by its neighbors could walk step by step all
      // the way down to the aura, ending up nowhere near its own dot
      // (confirmed on-device: "Measure again"'s label, whose dot sits at
      // the very top of the extension, drifted down to overlap the aura
      // instead). MAX_LABEL_DRIFT caps how far ANY direction can wander
      // from the label's own natural (dot-anchored) starting position —
      // once a guard iteration would exceed it, the loop gives up and
      // accepts a little visual crowding over a label that's lost its
      // visual connection to its own point entirely.
      const naturalLabelY = labelY;
      const MAX_LABEL_DRIFT = ACTION_LABEL_BOX_H * 3;
      for (let guard = 0; guard < 8; guard++) {
        const collides = placed.some(
          (p) =>
            Math.abs(labelX - p.x) < ACTION_LABEL_BOX_W &&
            Math.abs(labelY - p.y) < ACTION_LABEL_BOX_H,
        );
        if (!collides) break;
        const pushDown = placed.some((p) => p.y < labelY);
        const nextY = labelY + (pushDown ? 1 : -1) * ACTION_LABEL_BOX_H * 0.6;
        if (Math.abs(nextY - naturalLabelY) > MAX_LABEL_DRIFT) break;
        labelY = nextY;
      }
      placed.push({ x: labelX, y: labelY });
      const isLeftHalf = dx < -4;
      const isRightHalf = dx > 4;
      const align: "left" | "right" | "center" = isLeftHalf
        ? "right"
        : isRightHalf
          ? "left"
          : "center";
      return { labelX, labelY, align };
    });
  }, [actionPoints, geometry]);

  // Shift's own DOT position on the curve — the origin the sub-points
  // travel from on entrance/exit (2026-09-02, see ShiftSubRow's own
  // comment): they should visibly emerge from Shift's own point and
  // gather into their resting spot, "gather, condense, become" rather
  // than growing in place. Deliberately the raw dot (geometry.
  // actionPoints), not actionLabelLayout's own labelX/labelY — the label
  // can drift upward from its natural position via the collision-
  // avoidance pass above, which made the sub-points look like they were
  // emerging from "Understand it" (the neighboring, higher label)
  // instead of from Shift itself (confirmed by the user 2026-09-02).
  // The dot never drifts, so it stays the true visual source.
  const shiftDot = geometry.actionPoints[ACTION_ORDER.indexOf("shift")];

  // Shift's own 2 sub-points (Tune In, Breathing) — a THIRD, smaller
  // collision-avoidance pass, seeded from actionLabelLayout's own final
  // positions (so a sub-point can't land on Shift's own label, or any of
  // the other 3 action labels). Needed because these render conditionally
  // (only once shiftRevealed) right next to Shift's own already-placed
  // label — without this, both sub-points and Shift's label landed on
  // top of each other (confirmed on-device 2026-08-30).
  const shiftSubLabelLayout = useMemo(() => {
    // labelX is the box's own ANCHOR edge, not its center — where that
    // anchor sits within the box depends on align ('right': box extends
    // LEFT of labelX; 'left': box extends RIGHT of labelX; 'center': box
    // is centered on labelX). Recovering the true center here (rather
    // than treating labelX as if it were already the center) is what
    // makes the collision check below actually line up with the box's
    // real rendered position.
    const placed: { x: number; y: number; w: number; h: number }[] =
      actionLabelLayout.map((l) => ({
        x:
          l.align === "right"
            ? l.labelX - ACTION_LABEL_BOX_W / 2
            : l.align === "left"
              ? l.labelX + ACTION_LABEL_BOX_W / 2
              : l.labelX,
        y: l.labelY,
        w: ACTION_LABEL_BOX_W,
        h: ACTION_LABEL_BOX_H,
      }));
    return shiftSubPoints.map((point) => {
      const h = hForShiftSub(point.key);
      const p = pointForH(
        h,
        geometry.baseCx,
        geometry.chestY,
        geometry.riseHeight,
        auraHalfWidth,
        auraHalfHeight,
        auraHalfWidth,
        auraHalfHeight,
      );
      let labelX = p.x + 12;
      const naturalLabelY = p.y - fontSizes.xs * 0.7;
      let labelY = naturalLabelY;
      // Capped drift (2026-08-31) — an earlier, uncapped version of this
      // loop could push a sub-point far away chasing a collision-free
      // spot, landing on top of neighboring action points instead
      // (confirmed on-device). Tune In/Breathing should read as
      // unfolding right next to Shift, not relocating elsewhere — a
      // little visual crowding near Shift is the better trade than
      // drifting far from it.
      const MAX_SUB_DRIFT = SHIFT_SUB_LABEL_BOX_H * 1.5;
      for (let guard = 0; guard < 8; guard++) {
        const collides = placed.some(
          (pl) =>
            Math.abs(labelX - pl.x) < (SHIFT_SUB_LABEL_BOX_W + pl.w) / 2 &&
            Math.abs(labelY - pl.y) < (SHIFT_SUB_LABEL_BOX_H + pl.h) / 2,
        );
        if (!collides) break;
        const nextY =
          labelY +
          SHIFT_SUB_LABEL_BOX_H * 0.4 * (point.key === "tuneIn" ? -1 : 1);
        if (Math.abs(nextY - naturalLabelY) > MAX_SUB_DRIFT) break;
        labelY = nextY;
      }
      placed.push({
        x: labelX,
        y: labelY,
        w: SHIFT_SUB_LABEL_BOX_W,
        h: SHIFT_SUB_LABEL_BOX_H,
      });
      return { labelX, labelY };
    });
  }, [
    shiftSubPoints,
    geometry,
    actionLabelLayout,
    auraHalfWidth,
    auraHalfHeight,
  ]);

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

        {/* The 4 action points (h>1) — Stay/Understand/Shift/Measure
            again, replacing the old text-stack intentionSection. Always
            the one screen accent color (never per-sphere hues — these
            aren't sphere readings). Tap target is the WHOLE label+
            description block, not a separate dot Pressable — the block
            is already large enough to be the natural tap target, and a
            second overlapping Pressable would only add ambiguity. A
            small dot still renders at the point's own (x,y) purely for
            visual continuity with the sphere points below (now off-
            canvas, in DepthsSpiralCore, but the visual language is
            shared). Tapping plays a brief local scale/opacity pulse on
            THIS row (replacing the old cross-canvas travel-to-aura pulse,
            impossible now that action points scroll independently of the
            aura — see ActionRow's own comment) before calling
            onActionPress. */}
        {actionPoints.map((point, i) => {
          const layout = actionLabelLayout[i];
          if (!layout) return null;
          const { x, y } = geometry.actionPoints[i];
          const { labelX, labelY, align } = layout;
          return (
            <ActionRow
              key={point.key}
              point={point}
              x={x}
              y={y}
              labelX={labelX}
              labelY={labelY}
              align={align}
              width={width}
              strokeColor={strokeColor}
              mutedColor={colors.text.muted}
              accentRgb={accentRgb}
              onActionPress={onActionPress}
              pulseKey={pulseKey}
              onPulseSettled={onPulseSettled}
            />
          );
        })}

        {/* Shift's own 2 sub-points — only once revealed (tapping Shift
            itself toggles this, see depths/index.tsx's shiftRevealed
            state). Same rendering path as the 4 action points above,
            just nested one level deeper (no separate dot, smaller/
            quieter — these are a sub-choice, not a peer of Stay/
            Understand/Shift/Measure-again). */}
        {showShiftSubPoints &&
          shiftSubPoints.map((point, i) => {
            const { labelX, labelY } = shiftSubLabelLayout[i];
            return (
              <ShiftSubRow
                key={point.key}
                point={point}
                labelX={labelX}
                labelY={labelY}
                originX={shiftDot.x}
                originY={shiftDot.y}
                strokeColor={strokeColor}
                mutedColor={colors.text.muted}
                visible={shiftRevealed}
                onShiftSubPress={onShiftSubPress}
                pulseKey={pulseKey}
                onPulseSettled={onPulseSettled}
              />
            );
          })}
      </View>
    </View>
  );
}

// 2026-09-01 — replaces the old cross-canvas pulseToAction/
// actionPulseMarkerStyle (a dot that traveled from the tapped point's own
// h all the way down to h=0, the aura's chest), which is now impossible:
// action points live in the independently-scrollable Menu canvas, the
// aura in the fixed Core canvas — there is no longer one shared curve for
// a dot to travel along between them. Replaced with a short LOCAL
// confirmation on the tapped row itself: a brief scale-up + opacity dip,
// same ACTION_PULSE_DURATION_MS (600ms) and SOFT_EASE as the animation it
// replaces, so the FEEL of "you tapped this, it registered, now it's
// taking you somewhere" carries over even though the mechanism changed.
// Settles by calling onActionPulseSettled the same way the old marker's
// arrival used to.
const ACTION_PULSE_DURATION_MS = 600;
const ACTION_PULSE_FADE_MS = 120;
// exploreMap/feelingLucky's own on-curve dot size (2026-09-02) — their
// DepthsMenuSymbol icon in place of the other 4 points' plain
// DOT_RADIUS*2=10px circle. Was 18 (too small to read as a real symbol
// rather than a smudge, per the user's own follow-up); bumped to 26 —
// still well below this component's own row usage elsewhere (size={44})
// or its own default (34), which read as full icons, but large enough
// for the glyph's own strokes to stay legible at a glance.
const ACTION_SYMBOL_SIZE = 60;
// How long Shift's sub-points (Tune In / Breathing) take to fade in, and
// to fade back out once shiftRevealed flips false — DepthsSpiralMenu keeps
// rendering them for SHIFT_SUB_EXIT_MS past that flip so the exit has time
// to actually play. Entrance is deliberately slower than the exit: this is
// meant to read as an unfolding, not a snap (see ShiftSubRow's own comment
// on this) — 320ms read as too quick against that intent (2026-09-01).
const SHIFT_SUB_ENTER_MS = 560;
const SHIFT_SUB_EXIT_MS = 260;

function ActionRow({
  point,
  x,
  y,
  labelX,
  labelY,
  align,
  width,
  strokeColor,
  mutedColor,
  accentRgb,
  onActionPress,
  pulseKey,
  onPulseSettled,
}: {
  point: SpiralActionPoint;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  align: "left" | "right" | "center";
  width: number;
  strokeColor: string;
  mutedColor: string;
  // Raw "r,g,b" triple — DepthsMenuSymbol's own rgb prop wraps it
  // internally (see its own render), unlike strokeColor above which is
  // already pre-wrapped as `rgb(${accentRgb})`. Only used when
  // point.symbolId is set (exploreMap/feelingLucky); every other point
  // ignores it and keeps rendering the plain dot.
  accentRgb: string;
  onActionPress: (key: SpiralActionKey) => void;
  pulseKey: SpiralActionKey | SpiralShiftSubKey | null;
  onPulseSettled?: () => void;
}) {
  const isPulsing = pulseKey === point.key;
  const scale = useSharedValue(1);
  const dim = useSharedValue(0);
  useEffect(() => {
    if (!isPulsing) return;
    cancelAnimation(scale);
    cancelAnimation(dim);
    scale.value = withSequence(
      withTiming(1.08, {
        duration: ACTION_PULSE_DURATION_MS * 0.5,
        easing: SOFT_EASE,
      }),
      withTiming(1, {
        duration: ACTION_PULSE_DURATION_MS * 0.5,
        easing: SOFT_EASE,
      }),
    );
    dim.value = withSequence(
      withTiming(1, { duration: ACTION_PULSE_FADE_MS, easing: SOFT_EASE }),
      withTiming(0, {
        duration: ACTION_PULSE_DURATION_MS - ACTION_PULSE_FADE_MS,
        easing: SOFT_EASE,
      }),
    );
    const timer = setTimeout(
      () => onPulseSettled?.(),
      ACTION_PULSE_DURATION_MS,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPulsing]);
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 - dim.value * 0.25,
  }));

  return (
    <View>
      {point.philosopherId ? (
        // "Understand it" (2026-09-03) — the current philosopher's own
        // PhilosopherObject mark in place of a generic symbol, since
        // this row literally means "talk with them" (see DepthsMenuSymbol
        // .tsx's own header comment, which documented this exact plan
        // when the symbol set was first designed). Checked BEFORE
        // symbolId — the two are mutually exclusive per point.
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: x - ACTION_SYMBOL_SIZE / 2,
            top: y - ACTION_SYMBOL_SIZE / 2,
          }}
        >
          <PhilosopherObject
            id={point.philosopherId}
            rgb={accentRgb}
            size={ACTION_SYMBOL_SIZE}
          />
        </View>
      ) : point.symbolId ? (
        // exploreMap/feelingLucky (2026-09-02), stay/shift/measure
        // (2026-09-03) — their own already-built DepthsMenuSymbol icon
        // in place of the plain dot. exploreMap/feelingLucky mark a
        // different CATEGORY (open-ended exploration, not this reading's
        // own next steps — see ACTION_ORDER's own comment in
        // depthsSpiralGeometry.ts); stay/shift/measure's own glyphs were
        // designed alongside them but left unwired until now. Sized well
        // below this component's own row usage elsewhere (size={44}
        // there) — this needs to read as a DOT on the curve, not a full
        // icon competing with the label text for attention.
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: x - ACTION_SYMBOL_SIZE / 2,
            top: y - ACTION_SYMBOL_SIZE / 2,
          }}
        >
          <DepthsMenuSymbol
            id={point.symbolId as DepthsMenuSymbolId}
            rgb={accentRgb}
            size={ACTION_SYMBOL_SIZE}
          />
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[
            styles.dot,
            {
              position: "absolute",
              left: x - DOT_RADIUS,
              top: y - DOT_RADIUS,
              backgroundColor: strokeColor,
              opacity: 0.85,
            },
          ]}
        />
      )}
      <Pressable
        onPress={() => onActionPress(point.key)}
        hitSlop={4}
        style={[
          styles.actionLabelHit,
          {
            top: labelY - fontSizes.xs * 0.7,
            ...(align === "right"
              ? {
                  right: width - labelX,
                  left: undefined,
                  width: ACTION_LABEL_BOX_W,
                }
              : align === "left"
                ? { left: labelX, right: undefined, width: ACTION_LABEL_BOX_W }
                : {
                    left: labelX - ACTION_LABEL_BOX_W / 2,
                    width: ACTION_LABEL_BOX_W,
                  }),
          },
        ]}
      >
        <Animated.View style={rowStyle}>
          <Text
            style={[
              styles.actionLabel,
              { color: strokeColor, textAlign: align },
            ]}
          >
            {point.label}
          </Text>
          <Text
            style={[
              styles.actionDescription,
              { color: mutedColor, textAlign: align },
            ]}
          >
            {point.description}
          </Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

function ShiftSubRow({
  point,
  labelX,
  labelY,
  originX,
  originY,
  strokeColor,
  mutedColor,
  visible,
  onShiftSubPress,
  pulseKey,
  onPulseSettled,
}: {
  point: SpiralShiftSubPoint;
  labelX: number;
  labelY: number;
  originX: number;
  originY: number;
  strokeColor: string;
  mutedColor: string;
  visible: boolean;
  onShiftSubPress: (key: SpiralShiftSubKey) => void;
  pulseKey: SpiralActionKey | SpiralShiftSubKey | null;
  onPulseSettled?: () => void;
}) {
  const isPulsing = pulseKey === point.key;
  const scale = useSharedValue(1);
  const dim = useSharedValue(0);
  useEffect(() => {
    if (!isPulsing) return;
    cancelAnimation(scale);
    cancelAnimation(dim);
    scale.value = withSequence(
      withTiming(1.08, {
        duration: ACTION_PULSE_DURATION_MS * 0.5,
        easing: SOFT_EASE,
      }),
      withTiming(1, {
        duration: ACTION_PULSE_DURATION_MS * 0.5,
        easing: SOFT_EASE,
      }),
    );
    dim.value = withSequence(
      withTiming(1, { duration: ACTION_PULSE_FADE_MS, easing: SOFT_EASE }),
      withTiming(0, {
        duration: ACTION_PULSE_DURATION_MS - ACTION_PULSE_FADE_MS,
        easing: SOFT_EASE,
      }),
    );
    const timer = setTimeout(
      () => onPulseSettled?.(),
      ACTION_PULSE_DURATION_MS,
    );
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPulsing]);
  // 2026-09-02 — entrance/exit animation for this row's own appearance
  // (Shift's own sub-points used to pop in/out instantly the moment
  // shiftRevealed flipped, no transition at all; a first pass added a
  // plain fade+scale-in-place, but that read as a generic UI pop-in, not
  // in line with the app's own "gather, condense, become" motion
  // language — see aesthetic.md — so this travels FROM Shift's own label
  // position and settles into its resting spot, the same "point becomes
  // something" causality as onboarding's dots-converging-into-a-word).
  // `visible` mirrors the real shiftRevealed value (not the parent's
  // lingering-render boolean, which stays true slightly longer purely so
  // this exit has time to play — see DepthsSpiralMenu's own
  // showShiftSubPoints/lingeringRef).
  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.value = withTiming(visible ? 1 : 0, {
      duration: visible ? SHIFT_SUB_ENTER_MS : SHIFT_SUB_EXIT_MS,
      easing: SOFT_EASE,
    });
  }, [visible]);
  const dx = originX - labelX;
  const dy = originY - labelY;
  // No scale here, deliberately — an earlier version also scaled this
  // element up from 0.6→1 during the travel. RN applies scale around the
  // element's own center, but this box is positioned by its top-left
  // corner (labelX/labelY, both un-centered anchors) — scaling it while
  // ALSO translating shifted the visible glyphs' actual on-screen path
  // away from the straight line the raw dx/dy math implied, enough that
  // the whole motion read as originating near Understand it's dot
  // instead of Shift's, despite both endpoints independently measuring
  // correct (confirmed via on-screen debug markers, then confirmed fixed
  // by removing scale — 2026-09-02). Translate + fade alone reads
  // correctly; don't reintroduce scale here without re-deriving a
  // transform-origin-safe way to combine it with an off-center anchor.
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateX: dx * (1 - entrance.value) },
      { translateY: dy * (1 - entrance.value) },
    ],
  }));
  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: 1 - dim.value * 0.25,
  }));

  return (
    <Animated.View style={entranceStyle}>
      <Pressable
        onPress={() => onShiftSubPress(point.key)}
        hitSlop={4}
        style={[
          styles.actionLabelHit,
          { top: labelY, left: labelX, width: SHIFT_SUB_LABEL_BOX_W },
        ]}
      >
        <Animated.View style={rowStyle}>
          <Text style={[styles.actionLabel, { color: strokeColor }]}>
            {point.label}
          </Text>
          <Text style={[styles.actionDescription, { color: mutedColor }]}>
            {point.description}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

interface DepthsSpiralMenuProps {
  width: number;
  height: number;
  // This canvas's OWN local chestY/riseHeight — not the same numbers
  // DepthsSpiralCore uses. See this file's header comment for the full
  // seam-continuity derivation; depths/index.tsx computes the actual
  // values (MENU_GEOMETRY.chestY = CORE_GEOMETRY.chestY -
  // CORE_CANVAS_HEIGHT, MENU_GEOMETRY.riseHeight =
  // CORE_GEOMETRY.riseHeight).
  chestY: number;
  riseHeight: number;
  // Same aura-ellipse clearance dimensions Core uses — passed through
  // only because buildSpiralMenuGeometry/pointForH's signature takes
  // them; at h>H_CUT the clearance term is always 0 in practice (see
  // clearanceFadeForH in depthsSpiralGeometry.ts — it fades to 0 well
  // before H_GROUND=0.4, far below H_CUT=1.55), so these have no visible
  // effect here, kept only for signature parity with pointForH.
  auraHalfWidth: number;
  auraHalfHeight: number;
  accentRgb: string; // the one screen accent — same value Core receives
  actionPoints: SpiralActionPoint[];
  onActionPress: (key: SpiralActionKey) => void;
  shiftRevealed: boolean;
  shiftSubPoints: SpiralShiftSubPoint[];
  onShiftSubPress: (key: SpiralShiftSubKey) => void;
  // A quick LOCAL confirmation pulse — set to an action/sub-point key
  // right after it's tapped, plays a brief scale/opacity pulse on that
  // row (see ActionRow/ShiftSubRow), then calls onPulseSettled. Replaces
  // the old cross-canvas pulseToAction (see this file's own header
  // comment for why).
  pulseKey: SpiralActionKey | SpiralShiftSubKey | null;
  onPulseSettled?: () => void;
}

const styles = StyleSheet.create({
  outer: { alignItems: "center" },
  wrap: { position: "relative" },
  dot: {
    width: DOT_RADIUS * 2,
    height: DOT_RADIUS * 2,
    borderRadius: DOT_RADIUS,
  },
  actionLabelHit: {
    position: "absolute",
  },
  actionLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
  },
  actionDescription: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: 2,
  },
});
