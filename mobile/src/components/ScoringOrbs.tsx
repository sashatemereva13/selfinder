import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '../theme/useThemeColors';
import { spacing } from '../theme/spacing';

/** Mirrors web's .measure-scoringOrb pulse (measure.css): 1.4s ease-in-out loop,
 * scale 1→1.4 / opacity 0.5→1, staggered 0.2s per dot, alternating purple/blue. */
function Orb({ delayMs, color }: { delayMs: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.4 }],
    opacity: 0.5 + progress.value * 0.5,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
}

export function ScoringOrbs() {
  const colors = useThemeColors();
  // This loading indicator fires before Measure knows what level you are —
  // no reading exists yet to color it by — so it uses the level-agnostic
  // ivory accent at two opacities rather than a pair of axis hues, which
  // used to alternate two unrelated purples pulled from two different files
  // (colors.axis.spirit and measureConfig's AXIS_COLORS.clarity) for no real
  // reason beyond "both were purple-ish."
  const dotColors = [colors.accent.ivory, `${colors.accent.ivory}b3`];
  return (
    <View style={styles.row}>
      {dotColors.map((color, i) => (
        <Orb key={i} delayMs={i * 200} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
