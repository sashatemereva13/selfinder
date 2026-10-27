import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, G, Circle, Path } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import { useLevelColors } from '../../content/measureConfig';
import {
  ENERGY_BODY_CHEST,
  ENERGY_BODY_VIEWBOX,
  getEnergyPose,
} from '../../content/energyBodyPoses';

// The energy body (2026-10-27, replacing the pre-rendered AuraFigure images
// on Depths) — a constellation carrying a burst of light in its chest:
// joints as small stars, bones as fine lines, three orbits around the
// light, drawn in the same thin construction lines as the philosopher
// symbols and the cards. Poses, joints, orbits and ray shapes live in
// energyBodyPoses.ts.
//
// Motion follows docs/design/aesthetic.md — causality, then life: the
// spark lights, the rays reach out, the stars appear nearest the light
// first, the bones connect them, the head appears, the orbits close around
// it all. After that the glow breathes and the orbits turn very slowly, at
// different speeds and directions. Reduce Motion shows it drawn and still.
//
// Only SVG props are animated, never a native view's transform: an
// animated scale on the View around an Svg made the whole layer vanish on
// iOS. The orbits turn by recomputing their own path each frame rather
// than through a rotate prop, since react-native-svg resolves transform
// props on the JS side, where an animated value never reaches them.

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const SPARK_MS = 600;
const RAYS_START_MS = 250;
const RAY_STAGGER_MS = 20;
const DRAW_MS = 1000;
const STARS_START_MS = 550;
const STAR_STAGGER_MS = 70;
const STAR_MS = 700;
const HEAD_MS = 1150;
const BONES_START_MS = 1250;
const BONE_STAGGER_MS = 90;
const ORBITS_START_MS = 2000;
const ORBIT_STAGGER_MS = 250;
const ORBIT_DRAW_MS = 1600;
const SETTLED_MS = 3600;
const BREATH_MS = 4500;
// One full turn per orbit, each its own speed and direction.
const ORBIT_TURN_MS = [180000, -280000, 400000];

export function EnergyBody({
  slug,
  width,
  height,
}: {
  // A level slug, or null before any reading.
  slug: string | null;
  width: number;
  height: number;
}) {
  // A new state is a new figure — remount so it draws itself in again
  // rather than morphing one pose into another.
  return <EnergyBodyFigure key={slug ?? 'none'} slug={slug} width={width} height={height} />;
}

