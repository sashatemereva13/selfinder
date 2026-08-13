import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { useAppAccentButtonRgb } from '../../../../src/utils/appAccent';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { AuraSettle } from '../../../../src/components/AuraSettle';
import { track } from '../../../../src/utils/analytics';
import { getLocalizedLevelName } from '../../../../src/content/measureConfig';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';

export default function TodayScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const resetInterview = useMeasureStore((s) => s.resetInterview);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const columnWidth = useReadingColumnWidth();

  const accentRgb = useAppAccentButtonRgb();
  const accentColor = `rgb(${accentRgb})`;
  const hasMeasuredBefore = Boolean(currentResult);

  const handleBegin = () => {
    resetInterview();
    track('measure_started');
    router.push('/(tabs)/depths/measure/interview');
  };

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}

      <Pressable
        style={[styles.backRow, { paddingTop: insets.top + spacing[4] }]}
        onPress={() => router.back()}
      >
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <View style={[styles.body, { width: columnWidth, alignSelf: 'center' }]}>
        <Text style={styles.kicker}>{t('measureIntro.kicker')}</Text>
        <Text style={styles.title}>
          {t('measureIntro.title')}
        </Text>

        {/* The one arrival beat for the whole walk — previously this
            screen's own words ("a conversation to read where you are")
            were followed by a SECOND, separate arrival screen
            (AttentionScan, before sphere 0) doing the same settling job
            again with the aura, and then that same beat repeated before
            EVERY subsequent sphere too — four ritual interruptions in a
            conversation that's often only 4-8 exchanges long. Merging the
            aura directly into this screen means there's exactly one
            arrival, and the conversation itself (interview.tsx) now runs
            straight through with no per-sphere gate. See scanPhrases[0]
            below — reuses the philosopher's own hand-written body-sphere
            line rather than inventing new copy for this merged moment. */}
        <AuraSettle />
        {philosopher?.scanPhrases?.[0]?.phrase && (
          <Text style={styles.scanPhrase}>{philosopher.scanPhrases[0].phrase}</Text>
        )}

        {!hasMeasuredBefore && (
          <Text style={styles.copy}>
            {t('measureIntro.copy', { name: philosopher?.name ?? t('measure.yourPhilosopher') })}
          </Text>
        )}

        {currentResult && (
          <Text style={styles.lastReading}>
            {t('measureIntro.lastReading', {
              level: getLocalizedLevelName(currentResult.vibrationLevel, locale).toLowerCase(),
            })}
          </Text>
        )}
      </View>

      <View style={[styles.footer, { width: columnWidth, alignSelf: 'center' }]}>
        <Pressable
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={handleBegin}
        >
          <Text style={styles.buttonText}>{t('measureIntro.beginConversation')}</Text>
        </Pressable>

        {hasMeasuredBefore && (
          <Pressable
            style={styles.spillLink}
            onPress={() => router.push('/(tabs)/depths/spill')}
          >
            <Text style={styles.spillLinkText}>{t('measureIntro.orJustWriteItOut')}</Text>
          </Pressable>
        )}
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
  backRow: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  backLink: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  // Same register as AttentionScan's own phrase text (interview.tsx no
  // longer renders that component at all, but this screen inherits its
  // one surviving job — the philosopher's wordless-arrival line).
  scanPhrase: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  copy: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  lastReading: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
  },
  button: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.onAccent,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
  spillLink: {
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  spillLinkText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
  },
  });
}
