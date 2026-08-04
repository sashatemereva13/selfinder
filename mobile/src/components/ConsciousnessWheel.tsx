import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  withSpring,
} from 'react-native-reanimated';
import { VIBRATION_LEVELS, LEVEL_COLORS, getLocalizedLevelName } from '../content/measureConfig';
import { colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useLocaleStore } from '../store/localeStore';

// The full color wheel, draggable — this is where "map all 17 vibrations
// to their colors at once" actually belongs (see docs/design/aesthetic.md
// and RULES.md: the reveal screen shows ONE color, because many colors on
// one screen drag attention away from meaning; the map screen is the one
// place showing all of them together is correct, since it's a map of the
// whole territory, not a reading of a specific moment).
//
// A single dot dragged around the circumference, rather than 17 labels
// crowded around the ring — the wheel stays uncluttered (no text at all
// until you're pointing at something), and dragging to explore is a more
// direct way to feel "these are all just positions on one wheel," no
// better or worse than each other, than reading a static list would be.
//
// Same construction-line register as PhilosopherObject/VibrationSpectrum:
// thin stroke, no fill, no glow.
const WHEEL_RADIUS = 108;
const TICK_LENGTH = 8;
const DRAG_DOT_RADIUS = 9;

function angleFor(index: number, total: number): number {
  'worklet';
  return (index / total) * 2 * Math.PI - Math.PI / 2;
}

// 'worklet' directive required: this is called both from plain JS (laying
// out the 17 static ticks) AND from inside dotStyle's useAnimatedStyle
// worklet below. On web everything runs on one JS thread so the missing
// directive went unnoticed, but on native, useAnimatedStyle's callback runs
// on the UI thread, and a helper function isn't auto-workletized just
// because a worklet calls it — that crashed with "[Worklets] Tried to
// synchronously call a Remote Function" the first time this screen opened
// on-device.
function polarToXY(center: number, r: number, angle: number) {
  'worklet';
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
}

// Inverse of angleFor — given an angle, find the nearest level index. Used
// while dragging so the dot always snaps to one of the 17 real positions
// rather than floating freely (there is no vibration "between" two named
// levels — the wheel has 17 real points on it, not a continuous scale).
function nearestLevelIndex(angle: number, total: number): number {
  'worklet';
  const normalized = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
  const raw = (normalized / (2 * Math.PI)) * total;
  return Math.round(raw) % total;
}

const TOTAL = VIBRATION_LEVELS.length;
const SIZE = (WHEEL_RADIUS + TICK_LENGTH) * 2 + DRAG_DOT_RADIUS * 2;
const CENTER = SIZE / 2;

