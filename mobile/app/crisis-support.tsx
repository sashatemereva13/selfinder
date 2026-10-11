import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { crisisResources } from '../src/utils/safety';
import { track } from '../src/utils/analytics';
import { BackLink } from '../src/components/shared/BackLink';

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
// 2026-10-10 — the crisis safety net reaches here from the conversation,
// Journeys, Measure, Spill, a Shift session, the heavy states' quiet
// line, and the always-there "Need help now?" links — no longer only the
// wish flow, so the copy is about the person, not a wish. The line shown
// is the one for the phone's country (crisisResources), with the local
// emergency number and a directory for everywhere else.
export default function CrisisSupportScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // from=measure: shown right after a reading, before it — the way on is
  // the reading itself.
  const { from } = useLocalSearchParams<{ from?: string }>();
  const resources = crisisResources();

  useEffect(() => {
    track('crisis_support_viewed', { from: from ?? 'other' });
  }, [from]);

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/depths');
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <BackLink style={styles.backRow} onPress={leave} />

      <Text style={styles.kicker}>{t('crisisSupport.kicker')}</Text>
      <Text style={styles.title}>{t('crisisSupport.title')}</Text>
      <Text style={styles.body}>{t('crisisSupport.body')}</Text>

      {resources.line && (
        <Pressable style={styles.resourceButton} onPress={() => Linking.openURL(`tel:${resources.line!.number}`)}>
          <Text style={styles.resourceButtonLabel}>{t('crisisSupport.callLine', { name: resources.line.name })}</Text>
          <Text style={styles.resourceButtonSublabel}>{t('crisisSupport.callLineSublabel')}</Text>
        </Pressable>
      )}

      <Pressable style={styles.resourceButton} onPress={() => Linking.openURL(resources.directoryUrl)}>
        <Text style={styles.resourceButtonLabel}>{t('crisisSupport.findHelpline')}</Text>
        <Text style={styles.resourceButtonSublabel}>{t('crisisSupport.findHelplineSublabel')}</Text>
      </Pressable>

      <Pressable onPress={() => Linking.openURL(`tel:${resources.emergency}`)} accessibilityRole="button">
        <Text style={styles.emergency}>{t('crisisSupport.emergency', { number: resources.emergency })}</Text>
      </Pressable>

      <Pressable onPress={leave} accessibilityRole="button" style={styles.stayRow}>
        <Text style={styles.stay}>{from === 'measure' ? t('crisisSupport.continueToReading') : t('crisisSupport.stay')} →</Text>
      </Pressable>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
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
  emergency: {
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    marginTop: spacing[3],
  },
  stayRow: { marginTop: spacing[10] },
  stay: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  });
}
