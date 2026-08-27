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
import { JourneyKey, JourneyStage, JourneySessionDTO, AgencySortResult } from '../types';
import { TypingDots } from './TypingDots';
import { AmbientGlow } from './AmbientGlow';
import { useWideColumnWidth, useIsLargeScreen } from '../theme/responsive';

// Generalizes measure/interview.tsx's gated-sequential pattern (see that
// file for the original) into a reusable engine for any Journey's fixed
// STAGE sequence — N stages instead of a hardcoded 4 spheres, and stage
// content read from a per-Journey config instead of a per-philosopher
// one. A stage is a fixed psychological layer (e.g. Control's "object of
// control") that can absorb 1-3+ real conversational turns before its own
// goal is satisfied (2026-08-26 redesign — see backend/controllers/
// journeyController.js's stageComplete decision) — this replaced an
// earlier model where every exchange advanced immediately, which made
// the progress dots (then one per fixed question) never move during a
// long clarifying exchange and read as stalled even when real progress
// was happening. There is no scoring call at the end — onComplete hands
// off to the caller's own reflection screen instead of Measure's
// fade-to-Depths exit.
interface JourneyWizardProps {
  journey: JourneyKey;
  purchaseId: string;
  stages: JourneyStage[];
  // Override for a stage with a non-text answer UI (e.g. Control's agency
  // stage, the agency/influence/authorship sort) — default is the plain
  // TextInput+send compose bar below. Returning null falls back to the
  // default input for that stage. `priorFinalAnswers` is every completed
  // stage's final answer so far, in order (the primitive's own fallback
  // material); `extractedPropositions`, when present, is the AI-cleaned
  // material the primitive should prefer instead.
  renderStageInput?: (
    stage: JourneyStage,
    onSubmit: (answer: string, structuredAnswer?: AgencySortResult) => void,
    priorFinalAnswers: string[],
    extractedPropositions?: string[]
  ) => React.ReactNode | null;
  onComplete: (session: JourneySessionDTO) => void;
}

// One entry in the on-screen transcript — a completed stage's final
// exchange, OR a still-gathering sub-turn within the current stage. Kept
// as one shape so the transcript renders both uniformly; `dotsAdvance`
// distinguishes which kind it was only for internal bookkeeping (not
// rendered), since dots must only move on real stage completions.
interface TranscriptTurn {
  question: string;
  answer: string;
  reply: string | null;
}

