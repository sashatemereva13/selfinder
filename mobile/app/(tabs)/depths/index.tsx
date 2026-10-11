import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Platform,
} from "react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useIsFocused, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, {
  Ellipse as SvgEllipse,
  Defs,
  RadialGradient,
  Stop,
  Rect as SvgRect,
} from "react-native-svg";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  useReducedMotion,
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
import { spacing } from "../../../src/theme/spacing";
import { useWideColumnWidth } from "../../../src/theme/responsive";
import { useMeasureStore } from "../../../src/store/measureStore";
import { usePhilosopherStore } from "../../../src/store/philosopherStore";
import {
  getLevelBySlug,
  getLocalizedLevel,
} from "../../../src/content/levelsContent";
import {
  useLevelTextColors,
  getLocalizedLevelName,
} from "../../../src/content/measureConfig";
import { useLocaleStore } from "../../../src/store/localeStore";
import { Sphere } from "../../../src/types";
import { LongPressToSave } from "../../../src/components/shared/LongPressToSave";
import { AmbientGlow } from "../../../src/components/shared/AmbientGlow";
import { SphereAnswer } from "../../../src/components/depths/SphereAnswer";
import { getAnswerQuestion } from "../../../src/content/answerQuestions";
import { useGuideChatStore } from "../../../src/store/guideChatStore";
import { buildReadingContext } from "../../../src/utils/readingContext";
import { HEAVY_STATES } from "../../../src/utils/safety";
import { CrisisLine } from "../../../src/components/shared/CrisisLine";
import { useEngagementStore } from "../../../src/store/engagementStore";
import { getRelativeTimeBucket, formatDate } from "../../../src/utils/relativeTime";
import { PhilosopherObject } from "../../../src/components/shared/PhilosopherObject";
import { PhilosopherEnergy } from "../../../src/components/depths/PhilosopherEnergy";
import {
  buildAuraFieldGeometry,
  RING_ORDER,
  type SphereKey,
} from "../../../src/components/depths/AuraField";
import { AURA_NEUTRAL_COLOR } from "../../../src/components/shared/AuraFigure";
import {
  AURA_LEVEL_IMAGES,
  AURA_NEUTRAL_IMAGE,
  AURA_LEVEL_IMAGES_LIGHT,
  AURA_NEUTRAL_IMAGE_LIGHT,
} from "../../../src/content/auraLevelImages";
import { useAppAccentRgb, useAppAccentTextRgb } from "../../../src/utils/appAccent";
import { formatRelativeDay } from "../../../src/utils/relativeTime";
import { DepthsSpiralCore } from "../../../src/components/depths/DepthsSpiralCore";
import {
  SLOT_ORDER,
  H_CUT,
  H_MAX,
  WHEEL_SIZE,
  TOP_LOOP_TARGET_PX,
  TOP_MARGIN,
  type SpiralSpherePoint,
} from "../../../src/components/depths/depthsSpiralGeometry";
import {
  buildDepthsGeometry,
  BASE_AURA_DISPLAY_SIZE,
  SCREEN_WIDTH,
  BLEED_AMOUNT_PX,
  type DepthsGeometry,
} from "../../../src/components/depths/depthsGeometry";
import { makeStyles } from "../../../src/components/depths/depthsStyles";

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

// A finished Measure returns to the Depths already underneath it
// (dismissTo in interview.tsx) instead of stacking a new copy. The arrival
// reveal reads `justCompleted` when DepthsContent first mounts — so while a
// just-finished reading is on its way back and Depths is still covered,
// this holds a plain dark frame (matching the interview's fade to black)
// in place of the old content; the moment Depths comes into view,
// DepthsContent mounts fresh and plays the arrival as it always has.
export default function DepthsScreen() {
  const justCompleted = useMeasureStore((s) => s.justCompleted);
  const isFocused = useIsFocused();
  const colors = useThemeColors();
  if (justCompleted && !isFocused) {
    return <View style={{ flex: 1, backgroundColor: colors.bg.base }} />;
  }
  return <DepthsContent />;
}

