import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import { GROUND_RX_RATIO, GROUND_RY_RATIO } from './AuraField';
import { usePhilosopherStore } from '../../store/philosopherStore';
import { makeRng } from '../../utils/auraDots';

// Where the figure is — Today's place, which belongs to the chosen
// philosopher (2026-10-28): you're inside it, with them, at any hour.
// Drawn in the same thin construction lines as the philosopher symbols and
// the cards, in the theme's own line colour, kept faint so the figure and
// its light stay the brightest thing; each place carries its
// philosopher's emblem in the reading's colour. (The first version was a
// generic field by day and a fire room at night, chosen by the clock; it
// was replaced by the philosophers' places, and the night switch removed.)
//
// Laid out in a 390x844 design space (the phone the composition was tuned
// on) and scaled to fill the screen from the bottom, so the ground stays
// under the figure's feet. Every place shares one layout, placed around
// Today's own: a band across the top under the text, one element at each
// screen edge, a floor line broken behind the figure's legs — nothing
// where the headline, the reflection, the spiral's labels or the ring sit.
//
// The state isn't shown here yet — the plan is for each state to become
// the weather and light in the philosopher's place, never a different one.

const W = 390;
const H = 844;
// Each philosopher's place. Marcus Aurelius' is his inner citadel; Socrates', a
// portico in the Athenian Agora; Aristotle's, his library at the Lyceum;
// Camus', Sisyphus' hillside; Kierkegaard's, the two doors of Either/Or.
// A philosopher without a drawn place would show no place rather than
// borrowing someone else's.
export type HomePlace = 'citadel' | 'portico' | 'library' | 'slope' | 'doors' | null;

const PLACES: Record<string, HomePlace> = {
  stoics: 'citadel',
  socrates: 'portico',
  aristotle: 'library',
  camus: 'slope',
  kierkegaard: 'doors',
};

export function homePlaceFor(philosopherId: string | null | undefined): HomePlace {
  return (philosopherId && PLACES[philosopherId]) || null;
}

type Pt = { x: number; y: number };

function f(v: number) {
  return Math.round(v * 10) / 10;
}

function line(pts: Pt[]) {
  return `M${pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' L')}`;
}

// ---- Marcus Aurelius: the citadel ---------------------------------------

// Marcus Aurelius' place (2026-10-28): you are inside the citadel — his
// "inner citadel" (Hadot's phrase for the Meditations) is somewhere you go
// in, not something seen from outside. A hall drawn in the same
// construction lines as the symbols: a round wall around the figure (see
// WALL), crowned with battlements, two long banners at its far edges
// carrying Marcus' cone in the reading's colour, and a round tile floor, drawn only as lines, with the rings of light at the
// figure's feet at its centre. No ceiling lines — they'd cross the text
// and the spheres.
//
// Placed from Today's own layout on a 390x844 design screen: the figure's
// chest near (200, 611), its arms within x 185–215, feet near y 790; the
// spiral's labels — "Mind" near (124–157, 505), "Spirit" (80–113, 593),
// "Heart" (275–322, 515–536), "Body" (260–320, 675–700) — the banners
// hang outside all of them, and the wall's top line passes above "Heart".

// The round floor's centre — the centre of the rings at the figure's feet —
// and its flattening, the same as those rings'.
const FLOOR = { cx: 200, cy: 776 };
const FLOOR_FLATTEN = GROUND_RY_RATIO / GROUND_RX_RATIO;
// The round wall (2026-10-28): a rotunda seen from inside. Its foot is the
// back half of a large ellipse around the same centre as the floor and the
// rings, with the same flattening, so it curves toward you at the sides;
// its top rim sits above eye level, so it curves the other way and rises
// toward the sides. The wall looks taller where it's nearer.
const WALL = { rx: 330, height: 230 };
const EYE_Y = 604; // eye level: the figure's chest
// The gap in the wall's foot, behind the figure's legs.
const LEGS = { l: 182, r: 218 };

