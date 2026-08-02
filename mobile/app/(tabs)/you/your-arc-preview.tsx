import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { useMeasureStore } from '../../../src/store/measureStore';
import { sparklinePath, SPARKLINE_VIEW_W, SPARKLINE_VIEW_H, PREVIEW_POINTS } from '../../../src/components/arcSparkline';
import { useAppAccentRgb } from '../../../src/utils/appAccent';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useGuideChatStore } from '../../../src/store/guideChatStore';
import { useEngagementStore, TALK_ABOUT_IT_UPSELL_THRESHOLD } from '../../../src/store/engagementStore';
import { track } from '../../../src/utils/analytics';

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
export default function YourArcPreviewScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const accentRgb = useAppAccentRgb();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const sendGuideMessage = useGuideChatStore((s) => s.send);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const talkAboutItCount = useEngagementStore((s) => s.talkAboutItCount);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);

  const points = readingLog.slice(-PREVIEW_POINTS).map((e) => e.score);
  const d = sparklinePath(points);

  // Same threshold Depths' own "Talk about it" row used to swap its copy
  // at — moved here since this is the screen someone visits to see what
  // Selfinder+ would actually add, rather than interrupting the plain,
  // always-tappable Guide action on Depths itself with a pitch.
  const showTalkAboutItNudge =
    talkAboutItCount >= TALK_ABOUT_IT_UPSELL_THRESHOLD && !!philosopher && !!currentResult;

  const handleTalkAboutIt = () => {
    if (!philosopher || !currentResult) return;
    track('your_arc_preview_talk_about_it');
    recordTalkAboutIt();
    sendGuideMessage(
      philosopher,
      `I just measured myself: ${currentResult.vibrationLevel.name.toLowerCase()}, mostly in ${currentResult.dominantAxis}. Can we talk about it?`,
    );
    router.push('/(tabs)/guide');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Pressable style={styles.backRow} onPress={() => router.back()}>
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
        </Svg>
      </View>

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
  );
}

const styles = StyleSheet.create({
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
    marginBottom: spacing[10],
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
