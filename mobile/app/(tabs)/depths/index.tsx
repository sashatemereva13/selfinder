import { View, Text, Pressable, ScrollView, StyleSheet, Image, Platform } from 'react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Ellipse as SvgEllipse } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
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
} from 'react-native-reanimated';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../src/store/themeStore';
import { hexToRgba, type Colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { useWideColumnWidth } from '../../../src/theme/responsive';
import { useMeasureStore } from '../../../src/store/measureStore';
import { useIsSubscribed } from '../../../src/utils/useIsSubscribed';
import { useAuthStore } from '../../../src/store/authStore';
import { getMe, getMeasureHistory } from '../../../src/api/user';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import {
  useEngagementStore,
  DiscoverableFeature,
  BreadcrumbTool,
  isToolVisitedToday,
} from '../../../src/store/engagementStore';
import { getLevelBySlug, getLocalizedLevel } from '../../../src/content/levelsContent';
import { useLevelColors, getLocalizedLevelName } from '../../../src/content/measureConfig';
import { useLocaleStore } from '../../../src/store/localeStore';
import { Sphere } from '../../../src/types';
import { SaveMessageAction } from '../../../src/components/SaveMessageAction';
import { AmbientGlow } from '../../../src/components/AmbientGlow';
import {
  buildAuraFieldGeometry,
  RING_ORDER,
  type SphereKey,
} from '../../../src/components/AuraField';
import {
  getAuraFigureMetrics,
  AURA_NEUTRAL_COLOR,
} from '../../../src/components/AuraFigure';
import {
  AURA_LEVEL_IMAGES,
  AURA_NEUTRAL_IMAGE,
  AURA_LEVEL_IMAGES_LIGHT,
  AURA_NEUTRAL_IMAGE_LIGHT,
} from '../../../src/content/auraLevelImages';
import { useAppAccentRgb } from '../../../src/utils/appAccent';
import { track } from '../../../src/utils/analytics';
import { formatRelativeDay } from '../../../src/utils/relativeTime';
import { DepthsSpiral, PREFIX_WALK_KEYS, type SpiralPoint, type SpiralSlotKey } from '../../../src/components/DepthsSpiral';

// Pre-baked assets, not the live AuraFigure component — react-native-svg's
// filter engine doesn't reproduce the same result on-device, leaving the
// body visibly tinted (see auraLevelImages.ts).
const AURA_DISPLAY_SIZE = 130;
const AURA_METRICS = getAuraFigureMetrics(AURA_DISPLAY_SIZE);
// AuraField's own rings render absolutely-positioned (pulled out of normal
// layout flow, so they can center on the aura's chest rather than its
// geometric center — see AuraField's own chestNudge comment), which means
// ringWrap has nothing left in normal flow to size itself against except
// the aura image alone — smaller than the full ring set. Without an
// explicit height here, ringWrap collapsed to the aura's own size and
// everything below it (the level name, the sphere buttons) started
// overlapping the rings' own lower half instead of clearing them.
const AURA_FIELD_GEOMETRY = buildAuraFieldGeometry(AURA_DISPLAY_SIZE);
// The composition's own canvas — width fills a real 390px phone's content
// budget (columnWidth minus horizontal padding) the same way the old flat
// spiral did, so the shape itself reads as a real, spacious presence
// rather than a small diagram. Height is now taller than width (the cone
// rises above the aura's ground plane) — allowed to scroll naturally
// within Depths' own ScrollView rather than being compressed to fit one
// screen. Point labels are allowed to extend slightly past this box
// (React Native doesn't clip children unless told to) — auraSpiralWrap
// has no overflow:hidden, so a label near the canvas edge isn't cut off.
const SPIRAL_WIDTH = 342;
const SPIRAL_TOTAL_HEIGHT = SPIRAL_WIDTH * 1.8;
// The spiral's inner clearance (and now also the cone's own base-ellipse
// dimensions — see DepthsSpiral.tsx) is an ELLIPSE, not a circle,
// matching AuraField's real footprint (its four concentric sphere-rings,
// which only render once a reading exists — the larger, safer case to
// clear; the plain neutral aura alone is smaller). A flat margin on top
// so the spiral's own base winding sits visibly outside the body/rings,
// not flush against their edge. See DepthsSpiral.tsx's ellipticalClearance
// for why an ellipse: the aura figure is tall and narrow, so a single
// scalar radius was either too tight sideways or too loose vertically.
const AURA_CLEARANCE_MARGIN = 6;
const SPIRAL_AURA_HALF_WIDTH = AURA_FIELD_GEOMETRY.svgWidth / 2 + AURA_CLEARANCE_MARGIN;
const SPIRAL_AURA_HALF_HEIGHT = AURA_FIELD_GEOMETRY.svgHeight / 2 + AURA_CLEARANCE_MARGIN;
// The single shared coordinate system both the spiral's own base ellipse
// and the aura's positioning read from — replaces two independently
// flex-centered boxes (the old auraSpiralWrap fixed square + a separately
// centered ringWrap) that only visually coincided because both centered
// the same way. groundY sits near the bottom of the tall canvas, leaving
// riseHeight worth of room above it for the cone to climb through.
const DEPTHS_COMPOSITION_GEOMETRY = {
  width: SPIRAL_WIDTH,
  totalHeight: SPIRAL_TOTAL_HEIGHT,
  groundY: SPIRAL_TOTAL_HEIGHT - SPIRAL_AURA_HALF_HEIGHT - spacing[8],
};

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
const ALL_RINGS_GROWN_MS = (RING_COUNT - 1) * RING_GROW_STAGGER_MS + RING_GROW_DURATION_MS;
const COLOR_START_MS = ALL_RINGS_GROWN_MS + ANTICIPATION_DURATION_MS;
const LAST_RING_COLOR_SETTLED_MS = COLOR_START_MS + (RING_COUNT - 1) * RING_COLOR_STAGGER_MS + RING_COLOR_DURATION_MS;
const CONTENT_DELAY_MS = Math.max(LAST_RING_COLOR_SETTLED_MS, COLOR_START_MS + COLOR_SETTLE_DURATION_MS);

// Order for the four sphere buttons under the ring — mind first, then
// spirit, heart, body.
const SPHERE_DISPLAY_ORDER: Sphere[] = ['mind', 'spirit', 'heart', 'body'];

// Never Spill here, deliberately — it already has its two dedicated homes
// (the fork on Measure's entry screen, and Guide's rare invitation); adding
// a third, generic "try this" nudge for it would undercut exactly the
// positioning fix that gave it those two instead. Priority order matters:
// understanding what a level means is more foundational than a regulation
// tool, so it's offered first.
const DISCOVERY_NUDGES: { feature: DiscoverableFeature; labelKey: string; route: Href }[] = [
  { feature: 'levels', labelKey: 'depths.nudgeLevels', route: '/(tabs)/depths/levels' },
  { feature: 'tuneIn', labelKey: 'depths.nudgeTuneIn', route: '/(tabs)/depths/tunein' },
  { feature: 'breathing', labelKey: 'depths.nudgeBreathing', route: '/(tabs)/depths/breathing' },
];

type Tool = { key: string; labelKey: string; descriptionKey: string; route: Href };

// Depths' journey is now drawn as a spiral (see DepthsSpiral.tsx) rather
// than a vertical list of zone groups — this maps each of the spiral's 8
// fixed slots to its own route/copy keys. Order matches
// DepthsSpiral.tsx's own SLOT_ORDER exactly (measure → spill →
// talkAboutIt → cards → yourArc → levels → tunein → breathing); keep the
// two in sync if a slot is ever added or reordered.
const SLOT_META: Record<SpiralSlotKey, { labelKey: string; descriptionKey: string; route: Href }> = {
  measure: { labelKey: 'depths.measureLabel', descriptionKey: 'depths.measureDescription', route: '/(tabs)/depths/measure' },
  spill: { labelKey: 'depths.spillLabel', descriptionKey: 'depths.spillDescription', route: '/(tabs)/depths/spill' },
  talkAboutIt: { labelKey: 'depths.talkAboutIt', descriptionKey: 'depths.continueConversationWith', route: '/(tabs)/guide' },
  cards: { labelKey: 'depths.cardsLabel', descriptionKey: 'depths.cardsDescription', route: '/(tabs)/depths/cards' },
  yourArc: { labelKey: 'depths.yourArc', descriptionKey: 'depths.yourArcDescription', route: '/your-arc' },
  levels: { labelKey: 'depths.levelsLabel', descriptionKey: 'depths.levelsDescription', route: '/(tabs)/depths/levels' },
  tunein: { labelKey: 'depths.tuneInLabel', descriptionKey: 'depths.tuneInDescription', route: '/(tabs)/depths/tunein' },
  breathing: { labelKey: 'depths.breathingLabel', descriptionKey: 'depths.breathingDescription', route: '/(tabs)/depths/breathing' },
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
  key: 'feeling-lucky',
  labelKey: 'depths.feelingLuckyLabel',
  descriptionKey: 'depths.feelingLuckyDescription',
  route: '/(tabs)/depths/feeling-lucky',
};

export default function DepthsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useWideColumnWidth();
  const currentResult = useMeasureStore((s) => s.currentResult);
  const readingLog = useMeasureStore((s) => s.readingLog);
  const isSubscribed = useIsSubscribed();
  const session = useAuthStore((s) => s.session);
  // The local readingLog is per-device (SecureStore) — a signed-in,
  // consented account can have real server-side history the "Your arc"
  // row's visibility shouldn't miss just because this particular device
  // hasn't locally taken 2+ Measures yet (a fresh install, a second
  // device, storage cleared). Best-effort, mirrors the same
  // session+consent-check pattern your-arc.tsx already uses — never
  // blocks the row from working via the local count if this fails.
  const [serverReadingCount, setServerReadingCount] = useState(0);
  useEffect(() => {
    if (!session) {
      setServerReadingCount(0);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (cancelled || !profile.consent?.psychologicalData?.given) return;
        const history = await getMeasureHistory(session.token);
        if (!cancelled) setServerReadingCount(history.length);
      } catch {
        // Best-effort — the local readingLog count still works without this.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);
  const hasEnoughReadingsForArc = Math.max(readingLog.length, serverReadingCount) >= 2;
  const totalMeasureCount = useEngagementStore((s) => s.totalMeasureCount);
  const discovered = useEngagementStore((s) => s.discovered);
  const toolLastVisitedAt = useEngagementStore((s) => s.toolLastVisitedAt);
  const markToolVisited = useEngagementStore((s) => s.markToolVisited);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);
  const hasShownFirstRunCarry = useEngagementStore((s) => s.hasShownFirstRunCarry);
  const markFirstRunCarryShown = useEngagementStore((s) => s.markFirstRunCarryShown);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const setPendingMeasureResultId = useGuideChatStore((s) => s.setPendingMeasureResultId);
  const [showConversation, setShowConversation] = useState(false);
  // Read synchronously (safe — no store mutation) so the very first paint
  // already starts hidden/scaled-down when arriving; the flag itself is
  // cleared in the effect below, not here, since calling the store's set()
  // during render (inside a useState initializer) trips React's "cannot
  // update a component while rendering a different component" check.
  const [isArriving, setIsArriving] = useState(() => useMeasureStore.getState().justCompleted);
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
  // The spiral's own once-only first-run "look here next" emphasis (a
  // marker traveling aura → Levels, see DepthsSpiral.tsx) is driven by
  // showFirstRunCarry directly as a prop — no local shared value needed
  // here, unlike the old understandBloomScale this replaced.
  const [firstRunTravelDone, setFirstRunTravelDone] = useState(false);
  useEffect(() => {
    if (isArriving) useMeasureStore.getState().consumeJustCompleted();
    if (entryFade.value > 0) {
      entryFade.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
    }
    // Only ever needs to run once, right after mount — isArriving flipping
    // back to false later (via onSettled) shouldn't re-fire this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Computed once per mount, not re-derived — otherwise calling
  // markFirstRunCarryShown() below would flip hasShownFirstRunCarry
  // mid-session and the snapshot would go stale the instant AuraArrival's
  // onSettled reads it. Mirrors Guide's own secondVisitSnapshotRef
  // exactly (see app/(tabs)/guide/index.tsx) — this is the first use of
  // that pattern in Depths itself. totalMeasureCount === 1 means the
  // Measure that just completed and carried the user here was their
  // very first ever; by a real second completion this is structurally 2
  // (recordMeasure increments it before Depths is ever reached), so this
  // can't accidentally replay — hasShownFirstRunCarry is the second,
  // persisted guard regardless.
  const firstRunCarrySnapshotRef = useRef<boolean | null>(null);
  if (firstRunCarrySnapshotRef.current === null) {
    firstRunCarrySnapshotRef.current = Boolean(
      isArriving && totalMeasureCount === 1 && !hasShownFirstRunCarry
    );
  }
  const showFirstRunCarry = firstRunCarrySnapshotRef.current;
  useEffect(() => {
    if (showFirstRunCarry) markFirstRunCarryShown();
  }, [showFirstRunCarry]);
  // At most one nudge, for the highest-priority thing not yet found — never
  // stacked, never repeated once discovered. Only surfaced for someone who's
  // already established the core habit, not a first-timer still on Measure.
  const discoveryNudge =
    totalMeasureCount >= 2 ? DISCOVERY_NUDGES.find((n) => !discovered[n.feature]) : undefined;
  // The spiral's 8 fixed slots, in DepthsSpiral.tsx's own SLOT_ORDER —
  // presence varies with reading state (spill/talkAboutIt/cards/yourArc
  // only appear once discovered/a reading exists/2+ readings exist), but
  // the slot itself is always reserved (see DepthsSpiral.tsx's own
  // comment on why: unlocking a capability must never reflow the shape).
  // measure/spill/talkAboutIt/cards/yourArc always render at full
  // brightness (alwaysFull: true) — only levels/tunein/breathing
  // participate in the today's-walk dimming/prefix-trace mechanic.
  const spiralPoints: SpiralPoint[] = useMemo(() => {
    const spillPresent = discovered.spill;
    const talkAboutItPresent = Boolean(currentResult && philosopher);
    const cardsPresent = Boolean(currentResult);
    const yourArcPresent = hasEnoughReadingsForArc;
    const measureLabel = currentResult ? t('depths.measureAgain') : t(SLOT_META.measure.labelKey);
    return [
      { key: 'measure', label: measureLabel, isPresent: true, alwaysFull: true, visitedToday: false },
      { key: 'spill', label: t(SLOT_META.spill.labelKey), isPresent: spillPresent, alwaysFull: true, visitedToday: false },
      { key: 'talkAboutIt', label: t(SLOT_META.talkAboutIt.labelKey), isPresent: talkAboutItPresent, alwaysFull: true, visitedToday: false },
      { key: 'cards', label: t(SLOT_META.cards.labelKey), isPresent: cardsPresent, alwaysFull: true, visitedToday: false },
      { key: 'yourArc', label: t(SLOT_META.yourArc.labelKey), isPresent: yourArcPresent, alwaysFull: true, visitedToday: false },
      {
        key: 'levels',
        label: t(SLOT_META.levels.labelKey),
        isPresent: true,
        alwaysFull: false,
        visitedToday: isToolVisitedToday(toolLastVisitedAt, 'levels'),
      },
      {
        key: 'tunein',
        label: t(SLOT_META.tunein.labelKey),
        isPresent: true,
        alwaysFull: false,
        visitedToday: isToolVisitedToday(toolLastVisitedAt, 'tunein'),
      },
      {
        key: 'breathing',
        label: t(SLOT_META.breathing.labelKey),
        isPresent: true,
        alwaysFull: false,
        visitedToday: isToolVisitedToday(toolLastVisitedAt, 'breathing'),
      },
    ];
  }, [discovered.spill, currentResult, philosopher, hasEnoughReadingsForArc, toolLastVisitedAt, t]);

  // Strict prefix count along PREFIX_WALK_KEYS (levels → tunein →
  // breathing) — stops at the first tool not visited today, so an
  // out-of-order visit (e.g. Tune In before Levels) lights up that one
  // tool's own dot (via visitedToday above) without extending the solid
  // trace past the gap. This is the one piece of "today's walk" state
  // DepthsSpiral itself doesn't compute — it only knows how to draw a
  // given prefixCount, not derive one.
  const prefixCount = useMemo(() => {
    let count = 0;
    for (const key of PREFIX_WALK_KEYS) {
      if (isToolVisitedToday(toolLastVisitedAt, key as BreadcrumbTool)) count++;
      else break;
    }
    return count;
  }, [toolLastVisitedAt]);

  const playFirstRunTravel = showFirstRunCarry && !isArriving && !firstRunTravelDone;

  const handleSpiralPointPress = (key: SpiralSlotKey) => {
    if (key === 'talkAboutIt') {
      handleTalkAboutIt();
      return;
    }
    if (key === 'yourArc') {
      router.push(isSubscribed ? '/your-arc' : '/your-arc-preview');
      return;
    }
    if (key === 'levels' || key === 'tunein' || key === 'breathing' || key === 'spill') {
      markToolVisited(key as BreadcrumbTool);
    }
    router.push(SLOT_META[key].route);
  };

  const rawLastLevel = currentResult ? getLevelBySlug(currentResult.vibrationLevel.slug) : undefined;
  const lastLevel = rawLastLevel ? getLocalizedLevel(rawLastLevel, locale) : undefined;
  // ONE accent color for the whole screen — the current level's, same as
  // everywhere else in the app since the per-philosopher/per-axis color
  // system was retired. The four sphere readings below used to each carry
  // their own LEVEL_COLORS hue (four different colors competing in one
  // screen); they're neutral text now, this single color is what's "yours"
  // here.
  const levelRgb = lastLevel ? levelColors[lastLevel.slug] ?? accentRgb : accentRgb;
  const levelColor = `rgb(${levelRgb})`;
  // combinationMessage was also shown again on the old reveal screen — that
  // was the literal duplicate (this is its one home now). The reveal
  // screen's OTHER line, a locally-computed "X reads highest, Y reads
  // lowest" sentence, isn't recreated here either: with the four rows sitting
  // right below in wheel form, restating their relationship in words was
  // just saying aloud what the rows already show — the wheel is the "actions
  // speak louder than words" version of that idea, not a sentence.
  const headlineMessage = lastLevel
    ? currentResult?.combinationMessage ?? lastLevel.personalFrame ?? lastLevel.frame
    : undefined;
  const hasTranscript = Boolean(currentResult?.qaPairs && currentResult.qaPairs.length > 0);

  // Mind first, then top-to-bottom down the figure — mind (head), spirit
  // (aura outer edge), heart (chest), body (torso/legs). Display order only
  // (also used to order the sphere buttons below the ring); currentResult
  // .lines itself stays in the backend's own order since other consumers
  // may depend on it.
  const displayLines = useMemo(
    () =>
      currentResult
        ? [...currentResult.lines].sort(
            (a, b) => SPHERE_DISPLAY_ORDER.indexOf(a.key) - SPHERE_DISPLAY_ORDER.indexOf(b.key),
          )
        : [],
    [currentResult],
  );
  // Depths' aura field (AuraField/AuraArrival) only ever shows THIS
  // reading's four sphere colors — one concentric ring per sphere,
  // colored by that sphere's own LEVEL_COLORS hue — not the shared
  // 17-level map (Levels and a level's own detail page keep the full
  // VibrationSpectrum wheel, unchanged; this is a Depths-specific
  // personalization). Falls back to the level-agnostic accent color if a
  // given sphere's line is somehow missing.
  const sphereColors: Record<SphereKey, string> = useMemo(() => {
    const colorFor = (key: SphereKey) => {
      const slug = currentResult?.lines.find((l) => l.key === key)?.vibrationLevel.slug;
      return `rgb(${(slug && levelColors[slug]) ?? accentRgb})`;
    };
    return {
      spirit: colorFor('spirit'),
      mind: colorFor('mind'),
      heart: colorFor('heart'),
      body: colorFor('body'),
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
    const scoreFor = (key: SphereKey) => currentResult?.lines.find((l) => l.key === key)?.vibrationScore ?? 400;
    return {
      spirit: scoreFor('spirit'),
      mind: scoreFor('mind'),
      heart: scoreFor('heart'),
      body: scoreFor('body'),
    };
  }, [currentResult]);

  // Which sphere's level is shown on the ring — null means the ring shows
  // the overall/combined reading (the default, idle state). Tapping one of
  // the four sphere buttons swaps the ring's marker AND the name text to
  // that sphere's own level; there's only ever one marker on the ring at a
  // time, not the overall reading plus a second highlight.
  const [selectedSphere, setSelectedSphere] = useState<Sphere | null>(null);
  const selectedLine = currentResult?.lines.find((l) => l.key === selectedSphere);
  const ringLevelSlug = selectedLine ? selectedLine.vibrationLevel.slug : currentResult?.vibrationLevel.slug;
  const ringLevel = selectedLine ? selectedLine.vibrationLevel : currentResult?.vibrationLevel;
  const ringLevelName = ringLevel ? getLocalizedLevelName(ringLevel, locale) : undefined;
  // The aura's own image/glow/dots follow whichever level is currently
  // shown on the ring (the sphere you're pointing at, or the overall
  // reading when none is selected) — previously fixed to the overall
  // reading's color regardless of which sphere button was active, which
  // read as broken once the ring itself started responding to selection.
  // levelColor (below) stays the screen's one ACCENT color (headline,
  // Save/Share, the selected button's own text) — a different role that
  // should stay tied to the overall reading, not swap with the ring.
  const ringLevelRgb = ringLevelSlug ? levelColors[ringLevelSlug] ?? accentRgb : accentRgb;
  const ringLevelColor = `rgb(${ringLevelRgb})`;

  const goToLevel = (slug: string) => {
    router.push({ pathname: '/(tabs)/depths/level/[id]', params: { id: slug } });
  };

  const toggleConversation = () => {
    const next = !showConversation;
    setShowConversation(next);
    if (next) track('history_transcript_viewed');
  };

  // Was reveal's own action, keyed to the reading that had just finished;
  // here it just reads off currentResult directly, since that's always the
  // most recent reading regardless of how someone arrived at this screen.
  // Always sends to Guide now, regardless of how many times it's been used —
  // the past-threshold upsell nudge moved to the not-subscribed Your Arc
  // preview screen (see TALK_ABOUT_IT_UPSELL_THRESHOLD's own comment).
  const AXIS_LABEL_KEYS: Record<string, string> = {
    calm: 'common.axisCalm',
    clarity: 'common.axisClarity',
    intensity: 'common.axisIntensity',
    grounding: 'common.axisGrounding',
  };
  const SPHERE_LABEL_KEYS: Record<string, string> = {
    body: 'common.sphereBody',
    mind: 'common.sphereMind',
    heart: 'common.sphereHeart',
    spirit: 'common.sphereSpirit',
  };

  const handleTalkAboutIt = () => {
    if (!philosopher || !currentResult) return;
    track('reveal_talk_about_it');
    recordTalkAboutIt();
    setPendingMeasureResultId(philosopher.id, currentResult.measureResultId);
    sendGuideMessage(
      philosopher,
      t('depths.iJustMeasuredMyself', {
        level: getLocalizedLevelName(currentResult.vibrationLevel, locale).toLowerCase(),
        axis: t(AXIS_LABEL_KEYS[currentResult.dominantAxis] ?? currentResult.dominantAxis),
      }),
    );
    router.push('/(tabs)/guide');
  };

  // Distinct from handleTalkAboutIt above (whole-reading, lives under "Find
  // out where you are") — this one lives right under the ring, only shows
  // once a sphere is selected, and talks about THAT sphere specifically.
  // The visible opening message stays a clean, short line; the actual
  // Measure Q&A for that sphere rides along as invisible system-prompt
  // context (see guideChatStore.send's additionalContext) so the
  // philosopher's first reply can explain what's going on for THIS person,
  // not recite the generic level description — a static description can't
  // know "my heart reads as Anger" means suppressed resentment for one
  // person and something else entirely for another.
  const handleTalkAboutSphere = () => {
    if (!philosopher || !currentResult || !selectedLine) return;
    track('depths_sphere_talk_about_it', { sphere: selectedLine.key });
    recordTalkAboutIt();
    setPendingMeasureResultId(philosopher.id, currentResult.measureResultId);
    const qa = currentResult.qaPairs?.find((p) => p.sphere === selectedLine.key);
    const context = qa
      ? `They just tapped to talk about their ${selectedLine.key} reading, which came out as ${selectedLine.vibrationLevel.name}. When asked "${qa.question}" during their check-in, they answered: "${qa.answer}". Use this to speak to what's actually going on for THEM specifically — do not just describe what ${selectedLine.vibrationLevel.name} means in general, they can already read that on the level's own page. If their answer doesn't give you enough to go on, ask a clarifying question rather than generalizing. If it feels like there's real weight underneath they haven't said yet, you can invite them to Spill it out first, in your own voice.`
      : `They just tapped to talk about their ${selectedLine.key} reading, which came out as ${selectedLine.vibrationLevel.name}. There's no recorded answer for this sphere from their check-in to draw on. Don't just describe what ${selectedLine.vibrationLevel.name} means in general — ask them directly what's going on with their ${selectedLine.key} right now, so you have something real to respond to.`;
    sendGuideMessage(
      philosopher,
      t('depths.mySphereJustReadAs', {
        sphere: t(SPHERE_LABEL_KEYS[selectedLine.key] ?? selectedLine.key),
        level: getLocalizedLevelName(selectedLine.vibrationLevel, locale).toLowerCase(),
      }),
      context,
    );
    router.push('/(tabs)/guide');
  };

  const entryFadeStyle = useAnimatedStyle(() => ({ opacity: entryFade.value }));

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing[4], width: columnWidth, alignSelf: 'center' },
        ]}
      >
        {/* Timestamp sits beside the kicker, not in the content flow below —
            chrome (like a status bar clock), not something the ring's
            symbolic register needs to make room for. It used to be a full
            sentence ("yesterday, you read as love") directly under the
            ring/aura/name block; that dropped back into literal description
            right where the screen had just established a purely symbolic
            one (position, color, the aura itself). The information itself
            (when) still matters — this is where it lives now. */}
        <View style={styles.kickerRow}>
          <Text style={styles.kicker}>{t('depths.kicker')}</Text>
          {currentResult && (
            <Text style={styles.kickerTimestamp}>{formatRelativeDay(currentResult.savedAt)}</Text>
          )}
        </View>

        {currentResult && lastLevel ? (
          <>
            {/* The aura figure lives inside AuraField's four concentric
                rings — one per sphere, sharing the aura's own chest as
                their center, colored by that sphere's own reading (see
                AuraField.tsx). Idle, all four are equally visible; tapping
                a Body/Mind/Heart/Spirit button dims the other three while
                that sphere's own ring (and the aura image itself) stays
                bright — echoing the same "one thing highlighted, rest
                recede" pattern the sphere buttons already use elsewhere
                on this screen. */}
            {/* Tapping anywhere on the reveal while it's still arriving jumps
                every stage straight to its settled state — a way out for
                anyone who doesn't want to sit through the ~5s ritual every
                time, without adding a visible "skip" button that would
                compete with the reveal itself. No-op once settled (the
                Pressable stops intercepting taps via pointerEvents below). */}
            <View style={styles.auraSpiralWrap}>
              <View style={styles.spiralOverlay} pointerEvents="box-none">
                <DepthsSpiral
                  width={DEPTHS_COMPOSITION_GEOMETRY.width}
                  height={DEPTHS_COMPOSITION_GEOMETRY.totalHeight}
                  points={spiralPoints}
                  accentRgb={accentRgb}
                  onPointPress={handleSpiralPointPress}
                  prefixCount={prefixCount}
                  playFirstRunTravel={playFirstRunTravel}
                  onFirstRunTravelSettled={() => setFirstRunTravelDone(true)}
                  auraHalfWidth={SPIRAL_AURA_HALF_WIDTH}
                  auraHalfHeight={SPIRAL_AURA_HALF_HEIGHT}
                />
              </View>
            <Pressable
              style={styles.arrivalSkipWrap}
              pointerEvents={isArriving ? 'auto' : 'none'}
              onPress={() => setSkipArrival(true)}
            >
              <AuraArrival
                arriving={isArriving}
                skip={skipArrival}
                onSettled={() => {
                  setIsArriving(false);
                  setSkipArrival(false);
                  // The spiral's own traveling marker (aura → Levels)
                  // picks up showFirstRunCarry as a prop directly — see
                  // the DepthsSpiral render below — nothing to trigger
                  // here beyond letting arrival settle first.
                }}
                ringOnlySlugs={sphereColors}
                sphereScores={sphereScores}
                selectedSphere={selectedSphere}
                neutralAura={
                  <AuraWithDots source={theme === 'light' ? AURA_NEUTRAL_IMAGE_LIGHT : AURA_NEUTRAL_IMAGE} overlay />
                }
                settledAura={
                  <AuraWithDots
                    source={
                      theme === 'light'
                        ? AURA_LEVEL_IMAGES_LIGHT[ringLevelSlug!] ?? AURA_LEVEL_IMAGES_LIGHT[lastLevel.slug]
                        : AURA_LEVEL_IMAGES[ringLevelSlug!] ?? AURA_LEVEL_IMAGES[lastLevel.slug]
                    }
                    overlay
                  />
                }
              />
            </Pressable>
            </View>

            <ArrivalReveal arriving={isArriving} skip={skipArrival}>
              {/* Tappable — the level's own detail page (what this vibration
                  actually is), same destination the old per-row wheel rows
                  used to link to before they were replaced by this ring. */}
              <Pressable onPress={() => goToLevel(ringLevelSlug!)}>
                <Text style={[styles.ringLevelName, { color: ringLevelColor }]}>{ringLevelName}</Text>
              </Pressable>

              {/* Only once a sphere is selected — right here, not a scroll
                  away, because the impulse to ask about a specific reading
                  (e.g. "why did my heart read as Anger?") happens the moment
                  you see it, not after scrolling past the reflection and
                  Save/Share down to "Find out where you are". Distinct job
                  from that row's "Talk about it": this one is always about
                  THIS sphere specifically, that one is always the whole
                  reading — see handleTalkAboutSphere.
                  Always mounted (not conditionally rendered) with a fixed-
                  height wrapper — toggling opacity instead of mount/unmount
                  means this row's space is reserved whether or not it's
                  showing, so everything below it (the sphere buttons) no
                  longer shifts down the instant a sphere is tapped. */}
              <View style={styles.sphereTalkLinkWrap} pointerEvents={selectedSphere && philosopher ? 'auto' : 'none'}>
                <Pressable onPress={handleTalkAboutSphere}>
                  <Text
                    style={[
                      styles.sphereTalkLink,
                      { color: ringLevelColor, opacity: selectedSphere && philosopher ? 1 : 0 },
                    ]}
                  >
                    {t('depths.talkToAboutIt', { name: philosopher?.name })}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.sphereButtonRow}>
                {displayLines.map((line) => (
                  <Pressable
                    key={line.key}
                    style={styles.sphereButton}
                    onPress={() => setSelectedSphere((s) => (s === line.key ? null : line.key))}
                  >
                    <Text
                      style={[
                        styles.sphereButtonText,
                        selectedSphere === line.key && { color: levelColor },
                      ]}
                    >
                      {t(SPHERE_LABEL_KEYS[line.key] ?? line.label)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ArrivalReveal>

            {/* A reference on the reading itself, not a next step — sits
                right under the aura/sphere-rows block it's the raw material
                for, ahead of the philosopher's reflection on it (title/
                Save-Share below), which is once removed from the reading
                itself. Not down by the tool list where "Talk to X" and
                "Measure again" (things to DO next) live. */}
            {hasTranscript && (
              <View style={styles.conversationSection}>
                <Pressable style={styles.conversationToggle} onPress={toggleConversation}>
                  <Text style={styles.conversationToggleText}>
                    {showConversation ? t('depths.hideConversation') : t('depths.showConversation')}
                  </Text>
                  <Text style={styles.conversationChevron}>{showConversation ? '↑' : '↓'}</Text>
                </Pressable>

                {showConversation && (
                  <View style={styles.conversationDetail}>
                    {currentResult.qaPairs!.map((pair, i) => (
                      <View key={i} style={styles.conversationQA}>
                        <Text style={styles.conversationQuestion}>{pair.question}</Text>
                        <Text style={styles.conversationAnswer}>{pair.answer}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            <Text style={[styles.title, { color: levelColor }]}>{headlineMessage}</Text>

            {headlineMessage && (
              <SaveMessageAction message={headlineMessage} accentRgb={levelRgb} />
            )}
          </>
        ) : (
          <>
            <Text style={styles.lastReadingLabel}>{t('depths.beforeFirstReading')}</Text>
            {/* Same overlay approach as the reading branch above — the
                spiral is absolutely positioned inside a wrapper sized/
                positioned identically to how AuraWithDots itself sits
                (both pinned to DEPTHS_COMPOSITION_GEOMETRY.groundY), so
                both branches' spiral coincides with the aura's own
                center by construction, not by measurement. */}
            <View style={styles.auraSpiralWrap}>
              <View style={styles.spiralOverlay} pointerEvents="box-none">
                <DepthsSpiral
                  width={DEPTHS_COMPOSITION_GEOMETRY.width}
                  height={DEPTHS_COMPOSITION_GEOMETRY.totalHeight}
                  points={spiralPoints}
                  accentRgb={accentRgb}
                  onPointPress={handleSpiralPointPress}
                  prefixCount={prefixCount}
                  playFirstRunTravel={false}
                  auraHalfWidth={SPIRAL_AURA_HALF_WIDTH}
                  auraHalfHeight={SPIRAL_AURA_HALF_HEIGHT}
                />
              </View>
              <View style={styles.groundWrap}>
                <AuraWithDots source={theme === 'light' ? AURA_NEUTRAL_IMAGE_LIGHT : AURA_NEUTRAL_IMAGE} overlay />
              </View>
            </View>
            <Text style={styles.title}>
              {t('depths.firstReadingCopy')}
            </Text>
          </>
        )}

        <View style={styles.sectionDivider} />

        <View style={styles.stack}>
          {discoveryNudge && (
            <Pressable style={styles.discoveryNudge} onPress={() => router.push(discoveryNudge.route)}>
              <Text style={styles.discoveryNudgeText}>{t(discoveryNudge.labelKey)}</Text>
            </Pressable>
          )}

          <View style={styles.luckyWrap}>
            <Text style={styles.luckyDivider}>· · ·</Text>
            <Pressable style={styles.luckyRow} onPress={() => router.push(FEELING_LUCKY.route)}>
              <Text style={styles.luckyLabel}>{t(FEELING_LUCKY.labelKey)}</Text>
              <Text style={styles.luckyDescription}>{t(FEELING_LUCKY.descriptionKey)}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={[colors.bg.base, hexToRgba(colors.bg.base, 0)]}
        style={[styles.topFade, { height: insets.top + spacing[8] }]}
        pointerEvents="none"
      />

      {/* Only opaque when arriving fresh from Measure — see entryFade's
          own comment. Sits above everything (including topFade), covering
          the whole screen on the very first frame, then fades away to
          complete the beat of stillness interview.tsx's own exit fade
          started. */}
      <Animated.View style={[styles.entryFade, entryFadeStyle]} pointerEvents="none" />
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
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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
    heart: growHeart, mind: growMind, body: growBody, spirit: growSpirit,
  };
  const colorValues: Record<SphereKey, SharedValue<number>> = {
    heart: colorHeart, mind: colorMind, body: colorBody, spirit: colorSpirit,
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
          if (Platform.OS !== 'web') runOnJS(fireTickHaptic)();
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
        withTiming(1, { duration: ANTICIPATION_DURATION_MS * 0.6, easing: Easing.in(Easing.quad) }),
        withTiming(0, { duration: ANTICIPATION_DURATION_MS * 0.4, easing: Easing.out(Easing.quad) }),
      ),
    );
    RING_ORDER.forEach((key, i) => {
      const isLast = i === RING_ORDER.length - 1;
      colorValues[key].value = withDelay(
        COLOR_START_MS + i * RING_COLOR_STAGGER_MS,
        withTiming(1, { duration: RING_COLOR_DURATION_MS, easing: SOFT_EASE }, (finished) => {
          if (!finished || Platform.OS === 'web') return;
          // Soft tick as each ring settles into color; a firmer one at
          // the last ring, marking the whole picture as complete.
          runOnJS(isLast ? fireSettleHaptic : fireTickHaptic)();
        }),
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
    doneTimerRef.current = setTimeout(onSettled, CONTENT_DELAY_MS + CONTENT_DURATION_MS * 0.3);
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
    [anticipation, bodyProgress, colorProgress, ...RING_ORDER.map((k) => growValues[k]), ...RING_ORDER.map((k) => colorValues[k])]
      .forEach((v) => cancelAnimation(v));
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
      { scale: (0.5 + bodyProgress.value * 0.5) * (1 - anticipation.value * 0.08) },
      { rotateY: `${(1 - bodyProgress.value) * 100}deg` },
    ],
  }));
  const neutralStyle = useAnimatedStyle(() => ({ opacity: 1 - colorProgress.value }));
  // Neutral and settled images crossfade — the level-colored version fades
  // in exactly as the neutral one fades out.
  const settledStyle = useAnimatedStyle(() => ({ opacity: colorProgress.value }));

  return (
    <View style={styles.ringWrap}>
      <AnimatedAuraField
        size={AURA_DISPLAY_SIZE}
        colors={ringOnlySlugs}
        selectedSphere={selectedSphere}
        growValues={growValues}
        colorValues={colorValues}
      />
      <Animated.View style={[styles.auraArrivalBody, bodyStyle]}>
        <Animated.View style={[styles.auraArrivalLayer, neutralStyle]}>{neutralAura}</Animated.View>
        <Animated.View style={[styles.auraArrivalLayer, settledStyle]}>{settledAura}</Animated.View>
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
        ? withTiming(target, { duration: legDuration, easing: Easing.out(Easing.quad) }, (finished) => {
            if (finished) runOnJS(onDone)();
          })
        : withTiming(target, { duration: legDuration, easing: Easing.inOut(Easing.quad) }),
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
  const { svgWidth, svgHeight, svgCenterX, svgCenterY, chestNudge, ryFor, rxFor } = buildAuraFieldGeometry(size);
  return (
    <Svg
      width={svgWidth}
      height={svgHeight}
      style={{ position: 'absolute', marginTop: chestNudge }}
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
}: {
  source: number;
  overlay?: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.auraWrap, overlay && styles.auraWrapOverlay]} pointerEvents="none">
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

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  // Absolutely fills the same area ringWrap occupies (see ringWrap's own
  // `top` computed from groundY) rather than sizing itself from normal
  // flow — ringWrap is itself absolutely positioned now (the aura sits at
  // the base of a much taller composition, not centered in it), so
  // without this the Pressable's own hit area would collapse to nothing.
  arrivalSkipWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: DEPTHS_COMPOSITION_GEOMETRY.groundY - AURA_FIELD_GEOMETRY.svgHeight / 2,
    height: AURA_FIELD_GEOMETRY.svgHeight,
    alignItems: 'center',
  },
  // Pre-reading branch's own equivalent of arrivalSkipWrap/ringWrap — no
  // AuraArrival/AnimatedAuraField here (nothing to animate in before a
  // first reading exists), just AuraWithDots pinned to the same groundY
  // so both branches' aura lands at the identical point the spiral's own
  // base ellipse is built from.
  groundWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: DEPTHS_COMPOSITION_GEOMETRY.groundY - AURA_FIELD_GEOMETRY.svgHeight / 2,
    height: AURA_FIELD_GEOMETRY.svgHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shared positioning parent for both branches' aura + the spiral
  // overlay — sized to the spiral's own canvas so spiralOverlay (below)
  // can center within it and land on the exact same point the aura
  // itself is centered on, by construction rather than measurement.
  auraSpiralWrap: {
    width: DEPTHS_COMPOSITION_GEOMETRY.width,
    height: DEPTHS_COMPOSITION_GEOMETRY.totalHeight,
    alignSelf: 'center',
    // Gives the topmost point's label (Measure, at the apex) real
    // breathing room from the kicker row above — without this, "Measure
    // again" and its dot crowded right against "today"/the kicker text.
    marginTop: spacing[8],
    // Same reasoning below — the bottom-most content (the level name)
    // previously had only ringLevelName's own small marginTop before it,
    // which read as crowded against the spiral's own lower labels.
    marginBottom: spacing[8],
  },
  // Fills the whole tall wrapper — DepthsSpiral's own width/height match
  // this exactly, so its base ellipse lands at
  // DEPTHS_COMPOSITION_GEOMETRY.groundY by construction, not by measuring
  // this View. No alignItems/justifyContent centering here (unlike the
  // old flat/square version): the cone is NOT vertically centered in this
  // box, it rises from the bottom, so centering would float it wrong.
  spiralOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  entryFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg.base,
  },
  kickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  // Same visual weight as the kicker, opposite corner — chrome, not
  // content, so it reads as a timestamp/status line rather than a sentence
  // competing with the ring's own symbolic register below.
  kickerTimestamp: {
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
  auraWrap: { alignItems: 'center', marginVertical: spacing[8] },
  // Only applied when layered over ringWrap's ring — see AuraWithDots'
  // `overlay` prop. Fills and centers within the nearest positioned
  // ancestor rather than relying on inherited flex centering from
  // whatever wraps it — AuraArrival nests this inside extra Animated.View
  // layers for the arrival animation, none of which set alignItems, so a
  // bare `position: absolute` (no top/left/right/bottom) previously left
  // it pinned to its flex-computed position in an unpositioned ancestor
  // instead of centered, which is what put the aura in the wrong place.
  auraWrapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The animated body wrapper AuraArrival scales/fades/rotates as a whole —
  // fills and centers over the ring the same way auraWrapOverlay does, so
  // its own children (the neutral/settled aura layers) have a positioning
  // context to resolve against.
  auraArrivalBody: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Stacks the settled (level-colored) aura directly on top of the neutral
  // one during arrival, both filling/centering over auraArrivalBody, so
  // crossfading their opacity reads as one figure changing color rather
  // than two figures swapping places.
  auraArrivalLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Deliberately not styled as a heading — this is the philosopher speaking,
  // a reflection to read, not a screen title to scan. Lighter weight and
  // smaller size than a real title (see lastReadingLabel/kicker above it)
  // keeps it quiet and personal rather than declarative — a large bold
  // headline here read as closer to a verdict than a reflection.
  title: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    marginTop: spacing[6],
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
  // Fills its parent (arrivalSkipWrap, or the pre-reading branch's own
  // groundWrap — both already positioned so their own top lands at
  // DEPTHS_COMPOSITION_GEOMETRY.groundY) rather than centering within the
  // FULL tall auraSpiralWrap (the old approach, which would float the
  // aura in the middle of the whole rising-cone composition instead of
  // at its base). Pinning both this and the spiral's own base ellipse to
  // the one shared groundY value (see buildSpiralGeometry's own groundY)
  // unifies them into one coordinate system rather than two
  // independently-centered boxes that only agreed by construction.
  ringWrap: {
    position: 'relative',
    width: '100%',
    height: AURA_FIELD_GEOMETRY.svgHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Shown whether or not a sphere button is selected — the overall
  // reading's name by default, that sphere's own name once tapped — so
  // this line is never blank and the ring's marker always has a name
  // agreeing with it right underneath.
  // Dotted underline, same tap affordance the old per-row wheel rows used
  // for their level names — this is where that link lives now.
  ringLevelName: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing[4],
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
    textDecorationColor: colors.text.muted,
  },
  // Fixed height (not just content-sized) so this row always occupies the
  // same space whether or not selectedSphere is set — see the JSX's own
  // comment for why this stopped the sphere buttons below from shifting
  // down each time a sphere was tapped.
  sphereTalkLinkWrap: {
    height: 20,
    marginTop: spacing[2],
    justifyContent: 'center',
  },
  // Small and quiet on purpose — a next step you can reach for immediately,
  // not a second headline competing with the ring/name above it.
  sphereTalkLink: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  // Four equal buttons, not a card each — same "no bordered box to mean
  // tappable" register as the rest of the app; weight (medium vs light)
  // and the accent color on the selected one carry the affordance instead.
  sphereButtonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[6],
    marginTop: spacing[5],
  },
  sphereButton: { paddingVertical: spacing[2] },
  sphereButtonText: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  conversationSection: {
    gap: spacing[2],
    marginTop: spacing[6],
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
  },
  conversationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  conversationToggleText: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  conversationChevron: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  conversationDetail: { gap: spacing[3] },
  conversationQA: {
    gap: spacing[1],
    padding: spacing[3],
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
  },
  conversationQuestion: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  conversationAnswer: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  // Still used by discoveryNudge/luckyWrap below the spiral.
  stack: {},
  discoveryNudge: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  discoveryNudgeText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  luckyWrap: {
    alignItems: 'center',
    gap: spacing[4],
  },
  luckyDivider: {
    color: colors.text.faint,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.wide,
  },
  luckyRow: {
    alignItems: 'center',
    paddingVertical: spacing[3],
  },
  luckyLabel: {
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
  luckyDescription: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  });
}
