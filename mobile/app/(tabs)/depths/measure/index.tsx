import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';

export default function TodayScreen() {
  const router = useRouter();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const resetInterview = useMeasureStore((s) => s.resetInterview);
  const currentResult = useMeasureStore((s) => s.currentResult);

  const accentColor = philosopher?.color ?? colors.brand.purple;

  const handleBegin = () => {
    resetInterview();
    router.push('/(tabs)/depths/measure/interview');
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <Text style={styles.kicker}>Frequency Check-In</Text>
        <Text style={styles.title}>
          A conversation to read where you are right now
        </Text>
        <Text style={styles.copy}>
          {philosopher?.name ?? 'Your philosopher'} will ask you about four sides of your
          life — body, mind, heart, and spirit. Share what is actually true, not what you
          think it should be. The reading emerges from what you say.
        </Text>

        {currentResult && (
          <Text style={styles.lastReading}>
            Last reading: {currentResult.vibrationLevel.name} · {currentResult.vibrationScore}
          </Text>
        )}

        <Pressable
          style={[styles.button, { backgroundColor: accentColor }]}
          onPress={handleBegin}
        >
          <Text style={styles.buttonText}>Begin the conversation</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  content: {
    gap: spacing[4],
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
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * lineHeights.tight,
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
    marginTop: spacing[4],
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
