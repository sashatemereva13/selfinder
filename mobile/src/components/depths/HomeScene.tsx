import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useIsFocused } from 'expo-router';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import { GROUND_RX_RATIO, GROUND_RY_RATIO } from './AuraField';
import { useThemeStore } from '../../store/themeStore';

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

export type HomePlace = 'field' | 'fire';

export function homePlaceForHour(hour: number): HomePlace {
  return hour >= DAY_START && hour < NIGHT_START ? 'field' : 'fire';
}

type Pt = { x: number; y: number };

function f(v: number) {
  return Math.round(v * 10) / 10;
}

function line(pts: Pt[]) {
  return `M${pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' L')}`;
}

// ---- the field ----------------------------------------------------------

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

function buildField() {
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
  const place = useMemo(() => homePlaceForHour(new Date().getHours()), [isFocused]);
  const field = useMemo(buildField, []);
  const fire = useMemo(buildFire, []);
  const lineColor = colors.text.primary;
  const fireColor = theme === 'light' ? '#c98a3d' : '#f3cf95';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice">
        {place === 'field' ? (
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
        ) : (
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
