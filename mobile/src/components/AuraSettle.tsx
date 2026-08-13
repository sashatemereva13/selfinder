import { useEffect, useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { getAuraFigureMetrics, auraBodyToPixel, AURA_NEUTRAL_COLOR } from './AuraFigure';
import { AURA_NEUTRAL_IMAGE, AURA_NEUTRAL_IMAGE_LIGHT } from '../content/auraLevelImages';
import { useThemeStore } from '../store/themeStore';

// The single arrival beat for the whole Measure walk — see measure/index.tsx's
// own comment on why this replaced the old per-sphere, tap-to-continue scan
// (formerly AttentionScan.tsx, now deleted — nothing rendered it once the
// per-sphere gate was cut). One quiet gather-and-settle at the chest, once,
// no travel sequence and no "tap to continue" (this screen already has its
// own "Begin the conversation" button to move forward). Renders the same
// pre-baked neutral aura image Depths uses — the live AuraFigure SVG's "goo"
// filter doesn't render correctly on-device (see auraLevelImages.ts).
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const AURA_SIZE = 140;
const METRICS = getAuraFigureMetrics(AURA_SIZE);
const REST = auraBodyToPixel(AURA_SIZE, 100, 148); // chest
const REST_RADIUS = 34 * (AURA_SIZE / 200); // matches AuraFigure's own hardcoded core radius, scaled

export function AuraSettle() {
  const theme = useThemeStore((s) => s.theme);

  const scale = useSharedValue(0.7);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withTiming(1, { duration: 900, easing: SOFT_EASE });
    opacity.value = withTiming(0.65, { duration: 900, easing: SOFT_EASE });
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.wrap}>
      <View style={{ width: METRICS.width, height: METRICS.height }}>
        <Image
          source={theme === 'light' ? AURA_NEUTRAL_IMAGE_LIGHT : AURA_NEUTRAL_IMAGE}
          style={{ width: METRICS.width, height: METRICS.height }}
          resizeMode="contain"
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              left: REST.x - REST_RADIUS,
              top: REST.y - REST_RADIUS,
              width: REST_RADIUS * 2,
              height: REST_RADIUS * 2,
              borderRadius: REST_RADIUS,
            },
            glowStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  glow: {
    position: 'absolute',
    backgroundColor: AURA_NEUTRAL_COLOR,
  },
});
