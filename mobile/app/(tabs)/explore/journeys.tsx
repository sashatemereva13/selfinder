import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../src/store/themeStore';
import type { Colors } from '../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { GatherIn } from '../../../src/components/shared/GatherIn';
import { AmbientGlow } from '../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../src/components/shared/BackLink';
import { JourneyShelf } from '../../../src/components/journeys/JourneyShelf';
import { type JourneySymbolId } from '../../../src/components/journeys/JourneySymbol';
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
  // The physics/math symbol standing in for this Journey on its own card
  // (see JourneySymbol.tsx's own header comment) — added 2026-09-09 at
  // the user's own request, replacing plain text with a symbol the same
  // way Cards' own "draw a symbol" deck does, each one chosen to
  // structurally match the Journey's real psychological mechanism rather
  // than illustrate the question literally.
  symbolId: JourneySymbolId;
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
// screen.
//
// 2026-08-23: replaced the earlier placeholder Either/Or and Identity
// entries with this question-first catalog (label is the question in the
// user's own voice, e.g. "What am I really trying to control?" — see
// docs/journeys-concept.md's "Catalog" section for why).
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
  { key: 'control', labelKey: 'products.controlLabel', descriptionKey: 'products.controlDescription', symbolId: 'control', route: '/control', temporal: 'present' },
  { key: 'the-choice', labelKey: 'products.theChoiceLabel', descriptionKey: 'products.theChoiceDescription', symbolId: 'theChoice', route: '/the-choice', temporal: 'present' },
  { key: 'the-loop', labelKey: 'products.theLoopLabel', descriptionKey: 'products.theLoopDescription', symbolId: 'theLoop', route: '/the-loop', temporal: 'past' },
  { key: 'whose-voice', labelKey: 'products.whoseVoiceLabel', descriptionKey: 'products.whoseVoiceDescription', symbolId: 'whoseVoice', route: '/whose-voice', temporal: 'past' },
  { key: 'the-road-not-taken', labelKey: 'products.theRoadNotTakenLabel', descriptionKey: 'products.theRoadNotTakenDescription', symbolId: 'theRoadNotTaken', route: '/the-road-not-taken', temporal: 'past' },
  { key: 'letting-go', labelKey: 'products.lettingGoLabel', descriptionKey: 'products.lettingGoDescription', symbolId: 'lettingGo', route: '/letting-go', temporal: 'past' },
  { key: 'the-mirror', labelKey: 'products.theMirrorLabel', descriptionKey: 'products.theMirrorDescription', symbolId: 'theMirror', route: '/the-mirror', temporal: 'present' },
  { key: 'the-unsaid', labelKey: 'products.theUnsaidLabel', descriptionKey: 'products.theUnsaidDescription', symbolId: 'theUnsaid', route: '/the-unsaid', temporal: 'present' },
  { key: 'becoming', labelKey: 'products.becomingLabel', descriptionKey: 'products.becomingDescription', symbolId: 'becoming', route: '/becoming', temporal: 'future' },
  { key: 'the-threshold', labelKey: 'products.theThresholdLabel', descriptionKey: 'products.theThresholdDescription', symbolId: 'theThreshold', route: '/the-threshold', temporal: 'future' },
  { key: 'possible-selves', labelKey: 'products.possibleSelvesLabel', descriptionKey: 'products.possibleSelvesDescription', symbolId: 'possibleSelves', route: '/possible-selves', temporal: 'future' },
  { key: 'enough', labelKey: 'products.enoughLabel', descriptionKey: 'products.enoughDescription', symbolId: 'enough', route: '/enough', temporal: 'present' },
];

const TEMPORAL_GROUPS: { key: TemporalGroup; headingKey: string }[] = [
  { key: 'past', headingKey: 'products.groupPast' },
  { key: 'present', headingKey: 'products.groupPresent' },
  { key: 'future', headingKey: 'products.groupFuture' },
];

// 2026-09-03: replaced the flat, vertically-stacked row list (grouped
// under text headings, one full-width row per Journey) with three
// horizontally-swiped shelves, one per time-orientation — see
// JourneyShelf.tsx's own header comment for the full design rationale.
// Past/Present/Future stays a VERTICAL sequence (all three shelves
// visible together, nothing hidden behind an undiscovered swipe) while
// each shelf's own Journeys swipe HORIZONTALLY as cards — the version the
// user asked for after comparing three prototyped layouts (a refined flat
// list, a single horizontal timeline, and a Depths-style radial orbit):
// vertical time-order plus horizontal per-row browsing, without the
// orbit's discoverability risk for a first-time visitor.
// Deeper questions — the Journeys, on their own screen since 2026-10-09
// (they used to fill most of Explore, which made a list of quick
// experiences into a catalogue). Reached from Explore's "Understand"
// group, and from the end of a Shift session when one fits the state.
export default function JourneysScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.rootWrap}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
      >
      {theme === 'dark' && <AmbientGlow />}

      {/* The page gathers in top to bottom as it comes into view — title
          first, then each shelf in turn (see GatherIn) — rather than all
          of it, heavy carousels included, landing in one frame. */}
      <GatherIn>
      <BackLink style={styles.backRow} />
      <Text style={styles.title} accessibilityRole="header">{t('explore.deeperTitle')}</Text>
      <Text style={styles.intro}>{t('explore.deeperIntro')}</Text>
      {/* Where the per-card "Grounded in..." line used to be read by anyone
          who wanted it — moved to its own page (2026-09-09, at the user's
          own request) so every card can just be the question, with the
          research attribution one tap away instead of printed on all 12
          cards at once. See journeys-grounding.tsx's own header comment. */}
      <Pressable onPress={() => router.push('/journeys-grounding')} style={styles.groundingLinkRow}>
        <Text style={styles.groundingLink}>{t('products.groundingLink')}</Text>
      </Pressable>
      </GatherIn>

      {TEMPORAL_GROUPS.map((group, i) => {
        const items = PRODUCTS.filter((p) => p.temporal === group.key);
        if (items.length === 0) return null;
        return (
          <GatherIn key={group.key} delay={140 + i * 140}>
          <JourneyShelf
            label={t(group.headingKey)}
            items={items.map((product) => ({
              key: product.key,
              name: t(product.labelKey),
              question: t(product.descriptionKey),
              symbolId: product.symbolId,
              onPress: () => router.push(product.route),
            }))}
          />
          </GatherIn>
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
  content: { paddingBottom: spacing[12] },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    paddingHorizontal: spacing[6],
  },
  backRow: { paddingHorizontal: spacing[6], paddingBottom: spacing[6], alignSelf: 'flex-start' },
  intro: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.5,
    paddingHorizontal: spacing[6],
    marginTop: spacing[2],
  },
  groundingLinkRow: {
    paddingHorizontal: spacing[6],
    marginTop: spacing[2],
    marginBottom: spacing[8],
  },
  groundingLink: {
    color: colors.accent.ivory,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  });
}
