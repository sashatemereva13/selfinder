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
import { colors } from '../theme/colors';
import { AXIS_COLORS } from '../content/measureConfig';
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

const DOT_COLORS = [
  `rgb(${colors.axis.spirit})`,
  `rgb(${AXIS_COLORS.clarity})`,
  `rgb(${colors.axis.spirit})`,
  `rgb(${AXIS_COLORS.clarity})`,
];

export function ScoringOrbs() {
  return (
    <View style={styles.row}>
      {DOT_COLORS.map((color, i) => (
        <Orb key={i} delayMs={i * 200} color={color} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
