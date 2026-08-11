import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { AuraFigure, AURA_NEUTRAL_COLOR, getAuraFigureMetrics, auraBodyToPixel } from './AuraFigure';
import { useThemeColors } from '../theme/useThemeColors';
import { useThemeStore } from '../store/themeStore';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { Sphere } from '../types';

// Same "gather, condense, become" bezier already established for the
// aura's own arrival sequence (see depths/index.tsx's SOFT_EASE) — reused
// here rather than inventing new easing, so this beat feels like the same
// hand as everything else the aura figure does.
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

const AURA_SIZE = 140;
const METRICS = getAuraFigureMetrics(AURA_SIZE);
const REST = auraBodyToPixel(AURA_SIZE, 100, 148); // chest — the glow's resting position
const HEAD = auraBodyToPixel(AURA_SIZE, 100, 42);
// No existing coordinate for shoulders — inferred from AuraFigure's own
// arm-polygon geometry (BodyPrimitives: both arm polygons begin around
// y≈88-96 near the shoulder/neck junction). One centered point, not
// left/right — the scan doesn't need to distinguish a side, "upper
// chest/shoulders" as one general area carries the felt effect. Tune
// against a real render before treating 90 as final.
const SHOULDER_Y = 90;
const SHOULDER = auraBodyToPixel(AURA_SIZE, 100, SHOULDER_Y);

const REST_RADIUS = 34 * (AURA_SIZE / 200); // matches AuraFigure's own hardcoded core radius, scaled
const SPIRIT_SCALE = 2.4; // past the body's own silhouette half-width at this size

interface AttentionScanProps {
  sphere: Sphere;
  phrase?: string;
  // Longer for the first scan in a session, shorter for the rest — see
  // interview.tsx's own sphereIndex === 0 split. Both durations are
  // tune-during-build placeholders, not final.
  durationMs: number;
  onComplete: () => void;
}

// The wordless-but-spoken beat before each of Measure's four sphere
// questions (see docs/measure-experience-concept.md §1) — gives the
// body/mind something to notice before being asked to report on it. Four
// genuinely different motion shapes, not one animation reused with a
// different label:
//   body   — glow travels to the shoulders
//   mind   — glow travels to the head
//   heart  — glow deepens/pulses IN PLACE at its resting chest position
//            (the only one that doesn't travel — heart already lives there)
//   spirit — glow briefly expands past the body's own outline, then
//            contracts back (the only one that breaks the silhouette)
// Renders its own neutral (colorless, pre-reading) AuraFigure as a static
// backdrop, with an independently-animated glow layered on top — driven
// entirely via `transform` (translate + scale), never raw SVG cx/cy/r
// attributes, since Reanimated's cross-platform (incl. web) support for
// animating non-transform SVG attributes via react-native-svg is
// unreliable — transform is the one property it reliably animates
// everywhere. AuraFigure.tsx itself stays unmodified; its own core orb is
// hardcoded and reused in several other places (Depths, arrival
// sequences) where changing that render contract risks side effects
// elsewhere.
export function AttentionScan({ sphere, phrase, durationMs, onComplete }: AttentionScanProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.65);

  useEffect(() => {
    const grow = durationMs * 0.45;
    const hold = durationMs * 0.15;
    const settle = durationMs - grow - hold;

    if (sphere === 'body') {
      const dx = SHOULDER.x - REST.x;
      const dy = SHOULDER.y - REST.y;
      translateX.value = withSequence(
        withTiming(dx, { duration: grow, easing: SOFT_EASE }),
        withTiming(dx, { duration: hold }),
        withTiming(0, { duration: settle, easing: SOFT_EASE })
      );
      translateY.value = withSequence(
        withTiming(dy, { duration: grow, easing: SOFT_EASE }),
        withTiming(dy, { duration: hold }),
        withTiming(0, { duration: settle, easing: SOFT_EASE })
      );
    } else if (sphere === 'mind') {
      const dx = HEAD.x - REST.x;
      const dy = HEAD.y - REST.y;
      translateX.value = withSequence(
        withTiming(dx, { duration: grow, easing: SOFT_EASE }),
        withTiming(dx, { duration: hold }),
        withTiming(0, { duration: settle, easing: SOFT_EASE })
      );
      translateY.value = withSequence(
        withTiming(dy, { duration: grow, easing: SOFT_EASE }),
        withTiming(dy, { duration: hold }),
        withTiming(0, { duration: settle, easing: SOFT_EASE })
      );
    } else if (sphere === 'heart') {
      // No travel — deepens in place: larger scale, fuller opacity, then
      // back to resting. translateX/Y never move.
      scale.value = withSequence(
        withTiming(1.5, { duration: grow, easing: SOFT_EASE }),
        withTiming(1.5, { duration: hold }),
        withTiming(1, { duration: settle, easing: SOFT_EASE })
      );
      opacity.value = withSequence(
        withTiming(1, { duration: grow, easing: SOFT_EASE }),
        withTiming(1, { duration: hold }),
        withTiming(0.65, { duration: settle, easing: SOFT_EASE })
      );
    } else {
      // spirit — expands past the body's own outline, then contracts.
      scale.value = withSequence(
        withTiming(SPIRIT_SCALE, { duration: grow, easing: SOFT_EASE }),
        withTiming(SPIRIT_SCALE, { duration: hold }),
        withTiming(1, { duration: settle, easing: SOFT_EASE })
      );
      opacity.value = withSequence(
        withTiming(0.4, { duration: grow, easing: SOFT_EASE }),
        withTiming(0.4, { duration: hold }),
        withTiming(0.65, { duration: settle, easing: SOFT_EASE })
      );
    }

    // No auto-dismiss timer — the scan holds until tapped. A body/mind
    // beat that vanishes on its own before someone's finished noticing it
    // defeats the point (docs/measure-experience-concept.md §1); the
    // motion still settles on its own timeline, but moving on is the
    // user's own choice, not a countdown.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sphere, durationMs]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Pressable style={styles.wrap} onPress={onComplete}>
      <View style={{ width: METRICS.width, height: METRICS.height }}>
        <AuraFigure
          neutral
          size={AURA_SIZE}
          showDots={false}
          uid="scan"
          neutralColor={theme === 'light' ? colors.accent.ivory : AURA_NEUTRAL_COLOR}
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
      {phrase && <Text style={styles.phrase}>{phrase}</Text>}
      <Text style={styles.tapHint}>{t('measure.tapToContinue')}</Text>
    </Pressable>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    wrap: { alignItems: 'center', paddingVertical: spacing[4] },
    glow: {
      position: 'absolute',
      backgroundColor: AURA_NEUTRAL_COLOR,
    },
    phrase: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      textAlign: 'center',
      marginTop: spacing[3],
      paddingHorizontal: spacing[6],
    },
    tapHint: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textAlign: 'center',
      marginTop: spacing[5],
    },
  });
}
