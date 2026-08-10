import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  Image,
  Platform,
  Pressable,
  StyleSheet,
} from "react-native";
import Svg, { Path, Circle as SvgCircle } from "react-native-svg";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Animated, {
  SharedValue,
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useReducedMotion,
  withRepeat,
  withSequence,
  withDelay,
  withTiming,
  Easing,
  FadeIn,
} from "react-native-reanimated";
import { useThemeColors } from "../../src/theme/useThemeColors";
import { useThemeStore } from "../../src/store/themeStore";
import type { Colors } from "../../src/theme/colors";
import {
  fonts,
  fontSizes,
  letterSpacings,
  lineHeights,
} from "../../src/theme/typography";
import { spacing, radius } from "../../src/theme/spacing";
import { useWideColumnWidth } from "../../src/theme/responsive";
import { usePhilosopherStore } from "../../src/store/philosopherStore";
import { useLocaleStore } from "../../src/store/localeStore";
import { PhilosopherPicker } from "../../src/components/PhilosopherPicker";
import { AmbientGlow } from "../../src/components/AmbientGlow";
import {
  getAuraFigureMetrics,
  auraBodyToPixel,
  AURA_NEUTRAL_COLOR,
} from "../../src/components/AuraFigure";
import { generateAuraDots, AuraDot } from "../../src/utils/auraDots";
import { track } from "../../src/utils/analytics";

// A static, pre-rendered PNG of AuraFigure's neutral body (exported from the
// browser, where its SVG filters render correctly) rather than the live SVG
// component — React Native's native SVG filter engine doesn't reproduce the
// same result on-device, leaving the body visibly tinted instead of dark.
// The dots are NOT baked into this asset — they're rendered and animated
// separately below, so the beat transition can be carried by a burst of
// light around the body instead of the body itself moving.
const AURA_BODY = require("../../assets/aura/aura-neutral-body.png");

// The actual rendered size of the body image — change this freely to make
// the figure itself bigger/smaller.
const FIGURE_SIZE = 104;
// Everything AROUND the body (dots, connecting lines, "why?"/"what"/"you
// feel?" positions, the core spark) is positioned against this fixed
// reference size instead of FIGURE_SIZE, so shrinking/growing the body
// alone doesn't drag the whole surrounding composition along with it. The
// image itself is then anchored within this larger layout by its own core
// point (see imageOffsetX/Y in IntroFigure) so the two stay visually aligned.
// Reduced from 200 (proportionally with FIGURE_SIZE above) to free up real
// vertical room on short Android screens — the Samsung 3-button nav bar was
// squeezing the "walk" button against the bottom edge (see stage's
// paddingBottom below). Shrinking this scales the whole word/line
// composition down together, not just the body in isolation.
const LAYOUT_SIZE = 172;
const FIGURE_METRICS = getAuraFigureMetrics(LAYOUT_SIZE);
// How far a dot travels outward, in the figure's own drawing-space units
// (same scale AuraFigure itself uses), during the burst.
const BURST_DISTANCE = 20;

// ============================================================================
// EASY ADJUSTMENTS — change any number here to reposition a word or reshape
// a line. Everything below this block (the line paths, the text styles)
// derives from these values, so moving a word also moves the line segments
// that lead into and out of it — nothing else needs to change to match.
// ============================================================================
const POSITION = {
  // "why?" — crowns the head. Also shifts where its line starts.
  // x pushes "what" right of the composition's axis — the deliberate
  // counterweight to "is an experience" sitting left of it below.
  why: { y: -2, x: 48 },
  // "you" / "feel" — flank the chest.
  chest: {
    y: -25, // shared baseline for both the text and the line crossing here
    // Extra nudge for the TEXT only, relative to that baseline (negative =
    // above the line). Measured directly (via getBoundingClientRect on web)
    // that -5 actually let the text's own box overlap ~11px into the
    // line's box — this reads as the word crossing through the line, not
    // sitting near it. -20 clears the line with a small, deliberate gap
    // instead.
    textOffset: -20,
    spread: 30, // how far out from the body's own edge each word sits
  },
  // "is an experience" — after the figure, leading into the final sentence.
  // Small negative offset, not 0 — a tiny gap above the line it leads into
  // reads as "resting near," while 0 would sit the text flush on the line
  // itself.
  payoff: { y: -8 },
};

const SHAPE = {
  whyToWhatBow: -100, // how far the what->you arc swings out to the side
  chestDipDepth: 35, // how deep the you→feel arc dips below the chest
  legSweep: 90, // how far the two descending arcs swing outward before meeting
  convergeDrop: 240, // how far below the chest "you" and "feel"'s arcs meet
};

// Geometry for the connecting line that traces "why?" → "what" → "you feel?"
// — computed from FIGURE_METRICS rather than measured at runtime, since it's
// decorative (doesn't need pixel precision) and this avoids yet another
// layout-measurement dependency after the platform quirks the rest of this
// screen has already run into.
const WHY_SPACE = 35; // room reserved above the figure for "why?"
const LINE_WIDTH = 200;
const LINE_CENTER = LINE_WIDTH / 2;
const FLANK_REACH = FIGURE_METRICS.width / 2 + POSITION.chest.spread; // ≈ where "you"/"feel" sit — kept in sync with chestFlankRow's gap
const WHY_LINE_Y = POSITION.why.y;
const CHEST_LINE_Y = WHY_SPACE + FIGURE_METRICS.chestY + POSITION.chest.y;
const DIP_LINE_Y = CHEST_LINE_Y + SHAPE.chestDipDepth;
const FIGURE_COMP_HEIGHT = WHY_SPACE + FIGURE_METRICS.height;

function quadBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number,
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}
function quadPathString(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
) {
  return `M ${p0.x},${p0.y} Q ${p1.x},${p1.y} ${p2.x},${p2.y}`;
}
// Approximate arc length by summing short chords along the sampled curve —
// exact enough for sizing a stroke-dasharray "draw itself" reveal, without
// needing a runtime getTotalLength() call (react-native-svg doesn't expose
// one from JS the way web SVG does).
function quadBezierLength(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  samples = 24,
) {
  let length = 0;
  let prev = p0;
  for (let i = 1; i <= samples; i++) {
    const pt = quadBezierPoint(p0, p1, p2, i / samples);
    length += Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  return length;
}

// Three separate paths rather than one multi-segment string — a second "Q"
// command chained onto the first wasn't rendering reliably. Each is defined
// as its own three control points first, not just a string, so the same
// points can also size that line's stroke-dasharray "draw itself" reveal
// (see WHY_TO_WHAT_LENGTH etc.) — the shape and the reveal length can't
// drift apart if they're computed from the same source.
const WHY_TO_WHAT_PTS = {
  // Starts under "what", which sits right of center (POSITION.why.x).
  // +24, not +20 — measured directly (getBoundingClientRect on web) that
  // +20 left the line's start essentially touching the text's own bottom
  // edge (well under 1px gap); +24 opens a small, deliberate gap instead.
  p0: { x: LINE_CENTER + POSITION.why.x, y: WHY_LINE_Y + 24 },
  p1: {
    x: LINE_CENTER - SHAPE.whyToWhatBow,
    y: (WHY_LINE_Y + CHEST_LINE_Y) / 2,
  },
  p2: { x: LINE_CENTER - FLANK_REACH - 15, y: CHEST_LINE_Y },
};
const PATH_WHY_TO_WHAT = quadPathString(
  WHY_TO_WHAT_PTS.p0,
  WHY_TO_WHAT_PTS.p1,
  WHY_TO_WHAT_PTS.p2,
);
const WHY_TO_WHAT_LENGTH = quadBezierLength(
  WHY_TO_WHAT_PTS.p0,
  WHY_TO_WHAT_PTS.p1,
  WHY_TO_WHAT_PTS.p2,
);

const WHAT_TO_FEEL_PTS = {
  p0: { x: LINE_CENTER - FLANK_REACH + 40, y: CHEST_LINE_Y },
  p1: { x: LINE_CENTER, y: DIP_LINE_Y },
  p2: { x: LINE_CENTER + FLANK_REACH - 40, y: CHEST_LINE_Y },
};
const PATH_WHAT_TO_FEEL = quadPathString(
  WHAT_TO_FEEL_PTS.p0,
  WHAT_TO_FEEL_PTS.p1,
  WHAT_TO_FEEL_PTS.p2,
);
const WHAT_TO_FEEL_LENGTH = quadBezierLength(
  WHAT_TO_FEEL_PTS.p0,
  WHAT_TO_FEEL_PTS.p1,
  WHAT_TO_FEEL_PTS.p2,
);

// Both "you" and "feel" sweep down and converge at a single point below the
// figure — not just "feel" trailing off alone on the right, which read as
// lopsided and, worse, no longer led anywhere near "is an experience" once
// that text became centered. Converging at dead center fixes both: the
// composition stays symmetric, and the line actually arrives where the
// text now sits. The convergence point sits a bit above the very bottom
// (ankle height, roughly), not all the way down, so it doesn't travel any
// further than it needs to.
const CONVERGE_Y = CHEST_LINE_Y + SHAPE.convergeDrop;
const YOU_DOWN_PTS = {
  p0: { x: LINE_CENTER - FLANK_REACH + 40, y: CHEST_LINE_Y + 30 },
  p1: { x: LINE_CENTER - SHAPE.legSweep, y: (CHEST_LINE_Y + CONVERGE_Y) / 2 },
  p2: { x: LINE_CENTER, y: CONVERGE_Y },
};
const YOU_DOWN_LENGTH = quadBezierLength(
  YOU_DOWN_PTS.p0,
  YOU_DOWN_PTS.p1,
  YOU_DOWN_PTS.p2,
);

const FEEL_DOWN_PTS = {
  p0: { x: LINE_CENTER + FLANK_REACH - 40, y: CHEST_LINE_Y + 30 },
  p1: { x: LINE_CENTER + SHAPE.legSweep, y: (CHEST_LINE_Y + CONVERGE_Y) / 2 },
  p2: { x: LINE_CENTER, y: CONVERGE_Y },
};
const FEEL_DOWN_LENGTH = quadBezierLength(
  FEEL_DOWN_PTS.p0,
  FEEL_DOWN_PTS.p1,
  FEEL_DOWN_PTS.p2,
);

// Reserves the vertical pocket "is an experience" hangs in, between the
// converging V above and the payoff sentence below.
const PAYOFF_LINE_HEIGHT = 40;

// On "walk", the two descending arcs — the lines that walked down from
// "you" and "feel" — are what close into the choose screen's ring. They're
// the walk itself: the path traced down the body keeps going, bows outward,
// and rounds into the circle the philosophers stand on. Each arc is sampled
// as a polyline so a single progress value can lerp it point-by-point into
// its half of the circle ("you" takes the left half, "feel" the right);
// their shared endpoints — converged at the bottom, meeting overhead at the
// top — are what make two open curves read as one closing ring.
const V_MORPH_POINTS = 24;
// Matches PhilosopherPicker's own RING_RADIUS — this is what makes the
// literal ring-to-ring morph possible: the overlay ring (see travelActive
// etc. in OnboardingScreen) starts at exactly this radius/center (measured
// in window coordinates via connectLineWrap's onLayout) and animates to the
// picker's own measured rect, so it's genuinely the same ring the whole way,
// not two same-sized rings handed off with a fade.
const V_RING_RADIUS = 80;
// Circle center in the line canvas's own coordinate space — over the
// figure's torso, so the ring forms where the body is fading out and the
// philosophers arrive, standing where you stood.
const V_RING_CENTER = { x: LINE_CENTER, y: CHEST_LINE_Y + 110 };
function sampleQuad(
  pts: {
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
  },
  n: number,
) {
  return Array.from({ length: n }, (_, i) =>
    quadBezierPoint(pts.p0, pts.p1, pts.p2, i / (n - 1)),
  );
}
const YOU_MORPH_SOURCE = sampleQuad(YOU_DOWN_PTS, V_MORPH_POINTS);
const FEEL_MORPH_SOURCE = sampleQuad(FEEL_DOWN_PTS, V_MORPH_POINTS);
// "you" (left arc): top of the circle, around the left side, to the bottom.
const YOU_MORPH_TARGET = Array.from({ length: V_MORPH_POINTS }, (_, i) => {
  const angle = -Math.PI / 2 - (i / (V_MORPH_POINTS - 1)) * Math.PI;
  return {
    x: V_RING_CENTER.x + V_RING_RADIUS * Math.cos(angle),
    y: V_RING_CENTER.y + V_RING_RADIUS * Math.sin(angle),
  };
});
// "feel" (right arc): top of the circle, around the right side, to the bottom.
const FEEL_MORPH_TARGET = Array.from({ length: V_MORPH_POINTS }, (_, i) => {
  const angle = -Math.PI / 2 + (i / (V_MORPH_POINTS - 1)) * Math.PI;
  return {
    x: V_RING_CENTER.x + V_RING_RADIUS * Math.cos(angle),
    y: V_RING_CENTER.y + V_RING_RADIUS * Math.sin(angle),
  };
});
const AnimatedPath = Animated.createAnimatedComponent(Path);

// Each piece gets its own moment — "why?", then "what", then "you feel?",
// then "how?", then the payoff, then the button — rather than several
// fading in together. Hoisted to module scope (not just local to the render
// branch) so the line-draw effect's useEffect, which fires before that
// branch even runs, can schedule against the same beats.
// A slow, soft deceleration — most of the motion happens early, then it
// settles gently rather than arriving briskly. Used everywhere a word or
// line enters on this screen, in place of Reanimated's default entrance
// timing, which reads as a UI transition rather than something unhurried.
// Affordable here specifically because this screen plays once, ever — a
// returning user with a philosopher already chosen never sees it again.
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// Was 600 — the greet step's own wait (see the setStep("intro") timer) is
// now matched to the body's arrival animation, so this no longer needs to
// cover extra "let the body settle" time; 150 is just breathing room before
// the first beat fires, not a second wait stacked on the first.
const INTRO_BASE = 150;
const INTRO_BEAT = 1200;
const T_WHY = INTRO_BASE;
// "you" and "feel" share one beat — they're two halves of a single phrase
// split around the body, and giving them separate beats made the second
// half read as a stutter ("feel" seeming to arrive twice). One beat, one
// phrase; the chest arc drawing between them is what joins the halves.
const T_YOUFEEL = INTRO_BASE + INTRO_BEAT;
const T_HOW = INTRO_BASE + INTRO_BEAT * 2;
const T_PAYOFF = INTRO_BASE + INTRO_BEAT * 3;
const T_BUTTON = INTRO_BASE + INTRO_BEAT * 3.5;
// How long each line takes to draw itself on, once its beat arrives —
// long enough to still be finishing as the next word starts arriving, so
// the sequence reads as continuous rather than call-and-response.
const LINE_DRAW_DURATION = 950;

// How far out (in the figure's own drawing-space units) each dot starts
// before converging inward on mount — large enough that dots visibly rush
// in from beyond the figure, not just settle the last few pixels.
const ENTRANCE_SCATTER = 220;

function BurstDot({
  dot,
  index,
  burst,
  arrive,
  settle,
  exitProgress,
  merge,
  mergeTarget,
  styles,
}: {
  dot: AuraDot;
  index: number;
  burst: SharedValue<number>;
  arrive: SharedValue<number>;
  // The bloom pulse for this dot's zone — every zone has one now (legs
  // bloom on the "is an experience" beat).
  settle?: SharedValue<number>;
  // 0→1 on "walk": pulls the dot from its resting position back toward the
  // chest origin (dx/dy below, already computed relative to that point) —
  // "everything scattered about you gathers into one" as the actual gesture,
  // not just a fade.
  exitProgress: SharedValue<number>;
  // 0→1 shortly after this dot's bloom — migrates it toward mergeTarget and
  // dims it, so it reads as having become part of the word/line that just
  // named it rather than lingering as generic ambient scatter.
  merge?: SharedValue<number>;
  mergeTarget?: { x: number; y: number };
  styles: ReturnType<typeof makeStyles>;
}) {
  const pos = auraBodyToPixel(LAYOUT_SIZE, dot.cx, dot.cy);
  // The chest core-glow is the burst's origin — dots read as radiating from
  // it rather than from an arbitrary point (true for both the entrance
  // convergence and the later beat-transition burst).
  const origin = auraBodyToPixel(LAYOUT_SIZE, 100, 148);
  const dx = pos.x - origin.x;
  const dy = pos.y - origin.y;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const scale = LAYOUT_SIZE / 200;
  const size = dot.r * 2 * scale;
  const travel = BURST_DISTANCE * scale;
  const scatter = ENTRANCE_SCATTER * scale;
  // A small deterministic per-dot head start (0–0.55 of the total arrival
  // window) so dots don't converge in perfect lockstep — a real scatter of
  // particles never arrives all at once. The wide spread matters more than
  // it looks: it's most of what makes the entrance read as gathering
  // rather than snapping into place.
  const dotDelay = ((index % 17) / 17) * 0.55;

  // A faint downward bias in the dots' resting brightness — dots below the
  // chest sit slightly brighter than ones above it — so the field of light
  // leans toward the text underneath instead of scattering evenly in every
  // direction, standing in for the "gaze toward the copy" trick a photo
  // would use with an actual subject.
  const verticalBias = dot.cy > 148 ? 1.15 : 0.85;

  const mergeOffset = mergeTarget
    ? (() => {
        const t = auraBodyToPixel(LAYOUT_SIZE, mergeTarget.x, mergeTarget.y);
        return { x: t.x - pos.x, y: t.y - pos.y };
      })()
    : null;

  const dotStyle = useAnimatedStyle(() => {
    const local = Math.max(
      0,
      Math.min(1, (arrive.value - dotDelay) / (1 - dotDelay)),
    );
    const converge = 1 - local;
    const bloom = settle ? settle.value : 0;
    const collapse = exitProgress.value;
    const merged = merge ? merge.value : 0;
    return {
      // Fully fades to 0 as merge completes — the dot becomes the word and
      // then is gone, rather than lingering beside it at reduced opacity.
      // (Previously capped at 35% dimmed, which read as the dots refusing
      // to fully hand off to the word they'd just become.)
      opacity:
        Math.min(
          1,
          dot.opacity * verticalBias * local + burst.value * 0.45 + bloom * 0.5,
        ) *
        (1 - merged),
      transform: [
        {
          translateX:
            ux * (travel * burst.value + scatter * converge) -
            dx * collapse +
            (mergeOffset ? mergeOffset.x * merged : 0),
        },
        {
          translateY:
            uy * (travel * burst.value + scatter * converge) -
            dy * collapse +
            (mergeOffset ? mergeOffset.y * merged : 0),
        },
        // A catch of light, not a pop — kept small so the brightening and
        // the gather-toward-the-word read as one motion.
        { scale: 1 + bloom * 0.2 },
      ],
    };
  });

  return (
    <Animated.View
      style={[
        styles.dot,
        {
          left: pos.x - size / 2,
          top: pos.y - size / 2,
          width: size,
          height: size,
        },
        dotStyle,
      ]}
    />
  );
}

// An expanding ring plus a tiny bright flash at the chest — deliberately
// NOT just a filled glow, since the body image already has its own baked-in
// core glow at that exact spot and a plain circle would be hard to tell
// apart from it. A ring "shockwave" reads as ignition regardless of what's
// underneath it.
function CoreSpark({ arrive, styles }: { arrive: SharedValue<number>; styles: ReturnType<typeof makeStyles> }) {
  const pos = auraBodyToPixel(LAYOUT_SIZE, 100, 148);
  const r = 34 * (LAYOUT_SIZE / 200);

  const ringStyle = useAnimatedStyle(() => {
    const t = Math.min(1, arrive.value / 0.5);
    return {
      opacity: Math.max(0, 1 - t) * 0.9,
      transform: [{ scale: 0.4 + t * 1.8 }],
    };
  });

  const flashStyle = useAnimatedStyle(() => {
    const rise = Math.min(1, arrive.value / 0.15);
    const fall =
      arrive.value <= 0.15 ? 1 : Math.max(0, 1 - (arrive.value - 0.15) / 0.25);
    const env = Math.min(rise, fall);
    return {
      opacity: env,
      transform: [{ scale: 0.5 + env * 0.6 }],
    };
  });

  return (
    <>
      <Animated.View
        style={[
          styles.coreRing,
          {
            left: pos.x - r,
            top: pos.y - r,
            width: r * 2,
            height: r * 2,
            borderRadius: r,
          },
          ringStyle,
        ]}
      />
      <Animated.View
        style={[
          styles.coreFlash,
          {
            left: pos.x - r * 0.4,
            top: pos.y - r * 0.4,
            width: r * 0.8,
            height: r * 0.8,
            borderRadius: r * 0.4,
          },
          flashStyle,
        ]}
      />
    </>
  );
}

// The figure itself never moves or resizes between beats — it's the constant.
// What carries the transition is a brief outward burst of the dots already
// scattered around it, like a small release of light, while it just keeps
// breathing in place.
function IntroFigure({
  burst,
  exitProgress,
  settleWhat,
  settleYou,
  settleFeel,
  mergeWhat,
  mergeYou,
  mergeFeel,
  settleHow,
  mergeHow,
  reduceMotion,
  styles,
}: {
  burst: SharedValue<number>;
  exitProgress: SharedValue<number>;
  settleWhat: SharedValue<number>;
  settleYou: SharedValue<number>;
  settleFeel: SharedValue<number>;
  mergeWhat: SharedValue<number>;
  mergeYou: SharedValue<number>;
  mergeFeel: SharedValue<number>;
  settleHow: SharedValue<number>;
  mergeHow: SharedValue<number>;
  reduceMotion: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const pulse = useSharedValue(0);
  const arrive = useSharedValue(0);
  const dots = useMemo(() => generateAuraDots("onboarding-neutral"), []);
  const metrics = FIGURE_METRICS;
  // The rendered image is sized to FIGURE_SIZE (independent of LAYOUT_SIZE),
  // then positioned by matching ITS OWN core point to the same core point
  // everything else (dots, spark, lines) is already anchored to — not by
  // simple centering, which would leave the core misaligned since the
  // figure's anatomy isn't symmetric top-to-bottom.
  const imageMetrics = getAuraFigureMetrics(FIGURE_SIZE);
  const imageOffsetX = metrics.width / 2 - imageMetrics.width / 2;
  const imageOffsetY = metrics.chestY - imageMetrics.chestY;

  useEffect(() => {
    // Reduce Motion: the figure simply is — no breathing pulse, no dots
    // rushing in. arrive lands at 1 immediately, which also zeroes out the
    // CoreSpark ring/flash envelopes.
    if (reduceMotion) {
      arrive.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 3400, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    // The entrance itself — a spark ignites at the chest, the body blooms
    // in after it, and the scattered dots (see BurstDot) drift inward to
    // settle around it, all riding this single 0→1 timeline. 1500ms with a
    // long soft tail (not 1000 with a cubic) — the gathering should feel
    // unhurried, closer to condensation than to a UI transition.
    arrive.value = withTiming(1, {
      duration: 1500,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
    });
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.85 + pulse.value * 0.15,
    transform: [{ scale: 1 + pulse.value * 0.03 }],
  }));

  // The body holds back through the spark (first ~20% of arrive), then
  // blooms — spark first, THEN the figure, reads as ignition causing the
  // body rather than two things happening to start together. The scale
  // swell is small (0.92→1): a presence forming, not an element zooming.
  const bodyOpacityStyle = useAnimatedStyle(() => {
    const t = Math.max(0, (arrive.value - 0.2) / 0.8);
    return { opacity: t };
  });
  const bodyScaleStyle = useAnimatedStyle(() => {
    const t = Math.max(0, (arrive.value - 0.2) / 0.8);
    return { transform: [{ scale: 0.92 + t * 0.08 }] };
  });

  return (
    // No layout transition here — the composition reserves its full height
    // from the first frame, so this wrapper never actually moves. (It used
    // to slide up via LinearTransition when the text mounted below, which
    // read as an object being repositioned rather than a presence.)
    <Animated.View style={{ width: metrics.width, height: metrics.height }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            left: imageOffsetX,
            top: imageOffsetY,
            width: imageMetrics.width,
            height: imageMetrics.height,
          },
          bodyOpacityStyle,
        ]}
      >
        {/* Scale lives on its own nested view, separate from the one
            carrying position:absolute + left/top — on web, an element
            transformed by scale while ALSO positioned via left/top on the
            very same node can paint one wrong-looking frame before its
            transform-origin settles, which read as the body sliding in
            from the side on reload. Splitting position and scale onto
            different nodes removes that interaction entirely. */}
        <Animated.View style={[{ flex: 1 }, bodyScaleStyle]}>
          <Animated.View style={[{ flex: 1 }, pulseStyle]}>
            <Image
              source={AURA_BODY}
              style={styles.figureImage}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </Animated.View>
      <CoreSpark arrive={arrive} styles={styles} />
      {/* Deliberately NOT wrapped in pulseStyle — the body breathes, the
          dots don't. When the dots shared the breathing pulse, they seemed
          to pulsate for no reason; now their only motions are the ones that
          mean something: converging on entrance, catching light and merging
          into their word on its beat, gathering into the chest on exit. */}
      <View style={StyleSheet.absoluteFill}>
        {dots.map((d, i) => {
          // Head dots catch light with "what" (it sits right above the
          // head); torso dots split left/right to pair with "you" and
          // "feel", which flank the chest on those same sides; legs dots
          // belong to "is an experience" below — every zone collapses into
          // its phrase, marking where the attention goes.
          const settle =
            d.zone === "head"
              ? settleWhat
              : d.zone === "torso"
                ? d.cx < 100
                  ? settleYou
                  : settleFeel
                : settleHow;
          const merge =
            d.zone === "head"
              ? mergeWhat
              : d.zone === "torso"
                ? d.cx < 100
                  ? mergeYou
                  : mergeFeel
                : mergeHow;
          // Where each zone's dot comes to rest, in the dot coordinate space
          // auraBodyToPixel uses (canvas is 200 units; values beyond 0–200
          // extrapolate linearly, which is fine — nothing clips). Each point
          // sits just BEFORE its word's leading edge, in reading order —
          // not centered on the word — so the dot visibly arrives and THEN
          // the word grows from that point (see wordStyle/MERGE_WORD_START),
          // reading as "the dot becomes the word" rather than a dot landing
          // on top of a letter that's independently already appearing.
          const mergeTarget =
            d.zone === "head"
              ? { x: 108, y: -68 }
              : d.zone === "torso"
                ? d.cx < 100
                  ? { x: -55, y: 108 }
                  : { x: 208, y: 108 }
                : { x: 12, y: 378 };
          return (
            <BurstDot
              key={i}
              dot={d}
              index={i}
              burst={burst}
              arrive={arrive}
              settle={settle}
              exitProgress={exitProgress}
              merge={merge}
              mergeTarget={mergeTarget}
              styles={styles}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const reduceMotion = useReducedMotion();
  // Reduce Motion skips the greet beat and mounts the intro already
  // fast-forwarded: the full settled composition on gentle fades, no
  // choreography to sit through.
  const [step, setStep] = useState<"greet" | "intro" | "choose">(
    reduceMotion ? "intro" : "greet",
  );
  // A tap anywhere during the intro jumps the whole timeline to its settled
  // state instead of being ignored — first-open attention is scarce, and an
  // unresponsive screen reads as slow rather than calm.
  const [fastForwarded, setFastForwarded] = useState(reduceMotion);
  const [isExiting, setIsExiting] = useState(false);
  const viewStartRef = useRef(Date.now());
  const introStartRef = useRef(0);
  const hapticTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // Ref onto connectLineWrap (not onboarding/index.tsx's `e.target` — RN
  // Web's onLayout event doesn't carry a usable measurable node) so its
  // onLayout handler can call measureInWindow on the actual instance.
  const connectLineWrapRef = useRef<View>(null);
  // The literal ring-becomes-ring morph: one ring, drawn by this overlay,
  // that travels in WINDOW coordinates from where the intro's circle forms
  // to wherever the picker's ring actually lands on the next screen —
  // measured, not guessed, since the two screens' relative layout (safe-area
  // insets, title height) isn't a fixed number across devices. `travelActive`
  // is independent of `step`: the overlay keeps existing (and the picker's
  // own static ring stays hidden — see hideOwnRing) across the
  // intro-unmounts/choose-mounts boundary that would otherwise cut the ring
  // in two frames. Both rects start null; the travel only starts once both
  // are known (see the effect below).
  const [travelActive, setTravelActive] = useState(false);
  // True once the overlay ring starts its fade-out — separate from
  // travelActive (which keeps the overlay MOUNTED so that fade-out can
  // finish) so the picker's own ring can start fading in the same frame
  // the overlay starts fading out, rather than waiting for travelActive to
  // go false (which used to happen only after the overlay had already
  // finished disappearing).
  const [handoffStarted, setHandoffStarted] = useState(false);
  const [introRingRect, setIntroRingRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [pickerRingRect, setPickerRingRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const travelProgress = useSharedValue(0);
  const travelOpacity = useSharedValue(0);
  const burst = useSharedValue(0);
  // Drives the whole exit at once: the figure and other four lines fade out
  // (1 - exitProgress), the payoff curve morphs into the ring (see
  // RING_MORPH_SOURCE/TARGET), and the scattered dots pull back into the
  // chest origin they scattered from (see BurstDot) — one value, three
  // reactions, so nothing has to be hand-synced against another.
  const exitProgress = useSharedValue(0);
  // Each line "draws itself" via stroke-dashoffset (see the animatedProps
  // below) rather than just fading in — one value per beat, matching
  // T_WHAT/T_FEEL/T_HOW, so each line's growth reads as arriving right where
  // the previous one left off instead of all three appearing independently.
  const lineDrawWhat = useSharedValue(0);
  const lineDrawFeel = useSharedValue(0);
  const lineDrawHow = useSharedValue(0);
  // Beat-timed reveals for the payoff sentence and button — shared values
  // instead of `entering` delays, for the same no-flash reason as the words
  // (see wordStyle below). "is an experience" is NOT here — it condenses
  // from mergeHow instead, same mechanism as the three words above.
  const revealPayoff = useSharedValue(0);
  const revealButton = useSharedValue(0);
  // A brief brighten-and-settle pulse for the dots near each word, timed to
  // the same beat — the dots aren't just ambient aura escaping outward,
  // they're the scattered, not-yet-named parts of the moment, and each one
  // visibly "catches" as its word names it. 0 = neutral (no pre-trigger
  // dimming, so this can't fight with the entrance/burst animations already
  // driving these dots), briefly rising then easing back to 0 on trigger.
  const settleWhat = useSharedValue(0);
  const settleYou = useSharedValue(0);
  const settleFeel = useSharedValue(0);
  // What happens to a zone's dots once its bloom has passed — they don't
  // just sit there as ambient scatter indefinitely. Every zone migrates
  // toward and dims into its phrase's rough position (0 = still scattered,
  // 1 = merged) so the dots read as having become part of what just named
  // them; the legs dots belong to "is an experience" — they collapse toward
  // it on its beat, marking where the attention goes next, same as the
  // words above do.
  const mergeWhat = useSharedValue(0);
  const mergeYou = useSharedValue(0);
  const mergeFeel = useSharedValue(0);
  const settleHow = useSharedValue(0);
  const mergeHow = useSharedValue(0);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // The figure/ring composition itself stays fixed-size everywhere — its
  // geometry (line paths, ring radius, morph targets) is computed once at
  // module load from LAYOUT_SIZE/LINE_WIDTH etc, not at render time, and is
  // tightly choreographed with PhilosopherPicker's own ring for the
  // cross-screen morph (see travelActive below) — rescaling it live is a
  // separate, larger effort deliberately deferred (see docs/roadmap.md).
  // What DOES respond to a wider/tablet canvas: the payoff text and button
  // stop stretching to the screen's full width, capped at the same reading
  // column every other screen uses, so the space around the (unchanged)
  // figure reads as an intentional frame instead of a phone layout with
  // empty margins.
  const columnWidth = useWideColumnWidth();
  const select = usePhilosopherStore((s) => s.select);

  useEffect(() => {
    track("onboarding_viewed");
  }, []);

  // Jumps every timeline value to (or quickly toward) its final state — the
  // one place both the tap-to-fast-forward and the Reduce Motion mount go
  // through, so "settled" can't mean two slightly different compositions.
  const applySettled = (duration: number) => {
    for (const v of [lineDrawWhat, lineDrawFeel, lineDrawHow]) {
      cancelAnimation(v);
      v.value = withTiming(1, { duration, easing: SOFT_EASE });
    }
    for (const v of [settleWhat, settleYou, settleFeel, settleHow]) {
      cancelAnimation(v);
      v.value = withTiming(0, { duration: 200 });
    }
    for (const v of [mergeWhat, mergeYou, mergeFeel, mergeHow]) {
      cancelAnimation(v);
      v.value = withTiming(1, { duration, easing: SOFT_EASE });
    }
    for (const v of [revealPayoff, revealButton]) {
      cancelAnimation(v);
      v.value = withTiming(1, { duration, easing: SOFT_EASE });
    }
  };

  // Beat one (the figure, alone) settles into beat two (the text) on its
  // own after a pause — but a tap skips straight there, since a fixed wait
  // with no shortcut wears thin the second or third time someone opens the app.
  // Matched to IntroFigure's own 1500ms arrival animation (see IntroFigure's
  // `arrive` timeline) rather than a shorter, independent guess — the old
  // 1300ms + a further 600ms delay before "what" (T_WHY = INTRO_BASE) meant
  // the body finished arriving and then just sat there, breathing, for
  // several hundred idle milliseconds before anything else happened. Now
  // the words start essentially the moment the body has arrived.
  useEffect(() => {
    if (step !== "greet") return;
    const timer = setTimeout(() => setStep("intro"), 1500);
    return () => clearTimeout(timer);
  }, [step]);

  // The transition's motion lives here — a quick outward rise and a slower
  // return, like a breath of light — rather than in any repositioning of
  // the figure itself.
  useEffect(() => {
    if (step !== "intro") return;
    introStartRef.current = Date.now();
    // Reduce Motion mounts straight into this branch already fast-forwarded.
    if (fastForwarded) {
      applySettled(350);
      return;
    }
    burst.value = withSequence(
      withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 900, easing: Easing.inOut(Easing.cubic) }),
    );
    // A soft tick as each word lands — the beats are felt, not just seen.
    // Native only; cleared if the user fast-forwards or leaves.
    if (Platform.OS !== "web") {
      for (const t of [T_WHY, T_YOUFEEL, T_HOW, T_PAYOFF]) {
        hapticTimers.current.push(
          setTimeout(() => Haptics.selectionAsync(), t),
        );
      }
    }
    // Both chest-crossing lines ride the you/feel beat — the arc between
    // the two words is what joins the halves of the phrase.
    lineDrawWhat.value = withDelay(
      T_YOUFEEL,
      withTiming(1, { duration: LINE_DRAW_DURATION, easing: SOFT_EASE }),
    );
    lineDrawFeel.value = withDelay(
      T_YOUFEEL,
      withTiming(1, { duration: LINE_DRAW_DURATION, easing: SOFT_EASE }),
    );
    lineDrawHow.value = withDelay(
      T_HOW,
      withTiming(1, { duration: LINE_DRAW_DURATION, easing: SOFT_EASE }),
    );
    // "is an experience" and the three anchor words no longer have their
    // own reveal timing — they condense from mergeWhat/mergeYou/mergeFeel/
    // mergeHow (scheduled below), the same values that drive the dots.
    revealPayoff.value = withDelay(
      T_PAYOFF,
      withTiming(1, { duration: 1000, easing: SOFT_EASE }),
    );
    revealButton.value = withDelay(
      T_BUTTON,
      withTiming(1, { duration: 1000, easing: SOFT_EASE }),
    );
    settleWhat.value = withDelay(
      T_WHY,
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
    settleYou.value = withDelay(
      T_YOUFEEL,
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
    settleFeel.value = withDelay(
      T_YOUFEEL,
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
    settleHow.value = withDelay(
      T_HOW,
      withSequence(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.cubic) }),
      ),
    );
    // Starts WHILE the bloom is still rising (beat + 250ms), not after it —
    // catch light and gather into the word as one continuous gesture. When
    // the two were sequential (bloom, second of stillness, then drift), the
    // brightening read as an unexplained pulse and the drift as a second,
    // unrelated event; overlapping them is what makes the meaning legible:
    // the word names the dots, and they go to it.
    mergeWhat.value = withDelay(
      T_WHY + 250,
      withTiming(1, { duration: 1600, easing: SOFT_EASE }),
    );
    mergeYou.value = withDelay(
      T_YOUFEEL + 250,
      withTiming(1, { duration: 1600, easing: SOFT_EASE }),
    );
    mergeFeel.value = withDelay(
      T_YOUFEEL + 250,
      withTiming(1, { duration: 1600, easing: SOFT_EASE }),
    );
    mergeHow.value = withDelay(
      T_HOW + 250,
      withTiming(1, { duration: 1600, easing: SOFT_EASE }),
    );
    return () => {
      hapticTimers.current.forEach(clearTimeout);
      hapticTimers.current = [];
    };
  }, [step]);

  // Greet: advance to the intro. Intro: fast-forward to the settled
  // composition (remounting the keyed text elements with zero delay — see
  // ffKey below) instead of ignoring the tap.
  const handleIntroTap = () => {
    if (step === "greet") {
      setStep("intro");
      return;
    }
    if (!fastForwarded && !isExiting) {
      hapticTimers.current.forEach(clearTimeout);
      hapticTimers.current = [];
      setFastForwarded(true);
      applySettled(350);
      track("onboarding_intro_skipped", {
        at_ms: Date.now() - introStartRef.current,
      });
    }
  };

  // The word doesn't arrive independently of the dots — it's what the dots
  // BECOME. `merge` (0→1) is the single driver of the whole handoff: from
  // 0, dots are still scattered and the word is invisible; past MERGE_WORD_
  // START, the word begins condensing in — fading up and tightening its
  // letter-spacing — as the dots finish gathering into it, so the two
  // motions overlap and resolve together instead of arriving as two
  // separately-timed events that happen to end up in the same place. No
  // Reanimated `entering` animation anywhere here — see the note that used
  // to sit here about the "word flashes before its time" glitch that
  // motivated driving everything from shared values instead.
  const MERGE_WORD_START = 0.45;
  const wordStyle = (merge: SharedValue<number>) =>
    useAnimatedStyle(() => {
      const t = Math.max(
        0,
        (merge.value - MERGE_WORD_START) / (1 - MERGE_WORD_START),
      );
      return {
        opacity: t,
        letterSpacing: (1 - t) * 16,
        transform: [{ translateY: -6 * (1 - t) }],
      };
    });
  const trackWhatStyle = wordStyle(mergeWhat);
  const trackYouStyle = wordStyle(mergeYou);
  const trackFeelStyle = wordStyle(mergeFeel);

  const revealStyle = (reveal: SharedValue<number>) =>
    useAnimatedStyle(() => ({
      opacity: reveal.value,
      transform: [{ translateY: -12 * (1 - reveal.value) }],
    }));
  // "is an experience" condenses from its own dots the same way the words
  // above do — driven by mergeHow, not the independent revealHow timing.
  const howRevealStyle = wordStyle(mergeHow);
  const payoffRevealStyle = revealStyle(revealPayoff);
  // The button is in the layout from the first frame (reserving its space)
  // but must not swallow taps while invisible — before its beat, a tap in
  // its area should fall through to the root Pressable (skip / advance),
  // not start the walk.
  const buttonRevealStyle = useAnimatedStyle(() => ({
    opacity: revealButton.value,
    transform: [{ translateY: -12 * (1 - revealButton.value) }],
    pointerEvents: revealButton.value > 0.3 ? "auto" : "none",
  }));

  const lineWhatProps = useAnimatedProps(() => ({
    strokeDashoffset: WHY_TO_WHAT_LENGTH * (1 - lineDrawWhat.value),
  }));
  const lineFeelProps = useAnimatedProps(() => ({
    strokeDashoffset: WHAT_TO_FEEL_LENGTH * (1 - lineDrawFeel.value),
  }));
  // The V arcs are polylines whose points lerp toward their half of the
  // ring as exitProgress rises; the same props also run the draw-on reveal
  // (dashoffset) and release the dash pattern once the morph starts — the
  // semicircle is longer than the original arc, so the rest-state dash
  // length would otherwise clip it mid-morph.
  const makeVMorphProps = (
    source: { x: number; y: number }[],
    target: { x: number; y: number }[],
    length: number,
  ) =>
    useAnimatedProps(() => {
      const e = exitProgress.value;
      const d = source
        .map((sp, i) => {
          const tp = target[i];
          const x = sp.x + (tp.x - sp.x) * e;
          const y = sp.y + (tp.y - sp.y) * e;
          return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");
      const dash = length + (2000 - length) * Math.min(1, e * 4);
      return {
        d,
        strokeDashoffset: length * (1 - lineDrawHow.value),
        strokeDasharray: [dash, dash] as [number, number],
      };
    });
  const lineYouDownProps = makeVMorphProps(
    YOU_MORPH_SOURCE,
    YOU_MORPH_TARGET,
    YOU_DOWN_LENGTH,
  );
  const lineFeelDownProps = makeVMorphProps(
    FEEL_MORPH_SOURCE,
    FEEL_MORPH_TARGET,
    FEEL_DOWN_LENGTH,
  );

  const handleSelect = async (id: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await select(id);
    track("onboarding_completed", { philosopher: id });
    router.replace("/(tabs)/guide");
  };

  // The fully-formed ring sits still and visible for a beat before handing
  // off to "choose" — without this it read as arriving and immediately
  // being discarded, which undercut the whole point of growing it in the
  // first place rather than just fading everything at once. Under Reduce
  // Motion the morph is skipped down to a quick fade with no hold.
  //
  // Android-only: 0, not 500 — this hold-and-admire beat was tuned on iOS,
  // where the full onboarding->picker sequence reads as intentional. On
  // Android the same fixed durations stacked with this app's real render/
  // measurement overhead read as a plain multi-second stall instead (users
  // reported waiting ~2-3s before the picker ring appeared) — removing
  // just this one pure-waiting beat (no motion happens during it) trims
  // that without touching the morph/travel animations themselves, which
  // still visibly happen on both platforms.
  const EXIT_DURATION = reduceMotion ? 250 : 900;
  const RING_HOLD_DURATION = reduceMotion || Platform.OS === "android" ? 0 : 500;
  // How long the overlay ring takes to travel from its intro position to
  // the measured picker position, once both are known.
  const RING_TRAVEL_DURATION = reduceMotion ? 200 : 700;
  const handleWalk = () => {
    if (isExiting) return;
    setIsExiting(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    track("onboarding_walk", {
      ms_since_view: Date.now() - viewStartRef.current,
      skipped_intro: fastForwarded,
    });
    exitProgress.value = withTiming(1, {
      duration: EXIT_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });
    // Android only: skip the traveling-ring overlay entirely. That whole
    // mechanism depends on measureInWindow reporting the real, correct
    // position of PhilosopherPicker's ring on the next screen — confirmed
    // unreliable on Android across two rounds of real fixes (a genuine
    // measureInWindow (0,0)-before-layout-settles quirk, then a fallback-
    // timer race against the picker's own mount time) and still not
    // reliable enough in practice. Never starting travelActive here means
    // PhilosopherPicker's hideOwnRing prop (gated on
    // `travelActive && !handoffStarted`) stays false the whole time, so
    // its own static ring is simply visible the instant it mounts — no
    // cross-screen coordinate measurement, no fallback timers, nothing
    // left to race or get stuck. iOS keeps the full travel/morph, which
    // has not had this problem.
    if (Platform.OS !== "android") {
      // The overlay ring takes over from here — it's already visible
      // (it's literally the same ring the V-arcs just morphed into), so
      // it fades in instantly rather than re-entering, and starts
      // traveling the moment the picker reports where it needs to land
      // (see the effect below).
      travelOpacity.value = 1;
      setTravelActive(true);
      setHandoffStarted(false);
    }
    setTimeout(() => {
      // Explicitly stop every shared value that drives an animated SVG
      // prop (the V-arc morph paths, the line-draw dash offsets) before
      // unmounting the intro/exit tree that owns them — confirmed via
      // on-device adb logcat that leaving this implicit (relying on
      // Reanimated's own unmount cleanup) was the actual cause of the
      // "picker ring stuck for several seconds" bug on Android: even
      // with exitProgress settled at 1, react-native-svg's
      // VirtualView.setClientRect kept firing a layout-changed dispatch
      // that raced Reanimated's synchronous native-prop update against
      // the underlying view already being torn down
      // (RetryableMountingLayerException: "Unable to find
      // SurfaceMountingManager for tag"), retried every single frame for
      // several seconds until it happened to resolve. Cancelling here
      // stops the worklets from ever re-touching these views once we've
      // committed to leaving this screen, rather than hoping unmount
      // cleanup catches it in time.
      for (const v of [
        exitProgress,
        lineDrawWhat,
        lineDrawFeel,
        lineDrawHow,
        settleWhat,
        settleYou,
        settleFeel,
        settleHow,
        mergeWhat,
        mergeYou,
        mergeFeel,
        mergeHow,
        revealPayoff,
        revealButton,
      ]) {
        cancelAnimation(v);
      }
      setStep("choose");
    }, EXIT_DURATION + RING_HOLD_DURATION);
  };

  // Starts the actual travel once BOTH rects are known — the intro rect is
  // captured on mount (the ring's canvas doesn't move), the picker rect
  // only arrives once "choose" has mounted and PhilosopherPicker has laid
  // out. Whichever arrives second is what triggers movement, so the ring
  // never travels toward a stale or default target.
  useEffect(() => {
    if (!travelActive || !introRingRect || !pickerRingRect) return;
    travelProgress.value = withTiming(1, {
      duration: RING_TRAVEL_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });
    // Once arrived: hand off to the picker's own static ring (fade one out
    // as the other fades in) — both fades start in the SAME frame
    // (setHandoffStarted here, not a further delay) so they actually
    // overlap into a crossfade, instead of the picker's ring waiting for
    // the overlay to finish fading before it even starts (which left a gap
    // with neither ring visible). The overlay itself keeps rendering
    // (travelActive stays true) until its own fade-out duration has
    // elapsed, so its opacity animation gets to finish instead of being cut
    // by an unmount mid-fade.
    const handoff = setTimeout(() => {
      travelOpacity.value = withTiming(0, { duration: 250 });
      setHandoffStarted(true);
      setTimeout(() => setTravelActive(false), 250);
    }, RING_TRAVEL_DURATION);
    return () => clearTimeout(handoff);
  }, [travelActive, introRingRect, pickerRingRect]);

  // Fallback for when pickerRingRect never arrives at all — observed on
  // Android: measureInWindow's onLayout-triggered callback can, on some
  // devices/builds, simply never fire for the picker's ring container
  // (not just "noticeably longer" as the effect above already accounts
  // for, but indefinitely stuck), which left the traveling ring frozen at
  // its intro position forever since the interpolation target falls back
  // to introRingRect itself when pickerRingRect is null (see
  // travelRingStyle below — target stays equal to introRingRect, so
  // travelProgress animating has nothing to visibly interpolate toward).
  // This timer force-completes the handoff after a generous wait so the
  // screen always reaches the picker instead of hanging on a stuck ring.
  //
  // The wait was a flat 1200ms measured from travelActive's own start
  // (handleWalk, i.e. t=0) — but "choose" (and PhilosopherPicker itself)
  // doesn't even MOUNT until EXIT_DURATION + RING_HOLD_DURATION (900+500 =
  // 1400ms in the non-reduced-motion case). That means this fallback fired
  // ~200ms BEFORE the picker's ring could possibly exist to measure,
  // every single run — not an intermittent Android edge case, but an
  // unconditional race this fallback always lost. That's what actually
  // produced the persistent "ring looks stuck, then snaps into place on
  // tap" symptom users kept hitting, not the occasional measureInWindow
  // (0,0)/never-fires quirk this effect was originally written to guard
  // against (that quirk is still real and still needs this fallback — it's
  // just that the delay itself was racing the picker's own mount time).
  // Anchoring the wait to the picker's actual earliest possible mount time
  // (rather than 0) removes that race entirely.
  const PICKER_MOUNT_DELAY = EXIT_DURATION + RING_HOLD_DURATION;
  useEffect(() => {
    if (!travelActive || handoffStarted) return;
    const forceHandoff = setTimeout(() => {
      if (pickerRingRect) return; // already resolved normally above
      travelOpacity.value = withTiming(0, { duration: 250 });
      setHandoffStarted(true);
      setTimeout(() => setTravelActive(false), 250);
    }, PICKER_MOUNT_DELAY + 800);
    return () => clearTimeout(forceHandoff);
  }, [travelActive, handoffStarted, pickerRingRect]);

  const exitFadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - exitProgress.value,
  }));

  // The traveling ring overlay (rendered once, below, after this branch)
  // needs to sit on top of and outlive whichever branch is active — hence
  // building each branch's tree into `content` instead of returning
  // directly, so a shared trailing sibling can be added once at the bottom.
  let content: React.ReactNode;
  if (step === "greet" || step === "intro") {
    const revealed = step === "intro";
    // Each piece gets its own moment — "why?", then "what", then "you
    // feel?", then "how?", then the payoff, then the button — rather than
    // several fading in together. A line rides along with whichever text
    // it's arriving at, since it reads as leading into that word. (Values
    // live at module scope as T_WHY etc. — the line-draw effect above needs
    // them before this branch even runs.)
    // Every beat-timed element's visibility is driven by shared values
    // (wordStyle/revealStyle above), scheduled in the intro effect — no
    // delayed `entering` animations anywhere in the cascade, so nothing can
    // flash on mount, and fast-forward is just applySettled() jumping the
    // same values with no remounting.
    const ff = fastForwarded;
    content = (
      <Pressable
        style={styles.introRoot}
        disabled={revealed && ff}
        onPress={handleIntroTap}
      >
        {theme === 'dark' && <AmbientGlow />}

        {/* The brand name, not the tagline's kicker — established immediately,
            separately from the figure+copy, rather than fading in as one more
            line in the cascade below. */}
        <Animated.Text
          entering={FadeIn.duration(1100).easing(SOFT_EASE)}
          style={[styles.wordmark, { paddingTop: insets.top + spacing[4] }]}
        >
          {t('common.wordmark')}
        </Animated.Text>

        {/* insets.bottom + spacing[8] (32px), not spacing[4] — some Android
            OEM skins (confirmed on a Samsung device with 3-button nav)
            under-report the real nav bar height via useSafeAreaInsets, so a
            thin fixed margin on top of it wasn't enough to keep "walk" from
            visually fighting the nav bar. A larger fixed floor here is a
            safety margin, not a replacement for insets.bottom — devices
            where insets.bottom reports correctly just get extra breathing
            room instead of exact-fit spacing. */}
        <View style={[styles.stage, { paddingBottom: insets.bottom + spacing[8] }]}>
          <View style={styles.stageSpacer} />
          <View style={styles.figureComposition}>
            {/* Traces the reading path "why?" → "what" → "you feel?" — three
                separately-timed overlays sharing one canvas (rather than one
                shared entering animation) so each segment arrives with the
                text it's leading into, not all at once. Rendered before
                figureWrap so the opaque body naturally occludes its middle
                stretch, rather than needing curve-avoidance logic.
                The exit fade is applied per-piece rather than on this whole
                composition: the two descending V arcs are the one element
                that survives the exit (they close into the picker's ring),
                so they can't live inside a fading wrapper. */}
            <View
              ref={connectLineWrapRef}
              style={styles.connectLineWrap}
              onLayout={() => {
                // onLayout fires once this View has actually laid out —
                // that's the trigger, but the measurable node has to come
                // from a ref (onLayout's event has no usable `target` for
                // this on React Native Web). Captured once, on mount —
                // this container's position never changes (only the ring
                // drawn inside it, via the V-arc morph, changes over
                // time), so there's no need to remeasure later.
                // V_RING_CENTER/V_RING_RADIUS are in this container's own
                // local coordinate space (the Svg viewBox matches it
                // exactly), so window-x/y + those local values gives the
                // ring's real window-space rect.
                connectLineWrapRef.current?.measureInWindow((x, y) => {
                  setIntroRingRect({
                    x: x + V_RING_CENTER.x - V_RING_RADIUS,
                    y: y + V_RING_CENTER.y - V_RING_RADIUS,
                    width: V_RING_RADIUS * 2,
                    height: V_RING_RADIUS * 2,
                  });
                });
              }}
            >
              {/* Each line draws itself on via stroke-dashoffset (full
                    length → 0) instead of just fading in — growing out of
                    where the previous one arrived, rather than each
                    appearing independently. No entering prop needed here:
                    dashoffset starting at the line's full length already
                    means "not drawn yet," so the draw-on animation itself is
                    the reveal. */}
              <Animated.View style={exitFadeStyle}>
                <View style={styles.lineOverlay}>
                  <Svg
                    width={LINE_WIDTH}
                    height={FIGURE_COMP_HEIGHT}
                    viewBox={`0 0 ${LINE_WIDTH} ${FIGURE_COMP_HEIGHT}`}
                  >
                    <AnimatedPath
                      d={PATH_WHY_TO_WHAT}
                      animatedProps={lineWhatProps}
                      strokeDasharray={[WHY_TO_WHAT_LENGTH, WHY_TO_WHAT_LENGTH]}
                      fill="none"
                      stroke={AURA_NEUTRAL_COLOR}
                      strokeOpacity={0.35}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
                <View style={styles.lineOverlay}>
                  <Svg
                    width={LINE_WIDTH}
                    height={FIGURE_COMP_HEIGHT}
                    viewBox={`0 0 ${LINE_WIDTH} ${FIGURE_COMP_HEIGHT}`}
                  >
                    <AnimatedPath
                      d={PATH_WHAT_TO_FEEL}
                      animatedProps={lineFeelProps}
                      strokeDasharray={[
                        WHAT_TO_FEEL_LENGTH,
                        WHAT_TO_FEEL_LENGTH,
                      ]}
                      fill="none"
                      stroke={AURA_NEUTRAL_COLOR}
                      strokeOpacity={0.35}
                      strokeWidth={1}
                      strokeLinecap="round"
                    />
                  </Svg>
                </View>
              </Animated.View>
              {/* The V arcs — deliberately OUTSIDE the exit fade. Their d,
                    draw-on, and dash release all live in lineYouDownProps /
                    lineFeelDownProps. They stay in place once closed; the
                    overlay ring (rendered at the OnboardingScreen root, see
                    travelActive) is what actually travels from here to the
                    picker's ring afterward. */}
              <Animated.View style={styles.lineOverlay}>
                <Svg
                  width={LINE_WIDTH}
                  height={FIGURE_COMP_HEIGHT}
                  viewBox={`0 0 ${LINE_WIDTH} ${FIGURE_COMP_HEIGHT}`}
                >
                  <AnimatedPath
                    animatedProps={lineYouDownProps}
                    fill="none"
                    stroke={AURA_NEUTRAL_COLOR}
                    strokeOpacity={0.35}
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                  <AnimatedPath
                    animatedProps={lineFeelDownProps}
                    fill="none"
                    stroke={AURA_NEUTRAL_COLOR}
                    strokeOpacity={0.35}
                    strokeWidth={1}
                    strokeLinecap="round"
                  />
                </Svg>
              </Animated.View>
            </View>

            {/* Trimmed to a single word — the head's position already implies
                "this is where understanding happens," so the verb it used to
                need ("Understand") is now redundant with the visual itself. */}
            <Animated.View style={[styles.aboveHeadPosition, exitFadeStyle]}>
              <Animated.Text style={[styles.aboveHead, trackWhatStyle]}>
                {t('onboarding.what')}
              </Animated.Text>
            </Animated.View>

            <Animated.View style={[styles.figureFade, exitFadeStyle]}>
              <View style={[styles.figureWrap, { marginTop: WHY_SPACE }]}>
                <IntroFigure
                  reduceMotion={reduceMotion}
                  burst={burst}
                  exitProgress={exitProgress}
                  settleWhat={settleWhat}
                  settleYou={settleYou}
                  settleFeel={settleFeel}
                  mergeWhat={mergeWhat}
                  mergeYou={mergeYou}
                  mergeFeel={mergeFeel}
                  settleHow={settleHow}
                  mergeHow={mergeHow}
                  styles={styles}
                />

                {/* "Know" dropped — embracing the glowing core already implies
                  recognition — but "you" stays; "what" / "you feel" keeps
                  the pair close to the chest rather than sitting apart from
                  the figure as plain text underneath it. Positioned relative
                  to this full-width wrapper (not the figure's own narrow
                  box), so the halves land in the margin beside the body.
                  Each arrives on its own beat now, not together. */}
                <View
                  style={[
                    styles.chestFlankRow,
                    // CHEST_LINE_Y converted from figureComposition's
                    // coordinate space into figureWrap's (subtracting
                    // WHY_SPACE, since figureWrap sits that far down within
                    // figureComposition), then POSITION.chest.textOffset
                    // applied on top — that's the one knob to move if the
                    // text should sit somewhere other than right on the line.
                    {
                      top: CHEST_LINE_Y - WHY_SPACE + POSITION.chest.textOffset,
                    },
                  ]}
                >
                  {/* One shared beat, one phrase — visibility rides the same
                      track values as the crystallize tightening, so fade,
                      drift, and letter-spacing are a single gesture. */}
                  <Animated.Text
                    style={[
                      styles.flankText,
                      styles.flankTextLeft,
                      trackYouStyle,
                    ]}
                  >
                    {t('onboarding.you')}
                  </Animated.Text>
                  <Animated.Text
                    style={[
                      styles.flankText,
                      styles.flankTextRight,
                      trackFeelStyle,
                    ]}
                  >
                    {t('onboarding.feel')}
                  </Animated.Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Rendered from the very first frame — NOT gated on `revealed`.
              Everything in here is invisible until its beat (reveal values
              start at 0), but its HEIGHT is in the layout from the start,
              so the figure sits in its final position during the greet beat
              instead of being centered alone and then shoved upward when
              the text mounts. The figure is the constant; the screen
              assembles around it. */}
          <View style={[styles.payoffWrap, { width: columnWidth }]}>
            <View style={styles.payoffLineWrap}>
              {/* Hangs in the pocket between the converging V and the
                    payoff sentence. entering and the exit fade are split
                    across two layers (outer/inner) rather than both landing
                    on styles.howLabel directly — Reanimated warns that a
                    layout animation (entering) and a reactive style can
                    fight over the same property on one component. */}
              <Animated.View style={[StyleSheet.absoluteFill, howRevealStyle]}>
                {/* howLabel's default left:-62/textAlign:"left" is a
                    deliberate off-center placement tuned for the English
                    "is an experience" (see the comment on howLabel itself)
                    — but that fixed offset doesn't scale with string
                    length, so the Russian "— это опыт" (a different
                    length) visibly drifted off from the line/figure axis
                    instead of reading as intentional. Centered instead for
                    Russian specifically, rather than changing the English
                    design. */}
                <Animated.Text
                  style={[
                    styles.howLabel,
                    locale === 'ru' && styles.howLabelCentered,
                    exitFadeStyle,
                  ]}
                >
                  {t('onboarding.isAnExperience')}
                </Animated.Text>
              </Animated.View>
            </View>
            <Animated.View style={payoffRevealStyle}>
              <Animated.Text style={[styles.introLine3, exitFadeStyle]}>
                {t('onboarding.walkItThrough')}
              </Animated.Text>
              {/* The one clause of promise: each walk produces something
                    that accumulates. "Arc" is deliberate — it's the seed of
                    the future trend feature by that name, planted in the
                    first minute. Quiet and unbolded: a fact, not a pitch. */}
              <Animated.Text style={[styles.introPromise, exitFadeStyle]}>
                {t('onboarding.eachWalkPromise')}
              </Animated.Text>
            </Animated.View>
          </View>

          <Animated.View
            style={[
              styles.introFooter,
              buttonRevealStyle,
              // columnWidth alone is the full device width (capped at
              // READING_COLUMN_MAX_WIDTH) with no margin subtracted — fine
              // for wrapped text (payoffWrap above), but the button's own
              // outline then touches the screen edges exactly, with nothing
              // to the wordmark/stage's own paddingHorizontal to hold it
              // back. Subtracting stage's horizontal padding here gives the
              // button the same side margin every other element in stage
              // already has.
              { width: columnWidth - spacing[6] * 2, alignSelf: 'center' },
            ]}
          >
            <Animated.View style={exitFadeStyle}>
              <Pressable
                style={styles.beginButton}
                disabled={isExiting}
                onPress={handleWalk}
              >
                <Text style={styles.beginButtonText}>{t('onboarding.walkButton')}</Text>
              </Pressable>
            </Animated.View>
          </Animated.View>
          <View style={styles.stageSpacer} />
        </View>
      </Pressable>
    );
  } else {
    content = (
      <View
        style={[styles.chooseRoot, { paddingTop: insets.top + spacing[4] }]}
      >
        {/* Was pure black, no glow at all — the one screen in the app
            without AmbientGlow, which read as inconsistent rather than
            deliberate once every other screen had it. Now quiet enough
            (see AmbientGlow's own comment) that it doesn't compete with
            this screen's elegance-through-restraint — just enough warmth
            that the darkness reads as intentional, not empty. */}
        {theme === 'dark' && <AmbientGlow />}
        {/* A short fade rather than popping in instantly on mount — pairs
            with the ring's own entering fade (see PhilosopherPicker) so the
            whole handoff from the held circle reads as one continuous
            settling motion instead of everything snapping in at once. */}
        <Animated.Text
          entering={FadeIn.duration(500).delay(120).easing(SOFT_EASE)}
          style={styles.chooseTitle}
        >
          {t('you.chooseWhoWalksBesideYou')}
        </Animated.Text>
        <View
          style={[
            styles.chooseBody,
            {
              // columnWidth alone is the full device width (capped at
              // READING_COLUMN_MAX_WIDTH) with no side margin — the
              // confirm button inside PhilosopherPicker is width: '100%'
              // of this container, so it touched the screen edges exactly
              // (same root cause as onboarding's own "walk" button, fixed
              // the same way: subtract real side margin here).
              width: columnWidth - spacing[6] * 2,
              alignSelf: 'center',
              paddingBottom: spacing[10] + insets.bottom,
            },
          ]}
        >
          <PhilosopherPicker
            onSelect={handleSelect}
            onRingLayout={setPickerRingRect}
            hideOwnRing={travelActive && !handoffStarted}
          />
        </View>
      </View>
    );
  }

  // The literal ring-to-ring morph: one Circle, positioned in raw window
  // coordinates (not nested in either branch's local coordinate space,
  // since it has to be able to sit on top of BOTH), that lerps from
  // introRingRect to pickerRingRect over RING_TRAVEL_DURATION once both are
  // known (see the effect above). Rendered as a trailing sibling of
  // `content` so it survives the step change that unmounts/mounts content
  // itself — that's what makes this a real single traveling element rather
  // than two same-sized rings faded across a cut.
  const travelRingStyle = useAnimatedStyle(() => {
    // Renders at the INTRO position the instant that's known, even before
    // pickerRingRect arrives — on native, PhilosopherPicker's onLayout +
    // measureInWindow callback can take noticeably longer to resolve than
    // on web, and this overlay used to sit at opacity:0 for that whole
    // window (it only drew once BOTH rects existed). Since the V-arc ring
    // it replaces disappears the instant content swaps to "choose" (at
    // EXIT_DURATION + RING_HOLD_DURATION), that gap was a real dead frame
    // where no ring was visible at all — "the ring disappears, then the
    // picker's ring appears separately" is exactly that gap. Falling back
    // to introRingRect alone means there's always a ring on screen from the
    // moment the intro's one closes to the moment the picker's one takes
    // over — the interpolation below only engages once pickerRingRect is
    // also known, using introRingRect as both ends until then (t is inert).
    if (!introRingRect) return { opacity: 0 };
    const target = pickerRingRect ?? introRingRect;
    const t = travelProgress.value;
    const x = introRingRect.x + (target.x - introRingRect.x) * t;
    const y = introRingRect.y + (target.y - introRingRect.y) * t;
    const width =
      introRingRect.width + (target.width - introRingRect.width) * t;
    const height =
      introRingRect.height + (target.height - introRingRect.height) * t;
    return {
      opacity: travelOpacity.value,
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
    };
  });

  return (
    <>
      {content}
      {travelActive && (
        <Animated.View style={travelRingStyle} pointerEvents="none">
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 160 160"
            style={StyleSheet.absoluteFill}
          >
            {/* r/stroke matched exactly to PhilosopherPicker's own ring
                (RING_RADIUS=80, colors.bg.border) — this ring hands off to
                that one the instant they coincide (see travelOpacity/
                hideOwnRing), so any difference in radius or color reads as
                a visible snap right at the handoff, not a clean "same ring"
                continuation. */}
            <SvgCircle
              cx={80}
              cy={80}
              r={80}
              fill="none"
              stroke={colors.bg.border}
              strokeWidth={1}
            />
          </Svg>
        </Animated.View>
      )}
    </>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  introRoot: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  figureImage: {
    width: "100%",
    height: "100%",
  },
  dot: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: AURA_NEUTRAL_COLOR,
  },
  coreRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "#fff9ef",
    backgroundColor: "transparent",
  },
  coreFlash: {
    position: "absolute",
    backgroundColor: "#fff9ef",
  },
  // Centered as ONE group — figure, text, and button share a single small
  // gap (close to the gap between the text lines themselves) rather than
  // each getting its own large pocket of space. Proximity is what makes
  // them read as one composition instead of three separate blocks sharing
  // a screen; the leftover space becomes a balanced frame around the whole
  // group instead of a divider fragmenting it.
  // justifyContent was "center" — on a screen short enough that this
  // composition's full height (figure + payoff text + button) exceeds
  // stage's available space, centering pushes the excess up past stage's
  // OWN top edge (RN doesn't clip overflow by default), carrying "why?"/
  // "что" — the topmost element, already sitting on a small negative offset
  // of its own — up through the wordmark's row and off-screen entirely.
  // flex-start with a spacer above (styles.stageSpacer, flexGrow so it still
  // centers when there IS room) reproduces the same centered look on any
  // screen tall enough to fit the content, but can never push content above
  // stage's top on a screen that isn't.
  stage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    gap: spacing[5],
    paddingHorizontal: spacing[6],
  },
  stageSpacer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  // Android's 3-button gesture nav bar isn't inset-aware the way iOS's home
  // indicator is — without this, "walk" sat flush against (or under) it on
  // devices with that nav style (confirmed on a Samsung device). insets.bottom
  // is 0 on devices using full-screen gesture nav, so this is a no-op there.
  // The app's identity, confirmed once at the very top before anything
  // else — not a kicker introducing the tagline below it.
  wordmark: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: "uppercase",
    textAlign: "center",
  },
  // Crowns the head, full width — short enough to never need the risky
  // narrow-column treatment "Know what you feel" gets below.
  aboveHead: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
    textAlign: "center",
  },
  aboveHeadPosition: {
    position: "absolute",
    // Clamped to 0, not POSITION.why.y directly — on a short screen, stage's
    // centered composition can end up close enough to the wordmark above it
    // that a negative offset here escapes past figureComposition's own top
    // edge and renders above "SELFINDER" itself (confirmed by shrinking the
    // viewport height: "что" scrolled up past the logo with nothing to stop
    // it, since this was the only thing standing between the label and the
    // wordmark). Flush with the top edge is the correct floor regardless of
    // language/string width — this isn't specific to the Russian "что".
    top: Math.max(0, POSITION.why.y),
    left: 0,
    right: 0,
    transform: [{ translateX: POSITION.why.x }],
  },
  // Groups "Why.", the connecting line, and the figure into one relative
  // coordinate space (in that paint order, so the figure occludes the
  // line's middle stretch) — figureWrap's marginTop reserves WHY_SPACE at
  // the top for the absolutely-positioned "Why." and line to sit in.
  figureComposition: {
    width: "100%",
    alignItems: "center",
  },
  // The exit-fade wrapper around the figure + flank words — full width so
  // figureWrap's own 100% keeps meaning the composition's width, not a
  // shrunk-to-content box.
  figureFade: {
    width: "100%",
    alignItems: "center",
  },
  connectLineWrap: {
    position: "absolute",
    top: 0,
    width: LINE_WIDTH,
    height: FIGURE_COMP_HEIGHT,
    alignSelf: "center",
  },
  // Each of the three line segments gets its own Svg canvas stacked exactly
  // on top of the others (same size, same position), so each can fade in on
  // its own independent delay without needing to share one entering animation.
  lineOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  // Spans the full stage width (not the figure's own narrower box), so
  // the figure can be centered within it while this row's "space-between"
  // pushes each half out into the margin beside the body.
  figureWrap: {
    width: "100%",
    height: FIGURE_METRICS.height,
    alignItems: "center",
  },
  // A centered flex row with a fixed gap sized to the figure's own width
  // (plus a little breathing room) — the pair sits centered as a group,
  // with exactly enough space between them for the body to occupy, rather
  // than each spreading to the screen's edges (space-between) or relying
  // on percentage-plus-margin math that doesn't resolve predictably across
  // platforms.
  chestFlankRow: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: FIGURE_METRICS.width,
  },
  flankText: {
    flexShrink: 0,
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
  flankTextLeft: { textAlign: "right" },
  flankTextRight: { textAlign: "left" },
  payoffWrap: {
    alignItems: "center",
  },
  payoffLineWrap: {
    width: LINE_WIDTH,
    height: PAYOFF_LINE_HEIGHT,
    alignSelf: "center",
  },
  // Full-width and centered within payoffLineWrap (rather than a fixed left
  // offset that grows unconstrained) — "is an experience" is long enough
  // that an unconstrained anchor point ran the text off the screen edge.
  // Deliberately off-center — pushed clearly left of the composition's axis
  // rather than sitting in the uncanny near-center. The asymmetry is the
  // point; don't "fix" it by centering.
  howLabel: {
    position: "absolute",
    top: POSITION.payoff.y,
    left: -62,
    right: 0,
    textAlign: "left",
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.sm * lineHeights.tight,
  },
  // Russian-only override — see the comment where this is applied above.
  // Cancels howLabel's left:-62/textAlign:"left" asymmetric placement and
  // centers "— это опыт" on the composition's own axis instead, so it
  // aligns with the converging lines above it rather than drifting left.
  howLabelCentered: {
    left: 0,
    textAlign: "center",
  },
  // Same warm, thin, quiet register as "why?" / "what" / "you feel" —
  // matching the line-art feel that the rest of the screen has, rather
  // than a bold, saturated block that breaks the mood right at the end.
  introLine3: {
    color: AURA_NEUTRAL_COLOR,
    fontFamily: fonts.light,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[3],
    textAlign: "center",
  },
  // Sits under the payoff at a quieter size and color — information, not
  // exhortation. Left-aligned against the payoff's centered block: the same
  // deliberate off-axis placement "is an experience" uses, so the two read
  // as one compositional choice.
  introPromise: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[4],
    alignSelf: "flex-start",
    textAlign: "center",
  },
  // Now a direct child of `stage` (grouped with the figure and text via the
  // same shared gap) rather than a separately bottom-pinned block — just
  // needs to stretch to full width since its parent centers children by
  // default.
  introFooter: {
    alignSelf: "stretch",
  },
  // An outline, not a filled block — a solid saturated pill reads as a
  // completely different visual language from the thin, glowing lines
  // everywhere else on this screen.
  beginButton: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: "center",
    borderWidth: 1,
    borderColor: AURA_NEUTRAL_COLOR,
    backgroundColor: "transparent",
  },
  beginButtonText: {
    color: AURA_NEUTRAL_COLOR,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
  },
  chooseRoot: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingHorizontal: spacing[6],
  },
  // Same quiet register as the intro's payoff line (which is lg) — the
  // loudest moment of the flow shouldn't be its title, right where the mood
  // is handed over. Weight can't differ (every font key maps to
  // Panchang-Medium — see theme/typography.ts), so the size carries it.
  chooseTitle: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    textAlign: "center",
  },
  chooseBody: {
    flex: 1,
    justifyContent: "center",
  },
  });
}
