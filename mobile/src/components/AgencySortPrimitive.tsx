import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAppAccentRgb } from '../utils/appAccent';
import { AgencySortResult } from '../types';

type Bucket = keyof AgencySortResult;
const BUCKETS: Bucket[] = ['agency', 'influence', 'authorship'];
const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Control's agency-stage primitive — "which parts of this belong to you,
// which don't." Built Control-specific per docs/journeys-concept.md's own
// note not to prematurely generalize a shared "3-way sort" system before a
// second Journey actually needs one. Tap-to-assign (select a chip, tap a
// bucket) rather than drag-and-drop — this is a categorical sort, not an
// explorable range, so React Native drag complexity buys nothing here.
//
// 2026-08-26: the sortable "elements" are now, when available, AI-cleaned
// first-person propositions about agency (see journeyController.js's
// proposition-extraction step) rather than raw prior stage answers —
// real testing showed raw utterances mix internal states ("I'm feeling
// confused"), process questions ("Am I trying to control or not?"), and
// genuine agency claims ("A relationship") on the same footing, producing
// muddy categorization. `items` itself keeps the same shape (a flat
// string array) regardless of source — this component doesn't need to
// know whether what it received was extracted or is the raw fallback
// (see app/control.tsx's own `extractedPropositions ?? priorFinalAnswers`
// selection).
//
// 2026-08-29 redesign: a real on-device test found this screen's
// instructions unclear on first use. Root causes, both fixed here:
// (1) this component used to show its OWN static instruction line
// ("Place what you've said into where it actually belongs") stacked
// directly below the AI-phrased question JourneyWizard's transcript
// already shows above it — two differently-worded instructions for one
// action. That own-instruction line is removed; the AI-phrased question
// above is the only instruction now.
// (2) nothing showed the tap-a-chip-then-tap-a-bucket mechanic before
// you'd already done it once. A one-time animated demo (the first chip
// nudges toward the first bucket and back) now plays on mount, and the
// three bucket borders pulse in the accent color the instant any chip is
// selected, making "these three are where this goes" visually obvious.
//
// Explicitly did NOT move to a concentric-ring layout (closer-to-center =
// more agency) despite early exploration — distance-from-center as a
// stand-in for "how much of this is yours" is the same gradient-bar/
// ranking problem docs/design/aesthetic.md forbids elsewhere ("no
// gradient bars... a 'bad -> good' visual convention"). Treating "not
// mine to author" as a lesser/further category would imply it's a worse
// answer than "mine to choose," which contradicts the anti-diagnosis
// rule. The three buckets stay genuinely equal-weight peers.
interface AgencySortPrimitiveProps {
  items: string[]; // extracted propositions, or raw per-stage answers as a fallback
  onSubmit: (answer: string, structuredAnswer: AgencySortResult) => void;
}

