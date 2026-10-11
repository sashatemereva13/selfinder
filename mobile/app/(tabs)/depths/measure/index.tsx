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
import { ensureAIConsent } from '../../../../src/store/aiDisclosureStore';
import { useAppAccentButtonRgb } from '../../../../src/utils/appAccent';
import { AmbientGlow } from '../../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../../src/components/shared/BackLink';
import { AuraSettle } from '../../../../src/components/depths/AuraSettle';
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

  // Consent is asked here, before the interview opens, rather than at the
  // first answer — Measure's exchange deliberately fails open (see
  // interview.tsx), so a "Not now" mid-interview would silently skip every
  // reply and then fail at scoring.
  const handleBegin = async () => {
    if (!(await ensureAIConsent())) return;
    resetInterview();
    track('measure_started');
    router.push('/(tabs)/depths/measure/interview');
  };

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}

      <BackLink style={[styles.backRow, { paddingTop: insets.top + spacing[4] }]} />

      {/* 2026-09-26 — recomposed: four text blocks (kicker, a two-line
          title, the philosopher's line, a ~40-word paragraph) competed
          with the figure, and the paragraph repeated what onboarding's
          meet step had said a moment earlier ("four sides — body, mind,
          heart, spirit"). Now this is an arrival, not another explanation:
          the place's name, the figure, the philosopher's one breath of a
          line, then the button with the one instruction worth keeping.
          The minimap hides on Measure (see MapBar) — this is a focused
          conversation, and the back link is the way out. */}
      <View style={[styles.body, { width: columnWidth, alignSelf: 'center' }]}>
        <Text style={styles.kicker}>{t('measureIntro.kicker')}</Text>

        {/* The one arrival beat for the whole walk — see this file's history:
            the per-sphere AttentionScan gate it replaced ran four times in
            a 4–8 exchange conversation. scanPhrases[0] is the
            philosopher's own hand-written body-sphere line. */}
        <View style={styles.presence}>
          <AuraSettle />
          {philosopher?.scanPhrases?.[0]?.phrase && (
            <Text style={styles.scanPhrase}>{philosopher.scanPhrases[0].phrase}</Text>
          )}
          {currentResult && (
            <Text style={styles.lastReading}>
              {t('measureIntro.lastReading', {
                level: getLocalizedLevelName(currentResult.vibrationLevel, locale).toLowerCase(),
              })}
            </Text>
          )}
        </View>
      </View>

      <View style={[styles.footer, { width: columnWidth, alignSelf: 'center', paddingBottom: spacing[8] + insets.bottom }]}>
        <Pressable
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={handleBegin}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{t('measureIntro.beginConversation')}</Text>
        </Pressable>
        <Text style={styles.caption}>{t('measureIntro.caption')}</Text>

        {hasMeasuredBefore && (
          <Pressable
            style={styles.spillLink}
            // "First", not "or" (2026-10-10): when the head is too loud to
            // answer honestly, pouring it out is the way to the reading,
            // not a way around it — Spill's reveal brings you back here.
            // Spill never measures anything; this stays the one Measure.
            onPress={() => router.push({ pathname: '/(tabs)/explore/spill', params: { then: 'measure' } })}
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
    paddingBottom: spacing[4],
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing[6],
  },
  // The figure and the philosopher's line, centred in whatever height is
  // left between the place name and the button.
  presence: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
  },
  footer: {
    paddingHorizontal: spacing[6],
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
    color: colors.text.primary,
    fontFamily: fonts.voice,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.35,
    textAlign: 'center',
    // Narrow enough that a short line breaks into two balanced lines
    // rather than leaving one word alone on the second.
    maxWidth: 260,
  },
  // textAlign: 'center' — matches scanPhrase directly above it (review,
  // 2026-08-19: the two sat right on top of each other with different
  // alignment, reading as visually off). lastReading continues that same
  // spoken-aloud moment (scanPhrase is the philosopher's own line), not a
  // return to the left-aligned kicker/title/copy block further up, so it
  // takes scanPhrase's centered register rather than the title block's.
  lastReading: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
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
  // The one instruction worth keeping from the old paragraph — plain
  // layer, directly under the button it's about.
  caption: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    textAlign: 'center',
    marginTop: spacing[3],
    maxWidth: 260,
    alignSelf: 'center',
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
