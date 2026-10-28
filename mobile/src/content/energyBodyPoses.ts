import { makeRng } from '../utils/auraDots';

// The energy body (2026-10-27) — one pose per vibration level, plus `none`
// for before any reading. The light in the chest is the subject; the body
// is a constellation that carries it — joints as small stars, bones as
// fine lines — drawn in the same thin construction
// lines as the philosopher symbols and the cards. Each state's pose and ray
// shape echo that state's natural event in NatureSymbol.tsx (courage's
// rays rise like a flame in wind, grief's fall like rain, love's spread
// like a sunrise), so the figure and the state's own symbol tell the same
// story. No hair, face, shoulders or hips: the figure reads as anyone.
//
// Everything here is in one 240x420 drawing space, the same box
// AuraFigure's metrics describe (getAuraFigureMetrics), so a pose drops
// into any place that used to show the aura image. `burst` is where the
// light sits in the pose's own coordinates; EnergyBody moves the whole
// pose so the burst lands on AuraFigure's chest point — Depths' rings and
// spiral are centred on that point, so a seated or kneeling pose floats
// inside the rings rather than dragging them along.

export const ENERGY_BODY_VIEWBOX = { width: 240, height: 420 };
// AuraFigure's chest in the same box: (100 + PAD_SIDE, 148 + PAD_TOP).
export const ENERGY_BODY_CHEST = { x: 120, y: 178 };

export interface EnergyRay {
  d: string;
  opacity: number;
  width: number;
  // Approximate drawn length, for the draw-in's stroke-dash animation.
  length: number;
}

export interface EnergyPose {
  head: { x: number; y: number; r: number };
  // The bones — one fine line each.
  strokes: { d: string; length: number }[];
  // The stars: each bone's ends, nearest the light first (the order they
  // appear in), with near-duplicates merged where bones meet.
  joints: Pt[];
  burst: { x: number; y: number };
  rays: EnergyRay[];
  // Small marks in the light's colour (rain drops, stars, a waterline).
  dots?: { x: number; y: number; r: number; opacity: number }[];
  lines?: { d: string; opacity: number }[];
}

type Pt = { x: number; y: number };

function fmt(v: number) {
  return Math.round(v * 10) / 10;
}

function polyD(pts: Pt[]) {
  return `M${pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(' L')}`;
}

function polyLength(pts: Pt[]) {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return l;
}

function quad(p0: Pt, c: Pt, p1: Pt, steps: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push({ x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x, y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y });
  }
  return out;
}

// Parses the small absolute M/L/Q vocabulary the poses below are written
// in into a polyline.
function samplePath(d: string): Pt[] {
  const pts: Pt[] = [];
  const re = /([MLQ])([^MLQ]*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) {
    const n = m[2].trim().split(/[\s,]+/).map(Number);
    if (m[1] === 'M' || m[1] === 'L') {
      pts.push({ x: n[0], y: n[1] });
    } else {
      const from = pts[pts.length - 1];
      pts.push(...quad(from, { x: n[0], y: n[1] }, { x: n[2], y: n[3] }, 12).slice(1));
    }
  }
  return pts;
}


// ---- ray families --------------------------------------------------------

type LenFn = (a: number) => number;
type CurlFn = (a: number, L: number) => [number, number];

interface RayOpts {
  jitter?: number;
  op?: [number, number];
  w?: [number, number];
}

function curveRays(n: number, r0: number, len: LenFn, curl: CurlFn, seed: string, o: RayOpts = {}): EnergyRay[] {
  const { jitter = 0.08, op = [0.55, 1], w = [1.1, 2] } = o;
  const rng = makeRng(seed);
  const out: EnergyRay[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n + (rng() - 0.5) * jitter * 2;
    const L = len(a) * (0.75 + rng() * 0.5);
    const opacity = op[0] + rng() * (op[1] - op[0]);
    const width = w[0] + rng() * (w[1] - w[0]);
    if (L < 2) continue;
    const p0 = { x: r0 * Math.cos(a), y: r0 * Math.sin(a) };
    const [dx, dy] = curl(a, L);
    const p1 = { x: (r0 + L) * Math.cos(a) + dx * 0.6, y: (r0 + L) * Math.sin(a) + dy * 0.6 };
    const c = { x: (p0.x + (r0 + L) * Math.cos(a)) / 2 + dx, y: (p0.y + (r0 + L) * Math.sin(a)) / 2 + dy };
    out.push({
      d: `M${fmt(p0.x)},${fmt(p0.y)} Q${fmt(c.x)},${fmt(c.y)} ${fmt(p1.x)},${fmt(p1.y)}`,
      opacity,
      width,
      length: polyLength(quad(p0, c, p1, 10)),
    });
  }
  return out;
}

