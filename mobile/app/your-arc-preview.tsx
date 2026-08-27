import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useMeasureStore, ReadingLogEntry } from '../src/store/measureStore';
import { sparklinePath, sparklineCoords, SPARKLINE_VIEW_W, SPARKLINE_VIEW_H, PREVIEW_POINTS } from '../src/components/arcSparkline';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { useGuideChatStore } from '../src/store/guideChatStore';
import { useEngagementStore, TALK_ABOUT_IT_UPSELL_THRESHOLD } from '../src/store/engagementStore';
import { track } from '../src/utils/analytics';
import { VIBRATION_LEVELS, getLocalizedLevelName } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';
import { useArcTrialStatus } from '../src/utils/useArcTrialStatus';
import { ProfileIcon } from '../src/components/ProfileIcon';

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Not subscribed yet — shown when tapping Depths' "Your arc" row without an
// active subscription (see arcSparkline.ts). The sparkline here is the
// exact same real data used everywhere else, just larger — never a
// blurred or simulated chart standing in for the locked version. Honest
// about what's real (this line, from your actual readings) vs. what's
// locked (tapping into any one point, full history beyond the last
// PREVIEW_POINTS readings) rather than a dark-pattern tease. What
// Selfinder+ actually adds isn't just "more points" — a longer history,
// richer per-reading detail/analysis, and further Your Arc features are
// all intended to grow here over time; this screen's copy should be
// revisited once that fuller subscribed experience (your-arc.tsx) is
// actually designed, not just promised in one line.
//
// 2026-08-23 pivot (see RULES.md's Product/positioning section): this is
// now also the screen carrying Your Arc's free-trial framing —
// useArcTrialStatus() reports real progress toward the 7-saved-reading
// free trial while it's still open, and switches to the "keep everything"
// framing once it's exhausted. The trial itself is enforced server-side
// (chatController.js's saveMeasureResultIfConsented); this screen only
// ever reflects real state back, never claims anything about the trial
// that isn't already true server-side.
export default function YourArcPreviewScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const accentRgb = useAppAccentRgb();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const setPendingMeasureResultId = useGuideChatStore((s) => s.setPendingMeasureResultId);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const talkAboutItCount = useEngagementStore((s) => s.talkAboutItCount);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);
  const trialStatus = useArcTrialStatus();

  const previewEntries = readingLog.slice(-PREVIEW_POINTS);
  const points = previewEntries.map((e) => e.score);
  const d = sparklinePath(points);
  const coords = sparklineCoords(points);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);

  // Same threshold Depths' own "Talk about it" row used to swap its copy
  // at — moved here since this is the screen someone visits to see what
  // Selfinder+ would actually add, rather than interrupting the plain,
  // always-tappable Guide action on Depths itself with a pitch.
  const showTalkAboutItNudge =
    talkAboutItCount >= TALK_ABOUT_IT_UPSELL_THRESHOLD && !!philosopher && !!currentResult;

  const AXIS_LABEL_KEYS: Record<string, string> = {
    calm: 'common.axisCalm',
    clarity: 'common.axisClarity',
    intensity: 'common.axisIntensity',
    grounding: 'common.axisGrounding',
  };

  const handleTalkAboutIt = () => {
    if (!philosopher || !currentResult) return;
    track('your_arc_preview_talk_about_it');
    recordTalkAboutIt();
    setPendingMeasureResultId(philosopher.id, currentResult.measureResultId);
    sendGuideMessage(
      philosopher,
      t('depths.iJustMeasuredMyself', {
        level: getLocalizedLevelName(currentResult.vibrationLevel, locale).toLowerCase(),
        axis: t(AXIS_LABEL_KEYS[currentResult.dominantAxis] ?? currentResult.dominantAxis),
      }),
    );
    router.push('/guide');
  };

  return (
    <View style={styles.rootWrap}>
      <ProfileIcon />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
      >
      {/* See your-arc.tsx's identical comment — explicit destination, not
          router.back(), now that this is a top-level route. */}
      <Pressable style={styles.backRow} onPress={() => router.replace('/(tabs)/depths')}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.kicker}>{t('yourArcPreview.kicker')}</Text>
      <Text style={styles.title}>{t('yourArcPreview.title')}</Text>
      <Text style={styles.introLine}>
        {t('yourArcPreview.introLine')}
      </Text>

      <View style={styles.sparklineWrap}>
        <Svg
          width="100%"
          height={90}
          viewBox={`0 0 ${SPARKLINE_VIEW_W} ${SPARKLINE_VIEW_H}`}
          preserveAspectRatio="none"
        >
          <Path
            d={d}
            fill="none"
            stroke={`rgb(${accentRgb})`}
            strokeOpacity={0.7}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Marks each individual reading the line connects — without
              these the sparkline reads as a bare trend line, not "your last
              four readings," which is specifically what this screen's own
              copy promises right below it. */}
          {coords.map((point, i) => (
            <Circle
              key={i}
              cx={point.x}
              cy={point.y}
              r={1.2}
              fill={`rgb(${accentRgb})`}
            />
          ))}
        </Svg>
        {/* A separate absolutely-positioned tap layer, not SVG onPress per
            point — same reasoning as your-arc.tsx's own tapLayer (SVG
            shapes don't reliably take touch events at this marker size
            across platforms). Tappable here too, unlike a fully inert
            preview: showing just enough — the date, what it read as — and
            then naming what's still locked (the actual conversation) is
            the honest tease this screen is already built around, just
            extended down to the point level instead of stopping at the
            line itself. */}
        <View style={styles.tapLayer} pointerEvents="box-none">
          {previewEntries.map((entry, i) => (
            <Pressable
              key={entry.ts}
              style={[
                styles.tapTarget,
                { left: `${(coords[i].x / SPARKLINE_VIEW_W) * 100}%`, top: `${(coords[i].y / SPARKLINE_VIEW_H) * 100}%` },
              ]}
              onPress={() => setSelected(entry)}
              hitSlop={10}
            />
          ))}
        </View>
      </View>

      {selected && (
        <View style={styles.pointDetail}>
          <Text style={styles.pointDate}>{formatDate(selected.ts)}</Text>
          <Text style={styles.pointLevel}>
            {t('yourArcPreview.pointLevel', {
              level: getLocalizedLevelName(
                VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug) ?? VIBRATION_LEVELS[0],
                locale
              ).toLowerCase(),
            })}
          </Text>
          <Text style={styles.pointUnlockHint}>{t('yourArcPreview.pointUnlockHint')}</Text>
        </View>
      )}

      {/* Free-trial framing (2026-08-23 pivot) — real progress while the
          trial is still open, honest "replaces oldest" messaging once
          it's exhausted. trialStatus is null while loading/signed-out
          (useArcTrialStatus's own contract, same as every other hook in
          this codebase) — nothing renders here in that case, same as the
          rest of this screen already assumes a session exists to show
          anything meaningful. subscribed is checked too even though this
          screen shouldn't normally be reached by a subscriber (Depths'
          own routing sends them straight to your-arc.tsx) — a defensive
          read of real state, not a route guard. */}
      {trialStatus && !trialStatus.subscribed && (
        trialStatus.remaining > 0 ? (
          <Text style={styles.unlockLine}>
            {t('yourArcPreview.trialProgress', {
              count: trialStatus.savedReadingCount,
              limit: trialStatus.trialLimit,
            })}
          </Text>
        ) : (
          <Text style={styles.unlockLine}>{t('yourArcPreview.trialExhausted')}</Text>
        )
      )}

      <Text style={styles.unlockKicker}>{t('yourArcPreview.whatSelfinderPlusAdds')}</Text>
      <Text style={styles.unlockLine}>
        {t('yourArcPreview.fullLine', { count: PREVIEW_POINTS })}
      </Text>
      <Text style={styles.unlockLine}>
        {t('yourArcPreview.tapAnyPoint')}
      </Text>

      {showTalkAboutItNudge && (
        <>
          <View style={styles.divider} />
          <Pressable style={styles.row} onPress={handleTalkAboutIt}>
            <Text style={styles.rowLabel}>{t('yourArcPreview.keepConversationGoing')}</Text>
            <Text style={styles.rowDescription}>
              {t('yourArcPreview.keepConversationDescription', { name: philosopher!.name })}
            </Text>
          </Pressable>
        </>
      )}

      <Text style={styles.footnote}>
        {t('yourArcPreview.footnote')}
      </Text>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: colors.bg.base },
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  kicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  introLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[8],
  },
  sparklineWrap: {
    width: '100%',
    marginBottom: spacing[6],
  },
  tapLayer: { ...StyleSheet.absoluteFill },
  tapTarget: {
    position: 'absolute',
    width: 16,
    height: 16,
    marginLeft: -8,
    marginTop: -8,
    borderRadius: 8,
  },
  // No border/fill box — same "no cards" register as the rest of the app,
  // separated from the sparkline above it by space alone.
  pointDetail: { gap: spacing[1], marginBottom: spacing[8] },
  pointDate: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  pointLevel: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    textTransform: 'capitalize',
    marginTop: spacing[1],
  },
  pointUnlockHint: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    marginTop: spacing[2],
  },
  unlockKicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  unlockLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginBottom: spacing[3],
  },
  footnote: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    marginTop: spacing[6],
  },
  divider: { width: '100%', height: 1, backgroundColor: colors.bg.border, marginBottom: spacing[4] },
  row: { alignSelf: 'flex-start', paddingVertical: spacing[3], marginBottom: spacing[2] },
  rowLabel: { color: colors.accent.ivory, fontFamily: fonts.medium, fontSize: fontSizes.md },
  rowDescription: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[1],
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  });
}
