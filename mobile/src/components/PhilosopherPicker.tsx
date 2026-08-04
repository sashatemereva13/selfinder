import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Circle as SvgCircle } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  SlideInLeft,
  SlideInRight,
  FadeIn,
} from 'react-native-reanimated';
import { PHILOSOPHERS, PHILOSOPHER_MAP, getLocalizedPhilosopher } from '../content/philosophers';
import { Philosopher } from '../types';
import { colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAppAccentRgb } from '../utils/appAccent';
import { useLocaleStore } from '../store/localeStore';
import { PhilosopherObject } from './PhilosopherObject';

const ICON_SIZE = 60;
// Matches onboarding's RING_MORPH_RADIUS — when this picker follows that
// transition, the line-turned-circle and this ring are the same size, which
// does more to sell "this became that" than the position match does.
const RING_RADIUS = 80;
const RING_CENTER = { x: 160, y: 150 };
const CONTAINER = { width: 320, height: 283 };
const LABEL_GAP = 8;
// Wide enough for the longest single-word names ("Kierkegaard", "Aristotle")
// to stay on one line — a mid-word break reads far worse than a slightly
// generous box.
const LABEL_WIDTH_VERTICAL = 100;
// Marcus Aurelius is the one two-word name and sits on a side label (angle
// -18°, see RING_LAYOUT) — the original 72 was sized only for the four
// single-word names, so "Marcus Aurelius" wrapped onto two cramped lines
// tight against the icon. Widening enough to fit it on one line (~130) runs
// the label off the right edge of the screen at this ring position — the
// container isn't centered with that much spare margin on the right side —
// so this stays a two-line wrap, just with more room than before to
// breathe rather than crowd the icon.
const LABEL_WIDTH_SIDE = 96;
const LABEL_HEIGHT = 30;
const ENTRANCE_STAGGER = 70;

type LabelSide = 'top' | 'bottom' | 'left' | 'right';

// One fixed ring position + label direction per philosopher, rather than a
// generic radial-label formula — with only five spots, hand-placing each
// (top, the two upper corners to the side, the two lower corners below) is
// simpler and more reliable than deriving alignment from angle math, and
// keeps every label pointing outward from the ring instead of across it.
const RING_LAYOUT: { angleDeg: number; labelSide: LabelSide }[] = [
  { angleDeg: -90, labelSide: 'top' },
  { angleDeg: -18, labelSide: 'right' },
  { angleDeg: 54, labelSide: 'bottom' },
  { angleDeg: 126, labelSide: 'bottom' },
  { angleDeg: -162, labelSide: 'left' },
];

function ringPoint(angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: RING_CENTER.x + RING_RADIUS * Math.cos(rad),
    y: RING_CENTER.y + RING_RADIUS * Math.sin(rad),
  };
}

// Items on the right half of the ring slide in from the right, items on the
// left half from the left — the top item sits dead-center (cos ≈ 0), where
// neither side is the natural one, so it just fades/scales in instead.
function ringEntering(angleDeg: number, index: number) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const delay = index * ENTRANCE_STAGGER;
  if (Math.abs(cos) < 0.15) return FadeIn.duration(420).delay(delay);
  return (cos > 0 ? SlideInRight : SlideInLeft).duration(420).delay(delay);
}

function labelStyle(side: LabelSide, point: { x: number; y: number }): ViewStyle {
  switch (side) {
    case 'top':
      return {
        left: point.x - LABEL_WIDTH_VERTICAL / 2,
        top: point.y - ICON_SIZE / 2 - LABEL_GAP - LABEL_HEIGHT,
        width: LABEL_WIDTH_VERTICAL,
      };
    case 'bottom':
      return {
        left: point.x - LABEL_WIDTH_VERTICAL / 2,
        top: point.y + ICON_SIZE / 2 + LABEL_GAP,
        width: LABEL_WIDTH_VERTICAL,
      };
    case 'left':
      return {
        left: point.x - ICON_SIZE / 2 - LABEL_GAP - LABEL_WIDTH_SIDE,
        top: point.y - LABEL_HEIGHT / 2,
        width: LABEL_WIDTH_SIDE,
      };
    case 'right':
      return {
        left: point.x + ICON_SIZE / 2 + LABEL_GAP,
        top: point.y - LABEL_HEIGHT / 2,
        width: LABEL_WIDTH_SIDE,
      };
  }
}

type OrbState = 'idle' | 'focused' | 'dimmed';

