import { ReactNode, useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useIsFocused } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const GATHER_EASE = Easing.bezier(0.33, 0, 0.2, 1);
const DURATION = 600;
const RISE = 12;

// A section of a page gathering into place as the page comes into view —
// fading up and settling its last few pixels — rather than the whole page
// appearing in one frame (aesthetic.md: "things gather, condense, and
// become"). Give sections increasing `delay`s so a page arrives top to
// bottom, the way the map arrives around its thread. Replays each time the
// screen comes back into focus (tab screens stay mounted), so a page
// arrives the same way however it was reached. Skipped under Reduce Motion.
export function GatherIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (!isFocused || reduceMotion) return;
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: DURATION, easing: GATHER_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * RISE }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
