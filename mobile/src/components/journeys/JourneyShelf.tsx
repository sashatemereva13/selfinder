import { useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { useAppAccentRgb } from '../../utils/appAccent';
import { JourneySymbol, type JourneySymbolId } from './JourneySymbol';

// JourneyShelf — one time-orientation's (Past/Present/Future) own row of
// Journey cards, swiped through horizontally. Built for the Journeys
// catalog (2026-09-03 redesign, see docs/journeys-concept.md's "Catalog"
// section for the underlying Past/Present/Future grouping this
// visualizes) — three of these stacked vertically replace the old single
// flat list grouped under text headings ("What the past is still doing
// here" etc.). The redesign's own goal: keep all three time-zones
// visible at once (nothing hidden behind an undiscovered swipe, unlike a
// single horizontal timeline that shows only one zone at a time), while
// giving each zone's own questions a tactile, browsable feel a flat list
// doesn't have.
//
// Distinct from PagedScrollView (src/components/PagedScrollView.tsx) —
// that component pages through full SCREENS one at a time; this is a
// shelf of small CARDS within one screen, closer to a row of options than
// a sequence of destinations. Dot-row conventions (padded tap targets,
// active/inactive via opacity not a new hue) are intentionally carried
// over from PagedScrollView for visual consistency across the app, but
// the dots here are a passive position indicator only — not independently
// tappable navigation, since jumping to card 4 by tapping a dot isn't a
// meaningful action the way jumping to a whole screen is.
export interface JourneyShelfItem {
  key: string;
  name: string;
  question: string;
  symbolId: JourneySymbolId;
  onPress: () => void;
}

interface JourneyShelfProps {
  label: string;
  items: JourneyShelfItem[];
}

const CARD_WIDTH = 190;
const CARD_GAP = spacing[3];

export function JourneyShelf({ label, items }: JourneyShelfProps) {
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_GAP));
    if (index !== activeIndex) setActiveIndex(index);
  };

  return (
    <View style={styles.root}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + CARD_GAP}
        snapToAlignment="start"
        contentContainerStyle={styles.track}
        onScroll={handleScroll}
        scrollEventThrottle={32}
      >
        {items.map((item) => (
          <Pressable
            key={item.key}
            style={styles.card}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}. ${item.question}`}
          >
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardQuestion}>{item.question}</Text>
            <View style={styles.symbolWrap} importantForAccessibility="no-hide-descendants">
              <JourneySymbol id={item.symbolId} rgb={accentRgb} size={72} />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {items.length > 1 && (
        <View style={styles.dotsRow} importantForAccessibility="no-hide-descendants">
          {items.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex
                  ? { backgroundColor: `rgb(${accentRgb})`, opacity: 0.9, width: 12, borderRadius: 2 }
                  : { backgroundColor: colors.text.faint, opacity: 0.6 },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { marginBottom: spacing[8] },
    labelRow: { paddingHorizontal: spacing[6], marginBottom: spacing[3] },
    // Same demoted, confirming-not-primary register the flat-list
    // redesign established — this label exists so someone who wants to
    // browse by time-orientation can, not as the primary wayfinding
    // mechanism (recognition happens on the question inside each card).
    label: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    track: { paddingHorizontal: spacing[6], gap: CARD_GAP },
    // 2026-09-03: no border — matches the "draw a symbol" card's own
    // material (cards/index.tsx's cardPlane: colors.bg.elevated, rounded
    // corners, zero border) rather than an outlined box. RULES.md's "no
    // cards" rule targets bordered/filled boxes used as the DEFAULT way
    // to separate a list of items; a raised, borderless surface reused
    // from an existing single-card screen's own material is a deliberate
    // exception, not a reintroduction of that pattern — the border is
    // what read as "generic UI box," not the elevated surface itself.
    card: {
      width: CARD_WIDTH,
      paddingVertical: spacing[4],
      paddingHorizontal: spacing[4],
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
    },
    cardName: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: 9,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginTop: spacing[3],
      marginBottom: spacing[2],
    },
    // 2026-09-09: was the last of two lines (name/question) — the symbol
    // now sits below it (see symbolWrap), so this needs its own
    // marginBottom again to separate from what follows.
    cardQuestion: {
      color: colors.accent.ivory,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginBottom: spacing[3],
    },
    // Centers the symbol horizontally in the card, below the question —
    // the symbol reads as the card's own quiet second half, not another
    // line of text competing with name/question for the eye.
    symbolWrap: {
      alignItems: 'center',
      marginTop: spacing[1],
    },
    dotsRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[1],
      marginTop: spacing[3],
    },
    dot: { width: 4, height: 4, borderRadius: 2 },
  });
}
