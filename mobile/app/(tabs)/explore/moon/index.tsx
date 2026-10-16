import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../../src/theme/typography';
import { spacing } from '../../../../src/theme/spacing';
import { MoonPhaseDisc } from '../../../../src/components/depths/MoonPhaseDisc';
import { BackLink } from '../../../../src/components/shared/BackLink';
import { getMoonPhaseFraction, getMoonPhaseInfo, MOON_PHASE_CONTENT } from '../../../../src/content/moonConfig';

export default function MoonScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  const moon = useMemo(() => {
    const now = new Date();
    const fraction = getMoonPhaseFraction(now);
    const { name } = getMoonPhaseInfo(fraction);
    return { fraction, name, content: MOON_PHASE_CONTENT[name] };
  }, []);

  // 2026-10-16 — the moon tonight, in sentences: the moon itself, a real
  // sentence naming its phase, then its reflection and one practice. The
  // "MOON" label and title, the emoji, the stage badge, the three stat
  // boxes, the boxed sections, and the links on to other places (a second
  // menu — RULES.md, "no screen keeps its own menu") are gone.
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <BackLink style={styles.backRow} />

      <View style={styles.discBlock}>
        <MoonPhaseDisc fraction={moon.fraction} />
      </View>

      <Text style={styles.tonight}>
        {t('moon.tonight', { phase: moon.name.toLowerCase() })} {moon.content.nature}
      </Text>
      <Text style={styles.body}>{moon.content.reflection}</Text>
      <Text style={styles.practice}>{moon.content.practice}</Text>
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[5] },
    backRow: { alignSelf: 'flex-start', paddingBottom: spacing[4] },
    discBlock: { alignItems: 'center', paddingVertical: spacing[6] },
    tonight: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
    },
    body: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
    },
    practice: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
  });
}
