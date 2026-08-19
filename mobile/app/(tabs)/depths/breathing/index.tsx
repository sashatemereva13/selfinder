import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  SharedValue,
} from 'react-native-reanimated';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../../src/theme/typography';
import { spacing } from '../../../../src/theme/spacing';
import { BREATHING_PATTERNS, BreathingPhase, getRandomCompletionLine, getLocalizedBreathingPattern } from '../../../../src/content/breathingPatterns';
import { track } from '../../../../src/utils/analytics';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { useLocaleStore } from '../../../../src/store/localeStore';
import { useReadingColumnWidth } from '../../../../src/theme/responsive';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { getLocalizedLevelName } from '../../../../src/content/measureConfig';

const BASE_SCALE = 0.85;
const PEAK_SCALE = 1.25;
const SETTLE_MS = 800;
// The halo's screen-filling spread is driven by the same 0..1 range as the
// orb's own inhale/exhale scale (BASE_SCALE..PEAK_SCALE normalized), so the
// room visibly breathes in the same rhythm as the orb — grows on inhale,
// recedes on exhale — rather than running its own independent cycle.
const HALO_REST_SCALE = 1;
const HALO_PEAK_SCALE = 6;

function BreathingOrb({
  scale,
  onPress,
  label,
}: {
  scale: SharedValue<number>;
  onPress: () => void;
  label: string;
}) {
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const haloStyle = useAnimatedStyle(() => {
    const t = (scale.value - BASE_SCALE) / (PEAK_SCALE - BASE_SCALE);
    // Squared, not cubed like Tune In's faster pulse — phases here already
    // run 4-8s, slow enough that the halo doesn't need as much correction,
    // and over-easing risked visibly lagging the real breath cue it's tied to.
    const spread = t * t;
    return {
      transform: [{ scale: HALO_REST_SCALE + spread * (HALO_PEAK_SCALE - HALO_REST_SCALE) }],
      opacity: 0.3 - spread * 0.28,
    };
  });

  return (
    <View style={styles.orbWrap} pointerEvents="box-none">
      <Animated.View style={[styles.orbHalo, haloStyle]} pointerEvents="none" />
      <Animated.View style={[styles.orbCore, coreStyle]} pointerEvents="none" />
      {/* Sits at the core's resting size, not scaled with it — the breath
          cue's own growth/shrink shouldn't distort or reflow the label. */}
      <Pressable style={styles.orbTapTarget} onPress={onPress}>
        <Text style={styles.orbCoreLabel}>{label}</Text>
      </Pressable>
    </View>
  );
}