export function ConsciousnessWheel({
  onSelectLevel,
}: {
  onSelectLevel?: (slug: string) => void;
}) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  // Starts at Neutrality (roughly the middle of the scale) — an arbitrary
  // but deliberately unloaded starting point, rather than defaulting to
  // Shame or Enlightenment, which would make one extreme look like the
  // wheel's "resting" position.
  const startIndex = VIBRATION_LEVELS.findIndex((l) => l.slug === 'neutrality');
  const [activeIndex, setActiveIndex] = useState(startIndex);
  const dragAngle = useSharedValue(angleFor(startIndex, TOTAL));
  const didPan = useSharedValue(false);

  const updateIndex = (index: number) => setActiveIndex(index);

  const pan = Gesture.Pan()
    // Without a minimum distance, Pan can win the very first frame of a
    // plain tap (even a pixel or two of finger jitter counts as "changed"),
    // which stole taps away from the Tap gesture below and made a tap
    // resolve to whatever angle the jitter happened to land on instead of
    // the tick actually pressed. Requiring real movement before Pan
    // activates leaves quick taps entirely to Tap.
    .minDistance(10)
    .onChange((e) => {
      // Angle from wheel center to the raw touch point — this is what the
      // dot actually follows; snapping to the nearest level is a separate,
      // JS-side step derived from this continuous angle so the drag itself
      // still feels smooth rather than jumping between 17 fixed spots.
      const x = e.x - CENTER;
      const y = e.y - CENTER;
      const angle = Math.atan2(y, x);
      dragAngle.value = angle;
      didPan.value = true;
      const idx = nearestLevelIndex(angle, TOTAL);
      runOnJS(updateIndex)(idx);
    })
    .onFinalize(() => {
      // onFinalize fires even when Pan never activated (e.g. a plain tap
      // that never moved past minDistance, losing the Race to Tap below) —
      // without this guard it would still snap dragAngle back to the
      // *previous* activeIndex, racing against Tap's onEnd and sometimes
      // overwriting the tap's own, correct position with a stale one.
      // Only settle here if this gesture actually drove a drag.
      if (didPan.value) {
        dragAngle.value = withSpring(angleFor(activeIndex, TOTAL), { damping: 14 });
        didPan.value = false;
      }
    });

  // A tap on any of the 17 static ticks jumps straight to that level — the
  // Pan gesture above only ever fires once a touch has moved (a plain tap
  // never triggers onChange), so without this a tick was visible but
  // inert. Snaps directly to that tick's own angle rather than easing
  // through the wheel from wherever the dot currently sits, since a tap
  // means "I want this one," not "drag me there."
  const tap = Gesture.Tap().onEnd((e) => {
    const x = e.x - CENTER;
    const y = e.y - CENTER;
    const angle = Math.atan2(y, x);
    const idx = nearestLevelIndex(angle, TOTAL);
    dragAngle.value = withSpring(angleFor(idx, TOTAL), { damping: 14 });
    runOnJS(updateIndex)(idx);
  });

  const gesture = Gesture.Race(pan, tap);

  const dotStyle = useAnimatedStyle(() => {
    const { x, y } = polarToXY(CENTER, WHEEL_RADIUS, dragAngle.value);
    return {
      transform: [{ translateX: x - DRAG_DOT_RADIUS }, { translateY: y - DRAG_DOT_RADIUS }],
    };
  });

  const activeLevel = VIBRATION_LEVELS[activeIndex];
  const activeColor = `rgb(${LEVEL_COLORS[activeLevel.slug]})`;

  return (
    <View style={styles.wrap}>
      <GestureDetector gesture={gesture}>
        <View style={{ width: SIZE, height: SIZE }}>
          <Svg width={SIZE} height={SIZE}>
            <SvgCircle cx={CENTER} cy={CENTER} r={WHEEL_RADIUS} fill="none" stroke={colors.bg.border} strokeWidth={1} />
            {VIBRATION_LEVELS.map((level, i) => {
              const isActive = i === activeIndex;
              const pos = polarToXY(CENTER, WHEEL_RADIUS, angleFor(i, TOTAL));
              return (
                <SvgCircle
                  key={level.slug}
                  cx={pos.x}
                  cy={pos.y}
                  r={isActive ? 0 : TICK_LENGTH / 2.2}
                  fill={`rgb(${LEVEL_COLORS[level.slug]})`}
                  opacity={isActive ? 0 : 0.8}
                />
              );
            })}
          </Svg>
          {/* The draggable dot itself — an Animated.View rather than another
              SvgCircle, since it needs to track a continuously-updating
              shared value smoothly; mixing that with the static SVG ticks
              above (redrawn from React state, not a shared value) keeps the
              drag responsive without re-rendering all 17 ticks every frame. */}
          <Animated.View
            style={[
              styles.dragDot,
              { backgroundColor: activeColor, borderColor: colors.bg.base },
              dotStyle,
            ]}
          />
        </View>
      </GestureDetector>

      {/* Nothing labeled until you're pointing at it — the wheel itself
          stays uncluttered; dragging is what reveals a name, one at a
          time, rather than 17 labels crowding the circle at rest. */}
      <Text style={[styles.levelName, { color: activeColor }]}>
        {getLocalizedLevelName(activeLevel, locale)}
      </Text>
      <Text
        style={styles.levelLink}
        onPress={() => onSelectLevel?.(activeLevel.slug)}
      >
        {t('levels.readAbout', { name: getLocalizedLevelName(activeLevel, locale) })}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing[3] },
  dragDot: {
    position: 'absolute',
    width: DRAG_DOT_RADIUS * 2,
    height: DRAG_DOT_RADIUS * 2,
    borderRadius: DRAG_DOT_RADIUS,
    borderWidth: 2,
  },
  levelName: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  levelLink: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.normal,
  },
});
