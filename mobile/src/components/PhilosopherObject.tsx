import { ReactNode } from 'react';
import Svg, { Defs, RadialGradient, Stop, Ellipse, Line, Circle, Path } from 'react-native-svg';
import { makeRng } from '../utils/auraDots';

// Thin-line wireframe forms, not flat illustrations — each still maps to the
// philosopher's own idea rather than being an arbitrary geometric primitive:
// Socrates' spiral is the same deepening question as before; Marcus' cone is
// everything narrowing down to the one point that's actually his ("the
// dichotomy of control"); Kierkegaard's cube is the threshold/doorframe;
// Camus' faceted rock rests mid-slope on an inclined line — the boulder,
// forever partway up; Aristotle's sphere is the mean — the one shape defined
// entirely by staying in equilibrium. Rendered as crisp construction-line geometry
// (no blur/glow filters) rather than the soft halo language used elsewhere —
// deliberately closer to a technical diagram than to AuraFigure's glow.

// a/b scaled up (~1.76x from the original 8/13) so the spiral's overall
// footprint (max radius ≈ a + b*turns ≈ 62) is comparable to the other four
// marks — Aristotle's sphere is r=62, Camus' rock r=46, Marcus' cone spans a
// 164 base — the original 8/13 only reached ≈35, making Socrates' mark look
// noticeably smaller/fainter than its siblings despite sharing one viewBox.
// Same turns and a:b ratio, so the spiral's shape/density is unchanged, just
// its scale.
function spiralPath(cx: number, cy: number, turns = 2.1, a = 14, b = 23): string {
  const steps = 120;
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

interface WireEllipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

// Meridian + latitude ellipses around a sphere — the classic wireframe-globe
// construction. Meridians (varying rx, full ry) sweep from the front-facing
// edge to the center line; latitudes (varying cx offset, thin fixed ry) ring
// the body at evenly spaced heights.
function sphereWireframe(cx: number, cy: number, r: number, meridians = 6, latitudes = 4): WireEllipse[] {
  const ellipses: WireEllipse[] = [];
  for (let i = 0; i < meridians; i++) {
    const angle = (Math.PI / 2) * (i / (meridians - 1));
    ellipses.push({ cx, cy, rx: r * Math.cos(angle), ry: r });
  }
  for (let i = 1; i < latitudes; i++) {
    const t = i / latitudes - 0.5;
    const dy = t * 2 * r * 0.9;
    const rx = r * Math.sqrt(Math.max(0, 1 - (dy / r) ** 2));
    ellipses.push({ cx, cy: cy + dy, rx, ry: r * 0.12 });
  }
  return ellipses;
}

// A faceted rock: an irregular polygon outline (seeded jitter on both angle
// and radius) plus a few interior chords that read as fracture planes. This
// replaced a perturbed-sphere construction that sat too close to Aristotle's
// clean wireframe globe — angular facets against smooth ellipses keeps the
// two unmistakable at a glance, and the slope it rests on (drawn at the call
// site) is the Sisyphus hint for anyone who knows the myth.
function boulderWireframe(cx: number, cy: number, r: number, seed: string) {
  const rng = makeRng(seed);
  const n = 9;
  const pts: Point[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 2 * Math.PI - Math.PI / 2 + (rng() - 0.5) * 0.3;
    const rad = r * (0.76 + rng() * 0.4);
    pts.push({ x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) });
  }
  // Chords between non-adjacent vertices — the facet lines.
  const chords: [Point, Point][] = [
    [pts[0], pts[3]],
    [pts[3], pts[6]],
    [pts[6], pts[1]],
  ];
  return { pts, chords };
}

interface WireLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

// A fan of straight lines from a single apex to a spread of base points —
// everything converging on one point, the same idea the plumb line always
// carried, just resolved into a full construction rather than a single
// stroke.
function coneWireframe(cx: number, topY: number, bottomY: number, halfWidth: number, count = 9): WireLine[] {
  const lines: WireLine[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = cx - halfWidth + t * halfWidth * 2;
    lines.push({ x1: cx, y1: topY, x2: x, y2: bottomY });
  }
  return lines;
}

interface Point {
  x: number;
  y: number;
}

