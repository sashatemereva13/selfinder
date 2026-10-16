import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { useLocaleStore } from '../../store/localeStore';
import { VIBRATION_LEVELS, getLocalizedLevelName, useLevelColors, useLevelTextColors } from '../../content/measureConfig';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// A Shift session's before and after (2026-10-14): where the person
// started and where they placed themselves, each point in its own state's
// colour, joined by a thin arc — or, when they stayed, one point with a
// soft ring. The second point gathers in from the first. A record of what
// they did, never a verdict on it: no arrow, no distance, no praise.
// Shown at the end of a session, and on Today once the walk is done.
export function ShiftMark({
  fromSlug,
  toSlug,
  width = 220,
  animate = true,
}: {
  fromSlug: string;
  toSlug: string;
  width?: number;
  animate?: boolean;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const levelColors = useLevelColors();
  const levelTextColors = useLevelTextColors();
  const stayed = fromSlug === toSlug;

  const nameOf = (slug: string) => {
    const level = VIBRATION_LEVELS.find((l) => l.slug === slug);
    const name = level ? getLocalizedLevelName(level, locale) : slug;
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const H = 44;
  const left = { x: 14, y: 30 };
  const right = { x: width - 14, y: 30 };
  const mid = { x: width / 2, y: 4 };
  const arcD = `M ${left.x} ${left.y} Q ${mid.x} ${mid.y} ${right.x} ${right.y}`;
  // The arc's length, near enough for the draw-in.
  const ARC_LEN = width * 1.15;

  const progress = useSharedValue(animate ? 0 : 1);
  useEffect(() => {
    if (animate) progress.value = withDelay(300, withTiming(1, { duration: 1400, easing: SOFT_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The second point travels along the arc as it draws, then rests.
  const toProps = useAnimatedProps(() => {
    const t = progress.value;
    const x = (1 - t) * (1 - t) * left.x + 2 * (1 - t) * t * mid.x + t * t * right.x;
    const y = (1 - t) * (1 - t) * left.y + 2 * (1 - t) * t * mid.y + t * t * right.y;
    return { cx: x, cy: y, opacity: t === 0 ? 0 : 1 };
  });
  const arcProps = useAnimatedProps(() => ({ strokeDashoffset: ARC_LEN * (1 - progress.value) }));
  const ringProps = useAnimatedProps(() => ({ r: 6 + progress.value * 7, opacity: 0.8 * progress.value }));

  if (stayed) {
    const rgb = levelColors[fromSlug];
    return (
      <View style={styles.root}>
        <Svg width={60} height={H}>
          <Circle cx={30} cy={22} r={5} fill={`rgb(${rgb})`} />
          <AnimatedCircle cx={30} cy={22} fill="none" stroke={`rgb(${rgb})`} strokeWidth={1.2} animatedProps={ringProps} />
        </Svg>
        <Text style={[styles.name, { color: `rgb(${levelTextColors[fromSlug]})` }]}>{nameOf(fromSlug)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <Svg width={width} height={H}>
        <AnimatedPath
          d={arcD}
          fill="none"
          stroke={colors.text.faint}
          strokeWidth={1}
          strokeDasharray={`${ARC_LEN} ${ARC_LEN}`}
          animatedProps={arcProps}
        />
        <Circle cx={left.x} cy={left.y} r={5} fill={`rgb(${levelColors[fromSlug]})`} />
        <AnimatedCircle r={5} fill={`rgb(${levelColors[toSlug]})`} animatedProps={toProps} />
      </Svg>
      <View style={[styles.names, { width }]}>
        <Text style={[styles.name, { color: `rgb(${levelTextColors[fromSlug]})` }]}>{nameOf(fromSlug)}</Text>
        <Text style={[styles.name, { color: `rgb(${levelTextColors[toSlug]})` }]}>{nameOf(toSlug)}</Text>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { alignItems: 'center', gap: spacing[1] },
    names: { flexDirection: 'row', justifyContent: 'space-between' },
    name: { fontFamily: fonts.medium, fontSize: fontSizes.xs, color: colors.text.secondary },
  });
}
