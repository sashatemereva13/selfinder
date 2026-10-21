import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { usePhilosopherStep } from '../../utils/usePhilosopherStep';
import { useAppAccentRgb } from '../../utils/appAccent';
import { track } from '../../utils/analytics';
import { DepthsTabIcon, PracticeTabIcon, YourArcTabIcon } from '../shared/TabIcons';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const RING_R = 18;
const STATION_W = 72;

// The bottom menu (2026-10-09 — RULES.md, "Three places, one chain"):
// Today · Explore · Your Arc, each in its own faint dashed ring, joined by
// one thread, with a dot under the place you're in. Above them, the
// handle: the philosopher's one next step in Today's chain, named and
// done on tap — the way back into the chain from anywhere. (Until
// 2026-10-09 the handle also opened a full-screen map; with the chain
// leading itself and every separate experience in Explore, the map had no
// job left and was removed.)
//
// Typed structurally rather than against the navigator's own prop types —
// it only needs the tab state and navigation's emit/navigate.
type TabRoute = { key: string; name: string };
export interface MapBarProps {
  state: { index: number; routes: TabRoute[] };
  navigation: {
    emit: (event: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string) => void;
  };
  insets: { bottom: number };
}

type Station = 'today' | 'explore' | 'arc';

// By the route name's first segment — a tab folder without its own
// _layout (your-arc) registers as "your-arc/index", not "your-arc".
const stationForRoute = (name: string): Station | undefined =>
  ({ depths: 'today', explore: 'explore', 'your-arc': 'arc' } as const)[
    name.split('/')[0] as 'depths' | 'explore' | 'your-arc'
  ];