function PhilosopherRingItem({
  philosopher,
  index,
  angleDeg,
  labelSide,
  state,
  accentRgb,
  onPress,
}: {
  philosopher: Philosopher;
  index: number;
  angleDeg: number;
  labelSide: LabelSide;
  state: OrbState;
  accentRgb: string;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const shimmer = useSharedValue(0);
  const point = ringPoint(angleDeg);

  useEffect(() => {
    scale.value = withTiming(state === 'focused' ? 1.1 : state === 'dimmed' ? 0.88 : 1, { duration: 280 });
    opacity.value = withTiming(state === 'dimmed' ? 0.3 : 1, { duration: 280 });
  }, [state]);

  // Idle affordance: a soft swell that travels the ring — each symbol
  // breathes in turn (stagger × item count === one full cycle, so the wave
  // is seamless). It reads as "these are alive, touch one" without a label,
  // and stops the moment a choice is in progress. Deliberately NOT a
  // spinning ring: rotation moves the tap targets and drags the labels
  // with them.
  useEffect(() => {
    if (state === 'idle') {
      shimmer.value = withDelay(
        index * 520,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 650, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 650, easing: Easing.inOut(Easing.sin) }),
            withTiming(0, { duration: 1300 }),
          ),
          -1,
          false,
        ),
      );
    } else {
      cancelAnimation(shimmer);
      shimmer.value = withTiming(0, { duration: 200 });
    }
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * (1 + shimmer.value * 0.07) }],
    opacity: opacity.value,
  }));

  // entering lives on this outer wrapper (mount-only, plain positioning) so
  // it never lands on the same component as the focus-driven animatedStyle
  // below — combining an entering animation with a reactive style on one
  // component is what Reanimated warns can silently overwrite each other.
  return (
    <>
      <Animated.View
        entering={ringEntering(angleDeg, index)}
        style={[
          styles.iconTouchTarget,
          { left: point.x - ICON_SIZE / 2, top: point.y - ICON_SIZE / 2, width: ICON_SIZE, height: ICON_SIZE },
        ]}
      >
        <Pressable onPress={onPress} hitSlop={10}>
          <Animated.View style={animatedStyle}>
            <PhilosopherObject id={philosopher.id} rgb={accentRgb} size={ICON_SIZE} />
          </Animated.View>
        </Pressable>
      </Animated.View>
      {/* The name is a tap target too — people naturally tap the word, and
          a label that does nothing makes the ring feel inert. */}
      <Animated.Text
        entering={ringEntering(angleDeg, index)}
        onPress={onPress}
        suppressHighlighting
        style={[
          styles.orbName,
          labelStyle(labelSide, point),
          { textAlign: labelSide === 'left' ? 'right' : labelSide === 'right' ? 'left' : 'center' },
          state === 'focused' && { color: `rgb(${accentRgb})` },
        ]}
      >
        {philosopher.name}
      </Animated.Text>
    </>
  );
}