function DepthsContent() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const levelTextColors = useLevelTextColors();
  const theme = useThemeStore((s) => s.theme);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useWideColumnWidth();
  const currentResult = useMeasureStore((s) => s.currentResult);
  const accentRgb = useAppAccentRgb();
  // Text-safe variant — this screen's sphere/point labels and the
  // pre-reading neutral point color are both real Text, not decoration
  // (see spherePoints/neutralSpherePoints below), so they read through
  // useAppAccentTextRgb() instead of the decorative-only accentRgb.
  const accentTextRgb = useAppAccentTextRgb();
  const accentColor = `rgb(${accentTextRgb})`;
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sphereAnswerSeen = useEngagementStore((s) => s.discovered.sphereAnswer);
  // The shape of the path, said once — after the very first reading,
  // until its state's page has been opened (2026-10-09).
  const totalMeasureCount = useEngagementStore((s) => s.totalMeasureCount);
  const levelPageSeenFor = useEngagementStore((s) => s.levelPageSeenFor);
  // "Tap yourself to see the whole reading again" is only needed the
  // first time a sphere's answer is opened — snapshotted, since opening
  // one is what marks it seen.
  const showAnswerBackHint = useRef(!sphereAnswerSeen).current;
  const addReading = useGuideChatStore((s) => s.addReading);
  const addContext = useGuideChatStore((s) => s.addContext);
  const sendToGuide = useGuideChatStore((s) => s.send);
  // When the reflection was said, as a quiet word beside the
  // philosopher's name — "today", "yesterday", then a date.
  const reflectionWhen = (() => {
    if (!currentResult) return "";
    const bucket = getRelativeTimeBucket(currentResult.savedAt);
    if (bucket === "today") return t("depths.whenToday");
    if (bucket === "yesterday") return t("depths.whenYesterday");
    return formatDate(currentResult.savedAt, locale);
  })();
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  // Read synchronously (safe — no store mutation) so the very first paint
  // already starts hidden/scaled-down when arriving; the flag itself is
  // cleared in the effect below, not here, since calling the store's set()
  // during render (inside a useState initializer) trips React's "cannot
  // update a component while rendering a different component" check.
  const [isArriving, setIsArriving] = useState(
    () => useMeasureStore.getState().justCompleted,
  );
  // Same OS-level Reduce Motion signal onboarding's own arrival sequence
  // already reads (see onboarding/index.tsx) — Depths' own ring-grow/
  // color-settle ceremony is a multi-second, non-essential animation of
  // exactly the same kind, and previously had no automatic path past it:
  // only a manual tap-to-skip (skipArrival below), which someone has to
  // already know exists. Initializing skipArrival to true when Reduce
  // Motion is on reuses that same skip machinery instead of adding a
  // second, parallel "instant" code path — the reveal lands directly on
  // its settled state on first render, the same outcome a tap produces.
  const reduceMotion = useReducedMotion();
  // Set true by a tap anywhere on the reveal (or automatically under
  // Reduce Motion, see above) — tells AuraArrival/ArrivalReveal to cancel
  // their in-flight timelines and jump straight to the settled end state,
  // then reset back to false once onSettled fires (see the Pressable
  // wrapping AuraArrival below).
  const [skipArrival, setSkipArrival] = useState(reduceMotion);
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
  // here. Text-safe (levelTextColors/accentTextRgb) — this feeds both the
  // headline's own Text color below and LongPressToSave's decorative
  // accentRgb prop; using the text-safe value everywhere it's read is a
  // small, acceptable trade (a marginally less vivid save-image tint) for
  // never letting the headline reading itself fall below AA contrast.
  const levelRgb = lastLevel
    ? (levelTextColors[lastLevel.slug] ?? accentTextRgb)
    : accentTextRgb;
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
  // given sphere's line is somehow missing. Text-safe (levelTextColors/
  // accentTextRgb) — this feeds both AuraField's own decorative rings AND
  // DepthsSpiralCore's Body/Mind/Heart/Spirit point LABELS (real Text),
  // same small trade as levelRgb above.
  const sphereColors: Record<SphereKey, string> = useMemo(() => {
    const colorFor = (key: SphereKey) => {
      const slug = currentResult?.lines.find((l) => l.key === key)
        ?.vibrationLevel.slug;
      return `rgb(${(slug && levelTextColors[slug]) ?? accentTextRgb})`;
    };
    return {
      spirit: colorFor("spirit"),
      mind: colorFor("mind"),
      heart: colorFor("heart"),
      body: colorFor("body"),
    };
  }, [currentResult, accentTextRgb, levelTextColors]);
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
    markDiscovered("sphereAnswer");
  };
  // "Why did I read as this?" — answered with the person's own words, not
  // an interpretation (2026-10-08, from testing: the natural question after
  // a reading is why, and the level page only answers what). While a
  // sphere is selected, the reflection's place shows that sphere's level
  // and what they actually said for it in Measure — a record of their own
  // answer, which RULES.md allows precisely because it claims nothing.
  const selectedAnswer = selectedSphere
    ? currentResult?.qaPairs?.find((p) => p.sphere === selectedSphere)
    : undefined;
  const answerQuestion =
    philosopher && selectedLine
      ? getAnswerQuestion(philosopher.id, selectedLine.vibrationLevel.slug, locale)
      : null;
  // The person's question about an answer, sent to their philosopher in
  // their own words when they tap it (2026-10-08): the reading joins the
  // conversation first (as it does anywhere else), the answer it's about
  // is added to what the philosopher knows, then the question is sent.
  // The philosopher is told to help them find it, not to answer for them.
  const askAboutAnswer = () => {
    if (!philosopher || !currentResult || !selectedAnswer || !selectedLine || !answerQuestion) return;
    addReading(philosopher.id, {
      savedAt: currentResult.savedAt,
      reflection: currentResult.combinationMessage ?? null,
      context: buildReadingContext(currentResult),
      measureResultId: currentResult.measureResultId,
    });
    addContext(
      philosopher.id,
      `The person is asking about what they said for their ${selectedLine.key} in this reading, which read as ${selectedLine.vibrationLevel.name}. They said: "${selectedAnswer.answer}". Only they can know the answer to their question: don't tell them what they feel or what mattered to them. Help them find it — point back to their own words, and ask.`,
    );
    router.push("/guide");
    sendToGuide(philosopher, answerQuestion);
  };
  const handlePulseSettled = () => {
    setSelectedSphere((s) => (s === pulsingSphere ? null : pulsingSphere));
    setPulsingSphere(null);
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

  const entryFadeStyle = useAnimatedStyle(() => ({ opacity: entryFade.value }));

  // 2026-09-02 — fixedZone (the fixed/scroll split's own never-scrolling
  // zone) can no longer shrink or scroll its own content, unlike the old
  // single ScrollView. Its natural height (kicker + quote + core
  // geometry's own canvas) comfortably fits taller phones,
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
  // Room kept below the fixed zone. 0 since 2026-10-09: the message star
  // lives in the aura's own field now and the reading sits directly on
  // the minimap. (Was 190 while the philosopher's seam lived here, then 80.)
  const MIN_SCROLL_ZONE_HEIGHT = 0;
  // 2026-10-09 — the composition also GROWS to fill a screen taller than
  // it, instead of leaving empty space above it. Only the canvas grows
  // (the safe-area padding and text don't scale with it), so the growth is
  // the spare height divided by the canvas's own height, capped so the
  // figure never gets more than this much bigger than it was tuned at.
  const MAX_GROW = 1.2;
  const GROW_MARGIN_PX = 8;
  // Natural (scale-1) geometry — always built, used both for the first
  // measurement pass and as the render output whenever no shrink is
  // needed (the common case: taller phones never touch the branch
  // below).
  const naturalGeometry = useMemo(
    () => buildDepthsGeometry(BASE_AURA_DISPLAY_SIZE),
    [],
  );
  const spareHeight = rootHeight - MIN_SCROLL_ZONE_HEIGHT - naturalContentHeight;
  const fixedZoneScale =
    rootHeight > 0 && naturalContentHeight > 0
      ? spareHeight < 0
        ? (rootHeight - MIN_SCROLL_ZONE_HEIGHT) / naturalContentHeight
        : Math.min(
            MAX_GROW,
            1 + Math.max(0, spareHeight - GROW_MARGIN_PX) / naturalGeometry.core.totalHeight,
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
    // Grown counts too — a scaled render must never be re-measured as
    // the natural height, in either direction.
    if (fixedZoneScale !== 1) hasShrunkRef.current = true;
  }, [fixedZoneScale]);
  // Only recompute a second, scaled geometry object once a real shrink is
  // actually needed — on every taller device this just returns
  // naturalGeometry again (fixedZoneScale === 1), so there's no
  // second object identity churn on the common path.
  const geometry = useMemo(
    () =>
      fixedZoneScale !== 1
        ? buildDepthsGeometry(BASE_AURA_DISPLAY_SIZE * fixedZoneScale)
        : naturalGeometry,
    [fixedZoneScale, naturalGeometry],
  );
  const CORE_GEOMETRY = geometry.core;
  const AURA_METRICS = geometry.auraMetrics;
  const SPIRAL_AURA_HALF_WIDTH = geometry.spiralAuraHalfWidth;
  const SPIRAL_AURA_HALF_HEIGHT = geometry.spiralAuraHalfHeight;
  // (The message star that sat in the aura's field moved to Explore on
  // 2026-10-09 — Today has one job: where you are, and the chain from it.)
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
          content — a real, current need, not a leftover.
          2026-09-12 — briefly tried swapping this order (scrollZone on
          top, fixedZone/the aura pinned to the bottom) at the user's own
          request, reverted the same session: with the action menu on
          top, the curve visibly broke continuity around "Shift it"/the
          header (DepthsSpiralMenu's own curve still climbs AWAY from its
          seam point in the same direction as before, which reads as
          doubling back once it's above fixedZone on screen instead of
          below it — see depthsSpiralGeometry.ts's own seam-continuity
          math, never re-derived for the swap), and the screen's own
          title (DEPTHS/kicker) ended up buried mid-page instead of at
          the top. Confirmed via on-device screenshot, then reverted —
          the user preferred the wheel/aura visible immediately at the
          top, which this original order already does. */}
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
          {/* The "DEPTHS" kicker was removed 2026-10-08 — the minimap
              below already says where you are. */}
          {/* The standing orientation line ("What's happening inside you
            right now.") was removed 2026-08-30 — the goal now is for the
            screen itself (the spiral, the aura, the sphere points) to
            communicate what this place is without needing words to
            explain it; see the same reasoning applied to Journeys'
            products.intro/products.groupPresentDescription below. */}


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
                      isAggregateReading={!selectedSphere}
                      onWheelLevelPress={
                        wheelLevelSlug
                          ? () => goToLevel(wheelLevelSlug)
                          : undefined
                      }
                    />
                  </View>
                  {/* Once settled, tapping the aura figure itself clears a
                      selected sphere — the way back from "one sphere's own
                      reading" to "the whole reading," the same body the
                      four spiral dots narrow FROM. No-op, and no hit
                      target at all (pointerEvents "none" below), once
                      nothing is selected — this never competes with taps
                      meant for the spiral dots layered above it, and there
                      is nothing to clear when the wheel is already showing
                      the aggregate. The aggregate state itself already
                      reads visually: AnimatedAuraField's own emphasis
                      logic holds all four rings at full brightness when
                      selectedSphere is null (see its own comment), only
                      dimming the other three once one is tapped — the
                      "whole vs. one part" distinction was already carried
                      by the rings, this just adds a real way back. */}
                  <Pressable
                    style={styles.arrivalSkipWrap}
                    pointerEvents={
                      isArriving ? "auto" : selectedSphere ? "auto" : "none"
                    }
                    onPress={() => {
                      if (isArriving) {
                        setSkipArrival(true);
                      } else if (selectedSphere) {
                        setSelectedSphere(null);
                      }
                    }}
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
                      glowColor={levelColor}
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
                  comment). 2026-09-12: column widened twice in the same
                  session (45%→58%, then 58%→68%) and numberOfLines
                  through 4→7→9→8, all confirmed via direct DOM
                  measurement (element.scrollHeight vs clientHeight), not
                  guessed. First pass (45%→58%, 4→7 lines) fixed a real
                  truncation bug (a 30-word combinationMessage — the AI
                  prompt's own cap, see requestCombinationMessage,
                  backend/controllers/chatController.js — clipping
                  against the old 4-line cap). Second pass: bumping
                  title's own fontSize 11→14px (styles.title, see its own
                  comment — fixed a real size-hierarchy inversion, the
                  quote was tied for the SMALLEST text on the whole
                  screen) meant the same 30-word sentence needed 9 lines
                  at 58% width — which visually collided with the "Mind"
                  sphere label below it (confirmed via measuring both
                  elements' real screen position: only ~181px/8.35 lines
                  are actually clear above Mind). Fixed by widening the
                  column further to 68% (same sentence now fits in 7
                  lines at the new size) rather than shrinking the font
                  back down. numberOfLines set to 8, not 7, as a small
                  margin above the measured worst case. The wheel itself
                  is untouched by any of this (deliberately kept exactly
                  as big as it was — it's this app's main concept), since
                  the reclaimed width both times came from space the
                  wheel's own bleed never occupied in the first place —
                  reverify this is still true (screenshot-check the wheel
                  edge) if the column is ever widened again. */}
                <View style={styles.quoteBubbleWrap} pointerEvents="box-none">
                  {/* 2026-10-08 — who said it, and when. With the seam gone
                      nothing else on Depths names the philosopher, and a
                      reflection can be days old; only shown when it really
                      is their reflection (not the level's own description,
                      the fallback when none was generated). */}
                  {selectedAnswer && selectedSphere && selectedLine ? (
                    // One sphere selected: only what was said for it, the
                    // words its reading was based on lit, and the
                    // philosopher's one question (see SphereAnswer).
                    <SphereAnswer
                      answer={selectedAnswer.answer}
                      evidence={selectedLine.evidence}
                      color={sphereColors[selectedSphere]}
                      philosopherId={philosopher?.id}
                      philosopherRgb={accentTextRgb}
                      question={answerQuestion}
                      showBackHint={showAnswerBackHint}
                      backHint={t("depths.backToWholeReading")}
                      askLabel={t("depths.askPhilosopher", { name: philosopher?.name ?? "" })}
                      onAsk={askAboutAnswer}
                    />
                  ) : (
                  <>
                  {currentResult?.combinationMessage && philosopher && (
                    <View style={styles.reflectionByline}>
                      <PhilosopherObject id={philosopher.id} rgb={accentRgb} size={14} />
                      <Text style={[styles.reflectionName, { color: levelColor }]}>
                        {philosopher.name}
                      </Text>
                      <Text style={styles.reflectionWhen}>
                        {reflectionWhen}
                      </Text>
                    </View>
                  )}
                  {headlineMessage ? (
                    <LongPressToSave
                      message={headlineMessage}
                      accentRgb={levelRgb}
                    >
                      <Text
                        numberOfLines={10}
                        style={[styles.title, { color: levelColor }]}
                      >
                        {headlineMessage}
                      </Text>
                    </LongPressToSave>
                  ) : (
                    <Text
                      numberOfLines={10}
                      style={[styles.title, { color: levelColor }]}
                    >
                      {headlineMessage}
                    </Text>
                  )}
                  {totalMeasureCount <= 1 &&
                    !!currentResult &&
                    levelPageSeenFor !== currentResult.savedAt && (
                      <Text style={styles.pathOnce}>{t("depths.pathOnce")}</Text>
                    )}
                  {/* A reading in a heavy state carries the quiet line to
                      help, whatever was said (crisis safety net,
                      2026-10-10) — today's reading only. */}
                  {currentResult &&
                    HEAVY_STATES.includes(currentResult.vibrationLevel.slug) &&
                    getRelativeTimeBucket(currentResult.savedAt) === "today" && (
                      <CrisisLine kind="heavy" style={{ marginTop: spacing[3] }} />
                    )}
                  {/* Invites the "why" until it's been found once. */}
                  {!sphereAnswerSeen && !!currentResult?.qaPairs?.length && (
                    <Text style={styles.answerHint}>{t("depths.tapSphereHint")}</Text>
                  )}
                  </>
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
            </>
          )}
        </View>
      </View>

      {/* 2026-10-08 — Depths is only about where you are now. The space
          below the reading held the scrolling action menu, then the
          philosopher's seam; both moved out — every destination is on the
          map, and the philosopher's one step now sits on the minimap's
          handle (see MapBar). */}
      <View
        style={[
          styles.lowerZone,
          { width: columnWidth, alignSelf: "center" },
        ]}
        pointerEvents="box-none"
      />

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
  glowColor,
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
  // The reading's own one accent color (same value driving the headline
  // and rings) — see AuraGlow below for why this needed to be threaded in
  // rather than recomputed locally.
  glowColor: string;
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
      {/* 2026-09-12, at the user's own request — a first-time viewer's eye
          wasn't landing on the aura first (the wheel's size and the
          quote's saturated color were winning that contest instead, see
          this session's own discussion). Rather than shrinking either of
          those (the wheel is this app's main concept and must stay big;
          the quote was just widened to stop truncating), this gives the
          aura itself a real contrast advantage: a soft radial glow in
          the reading's own color, centered behind it, so it's the
          brightest thing on the canvas purely by luminance — no layout
          change. Depths' aura is a pre-rendered PNG (AuraWithDots), not
          the live AuraFigure SVG used elsewhere in the app, so its own
          baked-in rim can't be tuned here — this is a separate glow
          layer behind it instead, same RadialGradient technique
          AmbientGlow already uses for the page-level glow, just tighter
          and centered on the aura specifically rather than the whole
          screen. */}
      <AuraGlow color={glowColor} />
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

// A tight radial glow centered on the aura's own chest, one solid color
// (the reading's own accent — same value the headline/rings already use,
// never a second competing hue) fading to transparent. Purely decorative
// (pointerEvents 'none'), sits behind AnimatedAuraField in paint order so
// the rings/aura render on top of it, not the other way around.
function AuraGlow({ color }: { color: string }) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          {/* Fully transparent by 0.62 of the radius: centred at 62%
              down, the box's bottom edge is only 38% away (0.69 of r),
              and the glow used to still be visible there — a hard edge
              under the feet and a faint box around the body
              (2026-10-09). */}
          <RadialGradient id="auraFocusGlow" cx="50%" cy="62%" r="55%">
            <Stop offset="0" stopColor={color} stopOpacity={0.22} />
            <Stop offset="0.32" stopColor={color} stopOpacity={0.08} />
            <Stop offset="0.62" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <SvgRect width="100%" height="100%" fill="url(#auraFocusGlow)" />
      </Svg>
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

