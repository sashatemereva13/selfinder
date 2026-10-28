import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { G, Circle, Path } from 'react-native-svg';
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
// joints as small stars, bones as fine lines, drawn in the same thin construction lines as the philosopher
// symbols and the cards. Poses, joints and ray shapes live in
// energyBodyPoses.ts.
//
// Motion follows docs/design/aesthetic.md — causality, then life: the
// spark lights, the rays reach out, the stars appear nearest the light
// first, the bones connect them, the head appears. After that the spark
// breathes. Reduce Motion shows it drawn and still. The figure has no orbits
// of its own on Today (removed 2026-10-28): Depths' spiral already circles
// it, and two sets of rings around one body fought each other.
// No soft glow around the light (removed 2026-10-28, with the glow column
// behind the figure on Today): lines and the spark only read cleaner.
//
// Only SVG props are animated, never a native view's transform: an
// animated scale on the View around an Svg made the whole layer vanish on
// iOS.

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
const SETTLED_MS = 3000;
const BREATH_MS = 4500;

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

  const viewBox = `0 0 ${ENERGY_BODY_VIEWBOX.width} ${ENERGY_BODY_VIEWBOX.height}`;

  return (
    <View style={{ width, height }} pointerEvents="none">
      <Svg width={width} height={height} viewBox={viewBox}>
        <G transform={`translate(${dx}, ${dy})`}>

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
              delay={BONES_START_MS + 600}
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
