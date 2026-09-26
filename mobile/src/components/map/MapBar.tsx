import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  runOnJS,
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
import { mapProgress, useMapStore } from '../../store/mapStore';
import { MAP_PLACES, MapRegion } from '../../content/mapPlaces';
import { usePhilosopherStep } from '../../utils/usePhilosopherStep';
import { useAppAccentRgb } from '../../utils/appAccent';
import { track } from '../../utils/analytics';
import { DepthsTabIcon, JourneysTabIcon, YourArcTabIcon } from '../shared/TabIcons';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// How far up (px) a drag has to travel to bring the map fully open; past
// OPEN_AT of that (or a quick upward flick) it commits open on release,
// otherwise it settles back closed.
const DRAG_DISTANCE = 260;
const OPEN_AT = 0.3;
const FLICK_VELOCITY = -600;
const RING_R = 18;
const STATION_W = 72;

// The minimap (RULES.md, "Navigation is a map") — the tab bar's own space,
// drawn as a small copy of the full map: Depths, Journeys, Your Arc, each in
// its own faint dashed ring, joined by the same solid thread the full map
// is built on, with a dot under the place you're in. Tapping a place goes
// there (same as a tab); tapping the handle opens the full map
// (MapOverlay). The region holding the philosopher's one step glows as it
// changes, then rests.
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

// By the route name's first segment — a tab folder without its own
// _layout (your-arc) registers as "your-arc/index", not "your-arc".
const regionForRoute = (name: string): MapRegion | undefined =>
  ({ depths: 'depths', journeys: 'journeys', 'your-arc': 'arc' } as const)[
    name.split('/')[0] as 'depths' | 'journeys' | 'your-arc'
  ];

export function MapBar({ state, navigation, insets }: MapBarProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const openMap = useMapStore((s) => s.openMap);
  const setPeeking = useMapStore((s) => s.setPeeking);
  const accentRgb = useAppAccentRgb();
  const step = usePhilosopherStep();
  const [width, setWidth] = useState(0);
  const pathname = usePathname();

  const targetRegion = MAP_PLACES.find((p) => p.id === step.mapTarget)?.region ?? 'depths';
  const stations: { route: TabRoute; region: MapRegion; label: string; Icon: typeof DepthsTabIcon }[] = state.routes
    .filter((r) => regionForRoute(r.name))
    .map((route) => {
      const region = regionForRoute(route.name)!;
      return {
        route,
        region,
        label: region === 'depths' ? t('common.tabDepths') : region === 'journeys' ? t('common.tabJourneys') : t('common.tabYourArc'),
        Icon: region === 'depths' ? DepthsTabIcon : region === 'journeys' ? JourneysTabIcon : YourArcTabIcon,
      };
    });
  const focusedName = state.routes[state.index]?.name;
  const xFor = (i: number) => (width * (i === 0 ? 0.18 : i === 1 ? 0.5 : 0.82));
  const ringY = 22;

  // Decided on the JS side, where the store's real `open` is known: a tap
  // on the handle can nudge the finger enough to start this drag too, and
  // its "not far enough — settle back" used to race the tap's own open,
  // leaving the map stuck part-way. If the map is already opening, a
  // finishing drag leaves it alone.
  const settleDrag = (commit: boolean) => {
    if (useMapStore.getState().open) return;
    if (commit) {
      openMap();
      track('map_opened', { from: focusedName ?? '', by: 'drag' });
      return;
    }
    mapProgress.value = withTiming(0, { duration: 260, easing: SOFT_EASE }, (finished) => {
      if (finished) runOnJS(setPeeking)(false);
    });
  };

  const onStationPress = (route: TabRoute) => {
    const isFocused = route.name === focusedName;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
  };

  // Measure is a focused conversation with the philosopher (RULES.md, "The
  // philosopher is a constant presence": they fill the screen there) — no
  // map pulling elsewhere mid-walk; each Measure screen's own back link is
  // the way out. Checked after every hook above, so hook order never
  // changes between renders.
  if (pathname.startsWith('/depths/measure')) return null;

  // Drag the minimap up to pull the full map open — the map follows the
  // finger (mapProgress) and either commits open or settles back on
  // release. Only vertical movement activates it, so taps on the three
  // places and on "the map" still go straight through.
  const drag = Gesture.Pan()
    .activeOffsetY(-8)
    .failOffsetX([-24, 24])
    .onStart(() => {
      runOnJS(setPeeking)(true);
    })
    .onUpdate((e) => {
      mapProgress.value = Math.min(1, Math.max(0, -e.translationY / DRAG_DISTANCE));
    })
    .onEnd((e) => {
      runOnJS(settleDrag)(mapProgress.value > OPEN_AT || e.velocityY < FLICK_VELOCITY);
    });

  return (
    <GestureDetector gesture={drag}>
    {/* Fades rather than vanishing when Measure hides it (and back when
        Measure ends) — Reanimated keeps the leaving bar drawn in place
        while it fades, so the space doesn't blink empty for a frame. */}
    <Animated.View
      entering={FadeIn.duration(280).easing(SOFT_EASE)}
      exiting={FadeOut.duration(200)}
      style={[styles.root, { paddingBottom: insets.bottom + spacing[1] }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      <Pressable
        onPress={() => {
          track('map_opened', { from: focusedName, by: 'tap' });
          openMap();
        }}
        accessibilityRole="button"
        accessibilityLabel={t('map.open')}
        style={styles.handle}
      >
        <View style={styles.grabber} />
        <Text style={styles.handleText}>{t('map.handle')}</Text>
      </Pressable>

      <View style={styles.stations}>
        {width > 0 && (
          <Svg width={width} height={ringY * 2} style={StyleSheet.absoluteFill} pointerEvents="none">
            {stations.map((_, i) => (
              <Circle key={i} cx={xFor(i)} cy={ringY} r={RING_R} stroke={colors.bg.border} strokeWidth={1} strokeDasharray="2 4" fill="none" />
            ))}
            {/* The thread between the three places — the same line the
                full map is drawn around. */}
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
          stations.map(({ route, region, label, Icon }, i) => {
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
                  {region === targetRegion && <StepGlow accentRgb={accentRgb} stepKey={step.mapTarget} />}
                  <Icon color={color} />
                </View>
                <Text style={[styles.stationLabel, { color }]}>{label}</Text>
                <View style={[styles.hereDot, { backgroundColor: isFocused ? `rgb(${accentRgb})` : 'transparent' }]} />
              </Pressable>
            );
          })}
      </View>
    </Animated.View>
    </GestureDetector>
  );
}

// Breathes twice whenever the philosopher's step changes, then rests at
// nothing — the full map is where the step stays lit.
function StepGlow({ accentRgb, stepKey }: { accentRgb: string; stepKey: string }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = 0;
    glow.value = withDelay(
      600,
      withSequence(
        withRepeat(
          withSequence(
            withTiming(1, { duration: 700, easing: SOFT_EASE }),
            withTiming(0, { duration: 900, easing: SOFT_EASE }),
          ),
          2,
        ),
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
      width: 120,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 3,
    },
    grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.bg.border },
    handleText: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: 9,
      letterSpacing: 2,
      textTransform: 'uppercase',
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
