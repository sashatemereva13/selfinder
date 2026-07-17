import Svg, { Defs, ClipPath, Circle, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

const MOON_LIGHT = '#f4ead0';

// Simple circle-offset technique (not an astronomically precise terminator curve —
// deliberately a stylized 2D disc, not a 3D render): a light disc is translated
// horizontally and clipped to the base disc. At fraction 0 (new moon) it's fully
// outside (0% shown); at 0.5 (full moon) it fully overlaps (100% shown); waxing
// enters from the right, waning exits to the left.
export function MoonPhaseDisc({ fraction, size = 120 }: { fraction: number; size?: number }) {
  const pad = 16;
  const canvas = size + pad * 2;
  const r = size / 2;
  const cx = canvas / 2;
  const cy = canvas / 2;

  const theta = fraction * Math.PI * 2;
  const magnitude = r * (1 + Math.cos(theta));
  const translateX = fraction <= 0.5 ? magnitude : -magnitude;

  return (
    <Svg width={canvas} height={canvas} viewBox={`0 0 ${canvas} ${canvas}`}>
      <Defs>
        <ClipPath id="moonDiscClip">
          <Circle cx={cx} cy={cy} r={r} />
        </ClipPath>
        <RadialGradient id="moonDiscGlow" cx="50%" cy="50%" r="55%">
          <Stop offset="0" stopColor={MOON_LIGHT} stopOpacity={0.22} />
          <Stop offset="1" stopColor={MOON_LIGHT} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Circle cx={cx} cy={cy} r={r + pad} fill="url(#moonDiscGlow)" />
      <Circle cx={cx} cy={cy} r={r} fill={colors.bg.elevated} stroke={colors.bg.border} strokeWidth={1} />
      <Circle cx={cx + translateX} cy={cy} r={r} fill={MOON_LIGHT} clipPath="url(#moonDiscClip)" />
    </Svg>
  );
}
