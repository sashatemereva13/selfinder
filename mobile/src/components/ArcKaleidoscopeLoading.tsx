import { useEffect } from 'react';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { useThemeColors } from '../theme/useThemeColors';

// Your Arc's own first-paint loading state (the moment between tapping
// "Your arc" on Depths and the real ArcKaleidoscope/TimeCone pager
// mounting) — was previously a bare ActivityIndicator, a generic spinner
// on an empty screen that didn't feel like Your Arc at all (fails the
// aesthetic.md "cosy fireplace, not a UI" test).
//
// 2026-08-20: replaced the first version of this component (8 static
// dots pulsing together in opacity) after review — the opacity pulse
// either wasn't animating reliably on-device or wasn't legible as motion
// even when it was (reported: "I just see dots in a circle," no sense of
// something loading). Rebuilt around Your Arc's own vibration-color-wheel
// language instead (VibrationSpectrum.tsx's thin-stroke ring convention —
// see that file's own header comment for why a closed ring, never a
// gradient bar, is the standing rule here) with one small bright point
// actually traveling around the ring via a rotating transform. Directional
// motion around a fixed shape reads as "working" far more reliably than
// a synchronized opacity fade across several elements at once — matches
// how a real activity spinner communicates progress, translated into
// this app's own ring vocabulary instead of a generic system spinner.
//
// Deliberately NEUTRAL, not colored by the person's own reading history
// (2026-08-19 decision) — this stays cheap and data-independent (no
// per-reading color computation, which is part of what makes the real
// ArcKaleidoscope expensive and exactly what firstPaintReady in
// your-arc.tsx exists to defer). The moment of seeing your OWN colors
// stays specific to the real kaleidoscope's arrival, which also makes
// that arrival read as more of a reveal, not a repeat of what the
// loading state already showed.
const ROTATION_DURATION_MS = 1800;
const SOFT_LINEAR = Easing.linear;

export function ArcKaleidoscopeLoading({ size, accentRgb }: { size: number; accentRgb: string }) {
  const colors = useThemeColors();
  const cx = size / 2;
  const cy = size / 2;
  const ringR = size * 0.38;
  const glowId = 'arc-kaleidoscope-loading-glow';

  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: ROTATION_DURATION_MS, easing: SOFT_LINEAR }), -1, false);
  }, []);
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={`rgb(${accentRgb})`} stopOpacity={0.14} />
            <Stop offset="55%" stopColor={`rgb(${accentRgb})`} stopOpacity={0.04} />
            <Stop offset="100%" stopColor={`rgb(${accentRgb})`} stopOpacity={0} />
          </RadialGradient>
        </Defs>

        <Circle cx={cx} cy={cy} r={ringR * 1.3} fill={`url(#${glowId})`} />

        {/* The ring itself — same thin-stroke, no-fill convention as
            VibrationSpectrum's own wheel, so this reads as kin to the
            real vibration wheel rather than a new shape invented just
            for loading. */}
        <Circle cx={cx} cy={cy} r={ringR} fill="none" stroke={colors.bg.border} strokeWidth={1} />
      </Svg>
      {/* The traveling point sits in its own rotating wrapper (plain RN
          transform, not SVG animation — cheaper, and keeps the rotating
          element as a single small view rather than re-rendering SVG
          children every frame) positioned at the ring's own top (12
          o'clock), so rotating the wrapper around the ring's center
          carries it all the way around the circumference. */}
      <Animated.View
        style={[
          { position: 'absolute', width: size, height: size },
          rotateStyle,
        ]}
      >
        <Animated.View
          style={{
            position: 'absolute',
            left: cx - 3,
            top: cy - ringR - 3,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: `rgb(${accentRgb})`,
          }}
        />
      </Animated.View>
    </Animated.View>
  );
}
