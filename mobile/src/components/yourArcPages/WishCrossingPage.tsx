import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { SavedWish } from '../../api/wish';
import { SavedCrossing } from '../../api/crossing';
import { makeSharedArcPageStyles } from './arcPageShared';

const REPEAT_WRITING_TARGET = 5;

interface WishCrossingPageProps {
  activeWish: SavedWish | null;
  wishComposerOpen: boolean;
  setWishComposerOpen: (open: boolean) => void;
  newWishInput: string;
  setNewWishInput: (v: string) => void;
  newWishSubmitting: boolean;
  newWishRetryOffered: boolean;
  wishFulfillPending: string | null;
  crossing: SavedCrossing | null;
  crossingLoading: boolean;
  crossingAnswerInput: string;
  setCrossingAnswerInput: (v: string) => void;
  crossingSubmitting: boolean;
  fulfilledWishes: SavedWish[];
  philosopherName: string | undefined;
  accentRgb: string;
  onGenerateCrossing: () => void;
  onSubmitCrossingAnswer: () => void;
  onSubmitNewWish: () => void;
  onToggleWishFulfilled: (wish: SavedWish) => void;
}

// "What calls you" — the ACTIVE wish, standing on its own (moved off
// Measure, 2026-08-14), plus the Crossing that builds from it — both
// "present reaching toward future" material, so they share a page.
export function WishCrossingPage({
  activeWish,
  wishComposerOpen,
  setWishComposerOpen,
  newWishInput,
  setNewWishInput,
  newWishSubmitting,
  newWishRetryOffered,
  wishFulfillPending,
  crossing,
  crossingLoading,
  crossingAnswerInput,
  setCrossingAnswerInput,
  crossingSubmitting,
  fulfilledWishes,
  philosopherName,
  accentRgb,
  onGenerateCrossing,
  onSubmitCrossingAnswer,
  onSubmitNewWish,
  onToggleWishFulfilled,
}: WishCrossingPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // "Try it as if it's already true" (2026-08-18) — an explicitly-named
  // EXERCISE, not the app asserting anything as fact: the user writes
  // their OWN present-tense, feeling-based version of their wish, never
  // generated or rephrased by the app. Fully ephemeral by design
  // (2026-08-18 decision): none of this is sent to the server or
  // persisted across a visit. Resets whenever the active wish itself
  // changes, since the practice is scoped to whichever wish is live now.
  const [tryAsTrueOpen, setTryAsTrueOpen] = useState(false);
  const [presentTenseInput, setPresentTenseInput] = useState('');
  const [presentTenseLine, setPresentTenseLine] = useState<string | null>(null);
  const [repeatWritingCount, setRepeatWritingCount] = useState(0);
  const [repeatWritingInput, setRepeatWritingInput] = useState('');

  useEffect(() => {
    setTryAsTrueOpen(false);
    setPresentTenseInput('');
    setPresentTenseLine(null);
    setRepeatWritingCount(0);
    setRepeatWritingInput('');
  }, [activeWish?.id]);

  // Locks in the user's own present-tense line — no moderation call here
  // (unlike the wish itself), since this text is never sent to the
  // server or stored anywhere; it only ever lives in this component's own
  // state for as long as the person is looking at it.
  const handleSetPresentTenseLine = () => {
    const text = presentTenseInput.trim();
    if (!text) return;
    setPresentTenseLine(text);
    setPresentTenseInput('');
  };

  // Each submission just advances the count and clears the input for the
  // next pass — nothing about WHAT was typed is inspected, compared, or
  // kept; only that five separate, real keystroke-by-keystroke passes
  // happened. No fail state, no timer, nothing that could read as a test.
  const handleSubmitRepeatWriting = () => {
    if (!repeatWritingInput.trim()) return;
    setRepeatWritingCount((c) => Math.min(REPEAT_WRITING_TARGET, c + 1));
    setRepeatWritingInput('');
  };

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.whatCallsYou')}</Text>
      <View style={sharedStyles.wishSection}>
        {activeWish && !wishComposerOpen && (
          <>
            {/* The active wish is this page's real headline — what the
                whole page exists to hold — so it gets the same size/color
                register as crossingQuestion below, not the same sm/
                secondary weight as the "change wish" row beneath it. */}
            <Text style={styles.activeWishText}>{activeWish.text}</Text>
            {/* Ticking fulfilled (2026-08-19) — a real, positive claim the
                user makes about their own wish. Reversible — tapping again
                un-ticks. */}
            <Pressable
              style={styles.wishFulfillRow}
              onPress={() => onToggleWishFulfilled(activeWish)}
              disabled={wishFulfillPending === activeWish.id}
            >
              <Text style={styles.wishFulfillText}>
                {activeWish.fulfilledAt ? t('yourArc.wishFulfilledMark') : t('yourArc.markWishFulfilled')}
              </Text>
            </Pressable>
          </>
        )}
        {wishComposerOpen ? (
          <View style={styles.crossingInputRow}>
            <TextInput
              style={styles.crossingInput}
              value={newWishInput}
              onChangeText={setNewWishInput}
              placeholder={t('measure.wishPlaceholder')}
              placeholderTextColor={colors.text.muted}
              multiline
              editable={!newWishSubmitting}
            />
            <Pressable
              style={[
                styles.crossingSendButton,
                { backgroundColor: `rgb(${accentRgb})`, opacity: newWishInput.trim() && !newWishSubmitting ? 1 : 0.4 },
              ]}
              onPress={onSubmitNewWish}
              disabled={!newWishInput.trim() || newWishSubmitting}
            >
              <Text style={styles.crossingSendButtonText}>↑</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={sharedStyles.wishRow} onPress={() => setWishComposerOpen(true)}>
            <Text style={sharedStyles.wishRowText}>
              {activeWish ? t('yourArc.changeWish') : t('measure.wishQuestion')}
            </Text>
          </Pressable>
        )}
        <Text style={[sharedStyles.aside, styles.italicAside]}>{t('measure.wishGroundRule')}</Text>
        {newWishRetryOffered && <Text style={sharedStyles.aside}>{t('measure.wishRetryNote')}</Text>}
      </View>

      {/* "Try it as if it's already true" (2026-08-18) — three states:
          closed (a quiet invite, same row register as the Crossing invite
          below), setting the present-tense line (the user's own words,
          once), then the repeat-writing pass itself (5 fresh, typed
          passes, no score/streak/judgment on how it went). Only offered
          once a wish exists — this is explicitly about THIS wish, not a
          generic affirmation tool. */}
      {activeWish && !wishComposerOpen && (
        <View style={styles.crossingSection}>
          {!tryAsTrueOpen ? (
            <Pressable style={styles.crossingInviteRow} onPress={() => setTryAsTrueOpen(true)}>
              <Text style={styles.crossingInviteText}>{t('yourArc.tryAsTrueInvite')}</Text>
            </Pressable>
          ) : !presentTenseLine ? (
            <>
              <Text style={sharedStyles.wishHint}>{t('yourArc.tryAsTrueExplain')}</Text>
              <View style={styles.crossingInputRow}>
                <TextInput
                  style={styles.crossingInput}
                  value={presentTenseInput}
                  onChangeText={setPresentTenseInput}
                  placeholder={t('yourArc.tryAsTruePlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  multiline
                />
                <Pressable
                  style={[
                    styles.crossingSendButton,
                    { backgroundColor: `rgb(${accentRgb})`, opacity: presentTenseInput.trim() ? 1 : 0.4 },
                  ]}
                  onPress={handleSetPresentTenseLine}
                  disabled={!presentTenseInput.trim()}
                >
                  <Text style={styles.crossingSendButtonText}>↑</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.crossingHeading}>{t('yourArc.repeatWritingLabel')}</Text>
              <Text style={styles.crossingQuestion}>{presentTenseLine}</Text>
              {repeatWritingCount >= REPEAT_WRITING_TARGET ? (
                <>
                  <Text style={sharedStyles.wishHint}>{t('yourArc.repeatWritingDone')}</Text>
                  <Pressable
                    style={sharedStyles.wishRow}
                    onPress={() => {
                      setRepeatWritingCount(0);
                      setPresentTenseLine(null);
                    }}
                  >
                    <Text style={sharedStyles.wishRowText}>{t('yourArc.repeatWritingRestart')}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={sharedStyles.wishHint}>
                    {t('yourArc.repeatWritingHint', { count: repeatWritingCount })}
                  </Text>
                  <View style={styles.crossingInputRow}>
                    <TextInput
                      style={styles.crossingInput}
                      value={repeatWritingInput}
                      onChangeText={setRepeatWritingInput}
                      placeholder={presentTenseLine}
                      placeholderTextColor={colors.text.muted}
                      multiline
                    />
                    <Pressable
                      style={[
                        styles.crossingSendButton,
                        { backgroundColor: `rgb(${accentRgb})`, opacity: repeatWritingInput.trim() ? 1 : 0.4 },
                      ]}
                      onPress={handleSubmitRepeatWriting}
                      disabled={!repeatWritingInput.trim()}
                    >
                      <Text style={styles.crossingSendButtonText}>↑</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </>
          )}
        </View>
      )}

      {/* The Crossing (docs/session-result-concept.md Phase 4) — one
          philosopher-voiced question built from the active wish, offered
          only once it exists and nothing was generated for it yet. Not
          auto-fired on page load — a quiet, named invitation. Generation
          is idempotent per wish+reading pair. */}
      {activeWish && !crossing && (
        <View style={styles.crossingSection}>
          <Pressable style={styles.crossingInviteRow} onPress={onGenerateCrossing} disabled={crossingLoading}>
            <Text style={styles.crossingInviteText}>
              {crossingLoading
                ? t('yourArc.crossingLoading')
                : t('yourArc.crossingInvite', { name: philosopherName ?? '' })}
            </Text>
          </Pressable>
        </View>
      )}

      {crossing && (
        <View style={styles.crossingSection}>
          <Text style={styles.crossingHeading}>
            {t('yourArc.crossingHeading', { name: philosopherName ?? '' })}
          </Text>
          <Text style={styles.crossingQuestion}>{crossing.question}</Text>

          {crossing.answer ? (
            <>
              <Text style={styles.crossingAnsweredLabel}>{t('yourArc.crossingAnsweredLabel')}</Text>
              <Text style={styles.crossingAnswerText}>{crossing.answer}</Text>
              <Text style={styles.crossingSendHint}>{t('yourArc.crossingSendHint')}</Text>
            </>
          ) : (
            <View style={styles.crossingInputRow}>
              <TextInput
                style={styles.crossingInput}
                value={crossingAnswerInput}
                onChangeText={setCrossingAnswerInput}
                placeholder={t('yourArc.crossingPlaceholder')}
                placeholderTextColor={colors.text.muted}
                multiline
                editable={!crossingSubmitting}
              />
              <Pressable
                style={[
                  styles.crossingSendButton,
                  { backgroundColor: `rgb(${accentRgb})`, opacity: crossingAnswerInput.trim() && !crossingSubmitting ? 1 : 0.4 },
                ]}
                onPress={onSubmitCrossingAnswer}
                disabled={!crossingAnswerInput.trim() || crossingSubmitting}
              >
                <Text style={styles.crossingSendButtonText}>↑</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      {/* Fulfilled wishes (2026-08-19) — every wish in allWishes the user
          has ticked, oldest first (savedAt order, not fulfilledAt — this
          reads as "wishes that came true," not a log of ticking
          activity). Only rendered once at least one exists. Each row can
          be un-ticked the same way it was ticked. */}
      {fulfilledWishes.length > 0 && (
        <View style={styles.fulfilledWishesSection}>
          <Text style={sharedStyles.wishHeading}>{t('yourArc.fulfilledWishesHeading')}</Text>
          {fulfilledWishes.map((wish) => (
            <View key={wish.id} style={styles.fulfilledWishRow}>
              <Text style={styles.fulfilledWishText}>{wish.text}</Text>
              <Pressable
                onPress={() => onToggleWishFulfilled(wish)}
                disabled={wishFulfillPending === wish.id}
              >
                <Text style={styles.fulfilledWishUnmark}>{t('yourArc.wishFulfilledMark')}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    kicker: {
      alignSelf: 'flex-start',
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    // 2026-08-29: the active wish is this page's headline content — same
    // register as crossingQuestion below (base/primary/italic) rather
    // than the sm/secondary weight shared by the "change wish" row,
    // ground-rule note, and every other minor row on this page.
    activeWishText: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      marginTop: spacing[2],
    },
    italicAside: { fontStyle: 'italic' },
    wishFulfillRow: { paddingVertical: spacing[1], marginTop: spacing[2] },
    wishFulfillText: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    fulfilledWishesSection: { marginBottom: spacing[6], gap: spacing[3] },
    fulfilledWishRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing[3],
      marginTop: spacing[2],
    },
    fulfilledWishText: {
      flex: 1,
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    fulfilledWishUnmark: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    crossingSection: { marginBottom: spacing[6] },
    crossingInviteRow: { paddingVertical: spacing[1] },
    crossingInviteText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    crossingHeading: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    crossingQuestion: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      marginTop: spacing[2],
      marginBottom: spacing[3],
    },
    crossingAnsweredLabel: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      marginTop: spacing[2],
    },
    crossingAnswerText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[1],
    },
    crossingSendHint: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginTop: spacing[2],
    },
    crossingInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
    crossingInput: {
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
    crossingSendButton: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    crossingSendButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.lg },
  });
}
