import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { AmbientGlow } from '../../../src/components/AmbientGlow';
import { ProfileIcon } from '../../../src/components/ProfileIcon';
import { JourneyKey } from '../../../src/types';

// The three temporal groups a Journey's own movement belongs to (see
// docs/journeys-concept.md's "Catalog" section) — PAST -> NOW (something
// formed/happened/was lost, examined for how it exists now), PRESENT
// (excavating what's underneath a current want/reaction, no history or
// future projection required), FUTURE <- NOW (movement toward an
// imagined future and back). Center sits outside all three — it's a
// generated visualization of the record, not a question sequence, so it
// doesn't have a "movement" in this sense at all.
type TemporalGroup = 'past' | 'present' | 'future';

interface Product {
  // Checked against shared/journeyKeys.mjs's own list at the type level
  // (via JourneyKey) — a typo'd future entry now fails `tsc --noEmit`.
  key: JourneyKey;
  labelKey: string;
  descriptionKey: string;
  // A plain string, not a closed union of known routes — Journeys are an
  // explicitly open-ended, growing family (2026-08-23 pivot, see RULES.md's
  // Product/positioning section), so this list is expected to keep
  // growing without needing this type edited for every new entry. This is
  // a deliberately different axis from `key` above: `key` is checked
  // against the shared enum of valid Journeys, `route` is just an
  // arbitrary path string wired up per screen.
  route: string;
  // Absent only for Center — every question-sequence Journey belongs to
  // exactly one of the three groups above.
  temporal?: TemporalGroup;
}

// The catalog of Journeys — one-time-purchase experiences, standalone from
// Your Arc's ongoing subscription (see RULES.md's Product/positioning
// section for the full definition, and docs/journeys-concept.md for the
// full architecture: a Journey is a designed sequence of questions, not
// content Selfinder gives the user). Built as a real array (same
// SOURCES/HOW_TO_USE_ENTRIES pattern as sources/index.tsx and
// howToUseEntries.ts) so a future Journey is a new entry here, not a new
// screen. Control is the only one with real content today; the rest are
// named, reachable, honest "not yet available" placeholders (see each
// route's own file, all sharing JourneyComingSoonScreen) — not dead
// links, since a catalog entry that goes nowhere would be exactly the
// kind of tap-target-that-looks-like-a-purchase-and-doesn't this
// project's own standing rule warns against.
//
// 2026-08-23: replaced the earlier placeholder Either/Or and Identity
// entries with this question-first catalog (label is the question in the
// user's own voice, e.g. "What am I really trying to control?" — see
// docs/journeys-concept.md's "Catalog" section for why). Control is the
// reference implementation for how a Journey's architecture actually
// gets designed once it's built for real, and the only one with a real
// build behind it today — the rest are honest "not yet available"
// placeholders (see JourneyComingSoonScreen).
//
// 2026-08-26: grouped by temporal orientation (see docs/journeys-
// concept.md's "Catalog" section for the full reasoning) rather than one
// flat list — 4 Past, 5 Present, 3 Future, an asymmetry that's itself
// meaningful, not arbitrary. Order within the array still matches
// docs/journeys-concept.md's own group tables; the render below groups
// by `temporal`, not by array order alone, so the array itself doesn't
// need to be re-sorted if a future addition lands out of group order.
//
// 2026-08-28: Center's own entry removed from this catalog — it moved to
// a real, prominent home on Your Arc's own screen (2026-08-27
// restructure, see docs/app-architecture-concept.md, "Center's home").
// Listing it in both places read as duplication/confusion rather than
// helpful cross-listing once tried live — Your Arc is now Center's one
// true home, and this catalog is purely the 11-Journey question set.
const PRODUCTS: Product[] = [
  { key: 'control', labelKey: 'products.controlLabel', descriptionKey: 'products.controlDescription', route: '/control', temporal: 'present' },
  { key: 'the-choice', labelKey: 'products.theChoiceLabel', descriptionKey: 'products.theChoiceDescription', route: '/the-choice', temporal: 'present' },
  { key: 'the-loop', labelKey: 'products.theLoopLabel', descriptionKey: 'products.theLoopDescription', route: '/the-loop', temporal: 'past' },
  { key: 'whose-voice', labelKey: 'products.whoseVoiceLabel', descriptionKey: 'products.whoseVoiceDescription', route: '/whose-voice', temporal: 'past' },
  { key: 'the-road-not-taken', labelKey: 'products.theRoadNotTakenLabel', descriptionKey: 'products.theRoadNotTakenDescription', route: '/the-road-not-taken', temporal: 'past' },
  { key: 'letting-go', labelKey: 'products.lettingGoLabel', descriptionKey: 'products.lettingGoDescription', route: '/letting-go', temporal: 'past' },
  { key: 'the-mirror', labelKey: 'products.theMirrorLabel', descriptionKey: 'products.theMirrorDescription', route: '/the-mirror', temporal: 'present' },
  { key: 'the-unsaid', labelKey: 'products.theUnsaidLabel', descriptionKey: 'products.theUnsaidDescription', route: '/the-unsaid', temporal: 'present' },
  { key: 'becoming', labelKey: 'products.becomingLabel', descriptionKey: 'products.becomingDescription', route: '/becoming', temporal: 'future' },
  { key: 'the-threshold', labelKey: 'products.theThresholdLabel', descriptionKey: 'products.theThresholdDescription', route: '/the-threshold', temporal: 'future' },
  { key: 'possible-selves', labelKey: 'products.possibleSelvesLabel', descriptionKey: 'products.possibleSelvesDescription', route: '/possible-selves', temporal: 'future' },
  { key: 'enough', labelKey: 'products.enoughLabel', descriptionKey: 'products.enoughDescription', route: '/enough', temporal: 'present' },
];

