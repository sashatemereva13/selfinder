import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

// The app's one breathing visual (2026-10-16): a soft light that grows as
// you breathe in and fades as you breathe out. Used by the Shift sessions
// and by Breathe, so breathing looks and behaves the same wherever it
// happens. `breath` runs 0 (empty) → 1 (full); `rgb` is the light's colour.
// Children (e.g. "Begin") sit at its centre and don't scale with it.
export const BREATHING_LIGHT_SIZE = 200;

export function BreathingLight({
  breath,
  rgb,
  size = BREATHING_LIGHT_SIZE,
  children,
}: {
  breath: SharedValue<number>;
  rgb: string;
  size?: number;
  children?: ReactNode;
}) {
  const lightStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 0.7 + breath.value * 0.45 }],
    opacity: 0.55 + breath.value * 0.35,
  }));
  return (
    <View style={[styles.wrap, { width: size, height: size }]} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, lightStyle]} pointerEvents="none">
        <Svg width={size} height={size}>
          <Defs>
            <RadialGradient id="breathingLight" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={`rgb(${rgb})`} stopOpacity={0.55} />
              <Stop offset="0.45" stopColor={`rgb(${rgb})`} stopOpacity={0.18} />
              <Stop offset="1" stopColor={`rgb(${rgb})`} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#breathingLight)" />
        </Svg>
      </Animated.View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
