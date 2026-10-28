import { ReactNode, useEffect, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { useIsFocused, useNavigation } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const GATHER_EASE = Easing.bezier(0.33, 0, 0.2, 1);
const DURATION = 600;
const RISE = 12;

// A section of a page gathering into place as the page comes into view —
// fading up and settling its last few pixels — rather than the whole page
// appearing in one frame (aesthetic.md: "things gather, condense, and
// become"). Give sections increasing `delay`s so a page arrives top to
// bottom, the way the map arrives around its thread. Replays when the
// screen's tab comes back into view (tab screens stay mounted), so a page
// arrives the same way however it was reached — but not when coming back
// from something opened on top of it (2026-10-27: returning from Breathe
// or Spill replayed the whole page, which read as the page reloading).
// Skipped under Reduce Motion.

// The key of the tab currently selected in the nearest tab navigator above
// this screen, or null outside tabs.
type NavNode = {
  getState?: () => { type?: string; index?: number; routes: { key: string }[] } | undefined;
  getParent: () => NavNode | undefined;
};

function selectedTabKey(navigation: NavNode): string | null {
  let nav: NavNode | undefined = navigation;
  while (nav) {
    const state = nav.getState?.();
    if (state?.type === 'tab') return state.routes[state.index ?? 0]?.key ?? null;
    nav = nav.getParent();
  }
  return null;
}

export function GatherIn({
  children,
  delay = 0,
  style,
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const isFocused = useIsFocused();
  const navigation = useNavigation<NavNode>();
  const reduceMotion = useReducedMotion();
  const t = useSharedValue(reduceMotion ? 1 : 0);
  // Which tab was selected when this screen was last in focus, and whether
  // it lost focus only because something opened on top of it (the same
  // tab still selected) rather than a different tab being chosen.
  const tabWhenFocused = useRef<string | null>(null);
  const coveredOnly = useRef(false);

  useEffect(() => {
    if (!isFocused) {
      coveredOnly.current = tabWhenFocused.current !== null && selectedTabKey(navigation) === tabWhenFocused.current;
      return;
    }
    tabWhenFocused.current = selectedTabKey(navigation);
    if (reduceMotion) return;
    if (coveredOnly.current) {
      coveredOnly.current = false;
      t.value = 1;
      return;
    }
    t.value = 0;
    t.value = withDelay(delay, withTiming(1, { duration: DURATION, easing: GATHER_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * RISE }],
  }));

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>;
}
