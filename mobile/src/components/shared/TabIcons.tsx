import Svg, { Circle, Path } from 'react-native-svg';

// Thin-stroke construction-line geometry, no fill/glow — matches
// VibrationSpectrum/ConsciousnessWheel's ring register and
// PhilosopherObject's wireframe register, rather than the soft radial-
// gradient halo language AuraFigure uses. Tab icons are chrome (always
// visible, always small), so they stay in the same crisp-line family as
// the app's other construction-line UI rather than echoing the aura glow.

// A concentric ring pair, echoing AuraField's own two-lobe-per-sphere
// rings around the aura on Depths itself — the tab icon is a miniature of
// the screen it opens onto, same as Guide/You below.
export function DepthsTabIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 28 28">
      <Circle cx={14} cy={14} r={11} stroke={color} strokeWidth={1.4} fill="none" opacity={0.5} />
      <Circle cx={14} cy={14} r={6.5} stroke={color} strokeWidth={1.4} fill="none" />
      <Circle cx={14} cy={14} r={1.6} fill={color} />
    </Svg>
  );
}

// Two thin rings overlapping — you and a philosopher present together —
// rather than a generic chat-bubble glyph.
export function GuideTabIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 28 28">
      <Circle cx={11} cy={12} r={7.5} stroke={color} strokeWidth={1.4} fill="none" />
      <Circle cx={18} cy={17} r={6.5} stroke={color} strokeWidth={1.4} fill="none" opacity={0.7} />
    </Svg>
  );
}

// A small path stepping through three points — a Journey is a designed
// sequence, not a single state, so the icon is a route rather than a ring.
export function JourneysTabIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 28 28">
      <Path
        d="M5 21 C9 21 8 12 13 12 C17 12 15 7 22 7"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={5} cy={21} r={1.6} fill={color} />
      <Circle cx={22} cy={7} r={1.6} fill={color} />
    </Svg>
  );
}

// A single line rising through small marks — Your Arc is the record drawn
// across many readings over time, not one ring or one moment.
export function YourArcTabIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 28 28">
      <Path
        d="M4 20 Q10 6 24 8"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={9} cy={13.5} r={1.4} fill={color} />
      <Circle cx={16} cy={9.3} r={1.4} fill={color} />
      <Circle cx={24} cy={8} r={1.4} fill={color} />
    </Svg>
  );
}
