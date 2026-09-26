import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../store/themeStore';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mapProgress, useMapStore } from '../../store/mapStore';
import { MAP_PLACES, MapPlace, MapRegion, placeForPath, regionForPath } from '../../content/mapPlaces';
import { usePhilosopherStep } from '../../utils/usePhilosopherStep';
import { useAppAccentRgb, useAppAccentTextRgb } from '../../utils/appAccent';
import { track } from '../../utils/analytics';
import { AmbientGlow } from '../shared/AmbientGlow';
import { PhilosopherSeam } from '../depths/PhilosopherSeam';
import { SCREEN_TRANSITION } from '../../theme/transitions';
import { DepthsMenuSymbol } from '../depths/DepthsMenuSymbol';
import { PhilosopherObject } from '../shared/PhilosopherObject';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// Opening was a 380ms SOFT_EASE — nearly all of its movement in the first
// ~100ms, and the whole map arriving as one block, which read as abrupt.
// Now a longer, evenly-paced curve drives a staged reveal (MapContent).
const GATHER_EASE = Easing.bezier(0.33, 0, 0.2, 1);
const OPEN_DURATION = 720;
const CONTENT_FADE_DURATION = 220;
const GROUND_FADE_DURATION = 300;
// Rough length of the thread path, in design-box units — only needs to be
// at least the real length, for the draw-on dash below.
const THREAD_LENGTH = 900;
const AnimatedPath = Animated.createAnimatedComponent(Path);
const BOX_W = 390;
const BOX_H = 652;

// A layer of the map that gathers in over its own slice of mapProgress
// (from → to): fading up and settling the last few pixels into place.
function useReveal(from: number, to: number) {
  return useAnimatedStyle(() => {
    const t = Math.min(1, Math.max(0, (mapProgress.value - from) / (to - from)));
    return { opacity: t, transform: [{ translateY: (1 - t) * 14 }] };
  });
}

// The expanded map (RULES.md, "Navigation is a map"): three territories —
// Your Arc's sky, Journeys' contoured land, Depths' rings around you — each
// with its own dashed border and terrain, and one thread, the only thing
// that crosses their borders: it starts at you in Depths, passes through
// Measure, climbs through Journeys (each Journey a side road off it), and
// ends at Now in Your Arc. The philosopher's one step sits at the bottom
// and glows on the map. Opened from the minimap (MapBar); drawn from the
// root layout so it covers the whole screen.
//
// Always mounted; its content is drawn from mapProgress (0 closed → 1
// open), which either the minimap's drag moves with the finger or a tap
// animates — so opening by dragging and opening by tapping are one motion.
// Content stays mounted while peeking (being dragged) and while closing,
// until it has actually faded out.
export function MapOverlay() {
  const open = useMapStore((s) => s.open);
  const peeking = useMapStore((s) => s.peeking);
  const closeMap = useMapStore((s) => s.closeMap);
  const closing = useMapStore((s) => s.closing);
  const finishClosing = useMapStore((s) => s.finishClosing);
  // Closing in two clean stages rather than one crossfade: first the map's
  // contents fade away (contentFade), leaving only its plain dark ground;
  // then the ground fades (groundFade) to reveal the page beneath. Fading
  // the whole map at once had its lines and labels half-visible over the
  // new page for half a second — a double exposure that read as a glitch.
  const contentFade = useSharedValue(1);
  const groundFade = useSharedValue(1);

  useEffect(() => {
    if (open) {
      contentFade.value = 1;
      groundFade.value = 1;
      mapProgress.value = withTiming(1, { duration: OPEN_DURATION, easing: GATHER_EASE });
    } else if (closing) {
      contentFade.value = withTiming(0, { duration: CONTENT_FADE_DURATION, easing: GATHER_EASE });
      groundFade.value = withDelay(
        CONTENT_FADE_DURATION * 0.6,
        withTiming(0, { duration: GROUND_FADE_DURATION, easing: GATHER_EASE }, (finished) => {
          if (!finished) return;
          mapProgress.value = 0;
          contentFade.value = 1;
          groundFade.value = 1;
          runOnJS(finishClosing)();
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closing]);

  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeMap();
      return true;
    });
    return () => sub.remove();
  }, [open, closeMap]);

  // The dark ground arrives first on opening — the map itself gathers in
  // stages on top of it (see MapContent's reveal styles), all read off the
  // same mapProgress, so a drag plays the sequence under the finger.
  const groundStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, mapProgress.value * 3) * groundFade.value,
  }));
  const contentStyle = useAnimatedStyle(() => ({ opacity: contentFade.value }));

  const mounted = open || peeking || closing;
  return (
    <View style={styles.root} pointerEvents="box-none">
      {mounted && (
        <Animated.View style={[StyleSheet.absoluteFill, groundStyle]} pointerEvents={open ? 'auto' : 'none'}>
          <GroundLayer />
          <Animated.View style={[StyleSheet.absoluteFill, contentStyle]} pointerEvents="box-none">
            <MapContent />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

// The map's plain dark ground (and its warm glow) — separate from the map
// drawn on it, so closing can fade the drawing away first and the ground
// after (see MapOverlay).
function GroundLayer() {
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg.base }]} pointerEvents="none">
      {theme === 'dark' && <AmbientGlow />}
    </View>
  );
}

