import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, G, Circle } from 'react-native-svg';

// Your Arc's own first-paint loading state (the moment between tapping
// "Your arc" on Depths and the real ArcKaleidoscope/TimeCone pager
// mounting) — was previously a bare ActivityIndicator, a generic spinner
// on an empty screen that didn't feel like Your Arc at all (fails the
// aesthetic.md "cosy fireplace, not a UI" test). This is a deliberately
// CHEAP echo of ArcKaleidoscope's own 8-fold radial language (same
// MIRROR_COUNT, same warm-glow-plus-soft-shape idea) — not the real
// data-driven kaleidoscope itself. ArcKaleidoscope's full render (8
// mirrors × several jittered petals/tendrils each, plus a per-shape
// Gaussian blur filter) is exactly what firstPaintReady in your-arc.tsx
// exists to defer — it's the thing that froze the Depths→Your Arc
// transition for 13s on a real device before that gate was added. Reusing
// it here for the loading state would reintroduce that freeze. This
// component has none of that cost: one shared shape (no per-instance path
// generation, no filter), a slow breathing pulse instead of an entrance
// animation, and no dependency on readingLog beyond the accent color
// already computed by the caller.
const MIRROR_COUNT = 8;
const WEDGE_ANGLE = 360 / MIRROR_COUNT;
const PULSE_DURATION_MS = 2600;
const SOFT_EASE = Easing.inOut(Easing.sin);

export function ArcKaleidoscopeLoading({ size, accentRgb }: { size: number; accentRgb: string }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.1;
  const glowId = 'arc-kaleidoscope-loading-glow';

  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: PULSE_DURATION_MS, easing: SOFT_EASE }), -1, true);
  }, []);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
  }));

  return (
    <Animated.View style={[{ width: size, height: size }, pulseStyle]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={`rgb(${accentRgb})`} stopOpacity={0.16} />
            <Stop offset="55%" stopColor={`rgb(${accentRgb})`} stopOpacity={0.05} />
            <Stop offset="100%" stopColor={`rgb(${accentRgb})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={outerR * 1.1} fill={`url(#${glowId})`} />

        {/* One soft dot per mirror position — the 8-fold rhythm reads as
            "kin to the real kaleidoscope" without generating any of its
            actual per-reading shape data. */}
        {Array.from({ length: MIRROR_COUNT }).map((_, i) => {
          const angle = ((i * WEDGE_ANGLE - 90) * Math.PI) / 180;
          const r = (innerR + outerR) / 2;
          const x = cx + r * Math.cos(angle);
          const y = cy + r * Math.sin(angle);
          return (
            <G key={i}>
              <Circle cx={x} cy={y} r={size * 0.05} fill={`rgb(${accentRgb})`} fillOpacity={0.22} />
            </G>
          );
        })}
      </Svg>
    </Animated.View>
  );
}
