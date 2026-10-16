import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useThemeColors } from '../../../src/theme/useThemeColors';
import type { Colors } from '../../../src/theme/colors';
import { fonts, fontSizes } from '../../../src/theme/typography';
import { spacing, radius } from '../../../src/theme/spacing';
import { useMeasureStore } from '../../../src/store/measureStore';
import { usePhilosopherStore } from '../../../src/store/philosopherStore';
import { useLocaleStore } from '../../../src/store/localeStore';
import { useShiftStore } from '../../../src/store/shiftStore';
import { getLocalizedLevelName, useLevelColors } from '../../../src/content/measureConfig';
import { buildSession } from '../../../src/content/shiftSession';
import { getJourneyForState, getJourneyOfferLine, JOURNEY_OFFER_GAP_DAYS } from '../../../src/content/journeyForState';
import { useEngagementStore } from '../../../src/store/engagementStore';
import { HEAVY_STATES, mentionsCrisisOnDevice } from '../../../src/utils/safety';
import { CrisisLine } from '../../../src/components/shared/CrisisLine';
import type { ShiftDoor } from '../../../src/content/shiftContent';
import { track } from '../../../src/utils/analytics';
import { AmbientGlow } from '../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../src/components/shared/BackLink';
import { ConsciousnessWheel } from '../../../src/components/depths/ConsciousnessWheel';
import { SessionSound } from '../../../src/components/shift/SessionSound';
import { ShiftMark } from '../../../src/components/shift/ShiftMark';
import { BreathingLight } from '../../../src/components/shared/BreathingLight';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// About six breaths a minute — five seconds in, five out.
const HALF_BREATH_MS = 5000;
const LIGHT = 200;

