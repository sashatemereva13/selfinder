import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { useMeasureStore, ReadingLogEntry } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { getMe, getMeasureHistory } from '../src/api/user';
import { SavedMeasureResult } from '../src/types';
import { SPARKLINE_VIEW_W, SPARKLINE_VIEW_H } from '../src/components/arcSparkline';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { getLocalizedLevelName } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';

const VIEW_W = SPARKLINE_VIEW_W;
const VIEW_H = SPARKLINE_VIEW_H;
const PAD_Y = 4;
// Points closer together than this many view-units don't get their own
// tap target — at full history, a long line can pack dozens of points
// within a few pixels of each other, and a marker too small to reliably
// tap is worse than no marker at all.
const MIN_TAP_SPACING = 3;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Subscribed — the real payoff Depths' "Your arc" row (and, before that,
// the preview screen) points to: full history, not just the last few
// readings, and tapping
// any point opens what that day actually was. Two tiers of detail
// depending on what data exists for it: the rich version (four spheres,
// the philosopher's reflection, the actual Q&A) only exists server-side,
// for a signed-in account with data-saving consent on — the same
// precondition AccountSection's own history list already requires. Without
// that, a tapped point still means something (the date, the level, the
// score) — just not the full story, since that was never saved anywhere
// to recover. Never pretend detail exists that doesn't.
export default function YourArcScreen() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const session = useAuthStore((s) => s.session);
  const accentRgb = useAppAccentRgb();

  const [richHistory, setRichHistory] = useState<SavedMeasureResult[] | null>(null);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (cancelled || !profile.consent?.psychologicalData?.given) return;
        const history = await getMeasureHistory(session.token);
        if (!cancelled) setRichHistory(history);
      } catch {
        // Best-effort — the local-only readingLog view still works without this.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  const points = readingLog.map((e) => e.score);
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const span = max - min || 1;
  const xAt = (i: number) => (i / Math.max(points.length - 1, 1)) * VIEW_W;
  const yAt = (score: number) => PAD_Y + (1 - (score - min) / span) * (VIEW_H - PAD_Y * 2);
  const d = readingLog
    .map((e, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(e.score).toFixed(1)}`)
    .join(' ');

  // Only every Nth point gets a tap target once points are packed tighter
  // than MIN_TAP_SPACING, evenly thinned rather than just taking the first
  // N — otherwise a long history's tappable points would all bunch at one
  // end of the line.
  const tapStep = Math.max(1, Math.ceil(MIN_TAP_SPACING / (VIEW_W / Math.max(points.length - 1, 1))));
  const tappablePoints = readingLog.filter((_, i) => i % tapStep === 0 || i === readingLog.length - 1);

  const selectedRich = selected
    ? richHistory?.find((r) => Math.abs(new Date(r.savedAt).getTime() - selected.ts) < 60_000)
    : undefined;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      {/* Explicit destination, not router.back() — Your Arc's only real
          entry point is Depths' "Your arc" row, but this is now a
          top-level route (see app/_layout.tsx), so router.back()'s actual
          target depends on navigation-stack internals rather than where
          the user thinks they came from. Same fix as /sources. */}
      <Pressable style={styles.backRow} onPress={() => router.replace('/(tabs)/depths')}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.kicker}>{t('yourArc.kicker')}</Text>
      <Text style={styles.title}>{t('yourArc.title')}</Text>
      <Text style={styles.introLine}>
        {t('yourArc.introLine', { count: readingLog.length })}
      </Text>

      {readingLog.length >= 2 ? (
        <View style={styles.sparklineWrap}>
          <Svg
            width="100%"
            height={140}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
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
          {/* A separate absolutely-positioned tap layer, not SVG onPress per
              point — react-native-svg shapes don't reliably take touch
              events at this marker size across platforms, plain Views do. */}
          <View style={styles.tapLayer} pointerEvents="box-none">
            {tappablePoints.map((entry) => {
              const i = readingLog.indexOf(entry);
              const leftPct = (xAt(i) / VIEW_W) * 100;
              const topPct = (yAt(entry.score) / VIEW_H) * 100;
              return (
                <Pressable
                  key={entry.ts}
                  style={[styles.tapTarget, { left: `${leftPct}%`, top: `${topPct}%` }]}
                  onPress={() => setSelected(entry)}
                  hitSlop={10}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {t('yourArc.notEnoughReadings')}
        </Text>
      )}

      {selected && (
        <View style={styles.detailSection}>
          <Text style={styles.detailDate}>{formatDate(selected.ts)}</Text>
          {selectedRich ? (
            <>
              <Text style={styles.detailLevel}>
                {getLocalizedLevelName(selectedRich.vibrationLevel, locale)}
              </Text>
              {selectedRich.combinationMessage && (
                <Text style={styles.detailReflection}>{selectedRich.combinationMessage}</Text>
              )}
            </>
          ) : (
            <>
              <Text style={styles.detailLevel}>{selected.levelSlug}</Text>
              {session && !richHistory && (
                <Text style={styles.detailNote}>
                  {t('yourArc.turnOnSavingNote')}
                </Text>
              )}
              {!session && (
                <Text style={styles.detailNote}>
                  {t('yourArc.signInToSaveNote')}
                </Text>
              )}
            </>
          )}
        </View>
      )}
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
    marginBottom: spacing[6],
  },
  tapLayer: { ...StyleSheet.absoluteFill },
  tapTarget: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: 6,
    backgroundColor: colors.accent.ivory,
    opacity: 0.5,
  },
  emptyText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginBottom: spacing[6],
  },
  detailSection: {
    gap: spacing[2],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
  },
  detailDate: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  detailLevel: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    textTransform: 'capitalize',
  },
  detailReflection: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[1],
  },
  detailNote: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    marginTop: spacing[1],
  },
});
