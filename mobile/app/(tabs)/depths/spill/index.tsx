import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useAppAccentRgb } from '../../../../src/utils/appAccent';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { track } from '../../../../src/utils/analytics';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';

export default function SpillScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reset = useSpillStore((s) => s.reset);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const columnWidth = useReadingColumnWidth();

  useEffect(() => {
    markDiscovered('spill');
  }, []);

  const handleBegin = () => {
    reset();
    track('spill_started');
    router.push('/(tabs)/depths/spill/write');
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
        <Text style={styles.kicker}>{t('spill.kicker')}</Text>
        <Text style={styles.title}>{t('spill.title')}</Text>
        <Text style={styles.copy}>
          {t('spill.copy1')}
        </Text>
        <Text style={styles.copy}>
          {t('spill.copy2')}
        </Text>
      </View>

      <View style={[styles.footer, { width: columnWidth, alignSelf: 'center' }]}>
        <Pressable style={[styles.button, { backgroundColor: accentColor }]} onPress={handleBegin}>
          <Text style={styles.buttonText}>{t('common.begin')}</Text>
        </Pressable>
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
});
