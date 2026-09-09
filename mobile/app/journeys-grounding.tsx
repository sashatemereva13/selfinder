import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { JourneyKey } from '../src/types';

// The "Where do these come from?" page linked from the Journeys catalog
// (app/(tabs)/journeys/index.tsx) — moved the per-card "Grounded in..."
// line here as its own page rather than showing it on every card, at the
// user's own request: the catalog reads better once each card is just the
// question, and this is the one place, for whoever actually wants it, to
// see what real research shaped each Journey's question sequence. Same
// shape as sources/index.tsx (title, one disclaimer line, then a flat list
// of name + note blocks) — this is the same category of page (attribution
// for design research, not a claim shown inside the product itself), so it
// reuses that page's own structure rather than inventing a new one.
//
// Mirrors docs/journeys-concept.md's own hard boundary: research grounding
// informs which questions a Journey asks and in what order, but is never
// surfaced inside the Journey or used to draw a conclusion about the
// person answering it. This page names the research; it never says what
// the research implies about whoever's reading it.
interface GroundingEntry {
  key: JourneyKey;
  labelKey: string;
  descriptionKey: string;
  groundingKey: string;
}

const ENTRIES: GroundingEntry[] = [
  { key: 'control', labelKey: 'products.controlLabel', descriptionKey: 'products.controlDescription', groundingKey: 'products.controlGrounding' },
  { key: 'the-choice', labelKey: 'products.theChoiceLabel', descriptionKey: 'products.theChoiceDescription', groundingKey: 'products.theChoiceGrounding' },
  { key: 'the-loop', labelKey: 'products.theLoopLabel', descriptionKey: 'products.theLoopDescription', groundingKey: 'products.theLoopGrounding' },
  { key: 'whose-voice', labelKey: 'products.whoseVoiceLabel', descriptionKey: 'products.whoseVoiceDescription', groundingKey: 'products.whoseVoiceGrounding' },
  { key: 'the-road-not-taken', labelKey: 'products.theRoadNotTakenLabel', descriptionKey: 'products.theRoadNotTakenDescription', groundingKey: 'products.theRoadNotTakenGrounding' },
  { key: 'letting-go', labelKey: 'products.lettingGoLabel', descriptionKey: 'products.lettingGoDescription', groundingKey: 'products.lettingGoGrounding' },
  { key: 'the-mirror', labelKey: 'products.theMirrorLabel', descriptionKey: 'products.theMirrorDescription', groundingKey: 'products.theMirrorGrounding' },
  { key: 'the-unsaid', labelKey: 'products.theUnsaidLabel', descriptionKey: 'products.theUnsaidDescription', groundingKey: 'products.theUnsaidGrounding' },
  { key: 'becoming', labelKey: 'products.becomingLabel', descriptionKey: 'products.becomingDescription', groundingKey: 'products.becomingGrounding' },
  { key: 'the-threshold', labelKey: 'products.theThresholdLabel', descriptionKey: 'products.theThresholdDescription', groundingKey: 'products.theThresholdGrounding' },
  { key: 'possible-selves', labelKey: 'products.possibleSelvesLabel', descriptionKey: 'products.possibleSelvesDescription', groundingKey: 'products.possibleSelvesGrounding' },
  { key: 'enough', labelKey: 'products.enoughLabel', descriptionKey: 'products.enoughDescription', groundingKey: 'products.enoughGrounding' },
];

export default function JourneysGroundingScreen() {
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

      <Text style={styles.title}>{t('journeysGrounding.title')}</Text>
      <Text style={styles.disclaimer}>{t('journeysGrounding.disclaimer')}</Text>

      {ENTRIES.map((entry, i) => (
        <View
          key={entry.key}
          style={[styles.entryBlock, i === ENTRIES.length - 1 && styles.entryBlockLast]}
        >
          <Text style={styles.entryName}>{t(entry.labelKey)}</Text>
          <Text style={styles.entryQuestion}>{t(entry.descriptionKey)}</Text>
          <Text style={styles.entryGrounding}>{t(entry.groundingKey)}</Text>
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
    backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
    title: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xl,
      lineHeight: fontSizes.xl * lineHeights.tight,
      marginBottom: spacing[5],
    },
    disclaimer: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.loose,
      marginBottom: spacing[10],
    },
    entryBlock: {
      marginBottom: spacing[8],
      paddingBottom: spacing[8],
      borderBottomWidth: 1,
      borderBottomColor: colors.bg.border,
    },
    entryBlockLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    entryName: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginBottom: spacing[2],
    },
    entryQuestion: {
      color: colors.accent.ivory,
      fontFamily: fonts.medium,
      fontSize: fontSizes.md,
      lineHeight: fontSizes.md * lineHeights.normal,
      marginBottom: spacing[2],
    },
    entryGrounding: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.loose,
    },
  });
}