function EnergyBodyFigure({ slug, width, height }: { slug: string | null; width: number; height: number }) {
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  const reduceMotion = useReducedMotion();
  const pose = getEnergyPose(slug);
  const lightRgb = (slug && levelColors[slug]) || colors.accent.ivoryRgb;
  const light = `rgb(${lightRgb})`;
  const lineColor = colors.text.primary;

  // Line widths are chosen in screen pixels and converted into the pose's
  // 240-unit space, so the lines stay crisp at any size the figure is drawn.
  const px = ENERGY_BODY_VIEWBOX.width / width;

  // Moves the pose so its light sits on the chest point Depths' rings and
  // spiral are centred on.
  const dx = ENERGY_BODY_CHEST.x - pose.burst.x;
  const dy = ENERGY_BODY_CHEST.y - pose.burst.y;

  const spark = useSharedValue(reduceMotion ? 1 : 0);
  const breath = useSharedValue(0.5);

  useEffect(() => {
    if (reduceMotion) return;
    spark.value = withTiming(1, { duration: SPARK_MS, easing: SOFT_EASE });
    breath.value = withDelay(
      SETTLED_MS,
      withRepeat(withTiming(1, { duration: BREATH_MS, easing: Easing.inOut(Easing.sin) }), -1, true),
    );
    return () => cancelAnimation(breath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  const sparkProps = useAnimatedProps(() => ({
    opacity: spark.value,
    r: (1.5 + 3 * spark.value) * (0.92 + 0.16 * breath.value),
  }));
  const glowProps = useAnimatedProps(() => ({
    opacity: spark.value * (0.7 + 0.3 * breath.value),
    r: 60 + 16 * breath.value,
  }));

  const viewBox = `0 0 ${ENERGY_BODY_VIEWBOX.width} ${ENERGY_BODY_VIEWBOX.height}`;
  const glowId = `energy-glow-${slug ?? 'none'}`;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={viewBox}>
        <Defs>
          <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={light} stopOpacity={0.45} />
            <Stop offset="0.5" stopColor={light} stopOpacity={0.14} />
            <Stop offset="1" stopColor={light} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <G transform={`translate(${dx}, ${dy})`}>
          <AnimatedCircle cx={pose.burst.x} cy={pose.burst.y} fill={`url(#${glowId})`} animatedProps={glowProps} />

          {pose.orbits.map((o, k) => (
            <Orbit
              key={`o${k}`}
              cx={pose.burst.x}
              cy={pose.burst.y}
              rx={o.rx}
              ry={o.ry}
              rotation={o.rotation}
              turnMs={ORBIT_TURN_MS[k]}
              color={lineColor}
              opacity={0.3 - k * 0.07}
              width={0.8 * px}
              delay={ORBITS_START_MS + k * ORBIT_STAGGER_MS}
              reduceMotion={reduceMotion}
            />
          ))}

          {pose.strokes.map((s, i) => (
            <DrawStroke
              key={`b${i}`}
              d={s.d}
              width={1 * px}
              length={s.length}
              color={lineColor}
              opacity={0.55}
              delay={BONES_START_MS + i * BONE_STAGGER_MS}
              reduceMotion={reduceMotion}
            />
          ))}

          <Star
            cx={pose.head.x}
            cy={pose.head.y}
            r={pose.head.r}
            color={lineColor}
            ring
            width={1 * px}
            delay={HEAD_MS}
            reduceMotion={reduceMotion}
          />

          {pose.joints.map((j, i) => (
            <Star
              key={`j${i}`}
              cx={j.x}
              cy={j.y}
              r={1.8 * px}
              halo={4.5 * px}
              color={lineColor}
              width={0.8 * px}
              delay={STARS_START_MS + i * STAR_STAGGER_MS}
              reduceMotion={reduceMotion}
            />
          ))}

          <G transform={`translate(${pose.burst.x}, ${pose.burst.y})`}>
            {pose.rays.map((ray, i) => (
              <DrawStroke
                key={`r${i}`}
                d={ray.d}
                width={ray.width * 0.6 * px}
                length={ray.length}
                color={light}
                opacity={ray.opacity * 0.85}
                delay={RAYS_START_MS + i * RAY_STAGGER_MS}
                reduceMotion={reduceMotion}
              />
            ))}
          </G>
          {pose.lines?.map((l, i) => (
            <DrawStroke
              key={`l${i}`}
              d={l.d}
              width={0.8 * px}
              length={200}
              color={light}
              opacity={l.opacity}
              delay={ORBITS_START_MS}
              reduceMotion={reduceMotion}
            />
          ))}
          {pose.dots?.map((dot, i) => (
            <Star
              key={`d${i}`}
              cx={dot.x}
              cy={dot.y}
              r={dot.r}
              color={light}
              opacity={dot.opacity}
              delay={STARS_START_MS + i * 30}
              reduceMotion={reduceMotion}
            />
          ))}
          <AnimatedCircle cx={pose.burst.x} cy={pose.burst.y} fill="#fffaf0" animatedProps={sparkProps} />
        </G>
      </Svg>
    </View>
  );
}

function useDelayedProgress(delay: number, duration: number, reduceMotion: boolean) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withDelay(delay, withTiming(1, { duration, easing: SOFT_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  return progress;
}

// One line drawing itself along its own length, after `delay`.
function DrawStroke({
  d,
  width,
  length,
  color,
  opacity = 1,
  delay,
  reduceMotion,
}: {
  d: string;
  width: number;
  length: number;
  color: string;
  opacity?: number;
  delay: number;
  reduceMotion: boolean;
}) {
  const progress = useDelayedProgress(delay, DRAW_MS, reduceMotion);
  // +2: the round caps poke past the path's own ends; without the margin a
  // finished line keeps a sliver of dash gap at its tip.
  const dash = length + 2;
  // Hidden until it starts: a not-yet-drawn line still paints its round cap
  // as a dot at the path's start.
  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dash * (1 - progress.value),
    strokeOpacity: progress.value > 0.002 ? opacity : 0,
  }));
  return (
    <AnimatedPath
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={[dash, dash]}
      animatedProps={animatedProps}
    />
  );
}

// A star that appears with a small twinkle — swells past its size and
// settles. `halo` adds the faint ring around a joint; `ring` draws the
// star as an open circle (the head).
function Star({
  cx,
  cy,
  r,
  color,
  opacity = 0.9,
  halo,
  ring = false,
  width = 1,
  delay,
  reduceMotion,
}: {
  cx: number;
  cy: number;
  r: number;
  color: string;
  opacity?: number;
  halo?: number;
  ring?: boolean;
  width?: number;
  delay: number;
  reduceMotion: boolean;
}) {
  const scale = useSharedValue(reduceMotion ? 1 : 0);
  useEffect(() => {
    if (reduceMotion) return;
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.25, { duration: STAR_MS * 0.6, easing: SOFT_EASE }),
        withTiming(1, { duration: STAR_MS * 0.4, easing: SOFT_EASE }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  const coreProps = useAnimatedProps(() => ({
    r: r * scale.value,
    opacity: scale.value > 0.01 ? (ring ? 0.65 : opacity) : 0,
  }));
  const haloProps = useAnimatedProps(() => ({
    r: (halo ?? 0) * scale.value,
    strokeOpacity: scale.value > 0.01 ? 0.25 : 0,
  }));
  return (
    <>
      {halo ? <AnimatedCircle cx={cx} cy={cy} fill="none" stroke={color} strokeWidth={width} animatedProps={haloProps} /> : null}
      <AnimatedCircle
        cx={cx}
        cy={cy}
        fill={ring ? 'none' : color}
        stroke={ring ? color : 'none'}
        strokeWidth={ring ? width : 0}
        animatedProps={coreProps}
      />
    </>
  );
}

function ellipsePath(cx: number, cy: number, rx: number, ry: number, degrees: number) {
  'worklet';
  const a = (degrees * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  let d = '';
  for (let i = 0; i <= 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    const ex = rx * Math.cos(t);
    const ey = ry * Math.sin(t);
    d += `${i === 0 ? 'M' : ' L'}${(cx + ex * cos - ey * sin).toFixed(1)},${(cy + ex * sin + ey * cos).toFixed(1)}`;
  }
  return d;
}

// A tilted ellipse around the light that draws itself closed, then turns
// slowly forever. The path is rebuilt each frame from the current angle.
function Orbit({
  cx,
  cy,
  rx,
  ry,
  rotation,
  turnMs,
  color,
  opacity,
  width,
  delay,
  reduceMotion,
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  turnMs: number;
  color: string;
  opacity: number;
  width: number;
  delay: number;
  reduceMotion: boolean;
}) {
  const progress = useDelayedProgress(delay, ORBIT_DRAW_MS, reduceMotion);
  const turn = useSharedValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    turn.value = withDelay(
      SETTLED_MS,
      withRepeat(withTiming(1, { duration: Math.abs(turnMs), easing: Easing.linear }), -1, false),
    );
    return () => cancelAnimation(turn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);
  // Ramanujan's approximation — close enough for the draw-in's dash length.
  const h = ((rx - ry) * (rx - ry)) / ((rx + ry) * (rx + ry));
  const length = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h))) + 2;
  const direction = turnMs < 0 ? -1 : 1;
  const animatedProps = useAnimatedProps(() => ({
    d: ellipsePath(cx, cy, rx, ry, rotation + direction * 360 * turn.value),
    strokeDashoffset: length * (1 - progress.value),
    strokeOpacity: progress.value > 0.002 ? opacity : 0,
  }));
  return (
    <AnimatedPath
      d={ellipsePath(cx, cy, rx, ry, rotation)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeDasharray={[length, length]}
      animatedProps={animatedProps}
    />
  );
}
