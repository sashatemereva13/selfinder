import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useThemeColors } from '../../../../src/theme/useThemeColors';
import { useThemeStore } from '../../../../src/store/themeStore';
import type { Colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights, letterSpacings } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { useAppAccentRgb, useAppAccentTextRgb, useAppAccentButtonRgb } from '../../../../src/utils/appAccent';
import { useAuthStore } from '../../../../src/store/authStore';
import { useEngagementStore } from '../../../../src/store/engagementStore';
import { sendMeasureExchange } from '../../../../src/api/chat';
import { submitInterview } from '../../../../src/api/measure';
import { useGuideChatStore } from '../../../../src/store/guideChatStore';
import { buildReadingContext } from '../../../../src/utils/readingContext';
import { QAPair, Sphere } from '../../../../src/types';
import { TypingDots } from '../../../../src/components/shared/TypingDots';
import { AmbientGlow } from '../../../../src/components/shared/AmbientGlow';
import { BackLink } from '../../../../src/components/shared/BackLink';
import { PhilosopherObject } from '../../../../src/components/shared/PhilosopherObject';
import { ScoringOrbs } from '../../../../src/components/depths/ScoringOrbs';
import { track } from '../../../../src/utils/analytics';
import { useWideColumnWidth } from '../../../../src/theme/responsive';

const TOTAL_SPHERES = 4;

// The moment the score comes back used to cut straight from ScoringOrbs
// into Depths' arrival sequence — no beat between "the philosopher is
// thinking" and "the wheel is already spinning." This fades the screen to
// black, holds briefly on black (the beat of stillness — long enough to
// register as a deliberate pause, not a stutter), THEN navigates. Depths
// itself fades in and starts its own spin from there — this screen never
// sees that part, it only owns the exit.
const FADE_OUT_DURATION_MS = 450;
const BLACK_HOLD_MS = 500;

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// Turns that change place (the conversation re-anchoring once it starts,
// new lines pushing older ones up) glide there rather than jumping.
const TURN_LAYOUT = LinearTransition.duration(550).easing(SOFT_EASE);

