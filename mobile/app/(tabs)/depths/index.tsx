import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Rect, Circle } from 'react-native-svg';
import { colors } from '../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../src/store/measureStore';
import { useEngagementStore, DiscoverableFeature } from '../../../src/store/engagementStore';
import { getLevelBySlug } from '../../../src/content/levelsContent';
import { LEVEL_COLORS } from '../../../src/content/measureConfig';
import { SaveMessageAction } from '../../../src/components/SaveMessageAction';

// Never Spill here, deliberately — it already has its two dedicated homes
// (the fork on Measure's entry screen, and Guide's rare invitation); adding
// a third, generic "try this" nudge for it would undercut exactly the
// positioning fix that gave it those two instead. Priority order matters:
// understanding what a level means is more foundational than a regulation
// tool, so it's offered first.
const DISCOVERY_NUDGES: { feature: DiscoverableFeature; label: string; route: Href }[] = [
  { feature: 'levels', label: "Haven't tried Levels yet? See what each state actually means →", route: '/(tabs)/depths/levels' },
  { feature: 'tuneIn', label: "Haven't tried Tune In yet? Shift your state through sound →", route: '/(tabs)/depths/tunein' },
];

type Tool = { key: string; label: string; description: string; route: Href };

// Makes clear whether a reading reflects right now or something from a
// while back — the label otherwise looks identical whether it's five
// minutes or three weeks old.
function formatRelativeDay(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Grouped (rather than one flat stack) so the sequence reads as three moves —
// find out, understand, shift — instead of six equally-weighted options.
// Spill deliberately isn't listed here — as a plain equal-weight alternative
// to Measure it went unused, since nothing ever signaled *when* to reach for
// it. It now lives in two more specific places instead: a quiet link on
// Measure's own entry screen (the actual decision point between structured
// and unstructured), and a rare, philosopher-triggered invitation in Guide
// when someone's message reads as needing to vent rather than converse.
const TOOL_GROUPS: { label: string; tools: Tool[] }[] = [
  {
    label: 'Find out where you are',
    tools: [
      { key: 'measure', label: 'Measure', description: 'A guided conversation, one question at a time', route: '/(tabs)/depths/measure' },
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
    ],
  },
];
// Moon ('Understand your timing') is deliberately pulled out of the current
// flow, not deleted — its actual value (and a possible Sun/planets
// expansion) needs to be worked through before it earns a place next to
// Tune In. The screen still exists at app/(tabs)/depths/moon, unlinked, for
// when that's ready — likely as paid content.

// Kept outside the sequence and styled quieter — this one isn't a step, it's
// an alternative to the whole thing: skip finding out, let a message find you.
const FEELING_LUCKY: Tool = {
  key: 'feeling-lucky',
  label: 'Feeling Lucky',
  description: 'Or, let a message find you at random',
  route: '/(tabs)/depths/feeling-lucky',
};

// Soft outer halo + an off-center-lit core, rather than a flat circle — the
// same radial-glow signature as AmbientGlow, scaled down to sit inside a row.
function SphereOrb({ color, gradientId }: { color: string; gradientId: string }) {
  return (
    <Svg width={44} height={44}>
      <Defs>
        <RadialGradient id={`${gradientId}-halo`} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.3} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={`${gradientId}-core`} cx="35%" cy="32%" r="70%">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset="0.55" stopColor={color} stopOpacity={0.45} />
          <Stop offset="1" stopColor={color} stopOpacity={0.18} />
        </RadialGradient>
      </Defs>
      <Circle cx={22} cy={22} r={22} fill={`url(#${gradientId}-halo)`} />
      <Circle cx={22} cy={22} r={10} fill={`url(#${gradientId}-core)`} />
    </Svg>
  );
}

export default function DepthsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const totalMeasureCount = useEngagementStore((s) => s.totalMeasureCount);
  const discovered = useEngagementStore((s) => s.discovered);
  const accentColor = philosopher?.color ?? colors.brand.purple;
  // At most one nudge, for the highest-priority thing not yet found — never
  // stacked, never repeated once discovered. Only surfaced for someone who's
  // already established the core habit, not a first-timer still on Measure.
  const discoveryNudge =
    totalMeasureCount >= 2 ? DISCOVERY_NUDGES.find((n) => !discovered[n.feature]) : undefined;
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
            <Pressable onPress={() => router.push('/(tabs)/depths/measure/reveal')}>
              <Text style={styles.lastReadingLabel}>
                Your last reading — {formatRelativeDay(currentResult.savedAt)}: {currentResult.vibrationLevel.name} · {currentResult.vibrationScore} →
              </Text>
            </Pressable>
            <Text style={[styles.title, { color: levelColor }]}>{headlineMessage}</Text>

            {headlineMessage && levelRgb && (
              <SaveMessageAction message={headlineMessage} accentRgb={levelRgb} />
            )}

            <View style={styles.spheres}>
              {currentResult.lines.map((line) => {
                const sphereRgb = LEVEL_COLORS[line.vibrationLevel.slug] ?? colors.brand.purpleRgb;
                const sphereColor = `rgb(${sphereRgb})`;
                const gradientId = `sphereRow-${line.key}`;
                return (
                  <Pressable
                    key={line.key}
                    style={styles.sphereRow}
                    onPress={() => goToLevel(line.vibrationLevel.slug)}
                  >
                    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                      <Defs>
                        <RadialGradient id={gradientId} cx="14%" cy="45%" r="85%">
                          <Stop offset="0" stopColor={sphereColor} stopOpacity={0.1} />
                          <Stop offset="1" stopColor={sphereColor} stopOpacity={0} />
                        </RadialGradient>
                      </Defs>
                      <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
                    </Svg>

                    <View style={styles.sphereRowText}>
                      <Text
                        style={[
                          styles.sphereRowName,
                          { color: sphereColor, textShadowColor: sphereColor },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {line.vibrationLevel.name}
                      </Text>
                      <Text style={styles.sphereRowAxis}>{line.label}</Text>
                    </View>

                    <SphereOrb color={sphereColor} gradientId={`orb-${line.key}`} />
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : (
          <>
            <Text style={styles.lastReadingLabel}>Before your first reading</Text>
            <Text style={styles.title}>
              Whatever you're feeling right now is information, not a problem to fix. Measure is where you find out what it is.
            </Text>
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

          {discoveryNudge && (
            <Pressable style={styles.discoveryNudge} onPress={() => router.push(discoveryNudge.route)}>
              <Text style={styles.discoveryNudgeText}>{discoveryNudge.label}</Text>
            </Pressable>
          )}

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
    gap: spacing[3],
    marginTop: spacing[6],
  },
  sphereRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[5],
    borderRadius: radius.xl,
    backgroundColor: colors.bg.elevated,
    overflow: 'hidden',
  },
  sphereRowText: {
    flex: 1,
    marginRight: spacing[3],
  },
  sphereRowName: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sphereRowAxis: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
    marginTop: spacing[1],
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
  discoveryNudge: {
    alignItems: 'center',
    paddingVertical: spacing[3],
    marginBottom: spacing[4],
  },
  discoveryNudgeText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
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
