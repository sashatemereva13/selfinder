import { useEffect, useRef } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle as SvgCircle } from "react-native-svg";
import { VIBRATION_LEVELS, useLevelColors } from "../content/measureConfig";
import { useThemeColors } from "../theme/useThemeColors";
import { fonts, fontSizes, lineHeights } from "../theme/typography";
import { SOFT_EASE } from "./depthsSpiralGeometry";

// A wheel, not a line — and not a single-hue marker on a plain track
// either. Two decisions stacked on each other, both from the same
// worry: any left-to-right bar, even recolored to one plain hue, still
// has a low end and a high end, and a red-to-violet fill along it is
// exactly the "bad → good" visual convention (traffic lights, health
// bars, sentiment scores) Selfinder's philosophy refuses. A circle has
// no ends — shame and enlightenment sit adjacent, closing the loop, on
// purpose (see the user's own framing: if no vibration is better or
// worse, experiencing shame is just as much a part of the whole as
// enlightenment). All 17 level colors are shown around the ring, like a
// genuine color wheel — safe to do specifically BECAUSE it's a closed
// loop: nobody reads a color wheel's red as "worse" than its blue, since
// there's no start or end to rank them along. That's the one thing a
// gradient BAR could never do safely, no matter how it was recolored.
//
// Matches PhilosopherObject's visual language: thin stroke, no fill, no
// glow — the same crisp construction-line register as the philosopher
// symbols and the picker's own ring.
//
// All 17 stay the default (this is still what Levels, a level's own
// detail page, and the arrival spin itself show). Depths' own ring is the
// one deliberate exception, via onlySlugs below — once a reading exists,
// THAT screen personalizes down to just the four sphere colors the
// reading actually produced, since Depths is scoped to one reading, not a
// map of the whole territory the way Levels is.
const RING_RADIUS = 42;
const TICK_LENGTH = 6;
const MARKER_RADIUS = 5;
const COMPACT_RING_RADIUS = 17;
const COMPACT_TICK_LENGTH = 3;
const COMPACT_MARKER_RADIUS = 3;
// The fixed point a rotating ring (rotateToIndex) always brings the
// active level to. angleFor's own convention: 0 is 12 o'clock,
// increasing CLOCKWISE, so 90°(π/2) is due right, 180°(π) is due
// BOTTOM, 270°(3π/2) is due left. Was 225° (5π/4, the bottom-left
// quarter's own diagonal center) — after later tuning passes on the
// wheel's real position (WHEEL_LIFT_RATIO/WHEEL_EXTRA_LEFT_PX in
// DepthsSpiralCore.tsx both ended up smaller than this angle originally
// assumed), the actually-visible slice sits closer to the bottom edge
// than a clean diagonal quarter — confirmed by the user, the marker was
// landing near the visible slice's own TOP. Moved to 200° (closer to
// due-bottom, 180°, with just a touch of left) to match.
const VISIBLE_ANGLE = (200 * Math.PI) / 290;
// Was 700 — slowed at the user's own request (2026-09-02) so the spin
// itself reads as more deliberate/weighty, less like a quick UI snap.
const ROTATE_DURATION_MS = 1100;

export function levelIndex(slug: string): number {
  const i = VIBRATION_LEVELS.findIndex((l) => l.slug === slug);
  return i === -1 ? 0 : i;
}

// 0 stays "up" (12 o'clock) — the natural rest position a clock face or
// color wheel starts from. Distributes all 17 levels evenly around the
// FULL circle (not a half-circle or open arc), since a wheel with a
// visible start/end point would just be a bent line.
function angleFor(index: number, total: number): number {
  return (index / total) * 2 * Math.PI - Math.PI / 2;
}

function polarToXY(center: number, r: number, angle: number) {
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
}

// Exported so a caller composing something around this ring (Depths'
// sphere-convergence animation, see depths/index.tsx) can find a level's
// exact dot position without re-deriving the angle math — keeps the
// ring's own drawing and anything positioned relative to it from silently
// drifting apart if this math ever changes.
export function vibrationSpectrumDotPosition(levelSlug: string, size: number) {
  const total = VIBRATION_LEVELS.length;
  const angle = angleFor(levelIndex(levelSlug), total);
  const baseSize = (RING_RADIUS + TICK_LENGTH) * 2 + MARKER_RADIUS * 2;
  const r = RING_RADIUS * (size / baseSize);
  const center = size / 2;
  return polarToXY(center, r, angle);
}

