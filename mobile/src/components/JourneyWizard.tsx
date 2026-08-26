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
import { useThemeColors } from '../theme/useThemeColors';
import { useThemeStore } from '../store/themeStore';
import type { Colors } from '../theme/colors';
import { fonts, fontSizes, lineHeights, letterSpacings } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { useAuthStore } from '../store/authStore';
import { useAppAccentRgb, useAppAccentButtonRgb } from '../utils/appAccent';
import { sendJourneyExchange, getJourneySession } from '../api/journeys';
import { JourneyKey, JourneySlot, JourneySessionDTO, AgencySortResult } from '../types';
import { TypingDots } from './TypingDots';
import { AmbientGlow } from './AmbientGlow';
import { useWideColumnWidth, useIsLargeScreen } from '../theme/responsive';

// Generalizes measure/interview.tsx's gated-sequential pattern (see that
// file for the original) into a reusable engine for any Journey's fixed
// slot sequence — N slots instead of a hardcoded 4 spheres, and slot
// content read from a per-Journey config instead of a per-philosopher
// one. Unlike Measure, a Journey's AI phrases each slot's question live
// (see backend/controllers/journeyController.js) rather than reacting to
// a static one, and there is no scoring call at the end — onComplete
// hands off to the caller's own reflection screen instead of Measure's
// fade-to-Depths exit.
interface JourneyWizardProps {
  journey: JourneyKey;
  purchaseId: string;
  slots: JourneySlot[];
  // Override for a slot with a non-text answer UI (e.g. Control's slot 7,
  // the agency/influence/authorship sort) — default is the plain
  // TextInput+send compose bar below. Returning null falls back to the
  // default input for that slot. `priorAnswers` is every answer given so
  // far in this session, in order — the primitive's own raw material
  // (e.g. Control's sort presents one chip per prior answer).
  renderSlotInput?: (
    slot: JourneySlot,
    onSubmit: (answer: string, structuredAnswer?: AgencySortResult) => void,
    priorAnswers: string[]
  ) => React.ReactNode | null;
  onComplete: (session: JourneySessionDTO) => void;
}

