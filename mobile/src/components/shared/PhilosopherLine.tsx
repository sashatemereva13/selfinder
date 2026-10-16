import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { usePhilosopherStore } from '../../store/philosopherStore';
import { useLocaleStore } from '../../store/localeStore';
import { useAppAccentTextRgb } from '../../utils/appAccent';
import { ExploreRoom, getExploreLine } from '../../content/exploreVoices';
import { PhilosopherObject } from './PhilosopherObject';

// The philosopher's one line at the top of Breathe, Tune In and Spill
// (2026-10-16) — their mark and name, then the line in their voice. It
// replaces the jargon labels ("REGULATION LAYER") and explaining
// paragraphs those screens used to open with.
export function PhilosopherLine({ room, align = 'left' }: { room: ExploreRoom; align?: 'left' | 'center' }) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const locale = useLocaleStore((s) => s.locale);
  const accentTextRgb = useAppAccentTextRgb();
  const center = align === 'center';
  return (
    <View style={[styles.root, center && styles.center]}>
      {philosopher && (
        <View style={styles.byline}>
          <PhilosopherObject id={philosopher.id} rgb={accentTextRgb} size={16} />
          <Text style={[styles.name, { color: `rgb(${accentTextRgb})` }]}>{philosopher.name}</Text>
        </View>
      )}
      <Text style={[styles.line, center && styles.lineCenter]}>
        {getExploreLine(philosopher?.id, room, locale)}
      </Text>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { alignSelf: 'stretch', gap: spacing[2], marginBottom: spacing[6] },
    center: { alignItems: 'center' },
    byline: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
    name: { fontFamily: fonts.medium, fontSize: fontSizes.xs },
    line: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
    },
    lineCenter: { textAlign: 'center' },
  });
}