export function PhilosopherPicker({
  selectedId,
  onSelect,
  onRingLayout,
  hideOwnRing,
}: {
  selectedId?: string | null;
  onSelect: (id: string) => void;
  // Reports the ring's actual on-screen position/size once laid out — in
  // window coordinates, via measureInWindow, since this component doesn't
  // know what screen or scroll offset it's rendered inside of. Onboarding
  // uses this to land its own traveling ring exactly where this one will
  // sit, rather than guessing a static travel distance across two screens
  // whose relative layout (insets, title height) isn't a fixed number.
  onRingLayout?: (rect: { x: number; y: number; width: number; height: number }) => void;
  // True while onboarding's own ring is still traveling to this spot — this
  // component's static ring stays invisible so there's exactly one ring on
  // screen during the handoff, not two overlapping.
  hideOwnRing?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useLocaleStore((s) => s.locale);
  const [focusedId, setFocusedId] = useState<string | null>(selectedId ?? null);
  const focused = focusedId ? getLocalizedPhilosopher(PHILOSOPHER_MAP[focusedId], locale) : null;
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  const ringContainerRef = useRef<View>(null);

  // Own ring's fade-in, as a shared value instead of an `entering` prop —
  // see the comment at its render site for why. Starts at 0 whenever this
  // component mounts with hideOwnRing already true (onboarding's traveling
  // ring owns the moment); otherwise fades in immediately, matching the old
  // entering-based behavior for every other call site (e.g. the You tab).
  const ownRingOpacity = useSharedValue(hideOwnRing ? 0 : 1);
  useEffect(() => {
    if (hideOwnRing) return;
    ownRingOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) });
  }, [hideOwnRing]);
  const ownRingStyle = useAnimatedStyle(() => ({ opacity: ownRingOpacity.value }));

  return (
    <View style={styles.wrap}>
      <View
        ref={ringContainerRef}
        style={[styles.ringContainer, CONTAINER]}
        onLayout={() => {
          // onLayout is the trigger; the measurable node has to come from a
          // ref, not the event itself (no usable `target` on React Native
          // Web). Reports the RING's own rect, not this container's — this
          // View is CONTAINER-sized (320×283, the whole picker area
          // including labels), so measuring it directly would hand
          // onboarding's traveling ring that whole box's shape instead of a
          // same-sized circle. RING_CENTER/RING_RADIUS are in this
          // container's own local coordinate space (the Svg viewBox
          // matches CONTAINER exactly), so window-x/y + those local values
          // gives the ring's real window-space rect — same technique
          // onboarding's connectLineWrap uses on its side.
          if (!onRingLayout) return;
          // measureInWindow's callback has been observed on Android to
          // occasionally fire with (0, 0) — a genuinely impossible position
          // for this container mid-screen — right after this screen mounts,
          // before the native view's position has actually settled. Passing
          // that through gave onboarding's cross-screen ring-travel a target
          // in the top-left corner instead of the real ring position, which
          // is what made the traveling ring look "stuck" (it wasn't frozen,
          // it had already jumped to a wrong, off-screen-ish target and the
          // fallback timer's force-handoff just froze that wrong state
          // visually until a re-render, e.g. from tapping a philosopher,
          // triggered a fresh onLayout with the real position). One retry
          // after a short delay is enough in practice — this isn't a polling
          // loop, just a second attempt for the specific case where the
          // first one landed before layout was ready.
          //
          // A single retry wasn't enough in practice (still reported as a
          // visible stall on the Russian-locale build, where the picker's
          // title is a longer string — "Выберите, кто будет рядом" vs.
          // "Choose who walks beside you" — and reflows the screen slightly
          // differently, apparently making the mid-layout (0,0) window
          // wider on some devices). Retrying up to 3 times with a growing
          // delay covers that wider window without polling indefinitely.
          const MAX_MEASURE_RETRIES = 3;
          const report = (x: number, y: number) => {
            onRingLayout({
              x: x + RING_CENTER.x - RING_RADIUS,
              y: y + RING_CENTER.y - RING_RADIUS,
              width: RING_RADIUS * 2,
              height: RING_RADIUS * 2,
            });
          };
          const measureWithRetry = (attempt: number) => {
            ringContainerRef.current?.measureInWindow((x, y) => {
              if (x === 0 && y === 0 && attempt < MAX_MEASURE_RETRIES) {
                setTimeout(() => measureWithRetry(attempt + 1), 100 * (attempt + 1));
                return;
              }
              report(x, y);
            });
          };
          measureWithRetry(0);
        }}
      >
        {/* Hidden while onboarding's own ring is still traveling here (see
            hideOwnRing) — there should be exactly one ring visible during
            that handoff, the traveling one, not this static one plus that
            one overlapping. Once the traveler arrives, this fades in and
            the traveler fades out, so the swap between "the same ring
            drawn by two different components" is invisible. Outside
            onboarding (hideOwnRing is undefined outside it), this just
            fades in on mount as before — no `entering` prop here anymore:
            it and a static opacity override on the same view fight over
            the same property (Reanimated warns about exactly this), and
            `entering` was winning, showing this ring immediately regardless
            of hideOwnRing. Driving opacity from one shared value avoids the
            conflict entirely. */}
        <Animated.View style={[StyleSheet.absoluteFill, ownRingStyle]}>
          <Svg width={CONTAINER.width} height={CONTAINER.height} style={StyleSheet.absoluteFill}>
            <SvgCircle
              cx={RING_CENTER.x}
              cy={RING_CENTER.y}
              r={RING_RADIUS}
              fill="none"
              stroke={colors.bg.border}
              strokeWidth={1}
            />
          </Svg>
        </Animated.View>

        <View style={[styles.ringCenter, { left: RING_CENTER.x - 70, top: RING_CENTER.y - 20 }]}>
          {/* height: 40, top offset -20 — the box (styles.ringCenter) is
              centered exactly on RING_CENTER.y; justifyContent: 'center'
              inside it (not a manually-tuned top per line count) is what
              actually centers one line vs two lines identically. */}
          {/* adjustsFontSizeToFit doesn't reliably shrink text on web (react-
              native-web's Text support for it is partial), so a wide name
              either got clipped to "Marcus Aure…" or rendered visibly
              smaller than shorter names depending on the box width chosen —
              neither worked. Allowing two lines instead (numberOfLines={2},
              no forced single-line fit) matches how the ring's own side/top
              labels already wrap "Marcus Aurelius" successfully, and every
              name renders at the same natural font size. */}
          <Text
            style={[styles.ringCenterText, focused && { color: accentColor }]}
            numberOfLines={2}
          >
            {focused ? focused.name : ''}
          </Text>
        </View>

        {PHILOSOPHERS.map((p, i) => (
          <PhilosopherRingItem
            key={p.id}
            philosopher={getLocalizedPhilosopher(p, locale)}
            index={i}
            angleDeg={RING_LAYOUT[i].angleDeg}
            labelSide={RING_LAYOUT[i].labelSide}
            state={focusedId === null ? 'idle' : focusedId === p.id ? 'focused' : 'dimmed'}
            accentRgb={accentRgb}
            onPress={() => setFocusedId(p.id)}
          />
        ))}
      </View>

      <View style={styles.modeReveal}>
        {focused ? (
          <>
            <Text style={[styles.modeText, { color: accentColor }]}>{focused.mode}</Text>
            <Text style={styles.descriptionText}>{focused.description}</Text>
            <Text style={styles.symbolLine}>{focused.symbolLine}</Text>
          </>
        ) : (
          <Text style={styles.placeholderText}>{t('you.tapSomeoneToBegin')}</Text>
        )}
      </View>

      <View style={styles.confirmWrap}>
        <Pressable
          disabled={!focused}
          style={[
            styles.confirmButton,
            { backgroundColor: accentColor, opacity: focused ? 1 : 0 },
          ]}
          onPress={() => focused && onSelect(focused.id)}
        >
          <Text style={styles.confirmText}>
            {focused ? t('you.walkWith', { name: focused.name }) : ' '}
          </Text>
        </Pressable>
        {/* Always rendered — its height is part of the layout whether or not
            a philosopher is focused, so focusing never shifts the ring. */}
        <Text style={[styles.reassurance, !focused && styles.reassuranceHidden]}>
          {t('you.changeThisAnytime')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: spacing[6] },
  ringContainer: { alignItems: 'center', justifyContent: 'center' },
  // Wide enough for "Kierkegaard" at this size — 120 truncated it. Also
  // needs to comfortably fit "Marcus Aurelius" wrapped onto two lines (see
  // numberOfLines={2} at the render site) with real padding inside the
  // ring's own 160-diameter circle — a box as wide as or wider than the
  // ring itself (220, tried briefly) put the text right against the ring's
  // boundary instead of clearly inside it.
  // A fixed height (tall enough for 2 lines) + justifyContent: 'center' so
  // a one-line name (Socrates, Aristotle, ...) and a two-line name (Marcus
  // Aurelius) both land on the SAME vertical center — without this, a
  // one-line Text only occupies its own single line's height starting at
  // `top`, which sat visibly higher than the two-line block's true center.
  ringCenter: {
    position: 'absolute',
    width: 140,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  iconTouchTarget: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  orbName: {
    position: 'absolute',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.tight,
  },
  // minHeight fits the TALLEST focused state across all five philosophers —
  // Kierkegaard's and Marcus' descriptions run five lines where Socrates'
  // runs four — so no choice ever grows this block and shoves the ring
  // upward. If a description gets longer, this needs to grow with it.
  modeReveal: {
    minHeight: 200,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  // Color alone used to give this its presence (each philosopher's own
  // saturated hue against plain grey body text) — now that color is shared
  // app-wide rather than per-philosopher, the contrast has to come from
  // type instead: treated like the app's kicker labels (uppercase, wide
  // tracking) rather than a plain sentence.
  modeText: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  descriptionText: {
    marginTop: spacing[2],
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
  },
  placeholderText: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.wide,
  },
  confirmWrap: { width: '100%', alignItems: 'center', gap: spacing[3] },
  confirmButton: {
    width: '100%',
    paddingVertical: spacing[4],
    borderRadius: radius.full,
    alignItems: 'center',
  },
  confirmText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.base },
  reassurance: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  reassuranceHidden: { opacity: 0 },
  // The symbol's meaning, for people who know these thinkers — faint, one
  // line, under the description.
  symbolLine: {
    marginTop: spacing[2],
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    textAlign: 'center',
  },
});
