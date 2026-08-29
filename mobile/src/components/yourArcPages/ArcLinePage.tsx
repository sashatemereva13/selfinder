import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ArcLinePageProps {
  arcLine: string | null;
}

// Your Arc's opening page (2026-08-22: previously Cover, above the
// kaleidoscope — now the pager's first page since Cover and the time cone
// both spun out into Center, see RULES.md's Product/positioning section).
// Deliberately the quietest page in the whole pager, opening onto Facts
// (dense: stat rows, past-readings list) with a breath first rather than
// launching straight into the densest content.
export function ArcLinePage({ arcLine }: ArcLinePageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.arcLinePageContent}>
      <Text style={styles.coverPhilosopherLine}>{`"${arcLine ?? t('yourArc.coneFramingLine')}"`}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    arcLinePageContent: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing[8],
    },
    // Philosopher voice — no fontStyle: 'italic' (a silent no-op on this
    // typeface); quote marks in the string carry the "this is spoken"
    // signal instead of a slant that was never rendering.
    //
    // 2026-08-29: bumped from sm/secondary (the same weight every other
    // page uses for plain body text) to base/primary — this line is the
    // entire content of the page, not an aside, so it should read as this
    // page's headline even though the page stays visually quiet overall
    // (no kicker, generous whitespace) per its own opening-breath role.
    coverPhilosopherLine: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      textAlign: 'center',
    },
  });
}
