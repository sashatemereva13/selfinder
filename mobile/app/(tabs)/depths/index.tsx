import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { getLevelBySlug } from '../../../src/content/levelsContent';
import { LEVEL_COLORS } from '../../../src/content/measureConfig';
import { SaveMessageAction } from '../../../src/components/SaveMessageAction';

type Tool = { key: string; label: string; description: string; route: Href };

// Grouped (rather than one flat stack) so the sequence reads as three moves —
// find out, understand, shift — instead of six equally-weighted options.
// Measure and Spill sit together deliberately: both surface where you are,
// one through structured questions, the other through unstructured writing.
const TOOL_GROUPS: { label: string; tools: Tool[] }[] = [
  {
    label: 'Find out where you are',
    tools: [
      { key: 'measure', label: 'Measure', description: 'A guided conversation, one question at a time', route: '/(tabs)/depths/measure' },
      { key: 'spill',   label: 'Spill',   description: 'Let it out before you name it',                   route: '/(tabs)/depths/spill' },
    ],
  },
  {
    label: 'Understand it',
    tools: [
      { key: 'levels', label: 'Levels', description: 'What each state is for', route: '/(tabs)/depths/levels' },
    ],
  },
  {
    label: 'Shift it, if you want to',
    tools: [
      { key: 'tunein', label: 'Tune In', description: 'Regulate it with sound', route: '/(tabs)/depths/tunein' },
      { key: 'moon',   label: 'Moon',    description: 'Understand your timing', route: '/(tabs)/depths/moon' },
    ],
  },
];

// Kept outside the sequence and styled quieter — this one isn't a step, it's
// an alternative to the whole thing: skip finding out, let a message find you.
const FEELING_LUCKY: Tool = {
  key: 'feeling-lucky',
  label: 'Feeling Lucky',
  description: 'Or, let a message find you at random',
  route: '/(tabs)/depths/feeling-lucky',
};

export default function DepthsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const accentColor = philosopher?.color ?? colors.brand.purple;
  const lastLevel = currentResult ? getLevelBySlug(currentResult.vibrationLevel.slug) : undefined;
  const levelRgb = lastLevel ? LEVEL_COLORS[lastLevel.slug] ?? colors.brand.purpleRgb : undefined;
  const levelColor = levelRgb ? `rgb(${levelRgb})` : undefined;
  const tileColor = levelColor ?? accentColor;
  const headlineMessage = lastLevel
    ? currentResult?.combinationMessage ?? lastLevel.personalFrame ?? lastLevel.frame
    : undefined;

  const goToLevel = (slug: string) => {
    router.push({ pathname: '/(tabs)/depths/level/[id]', params: { id: slug } });
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}>
        <Text style={styles.kicker}>Depths</Text>

        {currentResult && lastLevel ? (
          <>
            <Text style={styles.lastReadingLabel}>
              Your last reading: {currentResult.vibrationLevel.name} · {currentResult.vibrationScore}
            </Text>
            <Text style={[styles.title, { color: levelColor }]}>{headlineMessage}</Text>

            {headlineMessage && levelRgb && (
              <SaveMessageAction message={headlineMessage} accentRgb={levelRgb} />
            )}

            <View style={styles.spheres}>
              {currentResult.lines.map((line) => {
                const sphereColor = `rgb(${LEVEL_COLORS[line.vibrationLevel.slug] ?? colors.brand.purpleRgb})`;
                return (
                  <Pressable
                    key={line.key}
                    style={styles.sphereItem}
                    onPress={() => goToLevel(line.vibrationLevel.slug)}
                  >
                    <View style={[styles.sphereDot, { backgroundColor: sphereColor }]} />
                    <Text style={styles.sphereLabel}>{line.label}</Text>
                    <Text
                      style={[styles.sphereValue, { color: sphereColor }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {line.vibrationLevel.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.lastReadingLabel}>Before your first reading</Text>
            <Text style={styles.title}>Whatever you're feeling right now is information, not a problem to fix.</Text>
          </>
        )}

        <View style={styles.sectionDivider} />

        <View style={styles.stack}>
          {TOOL_GROUPS.map((group) => (
            <View key={group.label} style={styles.group}>
              <Text style={styles.groupLabel}>{group.label}</Text>
              {group.tools.map((tool) => (
                <Pressable key={tool.key} style={styles.row} onPress={() => router.push(tool.route)}>
                  <Text style={[styles.rowLabel, { color: tileColor }]}>{tool.label}</Text>
                  <Text style={styles.rowDescription}>{tool.description}</Text>
                </Pressable>
              ))}
            </View>
          ))}

          <View style={styles.luckyWrap}>
            <Text style={styles.luckyDivider}>· · ·</Text>
            <Pressable style={styles.luckyRow} onPress={() => router.push(FEELING_LUCKY.route)}>
              <Text style={styles.luckyLabel}>{FEELING_LUCKY.label}</Text>
              <Text style={styles.luckyDescription}>{FEELING_LUCKY.description}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <LinearGradient
        colors={[colors.bg.base, 'transparent']}
        style={[styles.topFade, { height: insets.top + spacing[8] }]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
  },
  content: {
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  kicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  sectionDivider: {
    height: 1,
    backgroundColor: colors.bg.border,
    marginTop: spacing[10],
    marginBottom: spacing[8],
  },
  lastReadingLabel: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    marginTop: spacing[2],
  },
  title: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  spheres: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[6],
  },
  sphereItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[1],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
    marginHorizontal: spacing[1],
  },
  sphereDot: { width: 8, height: 8, borderRadius: 4 },
  sphereLabel: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  sphereValue: {
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textAlign: 'center',
  },
  stack: {},
  group: {
    marginBottom: spacing[8],
    gap: spacing[3],
  },
  groupLabel: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  row: {
    padding: spacing[5],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  rowLabel: { fontFamily: fonts.medium, fontSize: fontSizes.md },
  rowDescription: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[1],
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  luckyWrap: {
    alignItems: 'center',
    gap: spacing[4],
  },
  luckyDivider: {
    color: colors.text.faint,
    fontSize: fontSizes.sm,
    letterSpacing: letterSpacings.wide,
  },
  luckyRow: {
    width: '100%',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
    alignItems: 'center',
  },
  luckyLabel: {
    color: colors.text.secondary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.base,
  },
  luckyDescription: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[1],
    textAlign: 'center',
  },
});
