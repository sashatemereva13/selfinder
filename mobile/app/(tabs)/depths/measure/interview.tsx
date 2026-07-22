import { useEffect, useRef, useState } from 'react';
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
import { colors } from '../../../../src/theme/colors';
import { fonts, fontSizes, lineHeights } from '../../../../src/theme/typography';
import { spacing, radius } from '../../../../src/theme/spacing';
import { usePhilosopherStore } from '../../../../src/store/philosopherStore';
import { useMeasureStore } from '../../../../src/store/measureStore';
import { useAuthStore } from '../../../../src/store/authStore';
import { sendMeasureExchange } from '../../../../src/api/chat';
import { submitInterview } from '../../../../src/api/measure';
import { QAPair, Sphere } from '../../../../src/types';
import { TypingDots } from '../../../../src/components/TypingDots';
import { AmbientGlow } from '../../../../src/components/AmbientGlow';
import { ScoringOrbs } from '../../../../src/components/ScoringOrbs';

const SPHERE_LABELS: Record<Sphere, string> = {
  body: 'Body', mind: 'Mind', heart: 'Heart', spirit: 'Spirit',
};
const TOTAL_SPHERES = 4;

export default function InterviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const authToken = useAuthStore((s) => s.session?.token);
  const { sphereIndex, qaPairs, addQAPair, advanceSphere, goToPreviousSphere, saveResult, resetInterview } =
    useMeasureStore();

  const [input, setInput] = useState('');
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
  // Synchronous guard against double-submission — `isAcknowledging` alone has a
  // gap between calling setState and the re-render that disables the button,
  // during which a rapid double-tap can fire handleSend twice concurrently.
  const isSendingRef = useRef(false);

  const currentQuestion = philosopher?.measureQuestions?.[sphereIndex];
  const accentColor = philosopher?.color ?? colors.brand.purple;

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
      await saveResult({ ...result, savedAt: new Date().toISOString() });
      router.replace('/(tabs)/depths/measure/reveal');
    } catch (err) {
      console.error('Measure interview scoring request failed:', err);
      setIsScoring(false);
      setScoringError('Something went wrong reading your field.');
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
          sphereIndex > 0
        );
        advance = exchange.advance !== false;
        goBack = exchange.goBack === true;
        reply = exchange.reply ?? '';
      } catch {
        // Fail open — treat as answered so the interview never gets stuck.
      }

      setIsAcknowledging(false);

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
    router.replace('/(tabs)/depths/measure');
  };

  const handleGoBackManually = () => {
    if (sphereIndex === 0 || isAcknowledging) return;
    goToPreviousSphere();
    setAcknowledgments((prev) => prev.slice(0, -1));
    setAsides([]);
    setGoBackNote(null);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { paddingTop: insets.top + spacing[4] }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <AmbientGlow />

      <View style={styles.sphereProgress}>
        {(['body', 'mind', 'heart', 'spirit'] as Sphere[]).map((sphere, i) => (
          <View
            key={sphere}
            style={[
              styles.sphereDot,
              i < qaPairs.length && { backgroundColor: accentColor, borderColor: accentColor },
              i === sphereIndex && { borderColor: accentColor },
            ]}
          >
            <Text style={styles.sphereDotLabel}>{SPHERE_LABELS[sphere]}</Text>
          </View>
        ))}
      </View>

      {sphereIndex > 0 && !isScoring && !scoringError && (
        <Pressable style={styles.previousSphereRow} onPress={handleGoBackManually} disabled={isAcknowledging}>
          <Text style={styles.previousSphereText}>← Previous sphere</Text>
        </Pressable>
      )}

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {qaPairs.map((pair, i) => (
          <View key={pair.sphere} style={styles.exchange}>
            <Bubble color={accentColor}>{pair.question}</Bubble>
            <Bubble isUser>{pair.answer}</Bubble>
            {acknowledgments[i] ? (
              <Bubble color={accentColor}>{acknowledgments[i]}</Bubble>
            ) : null}
          </View>
        ))}

        {!isScoring && !scoringError && currentQuestion && (
          <Bubble color={accentColor}>{currentQuestion.question}</Bubble>
        )}

        {asides.map((aside, i) => (
          <View key={i} style={styles.exchange}>
            <Bubble isUser>{aside.answer}</Bubble>
            {aside.reply ? <Bubble color={accentColor}>{aside.reply}</Bubble> : null}
          </View>
        ))}

        {isAcknowledging && (
          <View style={[styles.bubble, styles.bubblePhilosopher, styles.typingBubble, { borderColor: accentColor }]}>
            <TypingDots />
          </View>
        )}

        {isScoring && (
          <View style={styles.scoringBlock}>
            <Text style={[styles.scoringText, { color: accentColor }]}>
              {philosopher?.name ?? 'Your philosopher'} is reading your field…
            </Text>
            <ScoringOrbs />
          </View>
        )}

        {scoringError && (
          <View style={styles.scoringErrorBlock}>
            <Text style={styles.errorText}>{scoringError}</Text>
            <Pressable
              style={[styles.retryButton, { backgroundColor: accentColor }]}
              onPress={handleRetryScoring}
            >
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {!isScoring && !scoringError && currentQuestion && (
        <View style={styles.compose}>
          {goBackNote && <Text style={styles.goBackNote}>{goBackNote}</Text>}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (goBackNote) setGoBackNote(null);
              }}
              placeholder="Type your answer, or ask why…"
              placeholderTextColor={colors.text.muted}
              multiline
              editable={!isAcknowledging}
            />
            <Pressable
              style={[styles.sendButton, { backgroundColor: accentColor, opacity: input.trim() && !isAcknowledging ? 1 : 0.4 }]}
              onPress={handleSend}
              disabled={!input.trim() || isAcknowledging}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable style={styles.restartButton} onPress={handleRestart}>
        <Text style={styles.restartText}>Start over</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

function Bubble({ children, color, isUser }: { children: string; color?: string; isUser?: boolean }) {
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.bubbleUser : styles.bubblePhilosopher,
        !isUser && color ? { borderColor: color } : null,
      ]}
    >
      <Text style={styles.bubbleText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  sphereProgress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing[3],
    paddingBottom: spacing[3],
  },
  sphereDot: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  sphereDotLabel: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  previousSphereRow: { alignItems: 'center', paddingBottom: spacing[3] },
  previousSphereText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  goBackNote: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
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
  exchange: { gap: spacing[2], marginBottom: spacing[2] },
  bubble: {
    maxWidth: '85%',
    borderRadius: radius.lg,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
  },
  bubblePhilosopher: {
    alignSelf: 'flex-start',
    backgroundColor: colors.bg.elevated,
    borderWidth: 1,
    borderColor: colors.bg.border,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: colors.bg.surface,
  },
  bubbleText: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.base,
    lineHeight: fontSizes.base * lineHeights.normal,
  },
  typingBubble: { minWidth: 52, paddingVertical: spacing[4] },
  scoringBlock: { alignItems: 'center', gap: spacing[4], paddingVertical: spacing[8] },
  scoringText: { fontFamily: fonts.medium, fontSize: fontSizes.md },
  errorText: {
    color: colors.brand.purple,
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
  retryButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  compose: { paddingHorizontal: spacing[5], paddingBottom: spacing[2] },
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
    fontSize: fontSizes.base,
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
  sendButtonText: { color: colors.bg.base, fontFamily: fonts.medium, fontSize: fontSizes.lg },
  restartButton: { alignItems: 'center', paddingVertical: spacing[4] },
  restartText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.sm },
});
