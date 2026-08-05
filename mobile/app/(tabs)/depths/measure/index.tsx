import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { useAppAccentRgb } from '../../../../src/utils/appAccent';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { track } from '../../../../src/utils/analytics';
import { getLocalizedLevelName } from '../../../../src/content/measureConfig';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';

export default function TodayScreen() {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const resetInterview = useMeasureStore((s) => s.resetInterview);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const columnWidth = useReadingColumnWidth();

  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const hasMeasuredBefore = Boolean(currentResult);

  const handleBegin = () => {
    resetInterview();
    track('measure_started');
    router.push('/(tabs)/depths/measure/interview');
  };

  return (
    <View style={styles.root}>
      <AmbientGlow />

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

const styles = StyleSheet.create({
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
    color: colors.bg.base,
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
