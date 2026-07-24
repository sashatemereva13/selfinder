import Svg, {
  Defs,
  Filter,
  FeGaussianBlur,
  LinearGradient,
  RadialGradient,
  Stop,
  G,
  Circle,
  Rect,
  Line,
  Ellipse,
  Polygon,
  Path,
} from 'react-native-svg';
import { generateObjectDots } from '../utils/auraDots';

// Each philosopher gets a symbol drawn from their own actual ideas, not a
// generic "philosopher" icon — Camus' boulder (Sisyphus), Aristotle's scale
// (the doctrine of the mean), Marcus Aurelius' plumb line ("one clean line:
// what is yours, and what is not" — his own words elsewhere in the app),
// Kierkegaard's open door (the leap), Socrates' spiral (a question that
// deepens rather than resolves). Rendered with the same halo/core-glow/dot
// language as AuraFigure so it still reads as Selfinder energy, just shaped.
const CORE_POS: Record<string, { cx: number; cy: number; r: number }> = {
  socrates: { cx: 100, cy: 105, r: 30 },
  stoics: { cx: 100, cy: 150, r: 20 },
  kierkegaard: { cx: 90, cy: 144, r: 20 },
  camus: { cx: 100, cy: 110, r: 24 },
  aristotle: { cx: 100, cy: 90, r: 22 },
};

const DOT_ZONE: Record<string, { cx: number; cy: number; rx: number; ry: number }> = {
  socrates: { cx: 100, cy: 105, rx: 85, ry: 85 },
  stoics: { cx: 100, cy: 100, rx: 75, ry: 90 },
  kierkegaard: { cx: 100, cy: 105, rx: 80, ry: 90 },
  camus: { cx: 100, cy: 110, rx: 85, ry: 75 },
  aristotle: { cx: 100, cy: 95, rx: 90, ry: 80 },
};

function spiralPath(cx: number, cy: number, turns = 1.65, a = 10, b = 15.5): string {
  const steps = 100;
  const points: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * turns * 2 * Math.PI;
    const r = a + (b * t) / (2 * Math.PI);
    const x = cx + r * Math.cos(t - Math.PI / 2);
    const y = cy + r * Math.sin(t - Math.PI / 2);
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M${points.join(' L')}`;
}

function Body({ id }: { id: string }) {
  switch (id) {
    case 'socrates':
      return <Path d={spiralPath(100, 105)} fill="none" strokeWidth={13} strokeLinecap="round" />;
    case 'stoics':
      return (
        <>
          <Circle cx={100} cy={26} r={5} />
          <Line x1={100} y1={26} x2={100} y2={150} strokeWidth={3} />
          <Polygon points="84,150 116,150 106,190 94,190" strokeWidth={2} />
        </>
      );
    case 'kierkegaard':
      return (
        <>
          <Rect x={48} y={24} width={96} height={156} fill="none" strokeWidth={4} rx={2} />
          <Polygon points="56,30 56,174 116,160 116,44" strokeWidth={2} />
          <Circle cx={104} cy={102} r={5} fill="#ffffff" fillOpacity={0.9} stroke="none" />
        </>
      );
    case 'camus':
      return (
        <>
          <Ellipse cx={85} cy={118} rx={46} ry={38} />
          <Ellipse cx={128} cy={108} rx={38} ry={34} />
          <Ellipse cx={106} cy={145} rx={42} ry={30} />
          <Ellipse cx={100} cy={90} rx={50} ry={32} />
        </>
      );
    case 'aristotle':
      return (
        <>
          <Rect x={97} y={38} width={6} height={104} strokeWidth={1} />
          <Polygon points="72,150 128,150 100,140" />
          <Rect x={42} y={44} width={116} height={5} />
          <Line x1={48} y1={49} x2={48} y2={70} strokeWidth={2} />
          <Line x1={152} y1={49} x2={152} y2={70} strokeWidth={2} />
          <Circle cx={48} cy={88} r={18} fill="none" strokeWidth={3} />
          <Circle cx={152} cy={88} r={18} fill="none" strokeWidth={3} />
        </>
      );
    default:
      return null;
  }
}

function Halo({ id }: { id: string }) {
  switch (id) {
    case 'socrates':
      return <Path d={spiralPath(100, 105)} fill="none" strokeWidth={22} strokeLinecap="round" />;
    case 'stoics':
      return (
        <>
          <Circle cx={100} cy={26} r={7} />
          <Line x1={100} y1={26} x2={100} y2={150} strokeWidth={8} />
          <Polygon points="80,148 120,148 108,194 92,194" />
        </>
      );
    case 'kierkegaard':
      return (
        <>
          <Rect x={48} y={24} width={96} height={156} rx={2} />
          <Polygon points="56,30 56,174 116,160 116,44" />
        </>
      );
    case 'camus':
      return <Body id="camus" />;
    case 'aristotle':
      return (
        <>
          <Rect x={94} y={38} width={12} height={104} />
          <Polygon points="68,152 132,152 100,138" />
          <Rect x={42} y={42} width={116} height={9} />
          <Circle cx={48} cy={88} r={20} />
          <Circle cx={152} cy={88} r={20} />
        </>
      );
    default:
      return null;
  }
}

export function PhilosopherObject({
  id,
  rgb,
  size = 96,
}: {
  id: string;
  rgb: string;
  size?: number;
}) {
  const color = `rgb(${rgb})`;
  const core = CORE_POS[id] ?? CORE_POS.socrates;
  const zone = DOT_ZONE[id] ?? DOT_ZONE.socrates;
  const dots = generateObjectDots(`obj-${id}`, zone.cx, zone.cy, zone.rx, zone.ry);
  const uid = `obj-${id}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <Filter id={`halo-${uid}`} x="-80%" y="-80%" width="260%" height="260%">
          <FeGaussianBlur in="SourceGraphic" stdDeviation={9} />
        </Filter>
        <RadialGradient id={`core-${uid}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor="#ffffff" stopOpacity={0.9} />
          <Stop offset="0.4" stopColor={color} stopOpacity={0.6} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
        <LinearGradient id={`fill-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset="1" stopColor={color} stopOpacity={0.65} />
        </LinearGradient>
      </Defs>

      <G filter={`url(#halo-${uid})`} fill={color} stroke={color} opacity={0.55}>
        <Halo id={id} />
      </G>

      <Circle cx={core.cx} cy={core.cy} r={core.r} fill={`url(#core-${uid})`} />

      <G fill={`url(#fill-${uid})`} stroke={color}>
        <Body id={id} />
      </G>

      <G>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.cx} cy={d.cy} r={d.r} fill={color} opacity={d.opacity} />
        ))}
      </G>
    </Svg>
  );
}