export function VibrationSpectrum({
  levelSlug,
  compact = false,
  size: sizeOverride,
  hideMarker = false,
  onlySlugs,
  centerLabel,
  onCenterLabelPress,
  rotateToIndex,
  labelOffset,
  dotScale = 1,
}: {
  levelSlug: string;
  compact?: boolean;
  // Scales the whole ring (radius/tick/marker together, same proportions
  // as the compact/full presets) to an arbitrary diameter — for
  // compositions that need a size neither preset fits, e.g. a ring sized
  // to wrap around the aura figure on Depths. Presets stay the default so
  // existing call sites (the compact per-line wheels, Levels' own use of
  // the full size) are unaffected.
  size?: number;
  // For Depths' arrival spin: without this, the current level's tick is
  // already the one drawn larger/outlined from the very first frame, so
  // spinning the ring doesn't actually conceal which position is "the
  // one" — an observant viewer can already see it before the spin lands.
  // With hideMarker true, that tick renders exactly like the other 16
  // (same size/opacity, no distinguishing outline) — genuinely
  // indistinguishable from the rest until the caller flips this back to
  // false once the spin has stopped.
  hideMarker?: boolean;
  // For Depths' settled-after-arrival ring: once the spin has landed,
  // only the slugs that actually mattered for THIS reading (the four
  // sphere results) draw as dots — the other 13 positions on the wheel
  // are dropped rather than dimmed, since a reading is about what these
  // four specific answers produced, not the full 17-position map (that
  // map still exists, unchanged, everywhere else this component is used
  // — Levels, level-detail, the spin itself). Undefined (the default)
  // draws all 17, same as before this prop existed.
  //
  // TODO: this leaves the ring visually sparse with only 4-5 points on
  // it — the plan is to fill that space with a thin-line geometric
  // visualization (see the web frontend's MagicBall/DistortBall for the
  // visual reference), not yet built. Don't mistake the current bare
  // dots for the finished look.
  onlySlugs?: string[];
  // Optional text rendered inside the ring's own center — for Depths'
  // sphere-tap wheel reveal (see DepthsSpiral.tsx), which needs the lit
  // level's name to sit INSIDE the wheel rather than below/outside it
  // (unlike ConsciousnessWheel's own levelName, which renders below).
  // Undefined (every other current caller — Levels, level-detail) renders
  // nothing new here, so this is additive-only.
  centerLabel?: string;
  // Makes centerLabel itself tappable — for Depths' wheel, this is the
  // level's own detail page (same destination the old ringLevelName link
  // below the aura used to lead to, before that separate text/link was
  // removed as redundant once the wheel started showing the name itself).
  // Ignored if centerLabel is undefined.
  onCenterLabelPress?: () => void;
  // 2026-09-02 — opt-in physical rotation, for Depths' own bigger wheel
  // (bled off the canvas's right edge, only its left half ever visible —
  // see depths/index.tsx's own comment on this). When set, the WHOLE
  // ring (every tick + the background circle + the marker — NOT the
  // center label, which stays upright/unrotated, see its own render
  // site below) rotates so `rotateToIndex`'s own tick lands at
  // VISIBLE_ANGLE (the wheel's own fixed "always on screen" point).
  // Undefined (every other current caller — Levels, level-detail, the
  // arrival spin, every compact per-line wheel) leaves the ring fully
  // static exactly as before this prop existed — this is strictly
  // additive, never a behavior change for an existing call site.
  rotateToIndex?: number;
  // Paired with rotateToIndex — where centerLabel renders when the ring
  // is in rotating mode, since the ring's own true center may now be
  // off-canvas (Depths' own bled wheel). Caller computes this in ITS OWN
  // pixel space (this component has no way to know where it's being
  // clipped from outside) and passes the offset from this component's
  // own (size/2, size/2) center. Ignored/unused when rotateToIndex is
  // undefined — centerLabel keeps centering on (size/2, size/2) exactly
  // as before.
  labelOffset?: { x: number; y: number };
  // Scales the tick/marker dots independently of the ring's own overall
  // diameter — for Depths' bigger wheel specifically (2026-09-02, at the
  // user's own request: "make them a bit smaller" once the whole ring
  // grew, the dots grew proportionally right along with it and started
  // reading as too large). Undefined (every other caller) leaves dots at
  // their normal 1:1 scale relative to the ring, exactly as before this
  // prop existed.
  dotScale?: number;
}) {
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  const index = levelIndex(levelSlug);
  const total = VIBRATION_LEVELS.length;
  const angle = angleFor(index, total);
  const color = `rgb(${levelColors[levelSlug] ?? colors.accent.ivoryRgb})`;

  // Rotation: brings rotateToIndex's own tick to VISIBLE_ANGLE by
  // rotating the ring by (VISIBLE_ANGLE - that tick's own natural
  // angle). Degrees, matching the rest of the codebase's rotate-
  // transform convention (ArcKaleidoscopeLoading.tsx). `rotation` stays
  // 0 (no-op transform) whenever rotateToIndex is undefined — every
  // existing caller never touches this path at all.
  const rotation = useSharedValue(0);
  const prevRotateToIndex = useRef<number | undefined>(rotateToIndex);
  useEffect(() => {
    if (rotateToIndex === undefined) return;
    const targetAngle = angleFor(rotateToIndex, total);
    const targetDeg = ((VISIBLE_ANGLE - targetAngle) * 180) / Math.PI;
    // Skip the animated transition on the very first render this prop
    // is provided (nothing to animate FROM yet — a spin out of nowhere
    // on mount would read as an unmotivated flourish, not a response to
    // a tap) — snap straight to the resting angle instead. Every
    // SUBSEQUENT change (a real sphere tap) animates.
    if (prevRotateToIndex.current === undefined) {
      rotation.value = targetDeg;
    } else {
      rotation.value = withTiming(targetDeg, {
        duration: ROTATE_DURATION_MS,
        easing: SOFT_EASE,
      });
    }
    prevRotateToIndex.current = rotateToIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rotateToIndex, total]);
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const baseR = compact ? COMPACT_RING_RADIUS : RING_RADIUS;
  const baseTickLen = compact ? COMPACT_TICK_LENGTH : TICK_LENGTH;
  const baseMarkerR = compact ? COMPACT_MARKER_RADIUS : MARKER_RADIUS;
  const baseSize = (baseR + baseTickLen) * 2 + baseMarkerR * 2;
  const scale = sizeOverride ? sizeOverride / baseSize : 1;
  const r = baseR * scale;
  // dotScale applies AFTER the ring's own scale, independently — it
  // shrinks/grows the ticks and marker without touching r (the ring's
  // own radius, which is what actually determines the wheel's overall
  // diameter/footprint). Left at its default 1 for every caller except
  // Depths' own bigger wheel.
  const tickLen = baseTickLen * scale * dotScale;
  const markerR = baseMarkerR * scale * dotScale;
  const size = sizeOverride ?? baseSize;
  const center = size / 2;
  const marker = polarToXY(center, r, angle);

  const ring = (
    <Svg width={size} height={size}>
      {/* The wheel itself — one short tick per level, in that level's own
          warmed color, evenly spaced around the full circle. Ticks are
          radial (pointing outward from center), like hour marks on a
          clock face or hue marks on a color wheel, not a continuous
          painted ring — this keeps every level visually distinct rather
          than blurring into a gradient. */}
      {VIBRATION_LEVELS.map((level, i) => {
        if (onlySlugs && !onlySlugs.includes(level.slug)) return null;
        const a = angleFor(i, total);
        const inner = polarToXY(center, r - tickLen / 2, a);
        const outer = polarToXY(center, r + tickLen / 2, a);
        const isCurrent = i === index && !hideMarker;
        return (
          <SvgCircle
            key={level.slug}
            cx={outer.x}
            cy={outer.y}
            r={isCurrent ? 0 : tickLen / 2.4}
            fill={`rgb(${levelColors[level.slug]})`}
            opacity={isCurrent ? 0 : compact ? 0.6 : 0.75}
            // Rendered as small dots rather than <Line> strokes — a dot
            // reads as "one of 17 points on a wheel" at a glance; a
            // radial line at this size and count starts to look like a
            // sunburst/warning pattern instead.
          />
        );
      })}
      <SvgCircle
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={colors.bg.border}
        strokeWidth={1}
      />
      {/* The current reading — outlined and slightly larger than the
          other 17 dots, at the exact same position theirs would sit, so
          it reads as "this one, specifically" rather than a foreign
          marker laid on top of the wheel. Hidden during the arrival
          spin (see hideMarker) — its normal tick renders in the loop
          above instead, indistinguishable from the other 16, until the
          spin lands. */}
      {!hideMarker && (
        <SvgCircle
          cx={marker.x}
          cy={marker.y}
          r={markerR}
          fill={color}
          stroke={colors.bg.base}
          strokeWidth={compact ? 1 : 1.5}
        />
      )}
    </Svg>
  );

  return (
    <View style={compact ? styles.wrapCompact : styles.wrap}>
      {/* rotateToIndex undefined (every caller except Depths' bled
          wheel): rotateStyle's transform is always the no-op `rotate:
          0deg`, so this Animated.View wrapper is inert — pixel-identical
          to rendering `ring` directly. Only Depths, which passes
          rotateToIndex, ever sees this actually turn. Wrapping the ring
          alone (not centerLabel, rendered as this View's OTHER sibling
          below) is what keeps the label upright while the ring spins. */}
      <Animated.View style={rotateStyle}>{ring}</Animated.View>
      {centerLabel ? (
        <Pressable
          onPress={onCenterLabelPress}
          disabled={!onCenterLabelPress}
          hitSlop={8}
          style={[
            styles.centerLabelHit,
            {
              width: size * 0.72,
              left: (size - size * 0.72) / 2 + (labelOffset?.x ?? 0),
              // RN style arrays don't deep-merge `transform` — this
              // object's own transform REPLACES styles.centerLabelHit's
              // base one, so its translateY term (vertical centering on
              // the ring's true middle) is repeated here explicitly,
              // with labelOffset's own y added on top. Not just
              // labelOffset.y alone, or the base centering would be
              // lost whenever labelOffset is provided.
              transform: [
                {
                  translateY:
                    -fontSizes.xs * lineHeights.tight * 1.5 +
                    (labelOffset?.y ?? 0),
                },
              ],
            },
          ]}
        >
          <Text
            style={[
              styles.centerLabel,
              {
                color,
                // A soft dark halo, not a card/box (per aesthetic.md's "no
                // cards" rule) — needed 2026-09-02 once Depths' own wheel
                // started sitting close enough to the aura figure that its
                // glow could sit directly behind this label (a compact-
                // spiral layout change elsewhere), making plain colored
                // text unreadable against it. textShadow reads as "the
                // text itself glows a little," consistent with the rest
                // of the app's glow language, rather than a flat panel
                // behind it.
                textShadowColor: colors.bg.base,
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 6,
              },
            ]}
            numberOfLines={2}
          >
            {centerLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // "N of 17" used to render here — dropped along with the whole label:
  // on a wheel, no position is first or last, so ranking one against the
  // total is exactly the kind of order/hierarchy the ring shape exists to
  // NOT imply. The level's name already appears wherever a caller needs
  // it (the reveal screen's own hero title, a line row's own label) — this
  // component only draws the wheel now, not a second copy of the name.
  wrap: { alignItems: "center", position: "relative" },
  wrapCompact: { alignItems: "center", position: "relative" },
  // Sits inside the ring's own center, over the Svg — for Depths' sphere-
  // tap wheel reveal only (see centerLabel's own comment above). Shifted
  // up by a FULL line height, not half — with numberOfLines={2}, a
  // wrapped name (e.g. "Acceptance" at this small width) reads as 2
  // lines, and only offsetting by half a line left it sitting low/
  // cramped against the ring's own bottom ticks (confirmed on-device).
  // A single-line name (e.g. "Desire") ends up shifted slightly high
  // instead of dead-center, a smaller/safer miss than the 2-line case.
  centerLabelHit: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -fontSizes.xs * lineHeights.tight * 1.5 }],
  },
  centerLabel: {
    textAlign: "center",
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.tight,
  },
});