function jaggedRays(n: number, r0: number, len: LenFn, seed: string, amp = 5, segs = 4): EnergyRay[] {
  const rng = makeRng(seed);
  const out: EnergyRay[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n + (rng() - 0.5) * 0.2;
    const L = len(a) * (0.75 + rng() * 0.5);
    const pts: Pt[] = [];
    for (let k = 0; k <= segs; k++) {
      const d = r0 + (L * k) / segs;
      const off = k === 0 || k === segs ? 0 : (k % 2 ? amp : -amp) * (0.6 + rng() * 0.8);
      pts.push({ x: d * Math.cos(a) - off * Math.sin(a), y: d * Math.sin(a) + off * Math.cos(a) });
    }
    out.push({ d: polyD(pts), opacity: 0.6 + rng() * 0.4, width: 1.2 + rng() * 0.8, length: polyLength(pts) });
  }
  return out;
}

function wavyRays(n: number, r0: number, len: LenFn, seed: string, amp = 4, waves = 2): EnergyRay[] {
  const rng = makeRng(seed);
  const out: EnergyRay[] = [];
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n + (rng() - 0.5) * 0.2;
    const L = len(a) * (0.75 + rng() * 0.5);
    if (L < 2) continue;
    const pts: Pt[] = [];
    for (let k = 0; k <= 14; k++) {
      const t = k / 14;
      const d = r0 + L * t;
      const off = amp * Math.sin(t * waves * 2 * Math.PI) * t;
      pts.push({ x: d * Math.cos(a) - off * Math.sin(a), y: d * Math.sin(a) + off * Math.cos(a) });
    }
    out.push({ d: polyD(pts), opacity: 0.55 + rng() * 0.45, width: 1.1 + rng() * 0.8, length: polyLength(pts) });
  }
  return out;
}

const up = (a: number) => -Math.sin(a);
const down = (a: number) => Math.sin(a);
const right = (a: number) => Math.cos(a);
const pos = (v: number) => Math.max(0, v);
const flat: CurlFn = () => [0, 0];

function feet(lx: number, rx: number): [string, number][] {
  return [
    [`M${lx},368 L${lx - 14},372`, 9],
    [`M${rx},368 L${rx + 14},372`, 9],
  ];
}

const STAND_TORSO: [string, number][] = [
  ['M120,76 L120,96', 10],
  ['M120,96 L120,204', 22],
];

interface PoseSource {
  head: [number, number];
  strokes: [string, number][];
  burst: [number, number];
  rays: () => EnergyRay[];
  dots?: () => EnergyPose['dots'];
  lines?: EnergyPose['lines'];
}