export default function InterviewScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const markRgb = useAppAccentRgb();
  // Moved from a module-level constant — needs t(), which only works
  // inside a component (hooks can't be called at module scope).
  const SPHERE_LABELS: Record<Sphere, string> = {
    body: t('common.sphereBody'),
    mind: t('common.sphereMind'),
    heart: t('common.sphereHeart'),
    spirit: t('common.sphereSpirit'),
  };
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const authToken = useAuthStore((s) => s.session?.token);
  const { sphereIndex, qaPairs, addQAPair, advanceSphere, goToPreviousSphere, saveResult, resetInterview } =
    useMeasureStore();
  const recordMeasure = useEngagementStore((s) => s.recordMeasure);

  const [input, setInput] = useState('');
  // The answer just sent, shown immediately as the person's own turn while
  // the philosopher's reply is on its way — it used to vanish from the
  // input and reappear only with the reply, ~2s later, all in one jump.
  // Remembers how many exchanges/asides existed when it was sent, so it
  // hides itself in the very render the real exchange (or aside) arrives —
  // never shown twice, never a gap between the two.
  const [pendingAnswer, setPendingAnswer] = useState<{ text: string; qaCount: number; asideCount: number } | null>(null);
  const [acknowledgments, setAcknowledgments] = useState<string[]>([]);
  // Exchanges on the *current* sphere that didn't advance it — the person asked
  // something back or deflected rather than answering. Cleared whenever the
  // sphere actually advances or the interview resets.
  const [asides, setAsides] = useState<{ answer: string; reply: string }[]>([]);
  // A brief note shown after stepping back to a previous sphere (either via
  // the philosopher recognizing the request, or the manual link) — cleared
  // the moment they start typing their revised answer.
  const [goBackNote, setGoBackNote] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [isScoring, setIsScoring] = useState(false);
  const [scoringError, setScoringError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  // Drives the fade-to-black exit — 0 (transparent) until the score comes
  // back, then animated to 1 to cover the screen before navigating away.
  const exitFade = useSharedValue(0);
  // Synchronous guard against double-submission — `isAcknowledging` alone has a
  // gap between calling setState and the re-render that disables the button,
  // during which a rapid double-tap can fire handleSend twice concurrently.
  const isSendingRef = useRef(false);

  const currentQuestion = philosopher?.measureQuestions?.[sphereIndex];
  // Text-safe — every use in this file colors real dialogue/label Text.
  const accentRgb = useAppAccentTextRgb();
  const accentColor = `rgb(${accentRgb})`;
  const accentButtonColor = `rgb(${useAppAccentButtonRgb()})`;
  const columnWidth = useWideColumnWidth();
  // Same "short conversation content on a tall tablet screen" case as
  // Guide's own empty-state fix — before any answer has been given at all,
  // there's only the first question, which flex-end would otherwise pin to
  // the very bottom of the screen with nothing else visible above it.
  const showPending =
    !!pendingAnswer && pendingAnswer.qaCount === qaPairs.length && pendingAnswer.asideCount === asides.length;
  const isBeforeFirstAnswer = qaPairs.length === 0 && asides.length === 0 && !showPending && !isScoring && !scoringError;

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [qaPairs.length, asides.length, isAcknowledging, isScoring]);

  // Shared by the initial submission and a retry — a retry must reuse the
  // pairs already recorded, never re-add the final answer (that already
  // happened before the first submit attempt, regardless of whether it
  // succeeded), or the last sphere ends up duplicated.
  const submitForScoring = async (pairs: QAPair[]) => {
    setIsScoring(true);
    setScoringError(null);
    try {
      const result = await submitInterview(pairs, philosopher?.systemPrompt ?? '', authToken);
      const savedAt = new Date().toISOString();
      const saved = { ...result, qaPairs: pairs, savedAt };
      await saveResult(saved);
      // Measure happens inside the conversation with the philosopher (see
      // RULES.md, "constant presence") — their reflection on this reading
      // joins that conversation as their latest message, alongside the
      // headline Depths shows it as.
      if (philosopher) {
        useGuideChatStore.getState().addReading(philosopher.id, {
          savedAt,
          reflection: result.combinationMessage ?? null,
          context: buildReadingContext(saved),
          measureResultId: result.measureResultId,
        });
      }
      await recordMeasure(result.vibrationScore, result.vibrationLevel.name, savedAt);
      track('measure_completed');
      // Fade to black, hold briefly, then navigate — a fixed pause
      // regardless of how long the request itself took (see
      // BLACK_HOLD_MS's own comment), so the ritual feels the same every
      // time rather than compounding a slow network wait with an
      // additional one on top of it.
      exitFade.value = withTiming(1, { duration: FADE_OUT_DURATION_MS, easing: Easing.in(Easing.quad) });
      await new Promise((resolve) => setTimeout(resolve, FADE_OUT_DURATION_MS + BLACK_HOLD_MS));
      // Back down to the Depths already underneath, not a new copy of it on
      // top: replace() here used to leave an old Depths and an old intro
      // in the stack after every reading, so swiping back after a reading
      // led into stale screens. Depths replays its arrival by rebuilding
      // itself when it comes back into view (see DepthsScreen).
      router.dismissTo('/(tabs)/depths');
    } catch (err) {
      console.error('Measure interview scoring request failed:', err);
      setIsScoring(false);
      setScoringError(t('measure.somethingWentWrong'));
    }
  };

  const handleRetryScoring = () => {
    submitForScoring(qaPairs);
  };

  const handleSend = async () => {
    const answer = input.trim();
    if (!answer || isAcknowledging || !philosopher || !currentQuestion || isSendingRef.current) return;
    isSendingRef.current = true;

    try {
      setInput('');
      setPendingAnswer({ text: answer, qaCount: qaPairs.length, asideCount: asides.length });
      setIsAcknowledging(true);
      setGoBackNote(null);

      let advance = true;
      let goBack = false;
      let reply = '';
      try {
        const exchange = await sendMeasureExchange(
          philosopher,
          currentQuestion.sphere,
          currentQuestion.question,
          answer,
          sphereIndex > 0,
          asides.length
        );
        advance = exchange.advance !== false;
        goBack = exchange.goBack === true;
        reply = exchange.reply ?? '';
      } catch {
        // Fail open — treat as answered so the interview never gets stuck.
      }

      setIsAcknowledging(false);
      setPendingAnswer(null);

      if (goBack) {
        goToPreviousSphere();
        setAcknowledgments((prev) => prev.slice(0, -1));
        setAsides([]);
        setGoBackNote(reply || null);
        return;
      }

      if (!advance) {
        setAsides((prev) => [...prev, { answer, reply }]);
        return;
      }

      addQAPair({ sphere: currentQuestion.sphere, question: currentQuestion.question, answer });
      setAcknowledgments((prev) => [...prev, reply]);
      setAsides([]);

      if (sphereIndex < TOTAL_SPHERES - 1) {
        advanceSphere();
        return;
      }

      const allPairs = [...qaPairs, { sphere: currentQuestion.sphere, question: currentQuestion.question, answer }];
      // The wish used to be a 5th beat here, asked right after spirit —
      // moved to Your Arc's own future section (2026-08-14 collaboration:
      // "the wish technically depends on the user's current feeling, not
      // on their reading... in measure this wish question is a bit out of
      // scope"). Scoring now fires directly once the 4th sphere answer
      // completes, same as spheres 1-3.
      await submitForScoring(allPairs);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleRestart = () => {
    resetInterview();
    setAcknowledgments([]);
    setAsides([]);
    setGoBackNote(null);
    // Back to the intro that's already underneath — replace() used to put
    // a second copy of the intro there, so the next "back" landed on an
    // identical screen.
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/depths/measure');
  };

  const handleGoBackManually = () => {
    if (sphereIndex === 0 || isAcknowledging) return;
    goToPreviousSphere();
    setAcknowledgments((prev) => prev.slice(0, -1));
    setAsides([]);
    setGoBackNote(null);
  };

  const exitFadeStyle = useAnimatedStyle(() => ({ opacity: exitFade.value }));

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing[4] }]}
      // 'undefined' on Android meant no keyboard avoidance ran at all — the
      // keyboard just overlaid the screen, covering the question and the
      // philosopher's reply entirely (confirmed on a real Android device).
      // 'height' is the standard Android equivalent to iOS's 'padding' —
      // Android's own soft-input handling differs enough that 'padding'
      // itself is known to double up with the OS's own resize behavior.
      // No keyboardVerticalOffset — this screen has no fixed header
      // (headerShown: false on the Tabs navigator), so a manual offset
      // just double-compensated on top of KeyboardAvoidingView's own
      // frame measurement, leaving a visible gap between the content and
      // the keyboard on both iOS and Android (confirmed on-device).
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {theme === 'dark' && <AmbientGlow />}

      {/* 2026-09-26 — a back link replaces the old "Start over" button that
          sat right under the input, where a thumb lands. Same effect
          (handleRestart: back to Measure's intro, answers cleared), in the
          place every other screen keeps its way out. */}
      <View style={[styles.header, { width: columnWidth, alignSelf: 'center' }]}>
        <BackLink onPress={handleRestart} style={styles.backLink} />
        {/* Three states, told apart by more than weight (fonts.light and
            fonts.medium are the same file, so "done" and "current" used to
            look identical): still to come = thin and faint, done = plain,
            current = accent with a dot beneath. */}
        <View style={styles.sphereProgress}>
          {(['body', 'mind', 'heart', 'spirit'] as Sphere[]).map((sphere, i) => {
            const isCurrent = i === sphereIndex && !isScoring;
            const isDone = i < qaPairs.length;
            return (
              <View key={sphere} style={styles.sphereStep}>
                <Text
                  style={[
                    styles.sphereLabel,
                    isDone && styles.sphereLabelDone,
                    isCurrent && { color: accentColor, fontFamily: fonts.medium },
                  ]}
                >
                  {SPHERE_LABELS[sphere]}
                </Text>
                <View style={[styles.sphereDot, { backgroundColor: isCurrent ? accentColor : 'transparent' }]} />
              </View>
            );
          })}
        </View>
      </View>

      {sphereIndex > 0 && !isScoring && !scoringError && (
        <Pressable style={styles.previousSphereRow} onPress={handleGoBackManually} disabled={isAcknowledging}>
          <Text style={styles.previousSphereText}>{t('measure.previousSphere')}</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { width: columnWidth, alignSelf: 'center' },
          isBeforeFirstAnswer && styles.scrollContentCenteredEmpty,
        ]}
      >
        {/* 2026-09-26 — one flat, keyed list of turns so the conversation
            unfolds as a sequence rather than jumping: every turn glides to
            its new place (layout), only genuinely new lines fade in
            (entering), and a turn that's already on screen keeps its key
            — the question stays the same element from the moment it's
            asked to the moment it's part of history. The first question's
            large centred version ("-lead") hands over to its chat-sized
            self by dissolving into it the moment an answer is sent. */}
        {qaPairs.map((pair, i) => (
          <Animated.View key={`q-${i}`} layout={TURN_LAYOUT}>
            <Turn color={accentColor} styles={styles}>{pair.question}</Turn>
          </Animated.View>
        )).flatMap((q, i) => [
          q,
          <Animated.View key={`a-${i}`} layout={TURN_LAYOUT}>
            <Turn isUser styles={styles}>{qaPairs[i].answer}</Turn>
          </Animated.View>,
          acknowledgments[i] ? (
            <Animated.View key={`ack-${i}`} layout={TURN_LAYOUT} entering={FadeIn.duration(600).easing(SOFT_EASE)}>
              <Turn color={accentColor} styles={styles}>{acknowledgments[i]}</Turn>
            </Animated.View>
          ) : null,
        ])}

        {isBeforeFirstAnswer && philosopher && currentQuestion && (
          <Animated.View key="presence" style={styles.presence} exiting={FadeOut.duration(350)}>
            <PhilosopherObject id={philosopher.id} rgb={markRgb} size={28} />
            <Text style={[styles.presenceName, { color: accentColor }]}>{philosopher.name}</Text>
          </Animated.View>
        )}

        {!isScoring && !scoringError && currentQuestion && (
          isBeforeFirstAnswer ? (
            <Animated.View key={`q-${sphereIndex}-lead`} exiting={FadeOut.duration(300)}>
              <Turn color={accentColor} styles={styles} lead>{currentQuestion.question}</Turn>
            </Animated.View>
          ) : (
            <Animated.View
              key={`q-${sphereIndex}`}
              layout={TURN_LAYOUT}
              entering={FadeIn.duration(700).delay(qaPairs.length > 0 && !showPending ? 450 : 150).easing(SOFT_EASE)}
            >
              <Turn color={accentColor} styles={styles}>{currentQuestion.question}</Turn>
            </Animated.View>
          )
        )}

        {asides.flatMap((aside, i) => [
          <Animated.View key={`aside-${i}-a`} layout={TURN_LAYOUT}>
            <Turn isUser styles={styles}>{aside.answer}</Turn>
          </Animated.View>,
          aside.reply ? (
            <Animated.View key={`aside-${i}-r`} layout={TURN_LAYOUT} entering={FadeIn.duration(600).easing(SOFT_EASE)}>
              <Turn color={accentColor} styles={styles}>{aside.reply}</Turn>
            </Animated.View>
          ) : null,
        ])}

        {showPending && pendingAnswer && (
          <Animated.View key="pending" layout={TURN_LAYOUT} entering={FadeIn.duration(250)}>
            <Turn isUser styles={styles}>{pendingAnswer.text}</Turn>
          </Animated.View>
        )}

        {isAcknowledging && (
          <View style={styles.typingRow}>
            <TypingDots />
          </View>
        )}

        {isScoring && (
          <View style={styles.scoringBlock}>
            <Text style={[styles.scoringText, { color: accentColor }]}>
              {t('measure.readingYourField', { name: philosopher?.name ?? t('measure.yourPhilosopher') })}
            </Text>
            <ScoringOrbs />
          </View>
        )}

        {scoringError && (
          <View style={styles.scoringErrorBlock}>
            <Text style={styles.errorText}>{scoringError}</Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: accentButtonColor }]}
              onPress={handleRetryScoring}
            >
              <Text style={styles.retryButtonText}>{t('measure.tryAgain')}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {!isScoring && !scoringError && currentQuestion && (
        <View style={[styles.compose, { width: columnWidth, alignSelf: 'center', paddingBottom: insets.bottom + spacing[2] }]}>
          {goBackNote && <Text style={styles.goBackNote}>{goBackNote}</Text>}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (goBackNote) setGoBackNote(null);
              }}
              placeholder={t('measure.inputPlaceholder')}
              placeholderTextColor={colors.text.muted}
              multiline
              editable={!isAcknowledging}
            />
            <Pressable
              style={[styles.sendButton, { backgroundColor: accentButtonColor, opacity: input.trim() && !isAcknowledging ? 1 : 0.4 }]}
              onPress={handleSend}
              disabled={!input.trim() || isAcknowledging}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Transparent until the score comes back, then fades to fully
          opaque and holds briefly before navigating — the "beat of
          stillness" between the philosopher finishing and Depths
          appearing. See submitForScoring/exitFade. */}
      <Animated.View style={[styles.exitFade, exitFadeStyle]} pointerEvents="none" />
    </KeyboardAvoidingView>
  );
}

