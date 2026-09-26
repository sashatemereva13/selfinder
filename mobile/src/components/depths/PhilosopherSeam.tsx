import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, lineHeights } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Philosopher } from '../../types';
import { PhilosopherObject } from '../shared/PhilosopherObject';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// The philosopher's place on Depths — in the middle, between the reading
// above and the menu below, the way a guide stands between where you are
// and where you could go (RULES.md, "The philosopher is a constant
// presence"; replaces PhilosopherPresence's bare name at the top of the
// screen, and the static firstReadingCopy line that used to sit here).
// Two layers, per the two-layer rule: their line (italic, their voice —
// tap to open the conversation) and one plain action link (the step
// itself). Exactly one step, never two.
export function PhilosopherSeam({
  philosopher,
  line,
  actionLabel,
  onAction,
  onOpenConversation,
  accentTextColor,
  accentRgb,
  visible,
  size = 'regular',
}: {
  philosopher: Philosopher;
  line: string;
  actionLabel: string;
  onAction: () => void;
  onOpenConversation: () => void;
  accentTextColor: string;
  // Raw "r,g,b" — PhilosopherObject's own decorative fill.
  accentRgb: string;
  // False while Depths' arrival sequence is still playing after a fresh
  // reading — the seam keeps its space (so the menu below never jumps)
  // but stays invisible until the reading has settled, then arrives.
  visible: boolean;
  // 'large' on Depths, where the seam has the whole lower half of the
  // screen to itself; 'regular' at the bottom of the map.
  size?: 'regular' | 'large';
}) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const opacity = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: visible ? 900 : 0, easing: SOFT_EASE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.root, fadeStyle]} pointerEvents={visible ? 'auto' : 'none'}>
      <Pressable
        onPress={onOpenConversation}
        accessibilityRole="button"
        accessibilityLabel={`${philosopher.name}. ${line}`}
        accessibilityHint={t('depths.talkWithPhilosopherHint')}
      >
        <View style={styles.nameRow}>
          <PhilosopherObject id={philosopher.id} rgb={accentRgb} size={16} />
          <Text style={[styles.name, { color: accentTextColor }]}>{philosopher.name}</Text>
        </View>
        <Text style={[styles.line, size === 'large' && styles.lineLarge]}>{line}</Text>
      </Pressable>
      <Pressable onPress={onAction} accessibilityRole="button" hitSlop={spacing[2]} style={styles.actionHit}>
        <Text style={[styles.action, size === 'large' && styles.actionLarge, { color: accentTextColor }]}>{actionLabel} →</Text>
      </Pressable>
    </Animated.View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: {
      paddingTop: spacing[3],
      paddingBottom: spacing[4],
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[2],
    },
    name: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
    },
    line: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[2],
    },
    lineLarge: {
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.35,
      marginTop: spacing[3],
    },
    actionHit: { alignSelf: 'flex-start', marginTop: spacing[2] },
    actionLarge: {
      fontSize: fontSizes.sm,
      marginTop: spacing[2],
    },
    action: {
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
    },
  });
}
