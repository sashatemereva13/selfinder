import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import type { Colors } from '../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../src/theme/typography';
import { spacing } from '../../../src/theme/spacing';
import { GatherIn } from '../../../src/components/shared/GatherIn';
import { TimeCone } from '../../../src/components/yourArc/TimeCone';
import { useArcPastPoints } from '../../your-arc';

// Your Arc's welcome (2026-10-29): before the cone, a short word on what
// Your Arc is and what's in it, with a small still cone of your own
// points. "Enter" opens the full cone screen (pushed on top, with the
// app's usual soft fade — a growing-cone hand-over was tried and lagged on
// device); a swipe back returns here.

const CONE_W = 150;
const CONE_H = 220;

export default function YourArcWelcome() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pastPoints = useArcPastPoints();

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[8] }]}>
      <GatherIn>
        <Text style={styles.title} accessibilityRole="header">{t('yourArc.welcomeTitle')}</Text>
        <Text style={styles.body}>{t('yourArc.welcomeBody')}</Text>
        <Text style={styles.body}>{t('yourArc.welcomeShape')}</Text>
        <Text style={styles.note}>{t('yourArc.welcomeConstruction')}</Text>
      </GatherIn>

      <GatherIn delay={180} style={styles.coneArea}>
        <View pointerEvents="none">
          <TimeCone width={CONE_W} height={CONE_H} pastPoints={pastPoints} futurePoints={[]} hideNowLabel showEternalNowPlane />
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/your-arc/cone')}
          accessibilityRole="button"
          style={({ pressed }) => [styles.enter, pressed && { opacity: 0.6 }]}
        >
          <Text style={styles.hint}>{t('yourArc.welcomeHint')} →</Text>
        </Pressable>
      </GatherIn>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base, paddingHorizontal: spacing[6] },
    title: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xl,
      lineHeight: fontSizes.xl * 1.15,
      color: colors.text.primary,
      marginBottom: spacing[4],
    },
    body: {
      fontFamily: fonts.voice,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      color: colors.text.secondary,
      marginBottom: spacing[3],
    },
    note: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      color: colors.text.muted,
      marginTop: spacing[2],
    },
    coneArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    enter: { paddingVertical: spacing[3], paddingHorizontal: spacing[5], marginTop: spacing[2] },
    hint: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      color: colors.text.primary,
    },
  });
}
