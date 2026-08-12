import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/useThemeColors';
import { useThemeStore } from '../store/themeStore';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useReadingColumnWidth } from '../theme/responsive';
import { useAIDisclosureStore } from '../store/aiDisclosureStore';
import { AmbientGlow } from './AmbientGlow';

// Shown once, before any feature that sends a user's own words to the
// third-party AI provider (Guide, Measure) — mounted at the root layout so
// it catches every path into either screen, not just one entry point.
// Accountless usage is the primary path (see RULES.md's "free core"
// section), so this can't live only behind the signup privacy-policy
// checkbox in AccountSection.tsx, which most people never see.
export function AIDisclosureOverlay() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const columnWidth = useReadingColumnWidth();
  const acknowledge = useAIDisclosureStore((s) => s.acknowledge);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[8] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <View
        style={[
          styles.content,
          { width: columnWidth, alignSelf: 'center', paddingHorizontal: spacing[6] },
        ]}
      >
        <Text style={styles.kicker}>{t('aiDisclosure.kicker')}</Text>
        <Text style={styles.body}>{t('aiDisclosure.body')}</Text>
        <Pressable style={styles.button} onPress={acknowledge}>
          <Text style={styles.buttonText}>{t('aiDisclosure.continue')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  // Absolute, not a sibling in normal flow — sits above the whole app
  // (mounted in app/_layout.tsx) rather than gating one screen's own tree.
  // Top-anchored, not vertically centered — this is a short notice to
  // read and dismiss, not a modal; centering it left equal dead space
  // above and below on every real device, reading as unfinished rather
  // than deliberate restraint.
  root: {
    ...StyleSheet.absoluteFill,
    zIndex: 100,
    backgroundColor: colors.bg.base,
    paddingBottom: spacing[10],
  },
  content: { gap: spacing[5] },
  kicker: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
  },
  body: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.loose,
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
