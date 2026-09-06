import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle as SvgCircle } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedProps, useAnimatedReaction, runOnJS, withTiming, Easing, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useAppAccentRgb } from '../utils/appAccent';

const AnimatedCircle = Animated.createAnimatedComponent(SvgCircle);

// Same slow-decelerate easing as onboarding's own "gather, condense,
// become" motion and Your Arc's own CLOSING_SOFT_EASE — reused here
// rather than withSpring's default damped-oscillation curve, which
// visibly overshot and wiggled the settling dot back and forth
// (confirmed live 2026-09-04: "there is a little jumping of the dot
// left and right on settling"). RULES.md's own motion rule is explicit
// that this app "never" uses a bouncy/springy easing — a spring's
// natural overshoot is exactly that, even at a fairly damped setting,
// so this needed a real easing swap, not just a damping tweak.
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const SETTLE_DURATION_MS = 260;

// ArcDial — a turnable, curved progress control for Your Arc's pager
// (2026-09-03), replacing PagedScrollView's own flat dot row there (see
// that component's `hideDots` prop). Directly inspired by the user's own
// reference: the iPhone Camera app's zoom wheel.
//
// 2026-09-04, SECOND rewrite — the previous version moved a single dot
// ALONG a fixed arc (drag angle -> position on the curve). Confirmed live
// that this isn't what "turn it like a wheel" means: on a real dial
// (camera zoom wheel, a volume knob), the WHEEL ITSELF rotates and a
// FIXED pointer stays in one place — you don't watch a marker slide
// along a stationary ring, you watch the ring's own marks spin past a
// stationary indicator. This version implements that instead: every
// page's own dot sits at a FIXED angular spacing from its neighbors
// (like hour-marks on a real dial), the whole set rotates together as
// one rigid body driven by the drag, and a single indicator dot at the
// arc's own apex (angle 0) never moves — whichever page-dot is currently
// rotated to sit under that fixed point is the active page.
//
// The drag itself is now DELTA-based, not absolute-position-based: each
// pan frame reads the finger's angle change since the last frame (not
// "where is the finger now" mapped onto a track) and adds that delta to
// a running rotation offset — the same relationship a real dial has to a
// turning finger, where the wheel's rotation speed matches how fast you
// physically turn it, regardless of where on the dial you started
// touching.
//
// SECONDARY navigation, never primary (per the user's own explicit
// choice) — normal page-swiping on PagedScrollView's own ScrollView
// still works exactly as before; this is an additional, more tactile way
// to move around, driven through the same jumpTo/onActiveIndexChange
// contract Your Arc's cone-tap-to-detail jump already uses, not a
// separate navigation system.
//
// The curve itself deliberately echoes the product's own name and
// Depths' spiral visual language (see DepthsSpiralCore/Menu) — this is
// the "arc" in Your Arc made literal and touchable, not a generic
// progress bar reshaped for novelty.
const DIAL_WIDTH = 260;
const DIAL_HEIGHT = 90;
// Target silhouette, unchanged from the previous version: the drawn
// track's two ends sit at (15, 78)/(245, 78), its apex at (130, -8) — a
// shallow, wide arc. Solved once (no closed form for the half-angle from
// "given end height, apex height, and half-width, find the one circle
// through both points") rather than hand-derived, so these three numbers
// can change without re-deriving the geometry by hand.
const END_Y = 78;
const APEX_Y = -8;
// Vertical padding above APEX_Y so the apex dot and the fixed indicator
// ring (radius 7, see its own render below) aren't clipped by the SVG's
// own viewBox — APEX_Y itself is negative (above the nominal 0,0
// origin), and a viewBox starting at y=0 silently clips anything above
// it (confirmed live: the apex dot and indicator were both invisible,
// clipped clean off, before this padding existed).
const TOP_PADDING = 20;
// The SVG's own pixel height and its viewBox height MUST match exactly
// — Svg scales its viewBox to fit whatever pixel width/height it's
// given, and a mismatch here silently rescales all the coordinate math
// below (PIVOT, pointAtAngle, touchAngle) relative to the actual touch
// coordinates GestureDetector reports, which are in PIXEL space, not
// viewBox units (confirmed live: an earlier version computed these two
// heights via two different formulas that happened to differ by 8px,
// producing a ~7% scale mismatch between where dots were DRAWN and
// where the gesture math THOUGHT the pivot was, which is what made
// dragging feel disconnected from the visible wheel). Defining one
// shared height and reusing it for both the Svg element's own height
// prop and the viewBox string is what keeps them identical by
// construction rather than by two numbers happening to agree.
const SVG_HEIGHT = DIAL_HEIGHT - APEX_Y + TOP_PADDING;
const HALF_WIDTH = DIAL_WIDTH / 2 - 15;
function solveArcGeometry() {
  const sagitta = END_Y - APEX_Y;
  let lo = 0.001;
  let hi = Math.PI / 2 - 0.001;
  for (let i = 0; i < 60; i++) {
    const theta = (lo + hi) / 2;
    const r = HALF_WIDTH / Math.sin(theta);
    const s = r * (1 - Math.cos(theta));
    if (s > sagitta) hi = theta;
    else lo = theta;
  }
  const halfAngle = (lo + hi) / 2;
  const radius = HALF_WIDTH / Math.sin(halfAngle);
  return { halfAngle, radius, pivotY: APEX_Y + radius };
}
const { halfAngle: TRACK_HALF_ANGLE, radius: RADIUS, pivotY: PIVOT_Y } = solveArcGeometry();
// The dial's own pivot — sits BELOW the visible canvas, well past its
// bottom edge, so only a shallow top slice of the full circle is ever
// drawn (the same relationship a real turning wheel/dial has to the
// visible arc of it you can see and touch — you're rotating around a
// center you don't see, not around a point on the arc itself).
const PIVOT = { x: DIAL_WIDTH / 2, y: PIVOT_Y };
// Fixed spacing between adjacent page-dots, in radians — deliberately
// SMALLER than the track's own half-angle span so several neighboring
// dots stay visible on the drawn arc at once (like seeing several
// hour-marks either side of a clock's own 12 at a time), rather than
// each dot filling the whole visible track on its own. Capped so a
// pager with very few pages doesn't space its dots absurdly far apart —
// see DOT_SPACING's own use below.
const DOT_SPACING = Math.min(TRACK_HALF_ANGLE * 0.55, 0.5);