const SOURCES: Record<string, PoseSource> = {
  none: {
    head: [121, 60],
    strokes: [['M121,76 L120,96', 10], ['M120,96 L120,204', 22], ['M114,108 Q104,160 100,204', 9], ['M126,108 Q138,156 146,200', 9],
      ['M116,204 L112,368', 11], ['M124,204 Q136,288 134,368', 11], ...feet(112, 134)],
    burst: [120, 140],
    rays: () => curveRays(18, 9, () => 24, flat, 'none', { jitter: 0.02, op: [0.5, 0.8] }),
  },
  shame: {
    head: [140, 306],
    strokes: [['M70,350 Q80,300 120,292', 22], ['M124,294 L134,302', 10], ['M70,354 L118,362', 12], ['M118,362 L64,370', 11],
      ['M110,292 Q142,276 158,298', 9]],
    burst: [96, 318],
    rays: () => curveRays(14, 7, () => 18, (a, L) => [-Math.sin(a) * L * 0.6, Math.cos(a) * L * 0.6], 'shame', { jitter: 0.1, op: [0.4, 0.75] }),
  },
  guilt: {
    head: [116, 82],
    strokes: [['M118,108 L117,98', 10], ['M118,108 Q120,156 118,206', 22], ['M114,118 Q100,160 124,170', 9], ['M122,118 Q136,150 128,172', 9],
      ['M114,204 L110,368', 11], ['M122,204 L128,368', 11], ...feet(110, 128)],
    burst: [118, 150],
    rays: () => curveRays(16, 8, (a) => 12 + 42 * pos(-right(a)) ** 1.5, (_a, L) => [0, L * 0.12], 'guilt', { jitter: 0.1, op: [0.45, 0.85] }),
  },
  apathy: {
    head: [98, 236],
    strokes: [['M70,360 Q66,300 84,262', 22], ['M86,262 L93,250', 10], ['M74,362 L190,366', 12], ['M78,356 L184,356', 11],
      ['M84,272 Q74,322 94,358', 9]],
    burst: [78, 312],
    rays: () => curveRays(10, 8, (a) => 26 * Math.abs(right(a)) ** 3, flat, 'apathy', { jitter: 0.02, op: [0.35, 0.6] }),
  },
  grief: {
    head: [124, 214],
    strokes: [['M110,240 L118,228', 10], ['M92,354 Q84,300 106,246', 22], ['M96,356 L160,292', 12], ['M160,292 L176,368', 11],
      ['M176,368 L196,372', 9], ['M108,258 Q138,300 164,296', 9]],
    burst: [98, 292],
    rays: () => curveRays(16, 9, (a) => 14 + 56 * pos(down(a)) ** 1.6 + 6 * pos(up(a)), (_a, L) => [L * 0.08, L * 0.06], 'grief', { jitter: 0.12 }),
    dots: () => [{ x: 107, y: 366, r: 1.4, opacity: 0.7 }, { x: 128, y: 364, r: 1.1, opacity: 0.5 }],
  },
  fear: {
    head: [108, 70],
    strokes: [['M112,86 L114,102', 10], ['M114,102 Q118,150 124,198', 22], ['M112,112 Q86,120 98,92', 9], ['M118,112 Q142,112 128,90', 9],
      ['M122,196 Q100,280 84,368', 11], ['M128,196 Q150,280 162,368', 11], ...feet(84, 162)],
    burst: [118, 146],
    rays: () => {
      const bolt = [{ x: 7, y: -5 }, { x: 22, y: -30 }, { x: 14, y: -34 }, { x: 34, y: -66 }, { x: 26, y: -70 }, { x: 52, y: -108 }];
      return [...curveRays(14, 7, () => 10, flat, 'fear', { jitter: 0.1, op: [0.5, 0.8] }),
        { d: polyD(bolt), opacity: 1, width: 1.8, length: polyLength(bolt) }];
    },
  },
  desire: {
    head: [156, 86],
    strokes: [['M146,104 L152,96', 10], ['M142,108 Q120,150 104,200', 22], ['M146,114 Q176,120 206,108', 9], ['M140,118 Q170,132 200,126', 9],
      ['M104,198 Q96,280 88,362', 11], ['M88,362 L98,374', 9], ['M100,200 Q70,270 50,340', 11], ['M50,340 L40,352', 9]],
    burst: [124, 152],
    rays: () => wavyRays(14, 9, (a) => 14 + 60 * pos(right(a)) ** 1.4, 'desire', 4, 2),
  },
  anger: {
    head: [122, 72],
    strokes: [['M120,88 L120,104', 10], ['M120,104 L120,200', 24], ['M114,112 Q86,140 78,188', 10], ['M126,112 Q154,140 162,188', 10],
      ['M78,188 L78,190', 16], ['M162,188 L162,190', 16], ['M114,198 L72,368', 12], ['M126,198 L168,368', 12], ...feet(72, 168)],
    burst: [120, 146],
    rays: () => jaggedRays(18, 9, (a) => 30 + 26 * Math.abs(up(a)), 'anger', 6, 4),
  },
  pride: {
    head: [120, 52],
    strokes: [['M120,68 L120,92', 10], ['M120,92 L120,204', 22], ['M114,104 L84,150 L112,196', 9], ['M126,104 L156,150 L128,196', 9],
      ['M116,204 L110,368', 11], ['M124,204 L132,368', 11], ...feet(110, 132)],
    burst: [120, 138],
    rays: () => curveRays(18, 8, (a) => 8 + 95 * pos(up(a)) ** 4, flat, 'pride', { jitter: 0.02 }),
  },
  courage: {
    head: [128, 70],
    strokes: [['M124,86 L120,104', 10], ['M120,104 Q117,152 110,200', 22], ['M122,114 Q150,138 178,124', 9], ['M116,114 Q98,148 82,176', 9],
      ['M113,198 Q138,248 150,296 L166,370', 11], ['M166,370 L184,374', 9], ['M108,198 Q96,256 82,300 L64,356', 11], ['M64,356 L52,366', 9]],
    burst: [119, 142],
    rays: () => curveRays(22, 9, (a) => 22 + 70 * pos(up(a)) ** 1.4 + 10 * pos(down(a)), (a, L) => [L * 0.22 * pos(up(a)), 0], 'courage'),
  },
  neutrality: {
    head: [120, 60],
    strokes: [...STAND_TORSO, ['M114,108 Q100,160 98,206', 9], ['M126,108 Q140,160 142,206', 9],
      ['M116,204 L112,368', 11], ['M124,204 L128,368', 11], ...feet(112, 128)],
    burst: [120, 140],
    rays: () => curveRays(16, 8, (a) => 70 * Math.abs(right(a)) ** 8, flat, 'neutrality', { jitter: 0, op: [0.6, 0.9] }),
  },
  willingness: {
    head: [118, 190],
    strokes: [['M112,214 L116,204', 10], ['M100,300 Q104,250 112,214', 22], ['M104,300 L150,300', 12], ['M150,300 L156,368', 11], ['M156,368 L170,372', 9],
      ['M98,302 L84,362', 12], ['M84,362 L46,368', 11], ['M114,224 Q132,180 140,140', 9], ['M108,228 Q96,262 100,292', 9]],
    burst: [106, 256],
    rays: () => curveRays(12, 8, (a) => 6 + 58 * pos(up(a)) ** 2, (a, L) => [-L * 0.15 * Math.cos(a), -L * 0.1], 'willingness', { jitter: 0.1 }),
  },
  acceptance: {
    head: [124, 234],
    strokes: [['M112,262 L119,249', 10], ['M84,356 Q96,300 112,262', 22], ['M88,360 L200,366', 12], ['M92,354 L150,316', 12], ['M150,316 L182,366', 11],
      ['M100,280 Q74,320 60,364', 9]],
    burst: [100, 302],
    rays: () => wavyRays(14, 8, (a) => 18 + 34 * pos(down(a) + 0.4), 'acceptance', 4, 1.5),
  },
  reason: {
    head: [122, 62],
    strokes: [['M121,78 L120,98', 10], ['M120,98 L118,204', 22], ['M126,110 Q156,150 134,86', 9], ['M114,112 Q110,150 142,152', 9],
      ['M114,204 L108,368', 11], ['M122,204 Q140,290 136,368', 11], ...feet(108, 136)],
    burst: [118, 140],
    rays: () => curveRays(16, 9, () => 34, flat, 'reason', { jitter: 0, op: [0.75, 0.75], w: [1.4, 1.4] }),
  },
  love: {
    head: [123, 62],
    strokes: [['M121,78 L120,98', 10], ['M120,98 L120,204', 22], ['M116,110 Q88,96 60,70', 9], ['M124,110 Q158,102 188,84', 9],
      ['M116,204 Q110,288 104,368', 11], ['M124,204 Q134,288 140,368', 11], ...feet(104, 140)],
    burst: [120, 140],
    rays: () => curveRays(28, 10, (a) => 40 + 40 * Math.abs(right(a)) ** 1.2, flat, 'love', { jitter: 0.03 }),
  },
  unconditionallove: {
    head: [120, 60],
    strokes: [...STAND_TORSO, ['M114,108 Q80,150 52,170', 9], ['M126,108 Q160,150 188,170', 9],
      ['M116,204 Q108,288 102,368', 11], ['M124,204 Q132,288 138,368', 11], ...feet(102, 138)],
    burst: [120, 140],
    rays: () => curveRays(26, 9, (a) => 50 + 30 * pos(up(a)), (a, L) => [Math.cos(a) * L * 0.35, L * 0.45], 'unconditionallove', { jitter: 0.05 }),
  },
  peace: {
    head: [120, 206],
    strokes: [['M120,232 L120,222', 10], ['M120,330 L120,234', 22], ['M112,334 Q80,350 60,348', 12], ['M128,334 Q160,350 180,348', 12],
      ['M60,348 Q100,368 136,358', 11], ['M180,348 Q140,368 104,358', 11], ['M114,244 Q90,290 72,334', 9], ['M126,244 Q150,290 168,334', 9]],
    burst: [120, 276],
    rays: () => curveRays(20, 9, () => 26, flat, 'peace', { jitter: 0, op: [0.55, 0.55], w: [1.2, 1.2] }),
    lines: [{ d: 'M40,382 L200,382', opacity: 0.35 }],
  },
  enlightenment: {
    head: [120, 58],
    strokes: [['M120,74 L120,96', 10], ['M120,96 L120,204', 22], ['M114,104 Q96,60 92,20', 9], ['M126,104 Q144,60 150,20', 9],
      ['M116,204 L112,368', 11], ['M124,204 L128,368', 11], ...feet(112, 128)],
    burst: [120, 138],
    rays: () => curveRays(30, 9, () => 52, flat, 'enlightenment', { jitter: 0.05, op: [0.45, 0.9] }),
    dots: () => {
      const rng = makeRng('enlightenment-stars');
      return Array.from({ length: 26 }, () => ({
        x: 10 + rng() * 220,
        y: 8 + rng() * 322,
        r: 0.8 + rng(),
        opacity: 0.3 + rng() * 0.6,
      }));
    },
  },
};

