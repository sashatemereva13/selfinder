import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { useSpillStore } from '../../../../src/store/spillStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { useAppAccentRgb } from '../../../../src/utils/appAccent';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { track } from '../../../../src/utils/analytics';

export default function SpillScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reset = useSpillStore((s) => s.reset);
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  useEffect(() => {
    markDiscovered('spill');
  }, []);

  const handleBegin = () => {
    reset();
    track('spill_started');
    router.push('/(tabs)/depths/spill/write');
  };

  return (
    <View style={styles.root}>
      <AmbientGlow />

      <Pressable
        style={[styles.backRow, { paddingTop: insets.top + spacing[4] }]}
        onPress={() => router.back()}
      >
        <Text style={styles.backLink}>← Back</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.kicker}>Spill</Text>
        <Text style={styles.title}>Write without looking back</Text>
        <Text style={styles.copy}>
          For one minute, just keep writing. Whatever comes, in any order, without editing
          it — you'll only ever see the word you're writing right now, nothing before it.
          When the minute is up, you can read the whole thing back.
        </Text>
        <Text style={styles.copy}>
          There's no wrong way to do this. Typos, half-thoughts, and repeats are part of it.
        </Text>
      </View>

      <View style={styles.footer}>
        <Pressable style={[styles.button, { backgroundColor: accentColor }]} onPress={handleBegin}>
          <Text style={styles.buttonText}>Begin</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  backRow: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  backLink: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[4],
  },
  footer: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[10],
  },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.tight,
  },
  copy: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  button: {
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
  },
  buttonText: {
    color: colors.bg.base,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
});