export function JourneyWizard({ journey, purchaseId, slots, renderSlotInput, onComplete }: JourneyWizardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const authToken = useAuthStore((s) => s.session?.token);
  const accentRgb = useAppAccentRgb();
  const accentColor = `rgb(${accentRgb})`;
  const accentButtonColor = `rgb(${useAppAccentButtonRgb()})`;
  const columnWidth = useWideColumnWidth();
  const isLargeScreen = useIsLargeScreen();

  const totalSlots = slots.length;
  const [loadingSession, setLoadingSession] = useState(true);
  const [slotIndex, setSlotIndex] = useState(0);
  // Completed slots this render — {slotId, question (phrased), answer}.
  // Mirrors measureStore's qaPairs, but kept as component state here
  // since a Journey session's durable copy already lives server-side
  // (see journeySessionStore.ts's own comment on why there's no second
  // local persistence layer to keep in sync).
  const [history, setHistory] = useState<{ slotId: string; question: string; answer: string }[]>([]);
  const [currentPhrasedQuestion, setCurrentPhrasedQuestion] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [acknowledgments, setAcknowledgments] = useState<string[]>([]);
  const [asides, setAsides] = useState<{ answer: string; reply: string }[]>([]);
  const [goBackNote, setGoBackNote] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const isSendingRef = useRef(false);

  const currentSlot = slots[slotIndex];
  const isBeforeFirstAnswer = history.length === 0 && asides.length === 0 && !loadingSession;

  // Resume an in-progress session on mount, or fetch a completed one so
  // its stored answers are available (an app restart between finishing
  // and viewing the reflection would otherwise lose them — component
  // state alone doesn't survive that gap).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!authToken) {
        setLoadingSession(false);
        return;
      }
      const session = await getJourneySession(purchaseId, authToken);
      if (cancelled) return;
      if (session?.completedAt) {
        onComplete(session);
        return;
      }
      if (session) {
        const priorSlots = session.slots.filter((s) => s.answer !== null);
        setHistory(priorSlots.map((s) => ({ slotId: s.slotId, question: s.phrasedQuestion, answer: s.answer! })));
        setAcknowledgments(priorSlots.map(() => ''));
        setSlotIndex(session.currentSlotIndex);
        const current = session.slots.find((s) => s.slotIndex === session.currentSlotIndex);
        setCurrentPhrasedQuestion(current?.phrasedQuestion ?? slots[session.currentSlotIndex]?.question ?? null);
      } else {
        setCurrentPhrasedQuestion(slots[0]?.question ?? null);
      }
      setLoadingSession(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseId, authToken]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [history.length, asides.length, isAcknowledging]);

  const submitAnswer = async (answer: string, structuredAnswer?: AgencySortResult) => {
    if (!answer.trim() || isAcknowledging || !authToken || !currentSlot || isSendingRef.current) return;
    isSendingRef.current = true;

    try {
      setInput('');
      setIsAcknowledging(true);
      setGoBackNote(null);
      setSendError(null);

      const nextSlot = slots[slotIndex + 1];
      const baseQuestion = currentPhrasedQuestion ?? currentSlot.question;

      let exchange;
      try {
        exchange = await sendJourneyExchange(
          {
            purchaseId,
            journey,
            slotIndex,
            slotId: currentSlot.id,
            baseQuestion,
            nextBaseQuestion: nextSlot?.question ?? null,
            priorSlots: history.map((h) => ({ slotId: h.slotId, question: h.question, answer: h.answer })),
            answer: answer.trim(),
            canGoBack: slotIndex > 0,
            priorAsideCount: asides.length,
            totalSlots,
            structuredAnswer,
          },
          authToken
        );
      } catch (err) {
        console.error('Journey exchange request failed:', err);
        setIsAcknowledging(false);
        setSendError(t('journey.somethingWentWrong'));
        return;
      }

      setIsAcknowledging(false);

      if (exchange.goBack) {
        setSlotIndex((i) => Math.max(0, i - 1));
        setHistory((prev) => prev.slice(0, -1));
        setAcknowledgments((prev) => prev.slice(0, -1));
        setAsides([]);
        setGoBackNote(exchange.reply || null);
        const prevSlot = history[history.length - 1];
        setCurrentPhrasedQuestion(prevSlot?.question ?? slots[Math.max(0, slotIndex - 1)]?.question ?? null);
        return;
      }

      if (!exchange.advance) {
        setAsides((prev) => [...prev, { answer: answer.trim(), reply: exchange.reply }]);
        return;
      }

      setHistory((prev) => [...prev, { slotId: currentSlot.id, question: baseQuestion, answer: answer.trim() }]);
      setAcknowledgments((prev) => [...prev, exchange.reply]);
      setAsides([]);

      if (exchange.isComplete) {
        const session = await getJourneySession(purchaseId, authToken);
        if (session) onComplete(session);
        return;
      }

      setSlotIndex((i) => i + 1);
      setCurrentPhrasedQuestion(exchange.nextQuestion ?? nextSlot?.question ?? null);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleSend = () => submitAnswer(input);

  const handleGoBackManually = () => {
    if (slotIndex === 0 || isAcknowledging) return;
    setSlotIndex((i) => Math.max(0, i - 1));
    setHistory((prev) => prev.slice(0, -1));
    setAcknowledgments((prev) => prev.slice(0, -1));
    setAsides([]);
    setGoBackNote(null);
    const prevSlot = history[history.length - 1];
    setCurrentPhrasedQuestion(prevSlot?.question ?? slots[Math.max(0, slotIndex - 1)]?.question ?? null);
  };

  if (loadingSession) return null;

  const customInput = currentSlot
    ? renderSlotInput?.(currentSlot, submitAnswer, history.map((h) => h.answer))
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {theme === 'dark' && <AmbientGlow />}

      <View style={styles.progressRow}>
        {slots.map((slot, i) => (
          <Text
            key={slot.id}
            style={[
              styles.progressDot,
              i < history.length && { color: accentColor, fontFamily: fonts.medium },
              i === slotIndex && { color: accentColor },
            ]}
          >
            •
          </Text>
        ))}
      </View>

      {slotIndex > 0 && (
        <Pressable style={styles.previousSlotRow} onPress={handleGoBackManually} disabled={isAcknowledging}>
          <Text style={styles.previousSlotText}>{t('journey.previousQuestion')}</Text>
        </Pressable>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { width: columnWidth, alignSelf: 'center' },
          isLargeScreen && isBeforeFirstAnswer && styles.scrollContentCenteredEmpty,
        ]}
      >
        {history.map((h, i) => (
          <View key={`${h.slotId}-${i}`} style={styles.exchange}>
            <Turn color={accentColor} styles={styles}>{h.question}</Turn>
            <Turn isUser styles={styles}>{h.answer}</Turn>
            {acknowledgments[i] ? <Turn color={accentColor} styles={styles}>{acknowledgments[i]}</Turn> : null}
          </View>
        ))}

        {currentSlot && currentPhrasedQuestion && (
          <Turn color={accentColor} styles={styles}>{currentPhrasedQuestion}</Turn>
        )}

        {asides.map((aside, i) => (
          <View key={i} style={styles.exchange}>
            <Turn isUser styles={styles}>{aside.answer}</Turn>
            {aside.reply ? <Turn color={accentColor} styles={styles}>{aside.reply}</Turn> : null}
          </View>
        ))}

        {isAcknowledging && (
          <View style={styles.typingRow}>
            <TypingDots />
          </View>
        )}

        {sendError && <Text style={styles.errorText}>{sendError}</Text>}
      </ScrollView>

      {currentSlot && !customInput && (
        <View style={[styles.compose, { width: columnWidth, alignSelf: 'center' }]}>
          {goBackNote && <Text style={styles.goBackNote}>{goBackNote}</Text>}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={(text) => {
                setInput(text);
                if (goBackNote) setGoBackNote(null);
              }}
              placeholder={t('journey.inputPlaceholder')}
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

      {currentSlot && customInput}
    </KeyboardAvoidingView>
  );
}

// Same turn-taking pattern as Guide/Measure's own Turn component —
// alignment and color carry who's speaking, no bubble/card.
function Turn({
  children,
  color,
  isUser,
  styles,
}: {
  children: string;
  color?: string;
  isUser?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Text
      style={[
        styles.turnText,
        isUser ? styles.turnUser : styles.turnPhilosopher,
        !isUser && color ? { color } : null,
      ]}
    >
      {children}
    </Text>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    progressRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing[2],
      paddingTop: spacing[6],
      paddingBottom: spacing[3],
    },
    progressDot: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
    previousSlotRow: { alignItems: 'center', paddingBottom: spacing[3] },
    previousSlotText: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
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
    scrollContentCenteredEmpty: { justifyContent: 'center' },
    exchange: { gap: spacing[3], marginBottom: spacing[3] },
    turnText: {
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.chat,
      letterSpacing: letterSpacings.body,
      maxWidth: '88%',
    },
    turnPhilosopher: { alignSelf: 'flex-start', color: colors.text.primary, textAlign: 'left' },
    turnUser: { alignSelf: 'flex-end', color: colors.text.secondary, textAlign: 'right' },
    typingRow: { alignSelf: 'flex-start', paddingVertical: spacing[2] },
    errorText: {
      color: colors.accent.ivory,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      textAlign: 'center',
      paddingVertical: spacing[3],
    },
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
      fontSize: fontSizes.sm,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    sendButton: { width: 44, height: 44, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
    sendButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.lg },
  });
}