export function JourneyWizard({ journey, purchaseId, stages, renderStageInput, onComplete }: JourneyWizardProps) {
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

  const totalStages = stages.length;
  const [loadingSession, setLoadingSession] = useState(true);
  const [stageIndex, setStageIndex] = useState(0);
  // Completed STAGES only — {stageId, question (opening), answer
  // (finalAnswer)}. Drives what's sent as `priorStages` context and what
  // AgencySortPrimitive's fallback material is built from. Distinct from
  // `currentStageTurns` below, which holds this stage's own in-progress
  // sub-turns.
  const [history, setHistory] = useState<{ stageId: string; question: string; answer: string }[]>([]);
  // Every sub-turn asked/answered so far WITHIN the current stage,
  // including ones whose reply was suppressed (shown: false) — kept for
  // resend context (`priorAsideCount`-equivalent) and transcript
  // rendering; reset to [] whenever the stage advances.
  const [currentStageTurns, setCurrentStageTurns] = useState<TranscriptTurn[]>([]);
  const [currentPhrasedQuestion, setCurrentPhrasedQuestion] = useState<string | null>(null);
  const [extractedPropositions, setExtractedPropositions] = useState<string[] | undefined>(undefined);
  const [input, setInput] = useState('');
  const [asides, setAsides] = useState<{ answer: string; reply: string | null }[]>([]);
  const [goBackNote, setGoBackNote] = useState<string | null>(null);
  const [isAcknowledging, setIsAcknowledging] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const isSendingRef = useRef(false);

  const currentStage = stages[stageIndex];
  const isBeforeFirstAnswer = history.length === 0 && currentStageTurns.length === 0 && asides.length === 0 && !loadingSession;

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
        const priorStages = session.stages.filter((s) => s.finalAnswer !== null);
        setHistory(priorStages.map((s) => ({ stageId: s.stageId, question: s.openingQuestion, answer: s.finalAnswer! })));
        setStageIndex(session.currentStageIndex);
        const current = session.stages.find((s) => s.stageIndex === session.currentStageIndex);
        setCurrentPhrasedQuestion(current?.openingQuestion ?? stages[session.currentStageIndex]?.openingQuestion ?? null);
        setExtractedPropositions(current?.extractedPropositions);
        // Sub-turns already recorded on the in-progress current stage
        // (e.g. a grounding exchange before an app restart) — replayed
        // into the transcript so resuming looks identical to never having
        // left.
        setCurrentStageTurns(
          (current?.turns ?? []).map((turn) => ({ question: turn.question, answer: turn.answer, reply: turn.shown ? turn.reply : null }))
        );
      } else {
        setCurrentPhrasedQuestion(stages[0]?.openingQuestion ?? null);
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
  }, [history.length, currentStageTurns.length, asides.length, isAcknowledging]);

  const submitAnswer = async (answer: string, structuredAnswer?: AgencySortResult) => {
    if (!answer.trim() || isAcknowledging || !authToken || !currentStage || isSendingRef.current) return;
    isSendingRef.current = true;

    try {
      setInput('');
      setIsAcknowledging(true);
      setGoBackNote(null);
      setSendError(null);

      const nextStage = stages[stageIndex + 1];
      const askedQuestion = currentPhrasedQuestion ?? currentStage.openingQuestion;

      let exchange;
      try {
        exchange = await sendJourneyExchange(
          {
            purchaseId,
            journey,
            stageIndex,
            stageId: currentStage.id,
            openingQuestion: askedQuestion,
            nextOpeningQuestion: nextStage?.openingQuestion ?? null,
            priorStages: history.map((h) => ({ stageId: h.stageId, question: h.question, answer: h.answer })),
            answer: answer.trim(),
            canGoBack: stageIndex > 0,
            priorAsideCount: asides.length,
            totalStages,
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
        // Going back always returns to the PREVIOUS completed stage — a
        // stage's own internal sub-turns are cleared, not partially
        // rewound, since the fixed opening question is the only
        // re-entry point the wizard needs.
        setStageIndex((i) => Math.max(0, i - 1));
        setHistory((prev) => prev.slice(0, -1));
        setCurrentStageTurns([]);
        setAsides([]);
        setGoBackNote(exchange.reply || null);
        const prevStage = history[history.length - 1];
        setCurrentPhrasedQuestion(prevStage?.question ?? stages[Math.max(0, stageIndex - 1)]?.openingQuestion ?? null);
        return;
      }

      if (!exchange.engaged) {
        setAsides((prev) => [...prev, { answer: answer.trim(), reply: exchange.reply }]);
        if (exchange.nextQuestion) setCurrentPhrasedQuestion(exchange.nextQuestion);
        return;
      }

      if (!exchange.stageComplete) {
        // Still gathering — record as a sub-turn within the CURRENT
        // stage. No dot movement, no stageIndex bump; this is the new
        // third bucket distinct from both a real advance and a true
        // non-engagement aside.
        setCurrentStageTurns((prev) => [
          ...prev,
          { question: askedQuestion, answer: answer.trim(), reply: exchange.showAcknowledgment ? exchange.reply : null },
        ]);
        setAsides([]);
        setCurrentPhrasedQuestion(exchange.nextQuestion ?? askedQuestion);
        return;
      }

      // Stage complete — the answer that satisfied the stage becomes its
      // finalAnswer; every sub-turn asked along the way (including this
      // last one) is folded into the transcript's completed-stage entry
      // implicitly (the completed-stage row itself is the coarse view;
      // full turn-by-turn detail already scrolled by live).
      setHistory((prev) => [...prev, { stageId: currentStage.id, question: askedQuestion, answer: answer.trim() }]);
      setCurrentStageTurns([]);
      setAsides([]);

      if (exchange.isComplete) {
        const session = await getJourneySession(purchaseId, authToken);
        if (session) onComplete(session);
        return;
      }

      setStageIndex((i) => i + 1);
      setCurrentPhrasedQuestion(exchange.nextQuestion ?? nextStage?.openingQuestion ?? null);
      // A fresh session fetch is the simplest reliable way to pick up
      // extractedPropositions the server may have just computed (e.g.
      // when this stage completion was "underlying-need," unlocking the
      // agency stage's propositions) — cheap, and only fires right before
      // a stage transition, never on every keystroke.
      const refreshed = await getJourneySession(purchaseId, authToken);
      const newCurrent = refreshed?.stages.find((s) => s.stageIndex === stageIndex + 1);
      setExtractedPropositions(newCurrent?.extractedPropositions);
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleSend = () => submitAnswer(input);

  const handleGoBackManually = () => {
    if (stageIndex === 0 || isAcknowledging) return;
    setStageIndex((i) => Math.max(0, i - 1));
    setHistory((prev) => prev.slice(0, -1));
    setCurrentStageTurns([]);
    setAsides([]);
    setGoBackNote(null);
    const prevStage = history[history.length - 1];
    setCurrentPhrasedQuestion(prevStage?.question ?? stages[Math.max(0, stageIndex - 1)]?.openingQuestion ?? null);
  };

  if (loadingSession) return null;

  const customInput = currentStage
    ? renderStageInput?.(currentStage, submitAnswer, history.map((h) => h.answer), extractedPropositions)
    : null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {theme === 'dark' && <AmbientGlow />}

      <View style={styles.progressRow}>
        {stages.map((stage, i) => (
          <Text
            key={stage.id}
            style={[
              styles.progressDot,
              // A dot fills only on a real STAGE completion (history),
              // never on a sub-turn within the current stage — this is
              // the fix for dots that never visibly moved during a long
              // clarifying exchange even as real progress happened.
              i < history.length && { color: accentColor, fontFamily: fonts.medium },
              i === stageIndex && { color: accentColor },
            ]}
          >
            •
          </Text>
        ))}
      </View>

      {stageIndex > 0 && (
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
          <View key={`${h.stageId}-${i}`} style={styles.exchange}>
            <Turn color={accentColor} styles={styles}>{h.question}</Turn>
            <Turn isUser styles={styles}>{h.answer}</Turn>
          </View>
        ))}

        {currentStageTurns.map((turn, i) => (
          <View key={`current-${i}`} style={styles.exchange}>
            <Turn color={accentColor} styles={styles}>{turn.question}</Turn>
            <Turn isUser styles={styles}>{turn.answer}</Turn>
            {turn.reply ? <Turn color={accentColor} styles={styles}>{turn.reply}</Turn> : null}
          </View>
        ))}

        {currentStage && currentPhrasedQuestion && (
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

      {currentStage && !customInput && (
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

      {currentStage && customInput}
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