export function MapBar({ state, navigation, insets }: MapBarProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accentRgb = useAppAccentRgb();
  const step = usePhilosopherStep();
  const handleLabel = step.state === 'firstMeasure' ? t('map.handleFirst') : step.actionLabel;
  const [width, setWidth] = useState(0);
  const pathname = usePathname();

  const stations = state.routes
    .filter((r) => stationForRoute(r.name))
    .map((route) => {
      const station = stationForRoute(route.name)!;
      return {
        route,
        station,
        label: station === 'today' ? t('common.tabToday') : station === 'explore' ? t('common.tabExplore') : t('common.tabYourArc'),
        Icon: station === 'today' ? DepthsTabIcon : station === 'explore' ? PracticeTabIcon : YourArcTabIcon,
      };
    });
  const focusedName = state.routes[state.index]?.name;
  const xFor = (i: number) => width * (i === 0 ? 0.18 : i === 1 ? 0.5 : 0.82);
  const ringY = 22;

  const onStationPress = (route: TabRoute) => {
    const isFocused = route.name === focusedName;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  // Measure and a Shift session are focused time with the philosopher
  // (they fill the screen there) — no menu pulling elsewhere mid-walk;
  // each one's own back link is the way out. Checked after every hook
  // above, so hook order never changes between renders.
  if (pathname.startsWith('/depths/measure') || pathname.startsWith('/depths/session')) return null;

  return (
    // Fades rather than vanishing when Measure hides it (and back when
    // Measure ends), so the space doesn't blink empty for a frame.
    <Animated.View
      entering={FadeIn.duration(280).easing(SOFT_EASE)}
      exiting={FadeOut.duration(200)}
      style={[styles.root, { paddingBottom: insets.bottom + spacing[1] }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {/* The philosopher's one step, done on tap. At rest it has nothing
          to do, so it's just words. */}
      <View style={styles.handle}>
        <Pressable
          disabled={!step.hasAction}
          onPress={() => {
            track('map_step_taken', { from: focusedName, state: step.state });
            step.run();
          }}
          accessibilityRole={step.hasAction ? 'button' : 'text'}
          accessibilityLabel={handleLabel}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
        >
          {step.hasAction ? (
            <Text style={[styles.handleText, { color: `rgb(${accentRgb})` }]} numberOfLines={1}>
              {handleLabel} →
            </Text>
          ) : (
            // At rest, the philosopher's own closing line for the day
            // (2026-10-14) — quieter, in their voice, nothing to press —
            // instead of a system-sounding "That's today's walk".
            <Text style={styles.restText} numberOfLines={2}>
              {step.line || handleLabel}
            </Text>
          )}
        </Pressable>
      </View>

      <View style={styles.stations}>
        {width > 0 && (
          <Svg width={width} height={ringY * 2} style={StyleSheet.absoluteFill} pointerEvents="none">
            {stations.map((_, i) => (
              <Circle key={i} cx={xFor(i)} cy={ringY} r={RING_R} stroke={colors.bg.border} strokeWidth={1} strokeDasharray="2 4" fill="none" />
            ))}
            {/* The thread between the three places. */}
            <Path
              d={[0, 1]
                .map((i) => {
                  const a = xFor(i) + RING_R;
                  const b = xFor(i + 1) - RING_R;
                  const third = (b - a) / 3;
                  return `M${a} ${ringY} C${a + third} ${ringY - 12} ${b - third} ${ringY + 12} ${b} ${ringY}`;
                })
                .join(' ')}
              stroke={`rgba(${accentRgb},0.5)`}
              strokeWidth={1.3}
              strokeLinecap="round"
              fill="none"
            />
          </Svg>
        )}
        {width > 0 &&
          stations.map(({ route, station, label, Icon }, i) => {
            const isFocused = route.name === focusedName;
            const color = isFocused ? `rgb(${accentRgb})` : colors.text.muted;
            return (
              <Pressable
                key={route.key}
                onPress={() => onStationPress(route)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={label}
                style={[styles.station, { left: xFor(i) - STATION_W / 2 }]}
              >
                <View style={styles.iconBox}>
                  {/* The step always lives in Today's chain — Today
                      breathes when it moves on, unless you're already
                      there. */}
                  {station === 'today' && !isFocused && step.hasAction && (
                    <StepGlow accentRgb={accentRgb} stepKey={step.state} />
                  )}
                  <Icon color={color} />
                </View>
                <Text style={[styles.stationLabel, { color }]}>{label}</Text>
                <View style={[styles.hereDot, { backgroundColor: isFocused ? `rgb(${accentRgb})` : 'transparent' }]} />
              </Pressable>
            );
          })}
      </View>
    </Animated.View>
  );
}

// Breathes twice whenever the philosopher's step changes, then rests.
function StepGlow({ accentRgb, stepKey }: { accentRgb: string; stepKey: string }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = 0;
    glow.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 700, easing: SOFT_EASE }),
          withTiming(0, { duration: 900, easing: SOFT_EASE }),
        ),
        2,
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepKey]);
  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + glow.value * 0.4 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: `rgba(${accentRgb},0.22)` },
        style,
      ]}
    />
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: {
      backgroundColor: colors.bg.base,
      borderTopWidth: 1,
      borderTopColor: colors.bg.border,
    },
    handle: {
      alignSelf: 'center',
      maxWidth: '90%',
      paddingHorizontal: spacing[4],
      minHeight: 34,
      paddingVertical: spacing[1],
      alignItems: 'center',
      justifyContent: 'center',
    },
    handleText: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 0.3,
    },
    restText: {
      color: colors.text.muted,
      fontFamily: fonts.voice,
      fontSize: 12,
      lineHeight: 12 * 1.35,
      textAlign: 'center',
    },
    stations: { height: 66 },
    station: {
      position: 'absolute',
      top: 0,
      width: STATION_W,
      height: 66,
      alignItems: 'center',
    },
    iconBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    stationLabel: { fontFamily: fonts.light, fontSize: 10, letterSpacing: 0.5 },
    hereDot: { width: 4, height: 4, borderRadius: 2, marginTop: 3 },
  });
}
