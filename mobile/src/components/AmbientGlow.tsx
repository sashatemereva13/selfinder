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
import { colors } from '../theme/colors';

/** Off-center purple/teal radial glow over near-black — the same background
 * signature used throughout selfinder-web (see frontend/src/designElements/PageWrapper.css).
 * Pulses slowly, mirroring the "breathing glow" used on web's EntryGate. */
export function AmbientGlow() {
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.75 + pulse.value * 0.25,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]} pointerEvents="none">
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="glowPurple" cx="20%" cy="18%" r="55%">
            <Stop offset="0" stopColor={colors.brand.purple} stopOpacity={0.16} />
            <Stop offset="1" stopColor={colors.brand.purple} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient id="glowTeal" cx="82%" cy="16%" r="55%">
            <Stop offset="0" stopColor={colors.brand.teal} stopOpacity={0.12} />
            <Stop offset="1" stopColor={colors.brand.teal} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glowPurple)" />
        <Rect width="100%" height="100%" fill="url(#glowTeal)" />
      </Svg>
    </Animated.View>
  );
}
