import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { track } from '../../../../src/utils/analytics';

export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const resetInterview = useMeasureStore((s) => s.resetInterview);
  const currentResult = useMeasureStore((s) => s.currentResult);

  const accentColor = philosopher?.color ?? colors.brand.purple;
  const hasMeasuredBefore = Boolean(currentResult);

  const handleBegin = () => {
    resetInterview();
    track('measure_started');
    router.push('/(tabs)/depths/measure/interview');
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
        <Text style={styles.kicker}>Frequency Check-In</Text>
        <Text style={styles.title}>
          A conversation to read{'\n'}where you are right now
        </Text>
        {!hasMeasuredBefore && (
          <Text style={styles.copy}>
            {philosopher?.name ?? 'Your philosopher'} will ask you about four sides of your
            life — body, mind, heart, and spirit. Share what is actually true, not what you
            think it should be. The reading emerges from what you say.
          </Text>
        )}

        {currentResult && (
          <Text style={styles.lastReading}>
            Last reading: {currentResult.vibrationLevel.name} · {currentResult.vibrationScore}
          </Text>
        )}
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={handleBegin}
        >
          <Text style={styles.buttonText}>Begin the conversation</Text>
        </Pressable>

        {hasMeasuredBefore && (
          <Pressable
            style={styles.spillLink}
            onPress={() => router.push('/(tabs)/depths/spill')}
          >
            <Text style={styles.spillLinkText}>Or, just write it out →</Text>
          </Pressable>
        )}
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
    paddingBottom: spacing[2],
  },
  backLink: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
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
  lastReading: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
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
  spillLink: {
    alignItems: 'center',
    paddingTop: spacing[4],
  },
  spillLinkText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
  },
});