export default function BreathingScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markDiscovered = useEngagementStore((s) => s.markDiscovered);
  const columnWidth = useReadingColumnWidth();

  const [patternIndex, setPatternIndex] = useState(0);
  const [active, setActive] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [round, setRound] = useState(1);
  const [completionLine, setCompletionLine] = useState<string | null>(null);
  const scale = useSharedValue(BASE_SCALE);
  const currentResult = useMeasureStore((s) => s.currentResult);
  // The direction question ("what direction does it give you? where does
  // it pull you?" — review, 2026-08-19) is offered once completion
  // settles, not folded into completionLine itself — it's a genuinely
  // different kind of line (a question to sit with, not a closing
  // remark), so it gets its own beat rather than crowding a single line
  // with two jobs. Reset whenever a new session starts (handleToggle),
  // same as completionLine.
  const [showDirectionPrompt, setShowDirectionPrompt] = useState(false);

  const pattern = getLocalizedBreathingPattern(BREATHING_PATTERNS[patternIndex], locale);
  const phase: BreathingPhase = pattern.phases[phaseIndex];
  const latestLevelName = currentResult
    ? getLocalizedLevelName(currentResult.vibrationLevel, locale)
    : null;

  useEffect(() => {
    markDiscovered('breathing');
  }, []);

  // Steps through the active pattern's phases and rounds on a recursive
  // setTimeout (same idiom as Tune In's sleep timer), while the orb's own
  // scale animates smoothly to each phase's target via Reanimated —
  // JS state drives the sequence, the shared value drives the 60fps motion.
  useEffect(() => {
    if (!active) return;
    const currentPhase = pattern.phases[phaseIndex];
    const target = currentPhase.scale === 'hold' ? scale.value : currentPhase.scale;
    scale.value = withTiming(target, {
      duration: currentPhase.seconds * 1000,
      easing: Easing.inOut(Easing.sin),
    });

    const id = setTimeout(() => {
      const nextPhaseIndex = phaseIndex + 1;
      if (nextPhaseIndex >= pattern.phases.length) {
        if (round >= pattern.rounds) {
          setActive(false);
          setPhaseIndex(0);
          setRound(1);
          scale.value = withTiming(BASE_SCALE, { duration: SETTLE_MS });
          setCompletionLine(getRandomCompletionLine(locale));
          setShowDirectionPrompt(true);
          track('breathing_completed', { patternId: pattern.id });
        } else {
          setRound((r) => r + 1);
          setPhaseIndex(0);
        }
      } else {
        setPhaseIndex(nextPhaseIndex);
      }
    }, currentPhase.seconds * 1000);

    return () => clearTimeout(id);
  }, [active, phaseIndex, round, patternIndex]);

  const handleToggle = () => {
    if (active) {
      setActive(false);
      setPhaseIndex(0);
      setRound(1);
      scale.value = withTiming(BASE_SCALE, { duration: SETTLE_MS });
    } else {
      setActive(true);
      setCompletionLine(null);
      setShowDirectionPrompt(false);
      track('breathing_started', { patternId: pattern.id });
    }
  };

  const handleSelectPattern = (index: number) => {
    if (index === patternIndex) return;
    setActive(false);
    setPhaseIndex(0);
    setRound(1);
    setCompletionLine(null);
    setShowDirectionPrompt(false);
    scale.value = withTiming(BASE_SCALE, { duration: 400 });
    setPatternIndex(index);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && (
        <AmbientGlow intensified={active} pulseDurationMs={active ? phase.seconds * 1000 : 4200} />
      )}

      <View
        style={{
          width: columnWidth,
          alignSelf: 'center',
          flex: 1,
          alignItems: 'center',
          paddingHorizontal: spacing[6],
        }}
      >
        <Pressable style={styles.backRow} onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('common.back')}</Text>
        </Pressable>

        <Text style={styles.kicker}>{t('common.regulationLayer')}</Text>
        <Text style={styles.title}>{t('breathing.title')}</Text>

        <View style={styles.pickerRow}>
          {BREATHING_PATTERNS.map((p, i) => (
            <Pressable key={p.id} style={styles.pickerItem} onPress={() => handleSelectPattern(i)}>
              <Text style={[styles.pickerName, i === patternIndex && styles.pickerNameActive]}>
                {getLocalizedBreathingPattern(p, locale).name}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.centerBlock}>
          <Text style={styles.subtitle}>{pattern.subtitle}</Text>
          <Text style={styles.useFor}>{pattern.useFor}</Text>

          {/* Body-focus prompt (review, 2026-08-19) — shown only before a
              session starts, only once a reading actually exists to name
              (currentResult, same source measureIntro.lastReading already
              reads). Grounds the practice in something real and specific
              rather than a generic "notice your breath" line — names the
              person's own most recent reading and asks them to locate it
              somatically before beginning, the same "structure, never
              supplied content" posture as the rest of the app: it asks
              WHERE, never tells them what they'll find there. */}
          {!active && !completionLine && latestLevelName && (
            <Text style={styles.bodyFocusPrompt}>
              {t('breathing.bodyFocusPrompt', { level: latestLevelName.toLowerCase() })}
            </Text>
          )}

          <BreathingOrb scale={scale} onPress={handleToggle} label={active ? t('common.stop') : t('breathing.begin')} />

          <Text style={styles.phaseLabel}>
            {active ? phase.label : completionLine ?? t('breathing.readyWhenYouAre')}
          </Text>
          {active && (
            <Text style={styles.roundCounter}>
              {t('breathing.roundOf', { round, total: pattern.rounds })}
            </Text>
          )}

          {/* The direction question (review, 2026-08-19) — offered once,
              right after a completion line, as its own beat rather than
              folded into that line. A genuine open question the person
              answers only to themselves (nothing here captures or saves
              an answer — same "offer the conditions, never supply the
              content" rule as the rest of the app); it's about where the
              settled body wants to move now, not what it means. */}
          {showDirectionPrompt && (
            <Text style={styles.directionPrompt}>{t('breathing.directionPrompt')}</Text>
          )}

          <Text style={styles.howToNote}>{pattern.howTo}</Text>
        </View>
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg.base,
    paddingBottom: spacing[8],
    alignItems: 'center',
  },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  kicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  // flexWrap + a smaller gap (was spacing[8]/32px) — Russian pattern names
  // ("Физиологический вздох" is considerably longer than "Physiological
  // Sigh") could push two 150px-wide items + a 32px gap past a narrow
  // phone's available width; wrapping lets the second item drop to its
  // own row instead of the row overflowing or clipping.
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'center',
    gap: spacing[5],
  },
  pickerItem: { alignItems: 'center', paddingVertical: spacing[2], maxWidth: 150 },
  pickerName: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  pickerNameActive: { color: colors.accent.ivory, fontSize: fontSizes.base },
  centerBlock: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitle: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  useFor: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  howToNote: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  // Same italic/secondary register as a philosopher's own spoken line
  // elsewhere (e.g. Measure's scanPhrase) — this is an invitation to
  // notice, not an instruction or a label.
  bodyFocusPrompt: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[5],
  },
  directionPrompt: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginTop: spacing[3],
  },
  orbWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbHalo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.accent.ivory,
  },
  orbCore: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.accent.buttonFill,
  },
  orbTapTarget: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbCoreLabel: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  phaseLabel: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing[5],
  },
  roundCounter: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    marginTop: spacing[1],
  },
  });
}