function pointAtAngle(angle: number) {
  'worklet';
  // Standard angle-from-vertical to (x, y): sin gives the horizontal
  // offset, cos gives how far up from the pivot (subtracted, since SVG y
  // increases downward).
  return {
    x: PIVOT.x + RADIUS * Math.sin(angle),
    y: PIVOT.y - RADIUS * Math.cos(angle),
  };
}

// GestureDetector reports touch coordinates in the wrapping View's own
// PIXEL space (origin at its top-left corner), but PIVOT/pointAtAngle
// are defined in the SVG's VIEWBOX coordinate space, whose origin is
// shifted up by (APEX_Y - TOP_PADDING) — see SVG_HEIGHT's own comment
// for why the two must be reconciled explicitly rather than assumed to
// match. Since the Svg element's pixel height exactly equals its viewBox
// height (both SVG_HEIGHT), the two spaces differ only by this constant
// vertical offset, never a scale factor.
const TOUCH_Y_OFFSET = APEX_Y - TOP_PADDING;

// The finger's raw angle around PIVOT — same Math.atan2 pattern
// ConsciousnessWheel.tsx uses for its own ring drag, just measured from
// straight-up (matching pointAtAngle's own convention: 0 = up) rather
// than from the positive x-axis Math.atan2 normally uses.
function touchAngle(x: number, y: number): number {
  'worklet';
  const viewBoxY = y + TOUCH_Y_OFFSET;
  return Math.atan2(x - PIVOT.x, -(viewBoxY - PIVOT.y));
}

interface ArcDialProps {
  total: number;
  activeIndex: number;
  // A short kicker-style name per page, same register as each page's own
  // kicker text (e.g. "What Calls You") — shown below the dial as the
  // "you are here" confirmation, the same "confirm, don't just indicate"
  // role Journeys' shelf dots and the earlier waypoint-rail concept both
  // use. Missing/undefined entries fall back to rendering nothing rather
  // than an empty string gap.
  pageLabels: (string | undefined)[];
  // Requests a jump to a specific page — the caller wires this to
  // PagedScrollView's own jumpTo prop (a {index, token} pair), matching
  // the same pattern the cone's tap-to-detail jump already uses.
  onRequestIndex: (index: number) => void;
}