// The wall's foot at x (back half of its ellipse), and its top there.
function wallFootY(x: number) {
  const t = Math.min(1, Math.abs(x - FLOOR.cx) / WALL.rx);
  return FLOOR.cy - WALL.rx * FLOOR_FLATTEN * Math.sqrt(1 - t * t);
}
function wallTopY(x: number) {
  const foot = wallFootY(x);
  const back = wallFootY(FLOOR.cx);
  return foot - (WALL.height * (foot - EYE_Y)) / (back - EYE_Y);
}

// A heraldic banner hanging from the parapet: a short rod, a swallowtail
// end, and Marcus' own emblem — the cone from the philosopher
// picker (lines fanning from one point down to a base, PhilosopherObject's
// coneWireframe), which makes this hall his citadel. The emblem is drawn in
// the reading's colour (see HomeScene).
//
// It hangs on the round wall, so it follows the wall like everything else
// on it: its rod and top run along a curve parallel to the wall's top and
// its swallowtail along one parallel to the wall's foot, so the outer side,
// nearer to you, is taller than the inner one and the banner turns toward
// the room; the sides stay vertical; the cone tilts with the cloth.
const BANNER_TOP = 0.905; // as fractions of the wall's height at x
const BANNER_BOTTOM = 0.11;

function wallLevel(x: number, frac: number) {
  return wallFootY(x) - frac * (wallFootY(x) - wallTopY(x));
}

function banner(x0: number, x1: number) {
  const mid = (x0 + x1) / 2;
  const w = x1 - x0;
  const top = (x: number) => wallLevel(x, BANNER_TOP);
  const bottom = (x: number) => wallLevel(x, BANNER_BOTTOM);
  const notch = bottom(mid) - w * 0.45;
  const cloth = `M${x0},${f(top(x0))} L${x0},${f(bottom(x0))} L${f(mid)},${f(notch)} L${x1},${f(bottom(x1))} L${x1},${f(top(x1))} Z`;
  const rod = `M${x0 - 4},${f(top(x0 - 4))} L${f(mid)},${f(top(mid))} L${x1 + 4},${f(top(x1 + 4))}`;
  const apex = { x: mid, y: wallLevel(mid, 0.84) };
  const half = w * 0.3;
  const cone: string[] = [];
  for (let i = 0; i < 9; i++) {
    const bx = mid - half + (i / 8) * half * 2;
    cone.push(`M${f(apex.x)},${f(apex.y)} L${f(bx)},${f(wallLevel(bx, 0.62))}`);
  }
  return { rod, cloth, emblem: cone.join(' ') };
}

