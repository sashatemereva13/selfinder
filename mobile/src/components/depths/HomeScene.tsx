import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import { GROUND_RX_RATIO, GROUND_RY_RATIO } from './AuraField';
import { useThemeStore } from '../../store/themeStore';
import { usePhilosopherStore } from '../../store/philosopherStore';
import { makeRng } from '../../utils/auraDots';

// Where the figure is (2026-10-27) — Today's home: a field by day, a room
// by a fire at night, chosen by the clock, not the theme. Drawn in the same
// thin construction lines as the philosopher symbols and the cards, in the
// theme's own line colour, so in dark mode the field reads as dusk and in
// light mode the fire as a lamp-lit room. The point is that the figure is
// never alone in a void: a quiet place, the kind where your own voice is
// audible. Kept faint — the figure and its light stay the brightest thing.
//
// Laid out in a 390x844 design space (the phone the composition was tuned
// on) and scaled to fill the screen from the bottom, so the ground stays
// under the figure's feet. Everything is placed around Today's own
// layout: nothing where the headline, the reflection, the spiral's upper
// turns or the ring sit; the fire stands to the right of the figure.
//
// The state isn't shown here yet — the plan is for each state to become
// the weather and light in this same place (rain over the field for
// grief, the fire flaring for courage), never a different location.

const W = 390;
const H = 844;
// Day runs from 06:00 to 19:00; the rest is the fire.
const DAY_START = 6;
const NIGHT_START = 19;

// Each philosopher has their own place by day (2026-10-28): you're inside
// it, with them. Marcus Aurelius' is his inner citadel; Socrates', a
// portico in the Athenian Agora; Aristotle's, his library at the Lyceum. The others' aren't drawn yet, so they show
// no place rather than borrowing someone else's.
export type HomePlace = 'citadel' | 'portico' | 'library' | 'fire' | null;

const DAY_PLACES: Record<string, HomePlace> = {
  stoics: 'citadel',
  socrates: 'portico',
  aristotle: 'library',
};

export function homePlaceFor(hour: number, philosopherId: string | null | undefined): HomePlace {
  if (hour < DAY_START || hour >= NIGHT_START) return 'fire';
  return (philosopherId && DAY_PLACES[philosopherId]) || null;
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

// ---- the fire -----------------------------------------------------------

function flame(bx: number, by: number, h: number, lean: number, wmax: number) {
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const taper = (1 - t) ** 0.7;
    const drift = lean * t ** 1.6;
    const w = wmax * taper * (1 - t * 0.3);
    left.push({ x: bx - w + drift, y: by - t * h });
    right.push({ x: bx + w + drift, y: by - t * h });
  }
  return `${line([...left, ...right.reverse()])} Z`;
}

// The hearth: a wireframe box in perspective (Kierkegaard's cube, become a
// fireplace), set to the right of the figure and partly past the screen's
// edge, as if the room continues.
// The scene is anchored to the bottom of Today's area (just above the tab
// bar), so placement is read from the bottom edge (y=844): the figure's
// feet stand about 55 above it, the spiral's last sphere ("Body") about
// 150. The hearth stays below and to the right of that.
const HEARTH = { x: 322, y: 712, w: 110, h: 104 };
const FIRE = { x: HEARTH.x + HEARTH.w / 2 - 14, base: HEARTH.y + HEARTH.h - 8 };

function buildFire() {
  const { x, y, w, h } = HEARTH;
  const vx = 300;
  const vy = 690;
  const floor: string[] = [];
  for (let fx = -220; fx <= 640; fx += 60) floor.push(`M${vx},${vy} L${fx},${H + 40}`);
  const boards = [748, 790, 830].map((fy, k) => ({ d: `M-10,${fy} L${W + 10},${fy}`, opacity: 0.05 + k * 0.02 }));
  const hearth = [
    { d: `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`, opacity: 0.42, width: 1.2 },
    { d: `M${x + 18},${y + 40} L${x + w - 18},${y + 40} L${x + w - 18},${y + h} M${x + 18},${y + h} L${x + 18},${y + 40}`, opacity: 0.28, width: 1 },
    { d: `M${x - 8},${y} L${x + w + 8},${y} L${x + w + 16},${y - 10} L${x},${y - 10} Z`, opacity: 0.36, width: 1.1 },
    { d: `M${x + 34},${y - 10} L${x + 34},${y - 46} M${x + w - 34},${y - 10} L${x + w - 34},${y - 46}`, opacity: 0.14, width: 1 },
  ];
  const logs = `M${x + 28},${y + h - 5} L${x + w - 26},${y + h - 13} M${x + 34},${y + h - 13} L${x + w - 30},${y + h - 5}`;
  const flames = [
    { d: flame(FIRE.x, FIRE.base, 52, 5, 13), opacity: 0.9, width: 1.5 },
    { d: flame(FIRE.x - 18, FIRE.base + 2, 30, 7, 8), opacity: 0.65, width: 1.1 },
    { d: flame(FIRE.x + 14, FIRE.base + 2, 24, 5, 7), opacity: 0.55, width: 1.1 },
  ];
  return { floor: floor.join(' '), boards, hearth, logs, flames };
}

export function HomeScene({ lightRgb }: {
  // The reading's colour (or the ivory before any reading) — the banners'
  // emblem and cloth answer the light in the figure's chest.
  lightRgb: string;
}) {
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  // Re-read the clock whenever Today comes back into view.
  const isFocused = useIsFocused();
  const philosopherId = usePhilosopherStore((s) => s.philosopher?.id);
  const place = useMemo(() => homePlaceFor(new Date().getHours(), philosopherId), [isFocused, philosopherId]);
  const field = useMemo(buildCitadelHall, []);
  const portico = useMemo(buildPortico, []);
  const library = useMemo(buildLibrary, []);
  const fire = useMemo(buildFire, []);
  const lineColor = colors.text.primary;
  const fireColor = theme === 'light' ? '#c98a3d' : '#f3cf95';

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
        {place === 'fire' && (
          <>
            <Defs>
              <RadialGradient id="home-fireglow" cx={FIRE.x} cy={FIRE.base - 40} r={360} gradientUnits="userSpaceOnUse">
                <Stop offset="0" stopColor={fireColor} stopOpacity={theme === 'light' ? 0.2 : 0.26} />
                <Stop offset="0.45" stopColor={fireColor} stopOpacity={0.08} />
                <Stop offset="1" stopColor={fireColor} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect x={-200} y={0} width={W + 400} height={H} fill="url(#home-fireglow)" />
            <G fill="none" stroke={lineColor} strokeLinecap="round" strokeLinejoin="round">
              <Path d={fire.floor} strokeOpacity={0.06} strokeWidth={1} />
              {fire.boards.map((b, i) => (
                <Path key={`b${i}`} d={b.d} strokeOpacity={b.opacity} strokeWidth={1} />
              ))}
              {fire.hearth.map((p, i) => (
                <Path key={`p${i}`} d={p.d} strokeOpacity={p.opacity} strokeWidth={p.width} />
              ))}
              <Path d={fire.logs} strokeOpacity={0.45} strokeWidth={2} />
            </G>
            <G fill="none" stroke={fireColor} strokeLinejoin="round">
              {fire.flames.map((fl, i) => (
                <Path key={`fl${i}`} d={fl.d} strokeOpacity={fl.opacity} strokeWidth={fl.width} />
              ))}
            </G>
          </>
        )}
      </Svg>
    </View>
  );
}