// Converts a release velocity (px/s, as GestureHandler reports it) into
// EXTRA whole dot-steps to carry the wheel through beyond wherever the
// raw drag alone left it — a fast flick should keep the wheel turning a
// little further before it settles, the same "the faster you flick, the
// further it spins" feel a real turning dial or an iOS picker wheel has,
// rather than every release (fast or slow) snapping to the same nearest
// dot immediately. Deliberately modest and capped (MAX_MOMENTUM_STEPS) —
// this is a small number of PAGES, not a long scrollable list, so even a
// hard flick should only ever carry a couple of extra steps, never send
// someone flying across the whole pager past pages they never saw pass.
const MOMENTUM_VELOCITY_DIVISOR = 900;
const MAX_MOMENTUM_STEPS = 2;
function momentumSteps(velocityX: number, velocityY: number): number {
  'worklet';
  // Project the raw (x, y) velocity onto the same touch-angle convention
  // pointAtAngle/touchAngle already use, so a flick ALONG the arc's own
  // curve (not just a raw horizontal speed) is what counts — a fast
  // flick straight down, for instance, shouldn't register as a fast turn.
  const speed = Math.sign(velocityX) * Math.hypot(velocityX, velocityY);
  const raw = speed / MOMENTUM_VELOCITY_DIVISOR;
  return Math.max(-MAX_MOMENTUM_STEPS, Math.min(MAX_MOMENTUM_STEPS, Math.round(raw)));
}