function MapContent() {
  const { t } = useTranslation();
  const router = useRouter();
  // Snapshotted once, when the map opens (MapContent mounts fresh on every
  // opening): the page underneath changes the moment a place is picked,
  // and reading it live made the map redraw mid-close — the "you are
  // here" mark jumping, the glow restarting — which read as a glitch.
  const livePathname = usePathname();
  const pathname = useRef(livePathname).current;
  const colors = useThemeColors();
  const ms = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const closeMap = useMapStore((s) => s.closeMap);
  const liveStep = usePhilosopherStep();
  // Same reason as pathname above: what the philosopher says and which
  // place glows stay as they were when the map opened; only the actions
  // themselves are read live.
  const stepSnapshot = useRef({
    mapTarget: liveStep.mapTarget,
    line: liveStep.line,
    actionLabel: liveStep.actionLabel,
  }).current;
  const step = { ...liveStep, ...stepSnapshot };
  const accentRgb = useAppAccentRgb();
  const accentTextColor = `rgb(${useAppAccentTextRgb()})`;
  const [area, setArea] = useState({ w: 0, h: 0 });

  // The order things gather in: the thread draws itself up from you, and
  // each territory arrives as the thread reaches it — Depths, then
  // Journeys, then Your Arc — with the philosopher's line settling last.
  const depthsReveal = useReveal(0.12, 0.5);
  const journeysReveal = useReveal(0.35, 0.75);
  const arcReveal = useReveal(0.58, 0.95);
  const seamReveal = useReveal(0.55, 1);
  const threadProps = useAnimatedProps(() => {
    const t = Math.min(1, Math.max(0, (mapProgress.value - 0.1) / 0.8));
    return { strokeDashoffset: THREAD_LENGTH * (1 - t) };
  });

  const here = placeForPath(pathname);
  const region = regionForPath(pathname);
  const atDepthsHome = pathname === '/depths' || pathname === '/';
  const s = area.w > 0 ? Math.min(area.w / BOX_W, area.h / BOX_H, 1.25) : 0;
  const offsetX = (area.w - BOX_W * s) / 2;

  const faint = colors.text.faint;
  const border = (r: MapRegion) => (r === region ? colors.text.muted : colors.bg.border);
  const regionLabel = (r: MapRegion) => (r === region ? colors.text.primary : colors.text.muted);

  // Opens the destination underneath the map while the map is still
  // showing, then dissolves the map once the new screen has faded in —
  // so the map gives way directly to the place picked. Closing first used
  // to reveal the old screen for a moment in between.
  const leavingRef = useRef(false);
  const goThenClose = (navigate: () => void) => {
    // One destination per opening — a second tap during the hand-off
    // would otherwise start a second navigation.
    if (leavingRef.current) return;
    leavingRef.current = true;
    navigate();
    setTimeout(closeMap, SCREEN_TRANSITION.animationDuration);
  };

  const go = (place: MapPlace) => {
    track('map_place_opened', { place: place.id, from: pathname });
    if (here?.id === place.id || (place.id !== 'talk' && !place.href)) {
      closeMap();
      return;
    }
    goThenClose(() => {
      if (place.id === 'talk') step.openConversation();
      else if (place.id === 'journeys') router.navigate(place.href!);
      else router.push(place.href!);
    });
  };

  const placeLabel = (place: MapPlace) =>
    place.id === 'talk'
      ? t(place.labelKey, { name: step.philosopher?.nameInstrumental ?? step.philosopher?.name ?? '' })
      : t(place.labelKey);

  const placesIn = (r: MapRegion) =>
    MAP_PLACES.filter((place) => place.region === r).map((place) => (
      <MapPlaceButton
        key={place.id}
        place={place}
        label={placeLabel(place)}
        s={s}
        boxW={BOX_W * s}
        isHere={here?.id === place.id}
        isTarget={step.mapTarget === place.id && here?.id !== place.id}
        accentRgb={accentRgb}
        philosopherId={step.philosopher?.id}
        colors={colors}
        onPress={() => go(place)}
      />
    ));

  return (
    <View style={[ms.fill, { paddingTop: insets.top + spacing[2] }]}>

      <View style={ms.header}>
        <Text style={ms.kicker} accessibilityRole="header">{t('map.title')}</Text>
        <Pressable onPress={closeMap} accessibilityRole="button" accessibilityLabel={t('map.close')} style={ms.closeHit}>
          <Svg width={16} height={16} viewBox="0 0 16 16">
            <Path d="M3 3 L13 13 M13 3 L3 13" stroke={colors.text.secondary} strokeWidth={1.2} strokeLinecap="round" />
          </Svg>
        </Pressable>
      </View>

      <View style={ms.mapArea} onLayout={(e) => setArea({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
        {s > 0 && (
          <View style={{ position: 'absolute', left: offsetX, top: 0, width: BOX_W * s, height: BOX_H * s }}>
            {/* Your Arc — sky: border, faint sky arcs, the time curve (the
                past half solid — what's recorded; the future half dashed —
                not yet). */}
            <Animated.View style={[StyleSheet.absoluteFill, arcReveal]} pointerEvents="box-none">
              <Svg width={BOX_W * s} height={BOX_H * s} viewBox={`0 0 ${BOX_W} ${BOX_H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path d="M20 46 C20 11 80 0 195 0 C310 0 372 11 372 46 L372 136 C372 156 330 158 195 158 C60 158 20 156 20 136 Z" stroke={border('arc')} strokeWidth={1} strokeDasharray="2 6" fill="none" />
                <Path d="M70 40 Q195 -6 320 40" stroke={colors.bg.border} strokeWidth={1} fill="none" opacity={0.6} />
                <Path d="M40 131 Q117.5 56 195 56" stroke={colors.text.muted} strokeWidth={1} fill="none" />
                <Path d="M195 56 Q272.5 56 350 131" stroke={colors.text.muted} strokeWidth={1} strokeDasharray="3 5" fill="none" />
              </Svg>
              <Text style={[ms.regionLabel, { right: 30 * s, top: 132 * s, color: regionLabel('arc') }]}>{t('common.tabYourArc')}</Text>
              {placesIn('arc')}
            </Animated.View>

            {/* Journeys — contoured land; each Journey a side road off the
                thread. */}
            <Animated.View style={[StyleSheet.absoluteFill, journeysReveal]} pointerEvents="box-none">
              <Svg width={BOX_W * s} height={BOX_H * s} viewBox={`0 0 ${BOX_W} ${BOX_H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path d="M20 198 C20 176 90 168 195 170 C300 172 372 176 372 200 L372 356 C372 380 300 386 195 384 C90 382 20 380 20 356 Z" stroke={border('journeys')} strokeWidth={1} strokeDasharray="2 6" fill="none" />
                <Path d="M30 204 C110 188 200 226 362 202 M30 254 C130 236 240 276 362 248 M30 308 C120 288 250 328 362 298 M30 362 C150 346 240 376 362 356" stroke={colors.bg.border} strokeWidth={1} fill="none" opacity={0.5} />
                <Path d="M165 331 C140 336 120 334 100 334 M218 271 C245 266 265 281 285 281 M188 211 C160 206 130 216 105 216 M195 186 C220 186 250 194 275 191" stroke={faint} strokeWidth={1} strokeDasharray="3 4" fill="none" />
              </Svg>
              <Text style={[ms.regionLabel, { right: 30 * s, top: 229 * s, color: regionLabel('journeys') }]}>{t('common.tabJourneys')}</Text>
              {placesIn('journeys')}
            </Animated.View>

            {/* Depths — rings around you; its places sit on the main one. */}
            <Animated.View style={[StyleSheet.absoluteFill, depthsReveal]} pointerEvents="box-none">
              <Svg width={BOX_W * s} height={BOX_H * s} viewBox={`0 0 ${BOX_W} ${BOX_H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
                <Path d="M20 456 C20 416 100 396 195 396 C290 396 372 416 372 456 L372 616 C372 644 290 652 195 652 C100 652 20 644 20 616 Z" stroke={border('depths')} strokeWidth={1} strokeDasharray="2 6" fill="none" />
                <Ellipse cx={195} cy={528} rx={40} ry={32} stroke={colors.bg.border} strokeWidth={1} fill="none" opacity={0.6} />
                <Ellipse cx={195} cy={528} rx={68} ry={55} stroke={colors.bg.border} strokeWidth={1} fill="none" opacity={0.6} />
                <Ellipse cx={195} cy={526} rx={95} ry={80} stroke={faint} strokeWidth={1} fill="none" />
              </Svg>
              <Text style={[ms.regionLabel, { left: 0, right: 0, textAlign: 'center', top: 630 * s, color: regionLabel('depths') }]}>{t('common.tabDepths')}</Text>
              <Text style={[ms.groupLabel, { left: 36 * s, top: 492 * s }]}>{t('map.shift')}</Text>
              {atDepthsHome && (
                <Text style={[ms.youAreHere, { left: 145 * s, width: 100 * s, top: 556 * s }]}>{t('map.youAreHere')}</Text>
              )}
              {placesIn('depths')}
            </Animated.View>

            {/* The thread — the one line that crosses every border — draws
                itself up from you as the map opens; the figure (you) is
                there from the start, where it begins. */}
            <Svg width={BOX_W * s} height={BOX_H * s} viewBox={`0 0 ${BOX_W} ${BOX_H}`} style={StyleSheet.absoluteFill} pointerEvents="none">
              <AnimatedPath
                d="M195 530 C160 542 150 496 175 481 S205 456 195 446 C185 426 200 406 195 391 C190 376 160 356 165 331 C170 306 225 296 218 271 C212 246 180 231 188 211 C194 194 205 181 195 168 C188 156 198 136 195 116 L195 56"
                stroke={`rgba(${accentRgb},0.7)`}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeDasharray={[THREAD_LENGTH, THREAD_LENGTH]}
                animatedProps={threadProps}
                fill="none"
              />
              <Path d="M188 514 a7 7 0 1 1 14 0 a7 7 0 1 1 -14 0 M185 528 q10 -5 20 0 l-3 22 h-14 z" fill={colors.text.secondary} />
            </Svg>
          </View>
        )}
      </View>

      {step.philosopher && (
        <Animated.View style={[ms.seamWrap, seamReveal, { paddingBottom: insets.bottom + spacing[2] }]}>
          <PhilosopherSeam
            philosopher={step.philosopher}
            line={step.line}
            actionLabel={step.actionLabel}
            onAction={() => goThenClose(step.run)}
            onOpenConversation={() => goThenClose(step.openConversation)}
            accentTextColor={accentTextColor}
            accentRgb={accentRgb}
            visible
          />
        </Animated.View>
      )}
    </View>
  );
}

function MapPlaceButton({
  place,
  label,
  s,
  boxW,
  isHere,
  isTarget,
  accentRgb,
  philosopherId,
  colors,
  onPress,
}: {
  place: MapPlace;
  label: string;
  s: number;
  boxW: number;
  isHere: boolean;
  isTarget: boolean;
  accentRgb: string;
  philosopherId?: string;
  colors: Colors;
  onPress: () => void;
}) {
  const mark =
    place.symbol === 'philosopher' ? (
      philosopherId ? <PhilosopherObject id={philosopherId} rgb={accentRgb} size={MARK_SIZE} /> : null
    ) : place.symbol ? (
      <DepthsMenuSymbol id={place.symbol} rgb={accentRgb} size={MARK_SIZE} />
    ) : null;
  const DOT_BOX = mark ? MARK_BOX : 22;
  const position =
    place.side === 'left'
      ? { right: boxW - (place.x * s + DOT_BOX / 2), flexDirection: 'row-reverse' as const }
      : { left: place.x * s - DOT_BOX / 2 };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isHere }}
      style={[pb.hit, { top: place.y * s - 22 }, position]}
    >
      <View style={[pb.dotBox, { width: DOT_BOX, height: DOT_BOX }]}>
        {isTarget && <TargetGlow accentRgb={accentRgb} />}
        {mark ? (
          <>
            {/* "You are here" on a symbol: a thin ring around it, since
                the symbol itself can't fill in like a dot does. */}
            {isHere && <View style={[pb.hereRing, { borderColor: `rgb(${accentRgb})` }]} />}
            <View style={{ opacity: isHere || isTarget ? 1 : 0.72 }}>{mark}</View>
          </>
        ) : (
          <View
            style={
              isHere
                ? [pb.dot, { backgroundColor: `rgb(${accentRgb})`, borderColor: `rgb(${accentRgb})` }]
                : [
                    pb.dot,
                    {
                      borderColor: isTarget ? `rgb(${accentRgb})` : colors.text.muted,
                      backgroundColor: isTarget ? `rgba(${accentRgb},0.35)` : colors.bg.base,
                    },
                  ]
            }
          />
        )}
      </View>
      <Text
        numberOfLines={1}
        style={[
          pb.label,
          {
            color: isHere || isTarget ? colors.text.primary : colors.text.secondary,
            fontFamily: isTarget ? fonts.medium : fonts.light,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

// The philosopher's step, breathing twice as the map opens and then
// settling to a quiet steady glow — so what they say and where it is
// visibly connect, without looping forever (no idle motion without
// meaning).
function TargetGlow({ accentRgb }: { accentRgb: string }) {
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withDelay(
      400,
      withSequence(
        withRepeat(
          withSequence(
            withTiming(1, { duration: 700, easing: SOFT_EASE }),
            withTiming(0.2, { duration: 900, easing: SOFT_EASE }),
          ),
          2,
        ),
        withTiming(0.45, { duration: 600, easing: SOFT_EASE }),
      ),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 0.8 + glow.value * 0.35 }],
  }));
  return (
    <Animated.View
      pointerEvents="none"
      style={[pb.glow, { backgroundColor: `rgba(${accentRgb},0.28)`, shadowColor: `rgb(${accentRgb})` }, style]}
    />
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, zIndex: 90 },
});

// The old spiral menu's own glyphs, at map scale — larger than a dot so
// each place reads as a place, small enough not to crowd its label.
const MARK_SIZE = 32;
const MARK_BOX = 34;

const pb = StyleSheet.create({
  hit: {
    position: 'absolute',
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dotBox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 1 },
  hereRing: {
    position: 'absolute',
    width: MARK_BOX,
    height: MARK_BOX,
    borderRadius: MARK_BOX / 2,
    borderWidth: 1,
  },
  glow: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  label: { fontSize: fontSizes.xs },
});

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    // Transparent — the dark ground is its own layer (GroundLayer).
    fill: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: spacing[6],
      paddingRight: spacing[3],
    },
    kicker: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    closeHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    mapArea: { flex: 1, marginTop: spacing[2] },
    // Map labels, not headings: letter-spaced, set inside their own
    // territory — the left-edge heading version read as a list.
    regionLabel: {
      position: 'absolute',
      fontFamily: fonts.medium,
      fontSize: 10,
      letterSpacing: 4,
      textTransform: 'uppercase',
    },
    groupLabel: {
      position: 'absolute',
      color: colors.text.faint,
      fontFamily: fonts.medium,
      fontSize: 8,
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    youAreHere: {
      position: 'absolute',
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: 9,
      textAlign: 'center',
    },
    seamWrap: {
      paddingHorizontal: spacing[6],
      borderTopWidth: 1,
      borderTopColor: colors.bg.border,
    },
  });
}