function buildCitadelHall() {
  const arc = (x0: number, x1: number, y: (x: number) => number) => {
    const pts: Pt[] = [];
    for (let x = x0; x <= x1 + 0.01; x += 5) pts.push({ x, y: y(x) });
    return line(pts);
  };
  // How much nearer (bigger) the wall is at x than at its back.
  const near = (x: number) => (wallFootY(x) - EYE_Y) / (wallFootY(FLOOR.cx) - EYE_Y);

  // Battlements along the top rim (2026-10-28): merlons and gaps, wider
  // and taller where the wall is nearer — you're inside a roofless tower.
  let battlements = `M-10,${f(wallTopY(-10))}`;
  for (let x = -10, up = false; x < W + 10; up = !up) {
    const step = 11 * near(x);
    const xe = Math.min(x + step, W + 10);
    const rise = up ? 8 * near(x) : 0;
    battlements += ` L${f(x)},${f(wallTopY(x) - rise)} L${f(xe)},${f(wallTopY(xe) - rise)}`;
    x = xe;
  }

  // A parapet band of stone under the battlements: one course following
  // the curve, and the joints between its blocks, wider where the wall is
  // nearer. Kept to this band so no masonry crosses the figure or the
  // spheres' labels below it.
  const courseY = (x: number) => wallFootY(x) - 0.92 * (wallFootY(x) - wallTopY(x));
  const course = arc(-10, W + 10, courseY);
  const joints: string[] = [];
  for (let x = -6; x < W + 10; x += 24 * near(x)) {
    joints.push(`M${f(x)},${f(wallTopY(x))} L${f(x)},${f(courseY(x))}`);
  }

  const back = [
    arc(-10, LEGS.l, wallFootY),
    arc(LEGS.r, W + 10, wallFootY),
  ].join(' ');

  // A round floor, like a rotunda's (2026-10-28): concentric tile rings
  // and spokes centred on where the figure stands, in the same perspective
  // as the rings of light at its feet — so those rings sit at the centre of
  // the floor's own pattern. The tile rings start outside the light rings;
  // spokes run between them and stop short of the area behind the legs.
  const ringsAt = [196, 248, 306];
  const tileRings = ringsAt.map((rx) => {
    const ry = rx * FLOOR_FLATTEN;
    const pts: Pt[] = [];
    // The whole ring while it stays in front of the back wall's foot, only
    // its near half once its far side would run up the wall.
    const full = FLOOR.cy - ry >= wallFootY(FLOOR.cx);
    const to = full ? Math.PI * 2 : Math.PI;
    for (let i = 0; i <= 72; i++) {
      const a = (to * i) / 72;
      pts.push({ x: FLOOR.cx + rx * Math.cos(a), y: FLOOR.cy + ry * Math.sin(a) });
    }
    return line(pts);
  });
  const spokes: string[] = [];
  const inner = 168;
  const outer = ringsAt[ringsAt.length - 1];
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2;
    // Only the near half and the sides — the far half runs behind the legs
    // and up the back wall.
    if (Math.sin(a) < -0.15) continue;
    const p0 = { x: FLOOR.cx + inner * Math.cos(a), y: FLOOR.cy + inner * FLOOR_FLATTEN * Math.sin(a) };
    const p1 = { x: FLOOR.cx + outer * Math.cos(a), y: FLOOR.cy + outer * FLOOR_FLATTEN * Math.sin(a) };
    spokes.push(`M${f(p0.x)},${f(p0.y)} L${f(p1.x)},${f(p1.y)}`);
  }
  const tiles = `${tileRings.join(' ')} ${spokes.join(' ')}`;
  // One long banner each side at the screen's far edges, outside every
  // sphere label, hanging from the parapet's course (2026-10-28 — they
  // replaced two gothic windows: one element per side is calmer, and the
  // tower is open to the sky, so the light already comes from above).
  const banners = [
    banner(12, 42),
    banner(W - 42, W - 12),
  ];
  return { back, battlements, course, joints: joints.join(' '), banners, tiles };
}

// ---- Socrates: the portico --------------------------------------------------

// Socrates' place (2026-10-28) — a portico in the Athenian Agora, where he
// did his questioning. It has to be recognisable at a glance (a plane tree
// and Plato's cave were tried first and didn't read), and Greek columns
// are: fluted shafts, an entablature with a row of dentils, a temple step.
// Laid out like the citadel — the entablature across the top band where
// the battlements are, one column at each screen edge where the banners
// are, all clear of the spiral's labels. The columns are Ionic, and an
// Ionic capital's volutes are spirals — Socrates' own emblem from the
// philosopher picker — so they're drawn in the reading's colour.

const COLUMNS = [
  { l: 12, r: 46 },
  { l: W - 46, r: W - 12 },
];
const ENTABLATURE = { cornice: 440, dentilTop: 448, dentilBottom: 455, architrave: 466 };
const CAPITAL_Y = 480; // the abacus, where the capital meets the architrave
const BASE_Y = 712; // the step the columns stand on

// An Ionic volute: a spiral coiling inward, `dir` 1 to curl clockwise.
function volute(cx: number, cy: number, r: number, dir: 1 | -1) {
  const pts: Pt[] = [];
  const turns = 1.75;
  for (let i = 0; i <= 70; i++) {
    const t = (i / 70) * Math.PI * 2 * turns;
    const rr = r * (1 - i / 80);
    pts.push({ x: cx + dir * rr * Math.cos(t - Math.PI / 2), y: cy + rr * Math.sin(t - Math.PI / 2) });
  }
  return line(pts);
}