const TEMPORAL_GROUPS: { key: TemporalGroup; headingKey: string }[] = [
  { key: 'past', headingKey: 'products.groupPast' },
  { key: 'present', headingKey: 'products.groupPresent' },
  { key: 'future', headingKey: 'products.groupFuture' },
];

export default function ProductsScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.rootWrap}>
      <ProfileIcon />
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
      >
      {theme === 'dark' && <AmbientGlow />}

      <Text style={styles.title}>{t('products.title')}</Text>
      {/* Standing orientation line — "why would I come here" — kept
          distinct from the commercial-framing line just below it ("what's
          the deal"): two different questions, same reasoning as the tab
          explainer on Depths/Your Arc. */}
      <Text style={styles.tabExplainer}>{t('products.tabExplainer')}</Text>
      <Text style={styles.intro}>{t('products.intro')}</Text>

      {TEMPORAL_GROUPS.map((group) => {
        const items = PRODUCTS.filter((p) => p.temporal === group.key);
        if (items.length === 0) return null;
        return (
          <View key={group.key} style={styles.group}>
            <Text style={styles.groupHeading}>{t(group.headingKey)}</Text>
            {items.map((product) => (
              // Full row weight (label + description), same as
              // sourcesLink/howToUseLink's own rows on the You tab and
              // RULES.md's "a next step earns the same visual weight...
              // if it's meant to be genuinely chosen" rule — this is the
              // entry point to a real purchase, not a footnote link.
              <Pressable key={product.key} style={styles.row} onPress={() => router.push(product.route)}>
                <Text style={styles.rowLabel}>{t(product.labelKey)}</Text>
                <Text style={styles.rowDescription}>{t(product.descriptionKey)}</Text>
              </Pressable>
            ))}
          </View>
        );
      })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: colors.bg.base },
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginBottom: spacing[2],
  },
  tabExplainer: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginBottom: spacing[3],
  },
  intro: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.loose,
    marginBottom: spacing[8],
  },
  group: { marginTop: spacing[8] },
  // Same kicker register as facts/pastReadings sections elsewhere in the
  // app (see your-arc.tsx's own factsKicker) — a plain uppercase label,
  // no box, position and space carrying the grouping rather than a card.
  groupHeading: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
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
