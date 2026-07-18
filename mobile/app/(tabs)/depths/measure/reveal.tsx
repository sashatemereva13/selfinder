import { useEffect } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { AXIS_COLORS, THERMOMETER_MAX } from '../../../../src/content/measureConfig';
import { MeasureLine } from '../../../../src/types';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';

export default function RevealScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const { currentResult, resetInterview } = useMeasureStore();

  useEffect(() => {
    if (!currentResult) router.replace('/(tabs)/depths/measure');
  }, [currentResult]);

  if (!currentResult) return null;

  const handleRestart = () => {
    resetInterview();
    router.replace('/(tabs)/depths/measure');
  };

  const goToLevel = (slug: string) => {
    router.push({ pathname: '/(tabs)/depths/level/[id]', params: { id: slug } });
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[6] }]}
    >
      <AmbientGlow />

      <Text style={styles.kicker}>Complete</Text>

      <Pressable onPress={() => goToLevel(currentResult.vibrationLevel.slug)}>
        <Text style={styles.overallName}>{currentResult.vibrationLevel.name}</Text>
      </Pressable>
      <Thermometer
        score={currentResult.vibrationScore}
        levelName={currentResult.vibrationLevel.name}
        axisKey={currentResult.dominantAxis}
      />
      <Pressable onPress={() => goToLevel(currentResult.vibrationLevel.slug)}>
        <Text style={styles.overallTapHint}>
          Read about {currentResult.vibrationLevel.name} →
        </Text>
      </Pressable>

      {(currentResult.microPractice || currentResult.affirmation) && (
        <View style={styles.practiceBlock}>
          {currentResult.microPractice && (
            <Text style={styles.practiceAction}>{currentResult.microPractice}</Text>
          )}
          {currentResult.affirmation && (
            <Text style={styles.affirmation}>"{currentResult.affirmation}"</Text>
          )}
        </View>
      )}

      <View style={styles.linesSection}>
        <Text style={styles.linesKicker}>Your four sides</Text>
        <Text style={[styles.copy, styles.linesIntro]}>
          You can read high on one side and low on another — that's not a contradiction,
          just where each part happens to be right now.
        </Text>

        {currentResult.lines.map((line: MeasureLine) => (
          <View key={line.key} style={styles.lineRow}>
            <Text style={styles.lineLabel}>{line.label}</Text>
            <Thermometer
              score={line.vibrationScore}
              levelName={line.vibrationLevel.name}
              axisKey={line.dominantAxis}
              compact
            />
            <Pressable onPress={() => goToLevel(line.vibrationLevel.slug)}>
              <Text style={styles.lineLink}>Read about {line.vibrationLevel.name} →</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: philosopher?.color ?? colors.brand.purple }]}
        onPress={handleRestart}
      >
        <Text style={styles.buttonText}>Measure again</Text>
      </Pressable>
    </ScrollView>
  );
}

function Thermometer({
  score,
  levelName,
  axisKey,
  compact = false,
}: {
  score: number;
  levelName: string;
  axisKey: string;
  compact?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (score / THERMOMETER_MAX) * 100));
  const rgb = AXIS_COLORS[axisKey] ?? AXIS_COLORS.clarity;

  return (
    <View style={compact ? styles.thermoCompact : styles.thermo}>
      <View style={styles.thermoTrack}>
        <View style={[styles.thermoFill, { width: `${pct}%`, backgroundColor: `rgb(${rgb})` }]} />
      </View>
      <Text style={styles.thermoReading}>
        {levelName} <Text style={styles.thermoScore}>· {score}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], gap: spacing[5], paddingBottom: spacing[12] },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  overallName: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.hero,
    lineHeight: fontSizes.hero * lineHeights.tight,
    marginTop: spacing[2],
  },
  overallTapHint: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[2],
  },
  copy: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  practiceBlock: {
    gap: spacing[2],
    marginTop: spacing[4],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  practiceAction: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.base },
  affirmation: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm, fontStyle: 'italic' },
  linesSection: { gap: spacing[4], marginTop: spacing[3] },
  linesKicker: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.md },
  linesIntro: { marginBottom: spacing[1] },
  lineRow: {
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.md,
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  lineLabel: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base, textTransform: 'capitalize' },
  lineLink: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
  thermo: { gap: spacing[2] },
  thermoCompact: { gap: spacing[1] },
  thermoTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: colors.bg.border,
    overflow: 'hidden',
  },
  thermoFill: { height: '100%', borderRadius: radius.full },
  thermoReading: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  thermoScore: { color: colors.text.muted },
  button: { paddingVertical: spacing[4], borderRadius: radius.full, alignItems: 'center' },
  buttonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.base },
});