function buildPortico() {
  const E = ENTABLATURE;
  const entablature = [
    `M-10,${E.cornice} L${W + 10},${E.cornice}`,
    `M-10,${E.architrave} L${W + 10},${E.architrave}`,
    `M-10,${E.architrave + 6} L${W + 10},${E.architrave + 6}`,
  ].join(' ');
  const dentils: string[] = [];
  for (let x = -4; x < W + 10; x += 12) {
    dentils.push(`M${x},${E.dentilTop} L${x},${E.dentilBottom} L${x + 7},${E.dentilBottom} L${x + 7},${E.dentilTop} Z`);
  }

  const shafts: string[] = [];
  const flutes: string[] = [];
  const capitals: string[] = [];
  const volutes: string[] = [];
  COLUMNS.forEach(({ l, r }) => {
    const top = CAPITAL_Y + 12;
    const baseTop = BASE_Y - 14;
    // The shaft, and its flutes.
    shafts.push(`M${l},${top} L${l},${baseTop} M${r},${top} L${r},${baseTop}`);
    for (let k = 1; k < 5; k++) {
      const x = l + ((r - l) * k) / 5;
      flutes.push(`M${f(x)},${top + 4} L${f(x)},${baseTop - 4}`);
    }
    // The base: two mouldings, wider than the shaft.
    shafts.push(
      `M${l - 4},${baseTop} L${r + 4},${baseTop} M${l - 6},${BASE_Y - 6} L${r + 6},${BASE_Y - 6} M${l - 8},${BASE_Y} L${r + 8},${BASE_Y}`,
    );
    // The capital: the abacus slab, the band below it.
    capitals.push(`M${l - 10},${CAPITAL_Y} L${r + 10},${CAPITAL_Y} M${l - 8},${CAPITAL_Y + 5} L${r + 8},${CAPITAL_Y + 5} M${l},${top} L${r},${top}`);
    // The volutes curling down at each end — Socrates' spiral.
    volutes.push(volute(l - 3, CAPITAL_Y + 12, 7, -1), volute(r + 3, CAPITAL_Y + 12, 7, 1));
  });

  // The temple's step behind the figure, broken behind its legs.
  const step = [
    `M-10,${BASE_Y} L${LEGS.l},${BASE_Y} M${LEGS.r},${BASE_Y} L${W + 10},${BASE_Y}`,
    `M-10,${BASE_Y + 9} L${LEGS.l - 6},${BASE_Y + 9} M${LEGS.r + 6},${BASE_Y + 9} L${W + 10},${BASE_Y + 9}`,
  ].join(' ');

  return {
    entablature,
    dentils: dentils.join(' '),
    shafts: shafts.join(' '),
    flutes: flutes.join(' '),
    capitals: capitals.join(' '),
    volutes: volutes.join(' '),
    step,
  };
}

// ---- Aristotle: the library ----------------------------------------------

// Aristotle's place (2026-10-28) — his library at the Lyceum, the first
// great library of the ancient world, for a man who wrote on almost
// everything. Laid out like the citadel and the portico: a beam across the
// top band, one tall case of scroll shelves at each screen edge (clear of
// the spiral's labels), the floor below. Each cubby holds a few rolled
// scrolls, seen end-on as small circles. On one shelf of the right case
// stands an armillary sphere — Aristotle's sphere from the philosopher
// picker, and his cosmos of nested spheres — in the reading's colour.

const CASES = [
  { l: 8, r: 56 },
  { l: W - 56, r: W - 8 },
];
const SHELF_TOP = 452;
const SHELF_STEP = 44;
const FLOOR_Y = 712;
// The right case's compartment that holds the sphere (counted from the top).
const SPHERE_SHELF = 2;

