import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing } from '../theme/spacing';

// The shared terminal screen for every Journey's ending — a pure
// quote-back of the person's own opening and closing answers, never an
// AI-generated summary or interpretation (see docs/journeys-concept.md's
// hard "never AI-interpreted ending" rule, and the plan's own Key
// Decision 4: the reflection makes zero AI calls). One shared component
// across all Journeys, not a per-Journey route — swapped in by
// JourneyWizard's onComplete in place of navigating anywhere, mirroring
// aesthetic.md's "one reading, one screen" lesson: a second screen that
// just repeats what's already known is the exact redundancy bug that
// rule exists to prevent.
interface JourneyReflectionProps {
  beganLabelKey: string;
  beganAnswer: string;
  arrivedLabelKey: string;
  arrivedAnswer: string;
}

export function JourneyReflection({ beganLabelKey, beganAnswer, arrivedLabelKey, arrivedAnswer }: JourneyReflectionProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.label}>{t(beganLabelKey)}</Text>
      <Text style={styles.quote}>{`"${beganAnswer}"`}</Text>

      <Text style={[styles.label, styles.secondLabel]}>{t(arrivedLabelKey)}</Text>
      <Text style={styles.quote}>{`"${arrivedAnswer}"`}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    content: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing[8],
      paddingVertical: spacing[12],
      gap: spacing[3],
    },
    label: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: 'center',
    },
    secondLabel: { marginTop: spacing[8] },
    quote: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.md,
      lineHeight: fontSizes.md * lineHeights.normal,
      textAlign: 'center',
    },
  });
}
