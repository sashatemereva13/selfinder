import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { useLocaleStore } from '../src/store/localeStore';

// Shared infrastructure, not scoped to any one feature — routeToCrisisSupport.ts
// is the callable trigger; this is the screen it lands on. First (and
// currently only) caller is the wish flow's own moderation gate
// (interview.tsx), when a wish is classified "self-harm" — but nothing
// about this screen is wish-specific, so a future feature can route here
// too without duplicating this content.
//
// No hardcoded per-country phone numbers beyond 988 (a confirmed, stable,
// official U.S. federal number) — every other locale links out to
// findahelpline.com's own maintained, locale-aware directory rather than
// a number this app would have to keep accurate and current itself. See
// RULES.md's "practice, not therapy" positioning — this screen's own
// voice matches that: plain, non-clinical, no diagnosis, no urgency
// theater.
export default function CrisisSupportScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const findHelplineUrl = `https://findahelpline.com/countries/${locale === 'ru' ? 'ru' : 'us'}`;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Pressable style={styles.backRow} onPress={() => router.replace('/(tabs)/depths')}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.kicker}>{t('crisisSupport.kicker')}</Text>
      <Text style={styles.title}>{t('crisisSupport.title')}</Text>
      <Text style={styles.body}>{t('crisisSupport.body')}</Text>

      {locale === 'en' ? (
        <Pressable style={styles.resourceButton} onPress={() => Linking.openURL('tel:988')}>
          <Text style={styles.resourceButtonLabel}>{t('crisisSupport.call988')}</Text>
          <Text style={styles.resourceButtonSublabel}>{t('crisisSupport.call988Sublabel')}</Text>
        </Pressable>
      ) : null}

      <Pressable style={styles.resourceButton} onPress={() => Linking.openURL(findHelplineUrl)}>
        <Text style={styles.resourceButtonLabel}>{t('crisisSupport.findHelpline')}</Text>
        <Text style={styles.resourceButtonSublabel}>{t('crisisSupport.findHelplineSublabel')}</Text>
      </Pressable>

      <Text style={styles.footnote}>{t('crisisSupport.footnote')}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  kicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  body: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[8],
  },
  resourceButton: {
    alignSelf: 'stretch',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: radius.full,
    backgroundColor: colors.accent.buttonFill,
    marginBottom: spacing[3],
  },
  resourceButtonLabel: {
    color: colors.onAccent,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
  resourceButtonSublabel: {
    color: colors.onAccent,
    opacity: 0.75,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[1],
  },
  footnote: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    marginTop: spacing[6],
  },
  });
}
