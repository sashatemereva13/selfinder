import { useEffect, useMemo } from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle, Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { buildCardSymbolLayers, CardSymbolId, CardSymbolLayers } from './CardSymbol';

// Draw-in animation for a drawn card — the main trace strokes itself into
// existence (per docs/design/aesthetic.md: "things gather, condense, and
// become — they don't slide or pop"), then the fainter echo/harmonic/
// scatter layer fades in around it, then (if the card has one) a single
// emphasis marker pops in last — same staggered choreography Depths' own
// arrival ritual uses (rings resolve first, content condenses in after,
// the aura forms last because of it). CardSymbol.tsx stays pure static
// geometry; this is the only place that touches Reanimated for a card.
//
// Approximate path length from the polyline point spacing baked into
// each card's path string (~1-2.5 SVG units between points across every
// generator in CardSymbol.tsx) rather than sampling the `d` string
// itself — cheap, and accurate enough for a stroke-dashoffset draw where
// the point is the reveal timing, not pixel-exact length. Exported so
// DepthsSpiral.tsx (a second `M`/`L`-polyline strokeDashoffset consumer,
// see docs/depths-structure-concept.md) can reuse the same summation
// instead of duplicating it.
export function estimatePathLength(d: string): number {
  if (!d) return 0;
  const points = d
    .replace(/^M/, '')
    .split(/[ML]/)
    .filter(Boolean)
    .map((pair) => {
      const [x, y] = pair.trim().split(',').map(Number);
      return { x, y };
    });
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  }
  return length;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const PRIMARY_DRAW_DURATION = 1400;
const REST_FADE_DELAY = 1000;
const REST_FADE_DURATION = 700;
const GLOW_FADE_DURATION = 900;
const EMPHASIS_DELAY = 1550;
const EMPHASIS_DURATION = 450;

// Generic draw-in shell for any wireframe symbol set built the way
// CardSymbol.tsx's are (a `buildLayers(id, color)` factory returning
// CardSymbolLayers) — Cards was the first consumer, NatureSymbol.tsx (level
// pages' natural-event imagery) is the second. `gradientKey` namespaces the
// core-glow SVG <Defs> id so two different symbol families never collide if
// an `id` string is ever coincidentally shared across them.
export function AnimatedSymbol<Id extends string>({
  id,
  rgb,
  size = 120,
  buildLayers,
  gradientKey,
}: {
  id: Id;
  rgb: string;
  size?: number;
  buildLayers: (id: Id, color: string) => CardSymbolLayers;
  gradientKey?: string;
}) {
  const color = `rgb(${rgb})`;
  const cx = 100;
  const cy = 100;
  const gradientId = `anim-${gradientKey ?? id}-core`;

  const { primaryPath, primaryStrokeWidth, rest, emphasis } = useMemo(
    () => buildLayers(id, color),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id, rgb],
  );
  const length = useMemo(() => estimatePathLength(primaryPath), [primaryPath]);
  const hasPrimary = primaryStrokeWidth > 0 && length > 1;

  const drawProgress = useSharedValue(0);
  const restOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const emphasisScale = useSharedValue(0);

  useEffect(() => {
    drawProgress.value = 0;
    restOpacity.value = 0;
    glowOpacity.value = 0;
    emphasisScale.value = 0;
    glowOpacity.value = withTiming(1, { duration: GLOW_FADE_DURATION, easing: SOFT_EASE });
    if (hasPrimary) {
      drawProgress.value = withTiming(1, { duration: PRIMARY_DRAW_DURATION, easing: SOFT_EASE });
      restOpacity.value = withDelay(
        REST_FADE_DELAY,
        withTiming(1, { duration: REST_FADE_DURATION, easing: SOFT_EASE }),
      );
    } else {
      restOpacity.value = withTiming(1, { duration: REST_FADE_DURATION, easing: SOFT_EASE });
    }
    if (emphasis) {
      emphasisScale.value = withDelay(
        hasPrimary ? EMPHASIS_DELAY : REST_FADE_DURATION + 200,
        withTiming(1, { duration: EMPHASIS_DURATION, easing: SOFT_EASE }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, rgb]);

  const primaryAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - drawProgress.value),
  }));

  const emphasisAnimatedProps = useAnimatedProps(() => ({
    r: (emphasis?.r ?? 0) * emphasisScale.value,
  }));

  const restStyle = useAnimatedStyle(() => ({ opacity: restOpacity.value }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  return (
    <Animated.View style={{ width: size, height: size }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size }, glowStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={0.18} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={cx} cy={cy} r={92} fill={`url(#${gradientId})`} />
        </Svg>
      </Animated.View>

      <Animated.View style={[{ position: 'absolute', width: size, height: size }, restStyle]}>
        <Svg width={size} height={size} viewBox="0 0 200 200">
          {rest}
        </Svg>
      </Animated.View>

      {hasPrimary && (
        <Svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute' }}>
          <AnimatedPath
            d={primaryPath}
            fill="none"
            stroke={color}
            strokeWidth={primaryStrokeWidth}
            strokeLinecap="round"
            strokeDasharray={[length, length]}
            animatedProps={primaryAnimatedProps}
          />
        </Svg>
      )}

      {emphasis && (
        <Svg width={size} height={size} viewBox="0 0 200 200" style={{ position: 'absolute' }}>
          <AnimatedCircle cx={emphasis.cx} cy={emphasis.cy} fill={color} animatedProps={emphasisAnimatedProps} />
        </Svg>
      )}
    </Animated.View>
  );
}

// Thin, backward-compatible wrapper — every existing Cards call site keeps
// working unchanged.
export function AnimatedCardSymbol({
  id,
  rgb,
  size = 120,
}: {
  id: CardSymbolId;
  rgb: string;
  size?: number;
}) {
  return <AnimatedSymbol id={id} rgb={rgb} size={size} buildLayers={buildCardSymbolLayers} gradientKey={`card-${id}`} />;
}
