// Deterministic dot-field generator for AuraFigure — same algorithm as the
// HTML mockup (edge-of-zone placement + gaussian jitter, biased outward so
// dots read as energy escaping the body rather than noise inside it), just
// ported to a seeded PRNG so React Native gets stable, non-reshuffling output.

export interface AuraDot {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
}

// mulberry32 — small, fast, deterministic PRNG seeded from a string.
function makeRng(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rng: () => number, sigma: number): number {
  const u1 = Math.max(rng(), 1e-9);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * sigma;
}

function dotField(
  rng: () => number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n: number,
  opacityRange: [number, number],
  radiusRange: [number, number],
  sigma = 0.16
): AuraDot[] {
  const dots: AuraDot[] = [];
  for (let i = 0; i < n; i++) {
    const theta = rng() * Math.PI * 2;
    const ex = cx + rx * Math.cos(theta);
    const ey = cy + ry * Math.sin(theta);
    const jitter = gaussian(rng, sigma);
    if (jitter < -0.3) continue;
    const ux = Math.cos(theta);
    const uy = Math.sin(theta);
    const px = ex + jitter * rx * ux;
    const py = ey + jitter * ry * uy;
    const dist = Math.abs(jitter);
    const falloff = Math.max(0, 1 - dist / 0.9);
    if (falloff <= 0.02) continue;
    const opacity =
      opacityRange[0] + (opacityRange[1] - opacityRange[0]) * falloff * (0.5 + rng() * 0.5);
    const r = radiusRange[0] + (radiusRange[1] - radiusRange[0]) * falloff * (0.4 + rng() * 0.6);
    dots.push({ cx: px, cy: py, r: Math.round(r * 10) / 10, opacity: Math.round(opacity * 100) / 100 });
  }
  return dots;
}

// Same three zones as the approved mockup — head, torso+arms, legs — each
// scattering dots from its own edge outward.
export function generateAuraDots(seed: string): AuraDot[] {
  const rng = makeRng(seed);
  return [
    ...dotField(rng, 100, 42, 32, 36, 55, [0.15, 0.85], [0.35, 1.2]),
    ...dotField(rng, 100, 145, 96, 116, 120, [0.12, 0.8], [0.35, 1.3]),
    ...dotField(rng, 100, 260, 56, 130, 90, [0.12, 0.75], [0.35, 1.2]),
  ];
}

// Single-zone version for the philosopher objects — one bounding ellipse
// around the whole shape, rather than the figure's three body zones.
export function generateObjectDots(
  seed: string,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  n = 45
): AuraDot[] {
  const rng = makeRng(seed);
  return dotField(rng, cx, cy, rx, ry, n, [0.1, 0.7], [0.4, 1.6], 0.18);
}
