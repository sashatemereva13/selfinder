import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';

// A simple two-state crossfade — one view fades out while the other fades
// in, both fully rendered (not a live geometry animation) — see
// TimeConeRing.tsx's own header comment for why the cone/ring rotation
// this was built for (2026-08-20) uses this approach rather than
// animating every point's position continuously.
//
// Not cone-specific: kept generic (any two children, a boolean prop
// picking which shows) in case a later screen wants the same "two fully-
// rendered states, faded between" transition without its own copy of
// this logic.
const FADE_DURATION_MS = 350;
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function CrossfadeSwitcher({
  showSecond,
  first,
  second,
}: {
  showSecond: boolean;
  first: React.ReactNode;
  second: React.ReactNode;
}) {
  // Keeps both children mounted through the transition (not swapped
  // instantly at the boolean flip) so the outgoing view has time to fade
  // rather than popping away — mirrors the "gather, condense, become"
  // motion language the rest of the app uses (see docs/design/
  // aesthetic.md), never a hard cut. Both are absolutely stacked on top
  // of each other for the duration of the fade (mountBoth), then only
  // the active one stays in normal flow once settled, so the page's own
  // layout isn't held open at "both views' combined height" the whole
  // time.
  const [mountBoth, setMountBoth] = useState(false);
  const progress = useSharedValue(showSecond ? 1 : 0);

  useEffect(() => {
    setMountBoth(true);
    progress.value = withTiming(showSecond ? 1 : 0, { duration: FADE_DURATION_MS, easing: SOFT_EASE });
    const timeout = setTimeout(() => setMountBoth(false), FADE_DURATION_MS);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSecond]);

  const firstStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const secondStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  if (!mountBoth) {
    return <View>{showSecond ? second : first}</View>;
  }

  return (
    <View>
      <Animated.View style={[{ position: 'absolute', width: '100%' }, firstStyle]}>{first}</Animated.View>
      <Animated.View style={secondStyle}>{second}</Animated.View>
    </View>
  );
}
