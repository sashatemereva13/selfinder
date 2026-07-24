import Svg, {
  Defs,
  Filter,
  FeGaussianBlur,
  FeColorMatrix,
  FeComposite,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Circle,
  Rect,
  Ellipse,
  Polygon,
} from 'react-native-svg';
import { generateAuraDots } from '../utils/auraDots';

// A standing figure whose body is a constant, near-black form — it's always
// you. Only the aura around it changes: soft white noise before a reading,
// the vibration level's color after. The dark body's fill uses a "goo" filter
// (blur then re-harden the alpha) so separately-drawn limbs read as one
// continuous silhouette instead of assembled parts; the rim reuses the same
// merged shape, dilated and then left softly blurred (no re-hardening), so it
// diffuses outward like a glow instead of a defined outline.
export function AuraFigure({
  rgb = '195,153,255',
  neutral = false,
  size = 160,
  uid = 'aura',
}: {
  rgb?: string;
  neutral?: boolean;
  size?: number;
  uid?: string;
}) {
  const color = neutral ? '#d8d5e6' : `rgb(${rgb})`;
  const coreColor = neutral ? '#f4f2fb' : '#ffffff';
  const dots = generateAuraDots(`${uid}-${neutral ? 'neutral' : rgb}`);
  const height = size * (380 / 200);

  return (
    <Svg width={size} height={height} viewBox="0 0 200 380">
      <Defs>
        <Filter id={`goo-${uid}`} x="-40%" y="-20%" width="180%" height="140%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={4} result="blur" />
          <FeColorMatrix
            in="blur"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
            result="goo"
          />
          <FeComposite in="goo" in2="goo" operator="atop" />
        </Filter>
        <Filter id={`soft-${uid}`} x="-60%" y="-40%" width="220%" height="180%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={8} />
        </Filter>
        <LinearGradient id={`body-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="rgb(30,27,40)" stopOpacity={0.97} />
          <Stop offset="1" stopColor="rgb(18,16,26)" stopOpacity={0.9} />
        </LinearGradient>
        <RadialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={coreColor} stopOpacity={0.95} />
          <Stop offset="0.35" stopColor={coreColor} stopOpacity={0.65} />
          <Stop offset="0.7" stopColor={color} stopOpacity={0.25} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* rim: a dilated, goo-merged copy of the whole silhouette, softly
          blurred (not re-hardened) so it diffuses outward like an aura */}
      <G filter={`url(#soft-${uid})`} opacity={0.85}>
        <G filter={`url(#goo-${uid})`} fill={color} stroke={color} strokeWidth={15} strokeOpacity={1}>
          <BodyPrimitives />
        </G>
      </G>

      {/* dark body, normal size, on top */}
      <G filter={`url(#goo-${uid})`} fill={`url(#body-${uid})`}>
        <BodyPrimitives />
      </G>

      <Circle cx={100} cy={148} r={34} fill={`url(#core-${uid})`} />

      <G>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={d.opacity} />
        ))}
      </G>
    </Svg>
  );
}

function BodyPrimitives() {
  return (
    <>
      <Circle cx={100} cy={42} r={25} />
      <Rect x={87} y={58} width={26} height={32} rx={12} />
      <Ellipse cx={100} cy={148} rx={32} ry={52} />
      <Polygon points="78,88 58,96 46,192 62,196" />
      <Polygon points="122,88 142,96 154,192 138,196" />
      <Polygon points="93,196 74,199 66,320 88,324" />
      <Polygon points="107,196 126,199 134,320 112,324" />
    </>
  );
}