function cubeWireframe(cx: number, cy: number, size: number) {
  const hw = size / 2;
  const dx = size * 0.24;
  const dy = -size * 0.17;
  const front: Point[] = [
    { x: cx - hw, y: cy - hw },
    { x: cx + hw, y: cy - hw },
    { x: cx + hw, y: cy + hw },
    { x: cx - hw, y: cy + hw },
  ];
  const back: Point[] = front.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  return { front, back };
}

function polygonPath(points: Point[]): string {
  return `M${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')} Z`;
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
  const cx = 100;
  const cy = 100;

  let content: ReactNode = null;

  switch (id) {
    case 'socrates': {
      content = (
        <Path
          d={spiralPath(cx, cy)}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
      );
      break;
    }
    case 'stoics': {
      const lines = coneWireframe(cx, 32, 164, 60, 9);
      const crossHeights = [0.4, 0.72];
      content = (
        <>
          {lines.map((l, i) => (
            <Line key={`l${i}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={color} strokeWidth={1.6} strokeOpacity={0.75} />
          ))}
          {crossHeights.map((f, ci) => {
            const pts = lines.map((l) => ({ x: l.x1 + (l.x2 - l.x1) * f, y: l.y1 + (l.y2 - l.y1) * f }));
            return (
              <Path
                key={`c${ci}`}
                d={`M${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L')}`}
                fill="none"
                stroke={color}
                strokeWidth={1.4}
                strokeOpacity={0.5}
              />
            );
          })}
          <Circle cx={cx} cy={32} r={3.2} fill={color} />
        </>
      );
      break;
    }
    case 'kierkegaard': {
      const { front, back } = cubeWireframe(cx, cy + 8, 90);
      content = (
        <>
          <Path d={polygonPath(back)} fill="none" stroke={color} strokeWidth={1.4} strokeOpacity={0.45} />
          {front.map((p, i) => (
            <Line key={i} x1={p.x} y1={p.y} x2={back[i].x} y2={back[i].y} stroke={color} strokeWidth={1.4} strokeOpacity={0.55} />
          ))}
          <Path d={polygonPath(front)} fill="none" stroke={color} strokeWidth={2} />
        </>
      );
      break;
    }
    case 'camus': {
      // The rock rests on an inclined line — mid-slope, neither summit nor
      // base, which is exactly where the myth leaves him. Center sits one
      // radius along the slope's normal from the contact point.
      const slopeA = { x: 20, y: 172 };
      const slopeB = { x: 184, y: 118 };
      const t = 0.55;
      const contact = {
        x: slopeA.x + (slopeB.x - slopeA.x) * t,
        y: slopeA.y + (slopeB.y - slopeA.y) * t,
      };
      const slopeLen = Math.hypot(slopeB.x - slopeA.x, slopeB.y - slopeA.y);
      const normal = {
        x: (slopeB.y - slopeA.y) / slopeLen,
        y: -(slopeB.x - slopeA.x) / slopeLen,
      };
      const r = 46;
      const center = { x: contact.x + normal.x * r, y: contact.y + normal.y * r };
      const { pts, chords } = boulderWireframe(center.x, center.y, r, 'obj-camus');
      content = (
        <>
          <Line
            x1={slopeA.x}
            y1={slopeA.y}
            x2={slopeB.x}
            y2={slopeB.y}
            stroke={color}
            strokeWidth={1.6}
            strokeOpacity={0.5}
          />
          {chords.map(([p, q], i) => (
            <Line key={`f${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color} strokeWidth={1.3} strokeOpacity={0.4} />
          ))}
          <Path d={polygonPath(pts)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
        </>
      );
      break;
    }
    case 'aristotle': {
      const ellipses = sphereWireframe(cx, cy, 62);
      content = (
        <>
          {ellipses.map((e, i) => (
            <Ellipse key={i} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={color} strokeWidth={1.6} strokeOpacity={0.75} />
          ))}
        </>
      );
      break;
    }
    default:
      content = null;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <RadialGradient id={`core-${id}`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.22} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={cx} cy={cy} r={92} fill={`url(#core-${id})`} />
      {content}
    </Svg>
  );
}
