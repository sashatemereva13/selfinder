import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, LayoutAnimation, StyleSheet, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { getLevelBySlug, getLocalizedLevel } from '../../../../src/content/levelsContent';
import { useLevelColors, useLevelTextColors } from '../../../../src/content/measureConfig';
import { getSeamLine } from '../../../../src/content/depthsSeam';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';
import { track } from '../../../../src/utils/analytics';
import { usePhilosopherStep } from '../../../../src/utils/usePhilosopherStep';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { AnimatedNatureSymbol, NatureSymbolId } from '../../../../src/components/depths/NatureSymbol';
import { VibrationSpectrum } from '../../../../src/components/depths/VibrationSpectrum';
import { PhilosopherObject } from '../../../../src/components/shared/PhilosopherObject';
import { AmbientGlow } from '../../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../../src/components/shared/BackLink';
import { CrisisLine } from '../../../../src/components/shared/CrisisLine';
import { HEAVY_STATES } from '../../../../src/utils/safety';

function renderRich(text: string, styles: ReturnType<typeof makeStyles>): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    return match ? (
      <Text key={i} style={styles.bold}>{match[1]}</Text>
    ) : (
      <Text key={i}>{part}</Text>
    );
  });
}

// Big enough to read as a position among all 17 at a glance; the compact
// preset (~40px) read as a speck.
const RING_SIZE = 96;

