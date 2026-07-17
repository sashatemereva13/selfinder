import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../src/store/measureStore';

const TOOLS: { key: string; label: string; description: string; route: Href }[] = [
  { key: 'measure', label: 'Measure',  description: 'Read where you are right now',    route: '/(tabs)/depths/measure' },
  { key: 'moon',    label: 'Moon',     description: 'Understand your timing',           route: '/(tabs)/depths/moon' },
  { key: 'tunein',  label: 'Tune In',  description: 'Regulate with frequency',          route: '/(tabs)/depths/tunein' },
  { key: 'levels',  label: 'Levels',   description: 'See the map of consciousness',     route: '/(tabs)/depths/levels' },
];

export default function DepthsScreen() {
  const router = useRouter();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const accentColor = philosopher?.color ?? colors.brand.purple;

  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>Depths</Text>
      <Text style={styles.title}>Know what you feel. Understand why. Decide what comes next.</Text>

      {currentResult && (
        <Text style={styles.lastReading}>
          Last reading: {currentResult.vibrationLevel.name} · {currentResult.vibrationScore}
        </Text>
      )}

      <View style={styles.grid}>
        {TOOLS.map((tool) => (
          <Pressable
            key={tool.key}
            style={styles.tile}
            onPress={() => router.push(tool.route)}
          >
            <Text style={[styles.tileLabel, { color: accentColor }]}>{tool.label}</Text>
            <Text style={styles.tileDescription}>{tool.description}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[12],
  },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  lastReading: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    marginTop: spacing[6],
  },
  tile: {
    width: '47%',
    aspectRatio: 1,
    justifyContent: 'flex-end',
    padding: spacing[4],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  tileLabel: { fontFamily: fonts.medium, fontSize: fontSizes.md },
  tileDescription: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[1],
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
});
