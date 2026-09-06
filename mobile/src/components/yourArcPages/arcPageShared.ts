import { StyleSheet } from 'react-native';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

// Styles genuinely shared across 2+ your-arc.tsx pager pages — kept
// separate from each page's own makeStyles (rather than merged into one
// object) so shared-vs-page-owned stays visible at each call site. See
// RULES.md/aesthetic.md for the underlying visual rules these implement.
//
// 2026-08-29 hierarchy pass: every page was leaning on the same sm/light/
// secondary style for 4-5 different content roles (a stat, a description,
// an answer, a wish) with no distinct "this is the headline" treatment —
// read as flat. Fix is size/color only, per RULES.md's "one typeface,
// hierarchy via size not weight" (fonts.light and fonts.medium are
// currently the same file, so weight was never a real lever anyway).
// Three registers now apply consistently across every page in the pager:
//   kicker   — xs/muted/uppercase/kicker-spacing (page or section label)
//   headline — md/primary (the one thing this page exists to show —
//              DetailPage's own detailLevel/TimeConePage's
//              conePointSummaryLevel already used this; now shared here
//              so every page reaches for the same recipe instead of each
//              inventing its own)
//   body     — sm/secondary (the main supporting prose)
//   aside    — xs/faint (secondary/incidental: hints, disclaimers,
//              metadata that isn't the page's own date/kicker)
// Dates specifically use dateLabel (xs/muted/uppercase/wide) everywhere —
// previously DetailPage/TimeConePage styled dates this way while
// FactsPage/ResurfacedWishPage used two other, inconsistent treatments.
export function makeSharedArcPageStyles(colors: Colors) {
  return StyleSheet.create({
    // Identical to FactsPage/TimeConePage/WishCrossingPage's own
    // page-local `kicker` style (not deduplicated there — out of scope
    // for this pass) — JourneysPage.tsx uses this shared one rather than
    // adding a 4th copy.
    kicker: {
      alignSelf: 'flex-start',
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    headline: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.md,
    },
    dateLabel: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textTransform: 'uppercase',
      letterSpacing: letterSpacings.wide,
    },
    aside: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    // The documented "body" register (sm/secondary) — was described in
    // this file's own header comment but never actually declared as a
    // reusable style; every page instead had its own equivalently-styled
    // one-off (wishText, factLine, momentAnswer, etc.). Added as a real
    // shared style for JourneysPage.tsx's own quoted-answer/synthesis text
    // rather than adding yet another one-off.
    body: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    // A person's own words, quoted back — same register wishText/
    // momentSpillText already use (italic sm/secondary) for this exact
    // kind of material.
    quoteText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
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
    // Same recipe as the shared dateLabel above (xs/muted/uppercase/wide)
    // — was previously xs/faint/no-letterspacing, the one date treatment
    // in the whole pager that didn't match DetailPage/TimeConePage's.
    wishDate: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textTransform: 'uppercase',
      letterSpacing: letterSpacings.wide,
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
