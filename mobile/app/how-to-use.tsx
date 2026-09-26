import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { BackLink } from '../src/components/shared/BackLink';
import { HOW_TO_USE_ENTRIES } from '../src/content/howToUseEntries';

// Reachable from the profile screen (same weight as "Where this comes
// from" — see profile.tsx's own sourcesLink row, which this screen's own
// link is modeled on directly). No longer shown automatically after
// onboarding (2026-09-26): its tips were for screens a new person hadn't
// seen yet — orientation moves to where it applies instead (RULES.md,
// "The philosopher is a constant presence").
export default function HowToUseScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      {theme === 'dark' && <AmbientGlow />}
      <BackLink style={styles.backRow} />

      <Text style={styles.title}>{t('howToUse.title')}</Text>
      <Text style={styles.intro}>{t('howToUse.intro')}</Text>

      {HOW_TO_USE_ENTRIES.map((entry) => (
        <View key={entry.headingKey} style={styles.entryBlock}>
          <Text style={styles.entryHeading}>{t(entry.headingKey)}</Text>
          <Text style={styles.entryBody}>{t(entry.bodyKey)}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[8] },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginBottom: spacing[5],
  },
  intro: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.loose,
    marginBottom: spacing[8],
  },
  entryBlock: { marginBottom: spacing[8] },
  entryHeading: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    marginBottom: spacing[2],
  },
  entryBody: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.loose,
  },
  });
}