export function ArcDial({ total, activeIndex, pageLabels, onRequestIndex }: ArcDialProps) {
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // The wheel's own rotation — page i's dot sits at angle
  // (i - activeIndex) * DOT_SPACING + rotationOffset in its RESTING
  // state (rotationOffset settles back to 0 once a drag ends and a page
  // commits, since page i's own resting angle already encodes "how far
  // from center" via (i - activeIndex)). While dragging, rotationOffset
  // carries the live, continuous turn away from that resting alignment.
  const rotationOffset = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const lastTouchAngle = useSharedValue(0);
  const activeIndexShared = useSharedValue(activeIndex);
  // Was a plain synchronous assignment directly in the render body —
  // Reanimated's strict mode correctly flags writing to `.value` during
  // render as unsafe (a render that's started but never committed, e.g.
  // React's own double-invoke in dev, would still have mutated this
  // shared value). Moved into an effect instead: it still fires
  // immediately after every commit where activeIndex actually changed,
  // well before another drag gesture could start, so the "stays in sync
  // with the activeIndex prop by the time the next gesture reads it"
  // guarantee the settle-target comment below depends on still holds —
  // only now it's tied to a committed render, not a possibly-discarded one.
  useEffect(() => {
    activeIndexShared.value = activeIndex;
  }, [activeIndex]);

  // The dot currently nearest the fixed indicator WHILE dragging — this
  // is what's about to become the active page if released right now.
  // Read via useAnimatedReaction below to drive two JS-side effects (a
  // haptic tick, and the live label preview) without either one forcing
  // a full re-render on every raw gesture frame — only on an actual
  // step-boundary crossing.
  const liveStepIndex = useSharedValue(activeIndex);
  const [previewIndex, setPreviewIndex] = useState(activeIndex);

  const commitIndex = (index: number) => onRequestIndex(index);
  const updatePreview = (index: number) => setPreviewIndex(index);
  const fireTick = () => Haptics.selectionAsync();

  // Live label preview + per-step haptic (2026-09-05) — previously the
  // label stayed frozen on the OLD page's name for the entire drag and
  // only updated once the gesture ended, so someone turning the wheel
  // got no feedback about where they were headed until they let go.
  // useAnimatedReaction watches liveStepIndex (itself only written when
  // the nearest-dot calculation actually crosses an integer boundary,
  // not every raw frame) and fires both effects exactly once per real
  // step, on the UI thread, without needing onChange itself to call
  // back to JS on every pixel of movement.
  useAnimatedReaction(
    () => {
      const steps = Math.round(rotationOffset.value / DOT_SPACING);
      return Math.max(0, Math.min(total - 1, activeIndexShared.value - steps));
    },
    (current, previous) => {
      if (current === previous) return;
      liveStepIndex.value = current;
      runOnJS(updatePreview)(current);
      if (previous !== null) runOnJS(fireTick)();
    }
  );

  const pan = Gesture.Pan()
    .minDistance(4)
    .onBegin((e) => {
      isDragging.value = true;
      lastTouchAngle.value = touchAngle(e.x, e.y);
    })
    .onChange((e) => {
      const angle = touchAngle(e.x, e.y);
      let delta = angle - lastTouchAngle.value;
      // Guards against the atan2 wraparound discontinuity (crossing from
      // just-under-π to just-over-−π) producing one huge spurious jump
      // in a single frame — clamping a single frame's delta to a
      // generous but finite range is cheaper and more robust here than
      // fully unwrapping the angle, since a real turn never moves the
      // finger by more than a small fraction of a full turn between two
      // consecutive gesture frames.
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      lastTouchAngle.value = angle;
      // 2026-09-04: sign flipped after confirming live that the wheel
      // turned OPPOSITE the drag direction — dragging along the arc
      // should feel like directly pushing/pulling that point of the
      // wheel around its pivot (the same relationship your finger has to
      // a real turning dial: push the rim one way, the whole wheel
      // follows that way), which means rotationOffset must move WITH the
      // raw angle delta, not against it. The comment this replaced
      // reasoned through the index/angle relationship correctly in the
      // abstract but got the sign backwards in practice — kept the
      // empirical fix rather than re-deriving the geometry, since this
      // was confirmed against the real rendered gesture, not a
      // theoretical model of it.
      rotationOffset.value += delta;
    })
    .onFinalize((e) => {
      isDragging.value = false;
      // Nearest whole dot-step to snap to, from the current live offset
      // — same "sample the continuous drag, commit to the nearest real
      // position" discipline ConsciousnessWheel's own onFinalize uses —
      // PLUS a small momentum carry-through from the release velocity
      // (2026-09-05), so a fast flick keeps turning a little further
      // rather than every release (fast or slow) landing on the exact
      // same nearest dot the raw drag distance alone would produce.
      const steps = Math.round(rotationOffset.value / DOT_SPACING) - momentumSteps(e.velocityX, e.velocityY);
      const oldActiveIndex = activeIndexShared.value;
      const newIndex = Math.max(0, Math.min(total - 1, oldActiveIndex - steps));
      // 2026-09-05, SECOND fix — the first attempt animated rotationOffset
      // to a flat 0, which is wrong: a dot's DISPLAYED angle is always
      // restingAngle + rotationOffset.value, where restingAngle = (index -
      // activeIndex) * DOT_SPACING using whatever activeIndex the PARENT
      // prop currently holds. Right after release, that prop is still the
      // OLD activeIndex (it only updates once commitIndex's round-trip
      // lands) — so newIndex's own restingAngle, computed against the OLD
      // activeIndex, is (newIndex - oldActiveIndex) * DOT_SPACING =
      // -steps * DOT_SPACING (since newIndex = oldActiveIndex - steps),
      // which is NOT zero whenever steps != 0. Animating rotationOffset
      // to a flat 0 therefore left the dot's displayed angle equal to
      // that nonzero restingAngle once the animation finished — it
      // visibly walked itself away from the indicator as rotationOffset
      // eased down, confirmed live ("it turns right, then the wheel/dot
      // visibly moves backward after landing"). Verified by hand with
      // concrete numbers before landing this a second time (the first
      // attempt's own fix comment also had this sign backwards): the
      // settle target that actually cancels the old restingAngle is
      // +steps * DOT_SPACING, not -steps * DOT_SPACING and not 0.
      //
      // Once that settle finishes, commitIndex needs to fire and the
      // PARENT needs to re-render with activeIndex = newIndex — at that
      // instant every dot's restingAngle recomputes against the NEW
      // activeIndex, so newIndex's own restingAngle becomes 0, and for
      // the displayed angle to stay continuous, rotationOffset must
      // ALSO reset to plain 0 at that exact same moment.
      //
      // 2026-09-05, THIRD fix — a third real, confirmed-live symptom
      // ("the dot travels to a spot, then jumps"), subtler than the
      // first two: the previous version reset rotationOffset.value = 0
      // directly on the UI thread, in the SAME withTiming callback that
      // also calls runOnJS(commitIndex). But runOnJS is an ASYNCHRONOUS
      // hop to the JS thread — the UI-thread reset to 0 takes effect
      // immediately (this frame), while the JS-thread activeIndex prop
      // update (and the re-render that recomputes every dot's
      // restingAngle) only lands a frame or more LATER. For that gap,
      // rotationOffset is already 0 but restingAngle is STILL computed
      // against the OLD activeIndex (nonzero) — so the dot's displayed
      // angle briefly becomes that nonzero restingAngle alone, i.e. it
      // pops away from the indicator for exactly the frames it takes the
      // JS thread to catch up, then jumps back once the prop finally
      // updates. This is why it read as "travels to a spot [the correct
      // settleTarget position], then jumps [when rotationOffset zeroes
      // out ahead of the prop update]."
      //
      // The fix: don't touch rotationOffset.value again at all after the
      // withTiming animation reaches settleTarget — leave it sitting
      // exactly there. Once commitIndex's round-trip eventually lands
      // and activeIndex becomes newIndex, restingAngle recomputes to 0
      // and rotationOffset is STILL settleTarget (steps*DOT_SPACING) —
      // which is wrong on its own, UNLESS activeIndexShared (read by
      // this same gesture handler on the NEXT drag) also reflects
      // newIndex by then, which it already does via the plain assignment
      // at the top of the render body (activeIndexShared.value =
      // activeIndex). The real fix is therefore to reset rotationOffset
      // to 0 the same way — as a plain, synchronous assignment driven by
      // the PARENT'S OWN re-render (see the useEffect below this
      // gesture), not from inside this UI-thread callback at all, so it
      // can never race ahead of the prop it depends on.
      const settleTarget = steps * DOT_SPACING;
      rotationOffset.value = withTiming(settleTarget, { duration: SETTLE_DURATION_MS, easing: SOFT_EASE }, (finished) => {
        if (finished && newIndex !== oldActiveIndex) {
          runOnJS(commitIndex)(newIndex);
        }
      });
    });

  const gesture = pan;

  const total_ = Math.max(total, 1);
  // previewIndex tracks activeIndex whenever the two drift apart from a
  // source OTHER than this dial's own drag (a direct pager swipe, or the
  // very first mount) — without this, previewIndex would only ever move
  // via the useAnimatedReaction above, going stale the moment someone
  // navigates any other way. Guarded by isDragging.value (read once per
  // effect run, not reactively — a plain, non-worklet read of a shared
  // value is safe from JS, it's just a ref) so a live drag's own preview
  // isn't fought by this same effect re-syncing to the not-yet-updated
  // activeIndex mid-turn.
  //
  // 2026-09-05 — this effect is ALSO now what resets rotationOffset back
  // to 0 after a drag-driven commit (see onFinalize's own THIRD-fix
  // comment for the full reasoning): this effect only runs once
  // activeIndex has ACTUALLY changed on the JS thread, i.e. exactly the
  // moment ArcDialDot's restingAngle recomputes to 0 for the new active
  // dot — so resetting rotationOffset to 0 HERE, instead of inside the
  // UI-thread withTiming callback, means the two can never land in two
  // different frames. Harmless to also run this on a page change that
  // came from somewhere OTHER than this dial (a direct pager swipe) —
  // rotationOffset is already 0 in that case (nothing dragged it away),
  // so the assignment is a no-op.
  useEffect(() => {
    if (!isDragging.value) {
      setPreviewIndex(activeIndex);
      rotationOffset.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex]);
  const currentLabel = pageLabels[previewIndex];

  // Fixed indicator — the fixed point everything else rotates past,
  // always drawn at the arc's own apex (angle 0). Rendered as a small
  // static ring, distinct from the page-dots themselves (which are
  // filled circles), so it reads as "the pointer," not "one more page."
  const indicatorPoint = pointAtAngle(0);

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={gesture}>
        <View style={{ width: DIAL_WIDTH, height: SVG_HEIGHT }}>
          <Svg
            width={DIAL_WIDTH}
            height={SVG_HEIGHT}
            viewBox={`0 ${APEX_Y - TOP_PADDING} ${DIAL_WIDTH} ${SVG_HEIGHT}`}
          >
            <Path
              d={`M ${pointAtAngle(-TRACK_HALF_ANGLE).x} ${pointAtAngle(-TRACK_HALF_ANGLE).y} A ${RADIUS} ${RADIUS} 0 0 1 ${pointAtAngle(TRACK_HALF_ANGLE).x} ${pointAtAngle(TRACK_HALF_ANGLE).y}`}
              fill="none"
              stroke={colors.bg.border}
              strokeWidth={1.5}
            />
            {Array.from({ length: total_ }).map((_, i) => (
              <ArcDialDot
                key={i}
                index={i}
                activeIndex={activeIndex}
                rotationOffset={rotationOffset}
                accentRgb={accentRgb}
                colors={colors}
              />
            ))}
            {/* Fixed indicator ring — never rotates, never moves; this is
                what everything else turns past. */}
            <SvgCircle
              cx={indicatorPoint.x}
              cy={indicatorPoint.y}
              r={7}
              fill="none"
              stroke={`rgb(${accentRgb})`}
              strokeWidth={1.5}
              opacity={0.55}
            />
          </Svg>
        </View>
      </GestureDetector>
      {currentLabel && <Text style={styles.currentLabel}>{currentLabel}</Text>}
    </View>
  );
}

