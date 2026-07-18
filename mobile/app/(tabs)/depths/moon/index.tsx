import { useMemo } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { MoonPhaseDisc } from '../../../../src/components/MoonPhaseDisc';
import {
  SYNODIC_MONTH,
  getMoonPhaseFraction,
  getMoonPhaseInfo,
  PHASE_STAGE,
  STAGE_DESCRIPTIONS,
  MOON_PHASE_CONTENT,
  getMeasureBand,
  getPersonalizedBridge,
  getFlowSuggestions,
} from '../../../../src/content/moonConfig';

export default function MoonScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentResult = useMeasureStore((s) => s.currentResult);

  const moon = useMemo(() => {
    const now = new Date();
    const fraction = getMoonPhaseFraction(now);
    const { name, symbol } = getMoonPhaseInfo(fraction);
    const stage = PHASE_STAGE[name];
    const content = MOON_PHASE_CONTENT[name];
    const moonAgeDays = fraction * SYNODIC_MONTH;
    const illuminationPercent = Math.round(0.5 * (1 - Math.cos(2 * Math.PI * fraction)) * 100);
    const cycleProgressPercent = Math.round(fraction * 100);

    return { fraction, name, symbol, stage, content, moonAgeDays, illuminationPercent, cycleProgressPercent };
  }, []);

  const band = currentResult ? getMeasureBand(currentResult.vibrationScore) : 'unknown';
  const bridge = getPersonalizedBridge(moon.name, currentResult);
  const flowSuggestions = getFlowSuggestions(moon.stage, band);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      <Text style={styles.kicker}>Moon</Text>
      <Text style={styles.title}>Everything has a cycle</Text>

      <View style={styles.discBlock}>
        <MoonPhaseDisc fraction={moon.fraction} />
        <Text style={styles.phaseName}>
          {moon.symbol} {moon.name}
        </Text>
        <View style={styles.stageBadge}>
          <Text style={styles.stageBadgeText}>{moon.stage}</Text>
        </View>
      </View>

      <Text style={styles.stageDescription}>{STAGE_DESCRIPTIONS[moon.stage]}</Text>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Moon age</Text>
          <Text style={styles.metricValue}>{moon.moonAgeDays.toFixed(1)}d</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Illumination</Text>
          <Text style={styles.metricValue}>{moon.illuminationPercent}%</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Cycle progress</Text>
          <Text style={styles.metricValue}>{moon.cycleProgressPercent}%</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardKicker}>Nature</Text>
        <Text style={styles.cardBody}>{moon.content.nature}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardKicker}>Reflection</Text>
        <Text style={styles.cardBody}>{moon.content.reflection}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardKicker}>Practice</Text>
        <Text style={styles.cardBody}>{moon.content.practice}</Text>
      </View>

      <View style={styles.bridgeCard}>
        <Text style={styles.cardKicker}>{bridge.title}</Text>
        <Text style={styles.cardBody}>{bridge.body}</Text>
        {!currentResult && (
          <Pressable
            style={styles.bridgeButton}
            onPress={() => router.push('/(tabs)/depths/measure' as Href)}
          >
            <Text style={styles.bridgeButtonText}>Start with Measure</Text>
          </Pressable>
        )}
      </View>

      {flowSuggestions.length > 0 && (
        <View style={styles.flowRow}>
          {flowSuggestions.map((tool) => (
            <Pressable
              key={tool.route}
              style={styles.flowChip}
              onPress={() => router.push(tool.route as Href)}
            >
              <Text style={styles.flowChipText}>{tool.label}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12], gap: spacing[4] },
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
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    marginBottom: spacing[2],
  },
  discBlock: { alignItems: 'center', gap: spacing[3], paddingVertical: spacing[4] },
  phaseName: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.md },
  stageBadge: {
    borderWidth: 1,
    borderColor: colors.bg.border,
    borderRadius: radius.full,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[1],
  },
  stageBadgeText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
    textTransform: 'uppercase',
  },
  stageDescription: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
  },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing[3] },
  metric: {
    flex: 1,
    alignItems: 'center',
    gap: spacing[1],
    paddingVertical: spacing[3],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  metricLabel: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  metricValue: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base },
  card: {
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
  },
  cardKicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  cardBody: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  bridgeCard: {
    gap: spacing[2],
    padding: spacing[4],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand.purple,
    backgroundColor: colors.bg.elevated,
  },
  bridgeButton: {
    marginTop: spacing[2],
    alignSelf: 'flex-start',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: radius.full,
    backgroundColor: colors.brand.purple,
  },
  bridgeButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  flowRow: { flexDirection: 'row', gap: spacing[2] },
  flowChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  flowChipText: { color: colors.text.secondary, fontFamily: fonts.light, fontSize: fontSizes.sm },
});