export function AgencySortPrimitive({ items, onSubmit }: AgencySortPrimitiveProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;

  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, Bucket>>({});

  // One-time demo — plays once per mount of this primitive (i.e. once per
  // Journey session reaching this stage), never repeats once a real
  // assignment has happened. Not persisted — a fresh demo each time this
  // screen is genuinely reached is fine, since it's brief and only shown
  // before any real interaction.
  const hasAssignedRef = useRef(false);
  const demoChipX = useSharedValue(0);
  const demoChipY = useSharedValue(0);
  const demoChipOpacity = useSharedValue(0.5);

  useEffect(() => {
    if (items.length === 0) return;
    // A short nudge toward "down and slightly right" (roughly where the
    // first bucket row sits relative to the chip row above it) and back —
    // "gather, condense, become," never a bounce/spring, per aesthetic.md's
    // motion language.
    demoChipOpacity.value = withDelay(400, withTiming(1, { duration: 300, easing: SOFT_EASE }));
    demoChipY.value = withDelay(
      400,
      withSequence(
        withTiming(14, { duration: 500, easing: SOFT_EASE }),
        withTiming(0, { duration: 500, easing: SOFT_EASE })
      )
    );
    demoChipOpacity.value = withDelay(400 + 1000, withTiming(0.5, { duration: 300, easing: SOFT_EASE }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length > 0]);

  const demoChipStyle = useAnimatedStyle(() => ({
    opacity: demoChipOpacity.value,
    transform: [{ translateY: demoChipY.value }],
  }));

  const bucketPulse = useSharedValue(0);
  useEffect(() => {
    bucketPulse.value = withTiming(selectedItem ? 1 : 0, { duration: 250, easing: SOFT_EASE });
  }, [selectedItem, bucketPulse]);
  const bucketPulseStyle = useAnimatedStyle(() => ({
    borderColor: bucketPulse.value > 0.5 ? accentColor : colors.bg.border,
    opacity: 0.4 + bucketPulse.value * 0.6,
  }));

  const bucketLabels: Record<Bucket, string> = {
    agency: t('control.agencyBucket'),
    influence: t('control.influenceBucket'),
    authorship: t('control.authorshipBucket'),
  };

  const handleAssign = (bucket: Bucket) => {
    if (!selectedItem) return;
    setAssignments((prev) => ({ ...prev, [selectedItem]: bucket }));
    setSelectedItem(null);
    hasAssignedRef.current = true;
  };

  const allAssigned = items.length > 0 && items.every((item) => assignments[item]);

  const handleSubmit = () => {
    if (!allAssigned) return;
    const result: AgencySortResult = { agency: [], influence: [], authorship: [] };
    for (const item of items) {
      result[assignments[item]].push(item);
    }
    const summary = BUCKETS.map(
      (b) => `${bucketLabels[b]}: ${result[b].join('; ') || '—'}`
    ).join('\n');
    onSubmit(summary, result);
  };

  return (
    <View style={styles.root}>
      <View style={styles.chipRow}>
        {items.map((item, i) => {
          const assignedTo = assignments[item];
          const isSelected = selectedItem === item;
          const isDemoTarget = i === 0 && !hasAssignedRef.current;
          return (
            <Animated.View key={item} style={isDemoTarget ? demoChipStyle : undefined}>
              <Pressable
                style={[
                  styles.chip,
                  isSelected && { borderColor: accentColor },
                  assignedTo && styles.chipAssigned,
                ]}
                onPress={() => setSelectedItem(isSelected ? null : item)}
              >
                <Text style={[styles.chipText, isSelected && { color: accentColor }]} numberOfLines={2}>
                  {item}
                </Text>
                {assignedTo && <Text style={styles.chipBucketLabel}>{bucketLabels[assignedTo]}</Text>}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={styles.buckets}>
        {BUCKETS.map((bucket) => (
          <Animated.View key={bucket} style={[styles.bucketRow, bucketPulseStyle]}>
            <Pressable style={styles.bucketRowInner} onPress={() => handleAssign(bucket)} disabled={!selectedItem}>
              <Text style={[styles.bucketLabel, selectedItem && { color: accentColor }]}>
                {bucketLabels[bucket]}
              </Text>
              <Text style={styles.bucketHint}>{t(`control.${bucket}Hint`)}</Text>
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <Pressable
        style={[styles.submitButton, { opacity: allAssigned ? 1 : 0.4 }]}
        onPress={handleSubmit}
        disabled={!allAssigned}
      >
        <Text style={[styles.submitButtonText, { color: accentColor }]}>{t('control.agencySortDone')}</Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { paddingHorizontal: spacing[5], paddingBottom: spacing[4], gap: spacing[5] },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2], justifyContent: 'center' },
    chip: {
      borderWidth: 1,
      borderColor: colors.bg.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      maxWidth: 220,
    },
    chipAssigned: { opacity: 0.5 },
    chipText: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.xs },
    chipBucketLabel: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      fontStyle: 'italic',
      marginTop: spacing[1],
    },
    // Increased from spacing[4] — more breathing room reads as "this is
    // its own distinct zone," part of fixing the same first-use clarity
    // gap the border pulse and demo animation address.
    buckets: { gap: spacing[6] },
    // The border itself now lives here (was plain, undecorated) so the
    // bucketPulseStyle animated border color has something to animate —
    // a 1px border, quiet by default (colors.bg.border, low opacity),
    // brightening to the accent color while a chip is selected.
    bucketRow: {
      borderWidth: 1,
      borderColor: colors.bg.border,
      borderRadius: radius.md,
    },
    bucketRowInner: { alignItems: 'center', paddingVertical: spacing[3], paddingHorizontal: spacing[3] },
    bucketLabel: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.sm },
    bucketHint: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textAlign: 'center',
      marginTop: spacing[1],
    },
    submitButton: { alignItems: 'center', paddingVertical: spacing[3] },
    submitButtonText: { fontFamily: fonts.medium, fontSize: fontSizes.sm },
  });
}
