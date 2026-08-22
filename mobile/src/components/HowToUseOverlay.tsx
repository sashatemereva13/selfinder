import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/useThemeColors';
import { useThemeStore } from '../store/themeStore';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useReadingColumnWidth } from '../theme/responsive';
import { useHowToUseStore } from '../store/howToUseStore';
import { HOW_TO_USE_ENTRIES } from '../content/howToUseEntries';
import { AmbientGlow } from './AmbientGlow';

// Shown once, right after onboarding — same mechanism as
// AIDisclosureOverlay.tsx (mounted at the root layout, gated on
// `philosopher` existing in _layout.tsx), shown FIRST when both are
// pending at once (see _layout.tsx's own ordering comment): this is
// general app orientation, the AI disclosure is feature-specific and only
// matters once Guide/Measure are actually about to be used. Content
// (HOW_TO_USE_ENTRIES) is shared with app/how-to-use.tsx, the same
// screen's standalone form reachable later from the You tab.
export function HowToUseOverlay() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const columnWidth = useReadingColumnWidth();
  const acknowledge = useHowToUseStore((s) => s.acknowledge);

  return (
    <View style={styles.root}>
      {theme === 'dark' && <AmbientGlow />}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { width: columnWidth, alignSelf: 'center', paddingHorizontal: spacing[6], paddingTop: insets.top + spacing[8] },
        ]}
      >
        <Text style={styles.kicker}>{t('howToUse.title')}</Text>
        <Text style={styles.intro}>{t('howToUse.intro')}</Text>

        {HOW_TO_USE_ENTRIES.map((entry) => (
          <View key={entry.headingKey} style={styles.entryBlock}>
            <Text style={styles.entryHeading}>{t(entry.headingKey)}</Text>
            <Text style={styles.entryBody}>{t(entry.bodyKey)}</Text>
          </View>
        ))}

        <Pressable style={styles.button} onPress={acknowledge}>
          {/* Reuses aiDisclosure.continue rather than adding a near-
              duplicate key — "Continue" is generic and this button does
              exactly the same job (acknowledge, dismiss) as that
              overlay's own button. */}
          <Text style={styles.buttonText}>{t('aiDisclosure.continue')}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  // Absolute, not a sibling in normal flow — sits above the whole app
  // (mounted in app/_layout.tsx), same convention AIDisclosureOverlay.tsx
  // uses. A ScrollView inside (unlike that overlay's plain View) since two
  // full entries plus intro copy can run past one screen's height on a
  // smaller phone.
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: colors.bg.base,
  },
  content: { paddingBottom: spacing[10] },
  kicker: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    marginBottom: spacing[3],
  },
  intro: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.loose,
    marginBottom: spacing[6],
  },
  entryBlock: { marginBottom: spacing[6] },
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
  button: {
    alignSelf: 'flex-start',
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors.accent.buttonFill,
  },
  buttonText: {
    color: colors.onAccent,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  });
}
