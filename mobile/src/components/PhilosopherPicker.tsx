import { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { PHILOSOPHERS, PHILOSOPHER_MAP } from '../content/philosophers';
import { Philosopher } from '../types';
import { colors } from '../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { PhilosopherObject } from './PhilosopherObject';

const ORB_SIZE = 96;
const ROWS = [PHILOSOPHERS.slice(0, 2), PHILOSOPHERS.slice(2, 3), PHILOSOPHERS.slice(3, 5)];

type OrbState = 'idle' | 'focused' | 'dimmed';

function PhilosopherOrb({
  philosopher,
  state,
  onPress,
}: {
  philosopher: Philosopher;
  state: OrbState;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(state === 'focused' ? 1.08 : state === 'dimmed' ? 0.9 : 1, { duration: 280 });
    opacity.value = withTiming(state === 'dimmed' ? 0.35 : 1, { duration: 280 });
  }, [state]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.orbTouchTarget}>
      <Animated.View style={[styles.orbColumn, animatedStyle]}>
        <PhilosopherObject id={philosopher.id} rgb={philosopher.accentRgb} size={ORB_SIZE} />
        <Text style={[styles.orbName, state === 'focused' && { color: philosopher.color }]}>
          {philosopher.name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

export function PhilosopherPicker({
  selectedId,
  onSelect,
}: {
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) {
  const [focusedId, setFocusedId] = useState<string | null>(selectedId ?? null);
  const focused = focusedId ? PHILOSOPHER_MAP[focusedId] : null;

  return (
    <View style={styles.wrap}>
      <View style={styles.cluster}>
        {ROWS.map((row, i) => (
          <View key={i} style={styles.row}>
            {row.map((p) => (
              <PhilosopherOrb
                key={p.id}
                philosopher={p}
                state={focusedId === null ? 'idle' : focusedId === p.id ? 'focused' : 'dimmed'}
                onPress={() => setFocusedId(p.id)}
              />
            ))}
          </View>
        ))}
      </View>

      <View style={styles.modeReveal}>
        {focused ? (
          <>
            <Text style={[styles.modeText, { color: focused.color }]}>{focused.mode}</Text>
            <Text style={styles.descriptionText}>{focused.description}</Text>
          </>
        ) : (
          <Text style={styles.placeholderText}>Tap someone to begin</Text>
        )}
      </View>

      <View style={styles.confirmWrap}>
        <Pressable
          disabled={!focused}
          style={[
            styles.confirmButton,
            { backgroundColor: focused?.color ?? colors.brand.purple, opacity: focused ? 1 : 0 },
          ]}
          onPress={() => focused && onSelect(focused.id)}
        >
          <Text style={styles.confirmText}>{focused ? `Walk with ${focused.name}` : ' '}</Text>
        </Pressable>
        {focused && <Text style={styles.reassurance}>You can change this anytime</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center', gap: spacing[6] },
  cluster: { gap: spacing[5], alignItems: 'center' },
  row: { flexDirection: 'row', gap: spacing[6], justifyContent: 'center' },
  orbTouchTarget: { alignItems: 'center' },
  orbColumn: { alignItems: 'center' },
  orbName: {
    marginTop: spacing[2],
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  modeReveal: {
    minHeight: fontSizes.sm * lineHeights.normal,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  modeText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.wide,
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
});
