import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { VIBRATION_LEVELS, useLevelColors, getLocalizedLevelName } from '../../../../src/content/measureConfig';
import { ConsciousnessWheel } from '../../../../src/components/ConsciousnessWheel';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { useWideColumnWidth } from '../../../../src/theme/responsive';

const LEVELS_HIGH_TO_LOW = [...VIBRATION_LEVELS].reverse();

export default function LevelsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const columnWidth = useWideColumnWidth();

  const goToLevel = (slug: string) => {
    router.push({ pathname: '/(tabs)/depths/level/[id]', params: { id: slug } });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing[4], width: columnWidth, alignSelf: 'center' },
      ]}
    >
      {theme === 'dark' && <AmbientGlow />}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.kicker}>{t('levels.kicker')}</Text>
      <Text style={styles.title}>{t('levels.title')}</Text>
      <Text style={styles.copy}>
        {t('levels.copy')}
      </Text>
      {/* The one place this caveat lives — not repeated on individual
          level pages' own "Why here" section, since this screen is where
          all 17 are seen as one territory. Without it, "Why here"'s
          resolves/still-open language between neighbors risks being
          misread as a required order of travel, which would smuggle in
          exactly the ranking judgment the ring shape exists to refuse. */}
      <Text style={styles.copy}>
        {t('levels.note')}
      </Text>

      {/* The one screen where showing all 17 level colors together is
          correct — this is a map of the whole territory, not a reading of
          a specific moment (see docs/design/aesthetic.md). A single
          draggable dot rather than 17 labels crowded around the ring: the
          wheel itself stays quiet until you're pointing at something. */}
      <ConsciousnessWheel onSelectLevel={goToLevel} />

      <View style={styles.list}>
        {LEVELS_HIGH_TO_LOW.map((level) => (
          <Pressable
            key={level.slug}
            style={styles.row}
            onPress={() => goToLevel(level.slug)}
          >
            <View style={[styles.rowDot, { backgroundColor: `rgb(${levelColors[level.slug]})` }]} />
            <Text style={styles.rowName}>{getLocalizedLevelName(level, locale)}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
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
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginTop: spacing[2],
  },
  copy: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[8],
  },
  list: { gap: spacing[2], marginTop: spacing[10] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  rowDot: { width: 10, height: 10, borderRadius: 5 },
  rowName: { flex: 1, color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.base },
  });
}
