import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { AURA_NEUTRAL_COLOR } from './AuraFigure';

// Was two cool-toned (purple/teal) blobs in the top corners — a common
// "dark SaaS app" gradient signature that fought the warm ivory used
// everywhere else (the aura figure, onboarding's copy, Depths' last-reading
// line): cool and warm hues sitting under the same text is a quiet
// temperature clash even when it isn't consciously noticed. It also gave
// some screens a gradient and left others (the philosopher-picker) on flat
// black, which read as an inconsistency rather than a deliberate choice.
//
// This is one warm, low-center glow instead — echoing the aura figure's own
// chest-glow origin point, so it reads as "the figure's presence warming
// the room" rather than decoration bolted onto the background. Faint enough
// that pure-black screens (like the picker) keep their elegant, restrained
// darkness; present enough that no screen is fully void of light. One
// color, one shape, everywhere — same principle as the single accent-color
// rule, applied to the background instead of the foreground.
export function AmbientGlow({
  intensified = false,
  pulseDurationMs = 4200,
}: {
  intensified?: boolean;
  // Lets a caller sync the glow's breathing rhythm to a local pulse (e.g.
  // Tune In's orb) while intensified, so the whole screen reads as one
  // thing beating together rather than two independent cycles drifting
  // in and out of phase with each other.
  pulseDurationMs?: number;
}) {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: pulseDurationMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, [pulseDurationMs]);

  const boost = useSharedValue(0);

  useEffect(() => {
    boost.value = withTiming(intensified ? 1 : 0, { duration: 600 });
  }, [intensified]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.7 + pulse.value * 0.3 + boost.value * 0.6,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glowIvory" cx="50%" cy="72%" r="60%">
            <Stop offset="0" stopColor={AURA_NEUTRAL_COLOR} stopOpacity={0.09} />
            <Stop offset="1" stopColor={AURA_NEUTRAL_COLOR} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glowIvory)" />
      </Svg>
    </Animated.View>
  );
}