// Signals were written as label-row fragments ("unbothered by which way
// things go…") — shown large on their own, they read as sentences.
const asSentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// A level's short signal ("Feels like: unbothered by which way things
// go…") and its longer section open the same way on every level — shown
// one under the other, the page said the same thing twice. When the
// section's first word matches the signal's, its first sentence is
// dropped and the rest (what it adds) kept.
const firstWord = (text: string) => text.toLowerCase().match(/[\p{L}']+/u)?.[0] ?? '';
function withoutRepeatedOpening(signal: string | undefined, paragraphs: string[] | undefined) {
  if (!signal || !paragraphs?.length || firstWord(signal) !== firstWord(paragraphs[0])) return paragraphs;
  const rest = paragraphs[0].split(/(?<=[.!?])\s+/).slice(1).join(' ');
  return rest ? [rest, ...paragraphs.slice(1)] : paragraphs.slice(1);
}

// One moment of the page, gathering in as it scrolls into view (fading up
// and settling its last few pixels) rather than the whole article being
// there at once. The first moment is simply present on arrival.
function Moment({
  scrollY,
  viewportH,
  first = false,
  style,
  children,
}: {
  scrollY: SharedValue<number>;
  viewportH: number;
  first?: boolean;
  style?: object;
  children: ReactNode;
}) {
  const top = useSharedValue(0);
  const revealStyle = useAnimatedStyle(() => {
    if (first) return { opacity: 1, transform: [{ translateY: 0 }] };
    const t = Math.min(1, Math.max(0, (scrollY.value + viewportH * 0.88 - top.value) / 160));
    return { opacity: t, transform: [{ translateY: (1 - t) * 16 }] };
  });
  return (
    <Animated.View
      onLayout={(e) => {
        top.value = e.nativeEvent.layout.y;
      }}
      style={[style, revealStyle]}
    >
      {children}
    </Animated.View>
  );
}

// A level's own page — where the philosopher sends someone right after a
// reading, to understand the state they just learned the name of
// (RULES.md, "Shift is the flagship": the one next step after a reading is
// understanding it, made genuinely fun to read). 2026-09-26 — rebuilt from
// a long article into a short sequence of moments, one idea each, the most
// surprising ones (where you'll see this state in the world, what it trips
// on) brought up from the middle of the page:
//
//   1. arrival — (the philosopher, if this is your own reading) its place
//      on the ring, its name, its one-line frame, its nature symbol
//   2. what it feels like
//   3. where you'll see it in the world
//   4. where it trips
//   5. something to try now — ending on the philosopher's step: talk
//   6. quietly, at the end: its neighbours on the ring, the deeper read,
//      and where this comes from
//
// Built from each level's existing fields by position — every level has
// the same four signals (Feels like / Personality / Used in society / …
// / Prone to) and the same five sections (What this feels like / What
// it's for / Try this now / Where people get it wrong / Why here), in both
// languages — so all 17 pages take this shape without new content.
// Replaced: the bare "LEVEL · 400" (RULES.md: never a numeric score next
// to a level name — a position on the ring instead), the filled signals
// box and the coloured left bar ("no cards").
export default function LevelScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const levelColors = useLevelColors();
  const levelTextColors = useLevelTextColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: viewportH } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const locale = useLocaleStore((s) => s.locale);
  const rawLevel = id ? getLevelBySlug(id) : undefined;
  const level = rawLevel ? getLocalizedLevel(rawLevel, locale) : undefined;
  const columnWidth = useReadingColumnWidth();
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const [neighboursOpen, setNeighboursOpen] = useState(false);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  const markLevelPageSeen = useEngagementStore((s) => s.markLevelPageSeen);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const step = usePhilosopherStep();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  useEffect(() => {
    if (level) {
      track('level_detail_viewed', { slug: level.slug });
      markDiscovered('levels');
      // Their own reading's level specifically — lets Depths' philosopher
      // seam move on from "understand your state" once they have.
      if (currentResult && currentResult.vibrationLevel.slug === level.slug) {
        markLevelPageSeen(currentResult.savedAt);
      }
    }
  }, [level?.slug]);

  const toggle = (setter: (fn: (open: boolean) => boolean) => void) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setter((open) => !open);
  };

  if (!level) {
    return (
      <View style={[styles.root, styles.notFoundRoot]}>
        <Text style={styles.notFoundText}>{t('level.notFound')}</Text>
        <BackLink />
      </View>
    );
  }

  const accentRgb = levelColors[level.slug] ?? colors.accent.ivoryRgb;
  const accentColor = `rgb(${accentRgb})`;
  const accentTextRgb = levelTextColors[level.slug] ?? colors.accent.ivoryTextRgb;
  const accentTextColor = `rgb(${accentTextRgb})`;

  const philosopher = step.philosopher;
  const isOwnReading = currentResult?.vibrationLevel.slug === level.slug;
  const signals = level.signals ?? [];
  const sections = level.sections ?? [];
  const feels = signals[0];
  const personality = signals[1];
  const seenIn = signals[2];
  const tripsOn = signals.length > 3 ? signals[signals.length - 1] : undefined;
  const extraSignals = signals.slice(3, -1);
  const [feelsSection, forSection, trySection, wrongSection, whySection] = sections;
  const talkLabel = t('depths.understandItDescription', {
    name: philosopher?.nameInstrumental ?? philosopher?.name ?? '',
  });

  const paragraphs = (list: string[] | undefined) =>
    list?.map((paragraph, i) => (
      <Text key={i} style={styles.paragraph}>{renderRich(paragraph, styles)}</Text>
    ));

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing[4], width: columnWidth, alignSelf: 'center' },
        ]}
      >
        <BackLink style={styles.backRow} />

        {/* 1. Arrival */}
        <Moment scrollY={scrollY} viewportH={viewportH} first style={styles.arrival}>
          {isOwnReading && philosopher && (
            <View style={styles.philosopherIntro}>
              <View style={styles.philosopherRow}>
                <PhilosopherObject id={philosopher.id} rgb={accentRgb} size={16} />
                <Text style={[styles.philosopherName, { color: accentTextColor }]}>{philosopher.name}</Text>
              </View>
              <Text style={styles.philosopherLine}>{getSeamLine(philosopher.id, 'learn', locale)}</Text>
            </View>
          )}

          {/* Where this state sits among all 17 — its position on the ring,
              not a number. Opens the full map of states. */}
          <Pressable
            onPress={() => router.push('/(tabs)/explore/levels')}
            accessibilityRole="button"
            accessibilityLabel={t('level.seeOnTheRing')}
            style={styles.ring}
          >
            <VibrationSpectrum levelSlug={level.slug} size={RING_SIZE} />
          </Pressable>

          <Text style={styles.title}>{level.title}</Text>
          <Text style={styles.frame}>{level.frame}</Text>
          {paragraphs(level.paragraphs)}

          {/* A visual way in for someone who doesn't yet have words for
              what they feel — a natural-event shape to recognise alongside
              the frame. See docs/measure-experience-concept.md §4/§5. */}
          <View style={styles.natureSymbol}>
            <AnimatedNatureSymbol id={level.slug as NatureSymbolId} rgb={accentRgb} size={160} />
          </View>
        </Moment>

        {/* 2. What it feels like */}
        {feels && (
          <Moment scrollY={scrollY} viewportH={viewportH} style={[styles.moment, { minHeight: viewportH * 0.5 }]}>
            <Text style={[styles.momentLabel, { color: accentTextColor }]}>{feels.label.toUpperCase()}</Text>
            <Text style={styles.momentLine}>{asSentence(feels.value)}</Text>
            {paragraphs(withoutRepeatedOpening(feels.value, feelsSection?.paragraphs))}
            {personality && (
              <View style={styles.aside}>
                <Text style={styles.asideLabel}>{personality.label.toUpperCase()}</Text>
                <Text style={styles.asideValue}>{personality.value}</Text>
              </View>
            )}
          </Moment>
        )}

        {/* 3. Where you'll see it in the world */}
        {seenIn && (
          <Moment scrollY={scrollY} viewportH={viewportH} style={[styles.moment, { minHeight: viewportH * 0.5 }]}>
            <Text style={[styles.momentLabel, { color: accentTextColor }]}>{t('level.seenIn').toUpperCase()}</Text>
            <Text style={styles.momentLine}>{asSentence(seenIn.value)}</Text>
            {paragraphs(forSection?.paragraphs)}
          </Moment>
        )}

        {/* 4. Where it trips */}
        {tripsOn && (
          <Moment scrollY={scrollY} viewportH={viewportH} style={[styles.moment, { minHeight: viewportH * 0.5 }]}>
            <Text style={[styles.momentLabel, { color: accentTextColor }]}>{t('level.tripsOn').toUpperCase()}</Text>
            <Text style={styles.momentLine}>{asSentence(tripsOn.value)}</Text>
            {extraSignals.map((signal) => (
              <View key={signal.label} style={styles.aside}>
                <Text style={styles.asideLabel}>{signal.label.toUpperCase()}</Text>
                <Text style={styles.asideValue}>{signal.value}</Text>
              </View>
            ))}
            {paragraphs(wrongSection?.paragraphs)}
          </Moment>
        )}

        {/* 5. Something to try now — ending on the philosopher's step */}
        {trySection && (
          <Moment scrollY={scrollY} viewportH={viewportH} style={[styles.moment, { minHeight: viewportH * 0.5 }]}>
            <Text style={[styles.momentLabel, { color: accentTextColor }]}>{trySection.heading.toUpperCase()}</Text>
            {paragraphs(trySection.paragraphs)}
            {/* The heavy states' pages carry the quiet line to help
                (crisis safety net, 2026-10-10). */}
            {HEAVY_STATES.includes(level.slug) && <CrisisLine kind="heavy" style={{ marginTop: spacing[4] }} />}
            {/* On your own reading's page, the next step is handed over
                right here, where the reading ends (2026-10-09, from
                testing: it used to appear only in the minimap's handle,
                after the page was closed — somewhere else, at another
                moment). Since 2026-10-18 it leads straight into Use it —
                one step per screen, no two-door choice. Any other
                state's page keeps the conversation. */}
            {philosopher && isOwnReading ? (
              <View style={styles.handOff}>
                <View style={styles.philosopherRow}>
                  <PhilosopherObject id={philosopher.id} rgb={accentRgb} size={16} />
                  <Text style={[styles.philosopherName, { color: accentTextColor }]}>{philosopher.name}</Text>
                </View>
                <Text style={styles.philosopherLine}>{getSeamLine(philosopher.id, 'use', locale)}</Text>
                <Pressable
                  style={[styles.talkButton, { backgroundColor: accentColor }]}
                  onPress={() => router.push({ pathname: '/(tabs)/depths/session', params: { door: 'use' } })}
                  accessibilityRole="button"
                >
                  <Text style={styles.talkButtonText}>
                    {t(HEAVY_STATES.includes(level.slug) ? 'shift.useActionHeavy' : 'shift.useAction', {
                      level: level.name.toLowerCase(),
                    })}{' '}
                    →
                  </Text>
                </Pressable>
              </View>
            ) : philosopher ? (
              <Pressable
                style={[styles.talkButton, { backgroundColor: accentColor }]}
                onPress={step.openConversation}
                accessibilityRole="button"
              >
                <Text style={styles.talkButtonText}>{talkLabel} →</Text>
              </Pressable>
            ) : null}
          </Moment>
        )}

        {/* 6. Quietly, at the end */}
        <Moment scrollY={scrollY} viewportH={viewportH} style={styles.endLinks}>
          {whySection && (
            <View>
              <Pressable onPress={() => toggle(setNeighboursOpen)} accessibilityRole="button">
                <Text style={[styles.endToggle, { color: accentTextColor }]}>
                  {neighboursOpen ? t('level.hideNeighbours') : t('level.neighbours')}
                </Text>
              </Pressable>
              {neighboursOpen && <View style={styles.endBody}>{paragraphs(whySection.paragraphs)}</View>}
            </View>
          )}

          {level.deepDive && (
            <View>
              <Pressable onPress={() => toggle(setDeepDiveOpen)} accessibilityRole="button">
                <Text style={[styles.endToggle, { color: accentTextColor }]}>
                  {deepDiveOpen ? t('level.hideDeeperRead') : t('level.goDeeper')}
                </Text>
              </Pressable>
              {deepDiveOpen && (
                <View style={styles.endBody}>
                  {level.deepDive.map((section) => (
                    <View key={section.heading} style={styles.sectionBlock}>
                      <Text style={styles.sectionHeading}>{section.heading}</Text>
                      {paragraphs(section.paragraphs)}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <Pressable onPress={() => router.push('/sources')}>
            <Text style={styles.sourcesLink}>{t('level.sourcesLink')}</Text>
          </Pressable>
        </Moment>
      </Animated.ScrollView>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    content: { paddingHorizontal: spacing[6], paddingBottom: spacing[12] },
    notFoundRoot: { alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
    notFoundText: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.base },
    backRow: { paddingBottom: spacing[6] },

    // 1. Arrival — centred: the one moment that's about the state as a
    // whole, before the page opens into its parts.
    arrival: { alignItems: 'center', marginBottom: spacing[10] },
    philosopherIntro: { alignSelf: 'stretch', marginBottom: spacing[8] },
    philosopherRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    philosopherName: { fontFamily: fonts.medium, fontSize: fontSizes.xs },
    philosopherLine: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
      marginTop: spacing[3],
    },
    ring: { marginBottom: spacing[4] },
    title: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xxl,
      lineHeight: fontSizes.xxl * lineHeights.tight,
      textAlign: 'center',
    },
    frame: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
      textAlign: 'center',
      marginTop: spacing[3],
      maxWidth: 300,
    },
    natureSymbol: { alignItems: 'center', marginTop: spacing[8] },

    // 2–5. One idea each: a small label in the level's colour, the idea
    // itself large, then its fuller paragraphs quietly beneath.
    moment: { justifyContent: 'center', marginBottom: spacing[8] },
    momentLabel: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      marginBottom: spacing[3],
    },
    momentLine: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
      marginBottom: spacing[5],
    },
    aside: { marginTop: spacing[4], gap: spacing[1] },
    asideLabel: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.wide,
    },
    asideValue: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
    },
    paragraph: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.loose,
      marginBottom: spacing[3],
    },
    bold: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
    },
    // Full weight, not a link — talking about your state is the
    // philosopher's step here (RULES.md, "Talking about a reading is never
    // a footnote").
    talkButton: {
      marginTop: spacing[5],
      paddingVertical: spacing[4],
      borderRadius: radius.full,
      alignItems: 'center',
    },
    talkButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.base },

    // 6. The quiet end.
    endLinks: { marginTop: spacing[6], gap: spacing[6] },
    handOff: { marginTop: spacing[8], gap: spacing[2] },
    endToggle: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      letterSpacing: letterSpacings.wide,
      textTransform: 'uppercase',
    },
    endBody: {
      marginTop: spacing[5],
      paddingTop: spacing[4],
      borderTopWidth: 1,
      borderTopColor: colors.bg.border,
    },
    sectionBlock: { marginBottom: spacing[5] },
    sectionHeading: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.md,
      marginBottom: spacing[3],
    },
    sourcesLink: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
  });
}
