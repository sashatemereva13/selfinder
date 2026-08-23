import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../theme/useThemeColors';
import { useThemeStore } from '../store/themeStore';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { AmbientGlow } from './AmbientGlow';

// A shared, minimal screen for a Journey that's named in the Products
// catalog (see products.tsx) but has no content built yet — Either/Or and
// Identity today, any future Journey named ahead of its own build. Real,
// reachable, honest about not being ready (not a dead link) — the same
// "never build a tap target that looks like a purchase and doesn't"
// discipline center.tsx's own "coming soon" Alert already follows, just
// as a full screen instead of a button-triggered alert, since a Products
// catalog tap should always land somewhere real.
export function JourneyComingSoonScreen({ titleKey, introKey }: { titleKey: string; introKey: string }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      {theme === 'dark' && <AmbientGlow />}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{t(titleKey)}</Text>
      <Text style={styles.intro}>{t(introKey)}</Text>
      <Text style={styles.comingSoon}>{t('journeyComingSoon.notYetAvailable')}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
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
    marginBottom: spacing[6],
  },
  comingSoon: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
  },
  });
}