function circlePath(cx: number, cy: number, r: number) {
  return `M${f(cx - r)},${f(cy)} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
}

// An ellipse as a path, tilted by `deg` — for the sphere's rings.
function ellipsePath(cx: number, cy: number, rx: number, ry: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  const pts: Pt[] = [];
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const x = rx * Math.cos(t);
    const y = ry * Math.sin(t);
    pts.push({ x: cx + x * Math.cos(a) - y * Math.sin(a), y: cy + x * Math.sin(a) + y * Math.cos(a) });
  }
  return `${line(pts)} Z`;
}

function buildLibrary() {
  const rng = makeRng('aristotle-library');
  const beam = `M-10,436 L${W + 10},436 M-10,444 L${W + 10},444`;
  const frames: string[] = [];
  const scrolls: string[] = [];
  const cores: string[] = [];
  let sphere = '';
  CASES.forEach(({ l, r }, c) => {
    const mid = (l + r) / 2;
    frames.push(`M${l},444 L${l},${FLOOR_Y} M${r},444 L${r},${FLOOR_Y}`);
    for (let y = SHELF_TOP, k = 0; y < FLOOR_Y; y += SHELF_STEP, k++) {
      const bottom = Math.min(y + SHELF_STEP, FLOOR_Y);
      frames.push(`M${l},${bottom} L${r},${bottom}`);
      const isSphere = c === 1 && k === SPHERE_SHELF;
      if (isSphere) {
        // The armillary sphere: an outer ring, the equator, a tilted
        // ecliptic, a meridian, and a small stand.
        const cx = mid;
        const cy = y + 19;
        const R = 13;
        sphere = [
          circlePath(cx, cy, R),
          ellipsePath(cx, cy, R, R * 0.32, 0),
          ellipsePath(cx, cy, R, R * 0.32, -24),
          ellipsePath(cx, cy, R * 0.35, R, 0),
          circlePath(cx, cy, 1.6),
          `M${cx},${cy + R} L${cx},${bottom - 2} M${cx - 7},${bottom} L${cx + 7},${bottom}`,
        ].join(' ');
        continue;
      }
      frames.push(`M${mid},${y} L${mid},${bottom}`);
      // Scrolls in each half: a stack of one to three, seen end-on.
      [l, mid].forEach((x0) => {
        const count = 1 + Math.floor(rng() * 3);
        const spots = [
          [x0 + 7, bottom - 5.5],
          [x0 + 17, bottom - 5.5],
          [x0 + 12, bottom - 14],
        ].slice(0, count);
        spots.forEach(([sx, sy]) => {
          scrolls.push(circlePath(sx, sy, 4.5));
          cores.push(circlePath(sx, sy, 1.2));
        });
      });
    }
  });
  const floor = `M-10,${FLOOR_Y} L${LEGS.l},${FLOOR_Y} M${LEGS.r},${FLOOR_Y} L${W + 10},${FLOOR_Y}`;
  return { beam, frames: frames.join(' '), scrolls: scrolls.join(' '), cores: cores.join(' '), sphere, floor };
}

// ---- Camus: Sisyphus' slope ------------------------------------------------

// Camus' place (2026-10-28) — The Myth of Sisyphus, and "one must imagine
// Sisyphus happy". Far off, across the top band, a long gentle hillside
// rises to the right, and Sisyphus pushes his boulder up it — small, like a
// frieze, the way the battlements and the entablature sit in the others'
// places. It has to be a gentle slope: on a steep flank (tried first) the
// man lay along the line and didn't read. Low on the left, distant rounded
// hills; the ground line runs behind you. The boulder is Camus' own symbol
// from the philosopher picker — a faceted rock (PhilosopherObject's
// boulderWireframe) — in the reading's colour; Sisyphus is plain thin
// lines, no stars and no light, so he's never mistaken for you.

// The hillside: a straight, gentle incline under the text, starting clear
// of "Mind" and passing above "Heart", rising off the right edge.
const HILL_FROM = { x: 186, y: 508 };
const HILL_TO = { x: W + 10, y: 440 };
const GROUND_Y = 712;

function hillAt(x: number): Pt {
  const t = (x - HILL_FROM.x) / (HILL_TO.x - HILL_FROM.x);
  return { x, y: HILL_FROM.y + (HILL_TO.y - HILL_FROM.y) * t };
}

function buildSlope() {
  const rng = makeRng('camus-slope');
  const ground = `M-10,${GROUND_Y} L${LEGS.l},${GROUND_Y} M${LEGS.r},${GROUND_Y} L${W + 10},${GROUND_Y}`;
  const hill = `M${HILL_FROM.x},${HILL_FROM.y} L${HILL_TO.x},${HILL_TO.y}`;
  // A few faint strokes under the hillside, for its rock.
  const hatch: string[] = [];
  for (let x = 204; x < W; x += 22 + rng() * 10) {
    const p = hillAt(x);
    hatch.push(`M${f(p.x)},${f(p.y + 4)} L${f(p.x + 6)},${f(p.y + 11)}`);
  }
  // Distant rounded hills on the left, low and faint, below "Spirit".
  const ridge = 'M-10,664 C4,640 16,620 30,622 C42,624 46,604 58,602 C74,600 84,640 98,676 C104,692 108,704 114,712';

  // Along the hillside: `dir` points uphill, `up` away from the ground.
  const dl = Math.hypot(HILL_TO.x - HILL_FROM.x, HILL_TO.y - HILL_FROM.y);
  const dir = { x: (HILL_TO.x - HILL_FROM.x) / dl, y: (HILL_TO.y - HILL_FROM.y) / dl };
  const up = { x: dir.y, y: -dir.x };
  const on = (x: number, along: number, height: number) => {
    const g = hillAt(x);
    return { x: g.x + dir.x * along + up.x * height, y: g.y + dir.y * along + up.y * height };
  };

  // The boulder, resting on the hillside.
  const R = 11;
  const c = on(318, 0, R);
  const pts: Pt[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 - Math.PI / 2 + (rng() - 0.5) * 0.3;
    const rad = R * (0.8 + rng() * 0.32);
    pts.push({ x: c.x + rad * Math.cos(a), y: c.y + rad * Math.sin(a) });
  }
  const chords = [[0, 3], [3, 6], [1, 5], [2, 7]]
    .map(([a, b]) => `M${f(pts[a].x)},${f(pts[a].y)} L${f(pts[b].x)},${f(pts[b].y)}`)
    .join(' ');
  const boulder = `${line(pts)} Z ${chords}`;

  // Sisyphus, just downhill, leaning his whole body into it.
  const sx = 286;
  const backFoot = on(sx, -8, 0);
  const frontFoot = on(sx, 6, 0);
  const knee = on(sx, 9, 7);
  const hips = on(sx, 2, 13);
  const shoulders = on(sx, 16, 22);
  const head = on(sx, 21, 27);
  const hands = on(318, -R * 0.9, R * 1.05);
  const sisyphus = [
    `M${f(backFoot.x)},${f(backFoot.y)} L${f(hips.x)},${f(hips.y)}`,
    `M${f(frontFoot.x)},${f(frontFoot.y)} L${f(knee.x)},${f(knee.y)} L${f(hips.x)},${f(hips.y)}`,
    `M${f(hips.x)},${f(hips.y)} L${f(shoulders.x)},${f(shoulders.y)}`,
    `M${f(shoulders.x)},${f(shoulders.y)} L${f(hands.x)},${f(hands.y)}`,
    `M${f(shoulders.x)},${f(shoulders.y - 1)} L${f(hands.x + up.x * 3)},${f(hands.y + up.y * 3)}`,
    circlePath(head.x, head.y, 3.2),
  ].join(' ');
  return { ground, hill, hatch: hatch.join(' '), ridge, boulder, sisyphus };
}

// ---- Kierkegaard: Either/Or ------------------------------------------------

// Kierkegaard's place (2026-10-28) — Either/Or, his best-known book, and a
// philosophy of choosing: two doors, one at each screen edge, mirrored and
// identical. Both stand slightly open, both let the same light through in
// the reading's colour — nothing marks either as the right one (Selfinder
// never ranks; the choice, and its reasons, are the person's). Each door
// frame is drawn as his picker symbol, the cube — a doorway with depth,
// its corners joined. A lintel runs across the top band and the threshold
// behind you, like the other places, all clear of the spiral's labels.

const DOOR = { outer: 6, inner: 60, top: 456, bottom: 712, depth: 6 };

// The left door; `mirror` reflects it to the right edge.
function door(mirror: boolean) {
  const X = (x: number) => (mirror ? W - x : x);
  const { outer, inner, top, bottom, depth } = DOOR;
  const fo = outer + depth; // the frame's inner face
  const fi = inner - depth;
  const ft = top + depth + 2;
  const frame = [
    `M${X(outer)},${bottom} L${X(outer)},${top} L${X(inner)},${top} L${X(inner)},${bottom}`,
    `M${X(fo)},${bottom} L${X(fo)},${ft} L${X(fi)},${ft} L${X(fi)},${bottom}`,
    // the cube's corners: front face to back face
    `M${X(outer)},${top} L${X(fo)},${ft} M${X(inner)},${top} L${X(fi)},${ft}`,
  ].join(' ');
  // The leaf, hinged on the outer side and swung open into the room beyond:
  // its free edge set back, so it narrows and drops slightly at the top.
  const free = fo + 24;
  const leaf = `M${X(fo)},${ft} L${X(free)},${ft + 9} L${X(free)},${bottom - 5} L${X(fo)},${bottom} Z`;
  const panels = [
    `M${X(fo + 5)},${ft + 16} L${X(free - 5)},${ft + 22} L${X(free - 5)},${ft + 110} L${X(fo + 5)},${ft + 108} Z`,
    `M${X(fo + 5)},${ft + 128} L${X(free - 5)},${ft + 132} L${X(free - 5)},${bottom - 18} L${X(fo + 5)},${bottom - 16} Z`,
  ].join(' ');
  // The gap between the leaf's free edge and the frame: the light coming
  // through, and three soft rays of it falling across the floor.
  const gap = `M${X(free)},${ft + 9} L${X(fi)},${ft} L${X(fi)},${bottom} L${X(free)},${bottom - 5} Z`;
  const rays = [0, 1, 2]
    .map((k) => {
      const x0 = free + 4 + k * 8;
      return `M${X(x0)},${bottom + 2} L${X(x0 + 34 + k * 22)},${bottom + 28 + k * 6}`;
    })
    .join(' ');
  return { frame, leaf, panels, gap, rays };
}

function buildDoors() {
  const lintel = `M-10,440 L${W + 10},440 M-10,447 L${W + 10},447`;
  const threshold = `M-10,${DOOR.bottom} L${LEGS.l},${DOOR.bottom} M${LEGS.r},${DOOR.bottom} L${W + 10},${DOOR.bottom}`;
  return { lintel, threshold, doors: [door(false), door(true)] };
}

export function HomeScene({ lightRgb }: {
  // The reading's colour (or the ivory before any reading) — the banners'
  // emblem and cloth answer the light in the figure's chest.
  lightRgb: string;
}) {
  const colors = useThemeColors();
  const philosopherId = usePhilosopherStore((s) => s.philosopher?.id);
  const place = homePlaceFor(philosopherId);
  const field = useMemo(buildCitadelHall, []);
  const portico = useMemo(buildPortico, []);
  const library = useMemo(buildLibrary, []);
  const slope = useMemo(buildSlope, []);
  const doors = useMemo(buildDoors, []);
  const lineColor = colors.text.primary;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        {place === 'citadel' && (
          <>
            <G fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round">
              <Path d={field.back} strokeOpacity={0.3} strokeWidth={1} />
              <Path d={field.battlements} strokeOpacity={0.3} strokeWidth={1} />
              <Path d={field.course} strokeOpacity={0.16} strokeWidth={0.9} />
              <Path d={field.joints} strokeOpacity={0.14} strokeWidth={0.9} />
              {field.banners.map((b, i) => (
                <G key={`b${i}`}>
                  <Path d={b.rod} strokeOpacity={0.36} strokeWidth={1.1} />
                  <Path d={b.cloth} strokeOpacity={0.32} strokeWidth={1} fill={`rgb(${lightRgb})`} fillOpacity={0.08} />
                  <Path d={b.emblem} stroke={`rgb(${lightRgb})`} strokeOpacity={0.7} strokeWidth={0.9} />
                </G>
              ))}
              <Path d={field.tiles} strokeOpacity={0.14} strokeWidth={0.9} />
            </G>
          </>
        )}
        {place === 'portico' && (
          <G fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round">
            <Path d={portico.entablature} strokeOpacity={0.32} strokeWidth={1} />
            <Path d={portico.dentils} strokeOpacity={0.2} strokeWidth={0.8} />
            <Path d={portico.shafts} strokeOpacity={0.34} strokeWidth={1} />
            <Path d={portico.flutes} strokeOpacity={0.16} strokeWidth={0.8} />
            <Path d={portico.capitals} strokeOpacity={0.34} strokeWidth={1} />
            <Path d={portico.volutes} stroke={`rgb(${lightRgb})`} strokeOpacity={0.8} strokeWidth={1} />
            <Path d={portico.step} strokeOpacity={0.24} strokeWidth={1} />
          </G>
        )}
        {place === 'library' && (
          <G fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round">
            <Path d={library.beam} strokeOpacity={0.32} strokeWidth={1} />
            <Path d={library.frames} strokeOpacity={0.3} strokeWidth={1} />
            <Path d={library.scrolls} strokeOpacity={0.26} strokeWidth={0.9} />
            <Path d={library.cores} strokeOpacity={0.2} strokeWidth={0.8} />
            <Path d={library.sphere} stroke={`rgb(${lightRgb})`} strokeOpacity={0.8} strokeWidth={0.9} />
            <Path d={library.floor} strokeOpacity={0.24} strokeWidth={1} />
          </G>
        )}
        {place === 'slope' && (
          <G fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round">
            <Path d={slope.ridge} strokeOpacity={0.16} strokeWidth={1} />
            <Path d={slope.ground} strokeOpacity={0.26} strokeWidth={1} />
            <Path d={slope.hill} strokeOpacity={0.34} strokeWidth={1.1} />
            <Path d={slope.hatch} strokeOpacity={0.16} strokeWidth={0.9} />
            <Path d={slope.sisyphus} strokeOpacity={0.6} strokeWidth={1.1} />
            <Path d={slope.boulder} stroke={`rgb(${lightRgb})`} strokeOpacity={0.8} strokeWidth={1} />
          </G>
        )}
        {place === 'doors' && (
          <G fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round">
            <Path d={doors.lintel} strokeOpacity={0.3} strokeWidth={1} />
            <Path d={doors.threshold} strokeOpacity={0.24} strokeWidth={1} />
            {doors.doors.map((d, i) => (
              <G key={`d${i}`}>
                <Path d={d.gap} stroke="none" fill={`rgb(${lightRgb})`} fillOpacity={0.16} />
                <Path d={d.rays} stroke={`rgb(${lightRgb})`} strokeOpacity={0.35} strokeWidth={1} />
                <Path d={d.frame} strokeOpacity={0.36} strokeWidth={1} />
                <Path d={d.leaf} strokeOpacity={0.34} strokeWidth={1} />
                <Path d={d.panels} strokeOpacity={0.18} strokeWidth={0.9} />
              </G>
            ))}
          </G>
        )}
      </Svg>
    </View>
  );
}
