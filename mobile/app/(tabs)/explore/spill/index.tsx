import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useAppAccentButtonRgb } from '../../../../src/utils/appAccent';
import { AmbientGlow } from '../../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../../src/components/shared/BackLink';
import { PhilosopherLine } from '../../../../src/components/shared/PhilosopherLine';
import { track } from '../../../../src/utils/analytics';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';

export default function SpillScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  // 'measure' when Spill was opened from Measure's intro as the step before
  // it — carried through write → reveal so the reveal can lead back.
  const { then } = useLocalSearchParams<{ then?: string }>();
  const insets = useSafeAreaInsets();
  const reset = useSpillStore((s) => s.reset);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  const accentRgb = useAppAccentButtonRgb();
  const accentColor = `rgb(${accentRgb})`;
  const columnWidth = useReadingColumnWidth();

  useEffect(() => {
    markDiscovered('spill');
  }, []);

  const handleBegin = () => {
    reset();
    track('spill_started');
    router.push({ pathname: '/(tabs)/explore/spill/write', params: then ? { then } : {} });
  };

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}

      <BackLink style={[styles.backRow, { paddingTop: insets.top + spacing[4] }]} />

      <View style={[styles.body, { width: columnWidth, alignSelf: 'center' }]}>
        {/* The philosopher steps away for the minute (2026-10-16), and one
            plain line says how it works — instead of the "SPILL" label, a
            title and two paragraphs. */}
        <PhilosopherLine room="spill" />
        <Text style={styles.copy}>{t('spill.howItWorks')}</Text>
      </View>

      <View style={[styles.footer, { width: columnWidth, alignSelf: 'center' }]}>
        <Pressable style={[styles.button, { backgroundColor: accentColor }]} onPress={handleBegin}>
          <Text style={styles.buttonText}>{t('common.begin')}</Text>
        </Pressable>
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
  // The plain layer under the philosopher's line — short, quieter.
  copy: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
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
  });
}
