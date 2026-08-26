import { StyleSheet } from 'react-native';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// Styles genuinely shared across 2+ your-arc.tsx pager pages — kept
// separate from each page's own makeStyles (rather than merged into one
// object) so shared-vs-page-owned stays visible at each call site. See
// RULES.md/aesthetic.md for the underlying visual rules these implement.
export function makeSharedArcPageStyles(colors: Colors) {
  return StyleSheet.create({
    // Each swipeable page is its own ScrollView (per PagedScrollView's own
    // contract), so there are two content-container shapes: pageCentered
    // vertically centers short, hero-like pages (Closing) so they don't
    // read as a tall page with content stranded at the top; pageContent is
    // a plain top-anchored padded column for pages with more to read
    // (Facts, wish/Crossing, detail).
    pageCentered: {
      flexGrow: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing[6],
      paddingBottom: spacing[12],
    },
    pageContent: {
      flexGrow: 1,
      padding: spacing[6],
      paddingBottom: spacing[16],
    },
    // "Held, not displayed" — the row itself is a plain sentence (an
    // instruction/label, not a card), no border/box per aesthetic.md's
    // "no cards" rule. Shared between the resurfaced-wish page and the
    // active-wish/Crossing page — both are the same kind of private, held
    // material.
    wishSection: {
      marginBottom: spacing[6],
    },
    wishRow: { paddingVertical: spacing[1] },
    wishRowText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    // Revealed state — same visual register as momentHeading/momentSpillText
    // (the wish is the person's own written words, same kind of material
    // as a kept Spill entry), not a new visual language invented just for
    // this one row.
    wishHeading: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    wishDate: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginTop: spacing[1],
    },
    wishText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[2],
    },
    wishHint: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginTop: spacing[2],
    },
    wishGroundRuleNote: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.xs,
      marginTop: spacing[2],
    },
  });
}