// No bubble shape, no card — matches Guide's own Turn component (see
// app/guide.tsx): a measure check-in is still a conversation,
// so it reads the same way, not as a separate "quiz" register. Turn-taking
// is carried by alignment and color, not a bordered/filled box. The
// philosopher's line takes the current level color (the one accent this
// screen has, before a reading exists) rather than a fixed tone — this
// used to be the bubble's border color; the visible signal moves from
// border to text since there's no border left to carry it.
function Turn({
  children,
  color,
  isUser,
  lead,
  styles,
}: {
  children: string;
  color?: string;
  isUser?: boolean;
  // The very first question, alone on the screen — larger and centred.
  lead?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Text
      style={[
        styles.turnText,
        isUser ? styles.turnUser : styles.turnPhilosopher,
        !isUser && color ? { color } : null,
        lead ? styles.turnLead : null,
      ]}
    >
      {children}
    </Text>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  exitFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bg.base,
  },
  // No pills/borders — which sphere is current is carried by color/weight
  // alone (muted for not-yet-reached, accent+medium for done or current),
  // the same "position and weight, not a box" register the rest of the app
  // uses (see aesthetic.md's philosopher-picker example).
  header: {
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  backLink: {
    position: 'absolute',
    left: spacing[5],
    top: 0,
    height: 44,
    justifyContent: 'center',
    zIndex: 1,
  },
  sphereProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[4],
  },
  sphereStep: { alignItems: 'center' },
  sphereLabel: {
    color: colors.text.faint,
    fontFamily: fonts.trueLight,
    fontSize: fontSizes.xs,
  },
  sphereLabelDone: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
  },
  sphereDot: { width: 4, height: 4, borderRadius: 2, marginTop: 4 },
  presence: {
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[5],
  },
  presenceName: {
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.wide,
  },
  previousSphereRow: { alignItems: 'center', paddingBottom: spacing[3] },
  previousSphereText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  goBackNote: {
    color: colors.text.muted,
    fontFamily: fonts.voice,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  scroll: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[4],
    gap: spacing[3],
  },
  // Before the first answer only (on every screen size) — the first
  // question sits centred with the philosopher above it; once the
  // conversation starts it anchors to the bottom like any chat.
  scrollContentCenteredEmpty: { justifyContent: 'center' },
  // Turn-taking carried by alignment and color, not a bubble shape — same
  // pattern as Guide's own Turn component (app/guide.tsx),
  // reused here so a Measure check-in reads as the same kind of
  // conversation, not a separate quiz-styled register.
  turnText: {
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.chat,
    letterSpacing: letterSpacings.body,
    maxWidth: '88%',
  },
  // The philosopher's voice — the thin weight (fonts.voice), per the
  // two-layer rule; your own answers stay in the plain weight.
  turnPhilosopher: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    fontFamily: fonts.voice,
    textAlign: 'left',
  },
  turnLead: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.35,
    maxWidth: '100%',
  },
  turnUser: {
    alignSelf: 'flex-end',
    color: colors.text.secondary,
    textAlign: 'right',
  },
  typingRow: { alignSelf: 'flex-start', paddingVertical: spacing[2] },
  scoringBlock: { alignItems: 'center', gap: spacing[4], paddingVertical: spacing[8] },
  scoringText: { fontFamily: fonts.medium, fontSize: fontSizes.md },
  errorText: {
    color: colors.accent.ivory,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    paddingVertical: spacing[3],
  },
  scoringErrorBlock: { alignItems: 'center', gap: spacing[2], paddingVertical: spacing[4] },
  retryButton: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    borderRadius: radius.full,
  },
  retryButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  compose: { paddingHorizontal: spacing[5] },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.bg.border,
    backgroundColor: colors.bg.elevated,
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.lg },
  });
}