// Split into its own component so each dot's animated style only reads
// the shared rotationOffset value (via useAnimatedStyle) without forcing
// the parent SVG's own non-animated children (the track Path, the fixed
// indicator) to re-render on every drag frame — the same "don't
// re-render 17 static ticks for one moving dot" reasoning
// ConsciousnessWheel.tsx already documents for its own drag dot.
function ArcDialDot({
  index,
  activeIndex,
  rotationOffset,
  accentRgb,
  colors,
}: {
  index: number;
  activeIndex: number;
  rotationOffset: SharedValue<number>;
  accentRgb: string;
  colors: Colors;
}) {
  const restingAngle = (index - activeIndex) * DOT_SPACING;
  const isCurrent = index === activeIndex;
  const isDone = index < activeIndex;
  const fill = isCurrent ? `rgb(${accentRgb})` : isDone ? colors.text.muted : colors.text.faint;
  const baseOpacity = isCurrent ? 0.95 : isDone ? 0.7 : 0.5;

  const animatedProps = useAnimatedProps(() => {
    const angle = restingAngle + rotationOffset.value;
    const pt = pointAtAngle(angle);
    // Dots that rotate past the visible track's own half-angle fade out
    // rather than popping off-canvas abruptly — a real dial's marks
    // recede toward its edge, they don't vanish mid-turn.
    const edgeFade = Math.max(0, 1 - Math.max(0, Math.abs(angle) - TRACK_HALF_ANGLE * 0.85) / (TRACK_HALF_ANGLE * 0.3));
    // 2026-09-05 — whichever dot is nearest the fixed indicator grows
    // toward the "current" size as it approaches, rather than every
    // non-active dot staying a flat, uniform small size throughout the
    // whole drag. This is what gives the live preview (see
    // useAnimatedReaction above) a matching VISUAL cue on the wheel
    // itself, not just a text label change — the dot that's about to
    // become the active page visibly swells as it nears the pointer,
    // the same way a real dial's marks read as "arriving" at its
    // indicator, not just passing through it identically to every
    // other mark.
    const proximity = Math.max(0, 1 - Math.abs(angle) / DOT_SPACING);
    const baseRadius = isCurrent ? 4.5 : 2.5;
    const radius = baseRadius + (4.5 - baseRadius) * proximity * (isCurrent ? 0 : 1);
    return { cx: pt.x, cy: pt.y, opacity: baseOpacity * edgeFade, r: radius };
  });

  return <AnimatedCircle animatedProps={animatedProps} fill={fill} />;
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', paddingTop: spacing[2] },
    // 2026-09-05 — lifted closer to the dial itself (marginTop negative,
    // pulling it up under the SVG's own bottom padding rather than
    // sitting the standard gap below it) — confirmed live the label was
    // reading as closer to whatever content follows the dial than to the
    // wheel it's actually naming.
    currentLabel: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginTop: -spacing[6],
    },
  });
}