// A Shift session (docs/shift-concept.md, §4) — Use it, or Shift toward
// love, chosen on Practice. The philosopher's cues arrive one at a time
// over a breathing light in the destination's colour; there are no
// timers or step counts, the light is the only sense of time. Cues move
// on by themselves (a tap moves on sooner); writing moments wait for the
// person and can be skipped. At the end the person places themselves on
// the ring — the before/after is theirs, never computed — and it's kept
// on the phone (shiftStore).
export default function ShiftSessionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const levelColors = useLevelColors();
  const { door: doorParam } = useLocalSearchParams<{ door?: string }>();
  const door: ShiftDoor = doorParam === 'use' ? 'use' : 'love';
  const currentResult = useMeasureStore((s) => s.currentResult);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const locale = useLocaleStore((s) => s.locale);
  const hydrateShifts = useShiftStore((s) => s.hydrate);
  const addSession = useShiftStore((s) => s.addSession);

  const fromSlug = currentResult?.vibrationLevel.slug ?? 'neutrality';
  const steps = useMemo(
    () =>
      currentResult
        ? buildSession(door, fromSlug, getLocalizedLevelName(currentResult.vibrationLevel, locale), locale, philosopher?.id)
        : [],
    // Built once per session — a locale switch mid-session shouldn't restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [door, fromSlug],
  );
  const [index, setIndex] = useState(0);
  const [words, setWords] = useState<Partial<Record<'gratitude' | 'act' | 'where', string>>>({});
  const [draft, setDraft] = useState('');
  const toSlugRef = useRef(fromSlug);
  // The Journey that fits this state, offered under the closing line at
  // most once a week — decided once, when the session opens, so marking
  // it offered doesn't make it vanish while it's on screen.
  const journeyOffer = useRef(
    (() => {
      const last = useEngagementStore.getState().journeyOfferedAt;
      const due = !last || Date.now() - new Date(last).getTime() > JOURNEY_OFFER_GAP_DAYS * 86_400_000;
      return due ? getJourneyForState(fromSlug) : null;
    })(),
  ).current;
  const step = steps[index];
  const next = () => setIndex((i) => Math.min(i + 1, steps.length - 1));

  const rgb = door === 'love' ? levelColors.love : levelColors[fromSlug];

  useEffect(() => {
    hydrateShifts();
    track('shift_session_started', { door, level: fromSlug });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timed cues move on by themselves.
  useEffect(() => {
    if (step?.kind !== 'cue') return;
    const timer = setTimeout(next, step.seconds * 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: HALF_BREATH_MS, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: HALF_BREATH_MS, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // "in" / "out" in the light, kept in step with it — started together
  // with the breath above, flipping every half-breath.
  const [inhaling, setInhaling] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => setInhaling((v) => !v), HALF_BREATH_MS);
    return () => clearInterval(timer);
  }, []);


  if (!currentResult || !step) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
        <AmbientGlow />
        <BackLink style={styles.backRow} />
      </View>
    );
  }

  const submitWords = (id: 'gratitude' | 'act' | 'where') => {
    const text = draft.trim();
    if (text) setWords((w) => ({ ...w, [id]: text }));
    setDraft('');
    next();
  };

  const finish = () => {
    addSession({
      at: new Date().toISOString(),
      door,
      readingAt: currentResult.savedAt,
      fromSlug,
      toSlug: toSlugRef.current,
      words,
    });
    track('shift_session_finished', { door, from: fromSlug, to: toSlugRef.current });
    next();
  };

  const showLight = step.kind === 'cue' || step.kind === 'input';

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing[4], paddingBottom: insets.bottom + spacing[6] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AmbientGlow />
      <SessionSound door={door} stage={step.kind === 'return' || step.kind === 'closing' ? step.kind : step.stage} />
      {step.kind !== 'closing' && <BackLink style={styles.backRow} />}

      {showLight && (
        <View style={styles.lightWrap} pointerEvents="none">
          <BreathingLight breath={breath} rgb={rgb} />
          {step.kind === 'cue' && step.breathGuide && (
            <Animated.Text
              key={inhaling ? 'in' : 'out'}
              entering={FadeIn.duration(600)}
              exiting={FadeOut.duration(400)}
              style={styles.breathWord}
            >
              {inhaling ? t('shift.breatheIn') : t('shift.breatheOut')}
            </Animated.Text>
          )}
        </View>
      )}

      {step.kind === 'cue' && (
        <Pressable style={styles.cueArea} onPress={next} accessibilityHint={t('shift.tapToContinue')}>
          <Animated.Text
            key={index}
            entering={FadeIn.duration(900).easing(SOFT_EASE)}
            exiting={FadeOut.duration(500)}
            style={styles.cue}
          >
            {step.text}
          </Animated.Text>
        </Pressable>
      )}

      {step.kind === 'input' && (
        <Animated.View key={index} entering={FadeIn.duration(700).easing(SOFT_EASE)} style={styles.inputArea}>
          <Text style={styles.cue}>{step.prompt}</Text>
          {step.hint && <Text style={styles.hint}>{step.hint}</Text>}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('shift.writePlaceholder')}
            placeholderTextColor={colors.text.faint}
            style={styles.input}
            multiline
            maxLength={280}
          />
          <Pressable
            onPress={() => submitWords(step.id)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{draft.trim() ? t('shift.continue') : t('shift.skip')}</Text>
          </Pressable>
        </Animated.View>
      )}

      {step.kind === 'return' && (
        <Animated.View entering={FadeIn.duration(700).easing(SOFT_EASE)} style={styles.returnArea}>
          <Text style={styles.cue}>{t('shift.returnPrompt')}</Text>
          <ConsciousnessWheel initialSlug={fromSlug} onChange={(slug) => (toSlugRef.current = slug)} />
          <Pressable
            onPress={finish}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t('shift.hereNow')}</Text>
          </Pressable>
        </Animated.View>
      )}

      {step.kind === 'closing' && (
        <Animated.View entering={FadeIn.duration(900).easing(SOFT_EASE)} style={styles.closingArea}>
          {/* What was just done: where the walk started and where the
              person placed themselves (2026-10-14) — the last thing seen
              is their own walk. */}
          <View style={styles.closingMark}>
            <ShiftMark fromSlug={fromSlug} toSlug={toSlugRef.current} />
          </View>
          {philosopher && <Text style={styles.name}>{philosopher.name}</Text>}
          <Text style={styles.cue}>{step.text}</Text>
          {journeyOffer && philosopher && (
            <JourneyOffer
              line={getJourneyOfferLine(philosopher.id, locale)}
              label={t(journeyOffer.labelKey)}
              question={t(journeyOffer.questionKey)}
              onPress={() => {
                track('shift_journey_offer_taken', { journey: journeyOffer.route, level: fromSlug });
                router.dismissTo('/(tabs)/depths');
                router.push(journeyOffer.route as never);
              }}
              styles={styles}
            />
          )}
          {/* The quiet line to help (crisis safety net, 2026-10-10): if
              what was written here said someone may be in danger —
              checked on the phone only, these words never leave it — or,
              more quietly, after a session that began in a heavy state. */}
          {mentionsCrisisOnDevice(words.gratitude, words.act, words.where) ? (
            <CrisisLine kind="crisis" style={styles.closingCrisis} />
          ) : HEAVY_STATES.includes(fromSlug) ? (
            <CrisisLine kind="heavy" style={styles.closingCrisis} />
          ) : null}
          <Pressable
            // Back to Today, past the doors — the chain is complete.
            onPress={() => router.dismissTo('/(tabs)/depths')}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t('shift.done')}</Text>
          </Pressable>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

// One quiet line under the closing, never a button: the Journey that fits
// this state, as the longer version of what was just done. Marked as
// offered when it appears.
function JourneyOffer({
  line,
  label,
  question,
  onPress,
  styles,
}: {
  line: string;
  label: string;
  question: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  useEffect(() => {
    useEngagementStore.getState().markJourneyOffered();
  }, []);
  return (
    <View style={styles.journeyOffer}>
      <Text style={styles.journeyLine}>{line}</Text>
      <Pressable onPress={onPress} accessibilityRole="link" hitSlop={spacing[2]}>
        <Text style={styles.journeyLink}>
          {label} — {question} →
        </Text>
      </Pressable>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base, paddingHorizontal: spacing[6] },
    backRow: { alignSelf: 'flex-start', zIndex: 2 },
    lightWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
    light: { width: LIGHT, height: LIGHT },
    // Under the light, faint — the light carries the rhythm, the word only
    // names it for the first minute.
    breathWord: {
      position: 'absolute',
      top: '50%',
      marginTop: LIGHT / 2 + spacing[2],
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      letterSpacing: 2,
    },
    cueArea: { flex: 1, justifyContent: 'center' },
    cue: {
      color: colors.text.primary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.4,
      textAlign: 'center',
    },
    hint: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * 1.5,
      textAlign: 'center',
      marginTop: spacing[3],
    },
    inputArea: { flex: 1, justifyContent: 'center', gap: spacing[4] },
    input: {
      color: colors.text.primary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.base,
      backgroundColor: colors.bg.elevated,
      borderRadius: radius.md,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[4],
      textAlign: 'center',
      maxHeight: 120,
    },
    returnArea: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[6] },
    closingArea: { flex: 1, justifyContent: 'center', gap: spacing[4] },
    closingCrisis: { alignSelf: 'center' },
    closingMark: { alignItems: 'center', marginBottom: spacing[6] },
    journeyOffer: { alignItems: 'center', gap: spacing[1], marginTop: spacing[4] },
    journeyLine: { color: colors.text.muted, fontFamily: fonts.voice, fontSize: fontSizes.sm, textAlign: 'center' },
    journeyLink: { color: colors.text.secondary, fontFamily: fonts.medium, fontSize: fontSizes.sm, textAlign: 'center' },
    name: { color: colors.text.muted, fontFamily: fonts.medium, fontSize: fontSizes.xs, textAlign: 'center' },
    button: {
      backgroundColor: colors.bg.elevated,
      alignSelf: 'stretch',
      borderRadius: radius.full,
      paddingVertical: spacing[4],
      alignItems: 'center',
      marginTop: spacing[2],
    },
    pressed: { opacity: 0.6 },
    buttonText: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.base },
  });
}
