import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '../theme/useThemeColors';
import { spacing } from '../theme/spacing';

/** Mirrors web's .measure-typingDot bounce (measure.css): 1.2s ease-in-out loop,
 * peak at 40%, staggered 0.18s per dot. */
function Dot({ delayMs, color }: { delayMs: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 480, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 480, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 240 })
        ),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -5 * progress.value }],
    opacity: 0.45 + 0.55 * progress.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, animatedStyle]} />;
}

export function TypingDots({ color }: { color?: string }) {
  const colors = useThemeColors();
  const dotColor = color ?? colors.text.secondary;

  return (
    <View style={styles.row}>
      <Dot delayMs={0} color={dotColor} />
      <Dot delayMs={180} color={dotColor} />
      <Dot delayMs={360} color={dotColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[1] },
  dot: { width: 5, height: 5, borderRadius: 3 },
});
