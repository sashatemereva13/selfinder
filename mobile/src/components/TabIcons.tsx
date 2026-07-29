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

// A reduced figure outline — head ring + shoulder line — same silhouette
// AuraFigure uses at icon scale, but as a thin construction line rather
// than a filled glowing body.
export function YouTabIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 28 28">
      <Circle cx={14} cy={8} r={4} stroke={color} strokeWidth={1.4} fill="none" />
      <Path
        d="M8 24 C8 16.5 10.6 13.5 14 13.5 C17.4 13.5 20 16.5 20 24"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
