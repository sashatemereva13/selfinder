import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors } from '../theme/useThemeColors';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAppAccentRgb } from '../utils/appAccent';
import { AgencySortResult } from '../types';

type Bucket = keyof AgencySortResult;
const BUCKETS: Bucket[] = ['agency', 'influence', 'authorship'];

// Control's slot 7 primitive — "which parts of this belong to you, which
// don't." Built Control-specific per docs/journeys-concept.md's own note
// not to prematurely generalize a shared "3-way sort" system before a
// second Journey actually needs one. Tap-to-assign (select a chip, tap a
// bucket) rather than drag-and-drop — this is a categorical sort, not an
// explorable range, so React Native drag complexity buys nothing here.
//
// V1: the sortable "elements" are the person's own prior answers in this
// session (one chip per completed slot, full text) rather than
// NLP-extracted sub-phrases — simpler and more reliable for a first pass;
// refining to phrase-level extraction is a reasonable later step, not
// blocking.
//
// Per aesthetic.md: no ranking implied between buckets (this is a sort,
// not a spectrum), one accent color, no cards — three plain labeled
// sections, position/space carrying the grouping, not boxes or per-bucket
// hues.
interface AgencySortPrimitiveProps {
  items: string[]; // the person's own prior answers, one per completed slot
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

  const bucketLabels: Record<Bucket, string> = {
    agency: t('control.agencyBucket'),
    influence: t('control.influenceBucket'),
    authorship: t('control.authorshipBucket'),
  };

  const handleAssign = (bucket: Bucket) => {
    if (!selectedItem) return;
    setAssignments((prev) => ({ ...prev, [selectedItem]: bucket }));
    setSelectedItem(null);
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
      <Text style={styles.instruction}>{t('control.agencySortInstruction')}</Text>

      <View style={styles.chipRow}>
        {items.map((item) => {
          const assignedTo = assignments[item];
          const isSelected = selectedItem === item;
          return (
            <Pressable
              key={item}
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
          );
        })}
      </View>

      <View style={styles.buckets}>
        {BUCKETS.map((bucket) => (
          <Pressable
            key={bucket}
            style={styles.bucketRow}
            onPress={() => handleAssign(bucket)}
            disabled={!selectedItem}
          >
            <Text style={[styles.bucketLabel, selectedItem && { color: accentColor }]}>
              {bucketLabels[bucket]}
            </Text>
            <Text style={styles.bucketHint}>{t(`control.${bucket}Hint`)}</Text>
          </Pressable>
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
    instruction: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: 'center',
    },
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
    buckets: { gap: spacing[4] },
    bucketRow: { alignItems: 'center', paddingVertical: spacing[2] },
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