const cache = new Map<string, EnergyPose>();

// Bones shorter than this (feet, fists) are a line with no star at the
// far end, so hands and feet don't clutter the figure with dots.
const SHORT_BONE = 22;

// The pose for a level slug, or `none` before any reading (and for an
// unknown slug). Built once per slug — the rays are seeded, so
// the same state always draws the same figure. (Each stroke's second value
// is the limb thickness the poses were drawn with; the constellation draws
// every bone as one fine line, so it isn't used here.)
export function getEnergyPose(slug: string | null | undefined): EnergyPose {
  const key = slug && SOURCES[slug] ? slug : 'none';
  const hit = cache.get(key);
  if (hit) return hit;
  const s = SOURCES[key];
  const burst = { x: s.burst[0], y: s.burst[1] };
  const bones = s.strokes.map(([d]) => samplePath(d));
  const joints: Pt[] = [];
  for (const pts of bones) {
    const ends = polyLength(pts) < SHORT_BONE ? [pts[0]] : [pts[0], pts[pts.length - 1]];
    for (const p of ends) {
      if (joints.every((q) => Math.hypot(p.x - q.x, p.y - q.y) > 7)) joints.push(p);
    }
  }
  joints.sort((a, b) => Math.hypot(a.x - burst.x, a.y - burst.y) - Math.hypot(b.x - burst.x, b.y - burst.y));
  const pose: EnergyPose = {
    head: { x: s.head[0], y: s.head[1], r: 13 },
    strokes: bones.map((pts) => ({ d: polyD(pts), length: polyLength(pts) })),
    joints,
    burst,
    rays: s.rays(),
    dots: s.dots?.(),
    lines: s.lines,
  };
  cache.set(key, pose);
  return pose;
}
