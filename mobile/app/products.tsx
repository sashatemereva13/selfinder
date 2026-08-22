import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { AmbientGlow } from '../src/components/AmbientGlow';

interface Product {
  key: string;
  labelKey: string;
  descriptionKey: string;
  route: '/center';
}

// The catalog of one-time-purchase experiences (2026-08-22, the Your Arc +
// Center split — see RULES.md's Product/positioning section) — distinct
// from Your Arc's ongoing subscription, this screen lists things bought
// once, repeatably, each producing its own generated result. Just Center
// for now; built as a real array (same SOURCES/HOW_TO_USE_ENTRIES pattern
// as sources/index.tsx and howToUseEntries.ts) so a second experience
// later is a new entry here, not a new screen.
const PRODUCTS: Product[] = [
  { key: 'center', labelKey: 'products.centerLabel', descriptionKey: 'products.centerDescription', route: '/center' },
];

export default function ProductsScreen() {
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

      <Text style={styles.title}>{t('products.title')}</Text>
      <Text style={styles.intro}>{t('products.intro')}</Text>

      {PRODUCTS.map((product) => (
        // Full row weight (label + description), same as sourcesLink/
        // howToUseLink's own rows on the You tab and RULES.md's "a next
        // step earns the same visual weight... if it's meant to be
        // genuinely chosen" rule — this is the entry point to a real
        // purchase, not a footnote link.
        <Pressable key={product.key} style={styles.row} onPress={() => router.push(product.route)}>
          <Text style={styles.rowLabel}>{t(product.labelKey)}</Text>
          <Text style={styles.rowDescription}>{t(product.descriptionKey)}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
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
    marginBottom: spacing[8],
  },
  row: { paddingVertical: spacing[4], borderTopWidth: 1, borderTopColor: colors.bg.border },
  rowLabel: { color: colors.accent.ivory, fontFamily: fonts.medium, fontSize: fontSizes.md },
  rowDescription: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[1],
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  });
}
