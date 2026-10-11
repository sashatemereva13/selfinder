import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '../../../theme/useThemeColors';
import type { Colors } from '../../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { SavedWish } from '../../../api/wish';
import { SavedCrossing } from '../../../api/crossing';
import { makeSharedArcPageStyles } from './arcPageShared';

interface CrossingPageProps {
  activeWish: SavedWish | null;
  crossing: SavedCrossing | null;
  crossingLoading: boolean;
  crossingAnswerInput: string;
  setCrossingAnswerInput: (v: string) => void;
  crossingSubmitting: boolean;
  fulfilledWishes: SavedWish[];
  wishFulfillPending: string | null;
  philosopherName: string | undefined;
  accentRgb: string;
  // 2026-09-13, at the user's own request — a Crossing is generated FROM
  // the current reading (handleGenerateCrossing in your-arc-future.tsx
  // needs currentResult.measureResultId, and bails out silently if it's
  // missing). Before this prop existed, the invite row rendered and was
  // tappable purely off `activeWish && !crossing`, with no regard for
  // whether a current reading actually existed — a real, confirmed dead
  // end: someone opening Your Arc without having just measured could tap
  // "Ask {philosopher} about this moment" and nothing would happen, with
  // no error or explanation. This prop lets the invite row itself be
  // honest about that missing precondition instead of failing silently
  // one layer down.
  hasCurrentReading: boolean;
  onGenerateCrossing: () => void;
  onSubmitCrossingAnswer: () => void;
  onToggleWishFulfilled: (wish: SavedWish) => void;
}

// The Crossing (docs/session-result-concept.md Phase 4) — one
// philosopher-voiced question built from the active wish — plus the
// fulfilled-wishes list, split out of WishCrossingPage.tsx (2026-09-03,
// see that file's own header comment for the full reasoning: the old
// single page had grown to do the work of 3-4 separate pages, and this
// half — reaching toward the philosopher, and looking back at what's
// already come true — is a genuinely different job from the wish/WOOP
// page's own "here and what I'm building toward" material).
export function CrossingPage({
  activeWish,
  crossing,
  crossingLoading,
  crossingAnswerInput,
  setCrossingAnswerInput,
  crossingSubmitting,
  fulfilledWishes,
  wishFulfillPending,
  philosopherName,
  accentRgb,
  hasCurrentReading,
  onGenerateCrossing,
  onSubmitCrossingAnswer,
  onToggleWishFulfilled,
}: CrossingPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // 2026-09-13, at the user's own request — this page can render as
  // literally one line (a missing-precondition message, kicker aside)
  // with nothing else: no crossing exists yet AND no fulfilled wishes
  // exist. That's the ONLY state genuinely this sparse — a real crossing
  // (question+answer or the input row) or a fulfilled-wishes list both
  // give the page real, potentially long content that should stay
  // top-anchored like every other page in the pager, not be forced into
  // a short/centered layout. Centering unconditionally would have looked
  // wrong the moment either of those exists.
  const isEmpty = !crossing && fulfilledWishes.length === 0;

  return (
    <ScrollView contentContainerStyle={isEmpty ? sharedStyles.pageCentered : sharedStyles.pageContent}>
      {/* pageCentered's own alignItems:'center' only centers each Text
          element as a block — kicker's own alignSelf:'flex-start' (needed
          for the normal top-anchored pageContent layout) would otherwise
          still pin it to the left edge while everything else centers,
          looking lopsided. Overridden back to center only in the empty
          state; every other page using this kicker style stays
          left-anchored as before. */}
      <Text style={[styles.kicker, isEmpty && styles.kickerCentered]}>
        {t('yourArc.crossingKicker')}
      </Text>

      {activeWish && !crossing && hasCurrentReading && (
        <View style={styles.crossingSection}>
          <Pressable style={styles.crossingInviteRow} onPress={onGenerateCrossing} disabled={crossingLoading}>
            <Text style={[styles.crossingInviteText, isEmpty && styles.centeredText]}>
              {crossingLoading
                ? t('yourArc.crossingLoading')
                : t('yourArc.crossingInvite', { name: philosopherName ?? '' })}
            </Text>
          </Pressable>
        </View>
      )}

      {/* 2026-09-13 — a wish with no current reading used to fall through
          to this same "name a wish" message, which was actively wrong
          (a wish already exists; reading is the missing piece) as well
          as leaving the invite row above rendered-but-silently-dead (see
          this component's own hasCurrentReading prop comment). Now
          distinguishes the two real missing-precondition states instead
          of collapsing them into one generic message. */}
      {!activeWish && (
        <Text style={[sharedStyles.aside, isEmpty && styles.centeredText]}>
          {t('yourArc.crossingNeedsWish')}
        </Text>
      )}
      {activeWish && !crossing && !hasCurrentReading && (
        <Text style={[sharedStyles.aside, isEmpty && styles.centeredText]}>
          {t('yourArc.crossingNeedsReading', { name: philosopherName ?? '' })}
        </Text>
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
      marginBottom: spacing[6],
    },
    // Overrides kicker's own alignSelf/textAlign for the empty/centered
    // layout only (see isEmpty's own comment above the render).
    kickerCentered: { alignSelf: 'center', textAlign: 'center' },
    centeredText: { textAlign: 'center' },
    crossingSection: { marginBottom: spacing[6] },
    crossingInviteRow: { paddingVertical: spacing[1] },
    crossingInviteText: {
      color: colors.text.secondary,
      fontFamily: fonts.voice,
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
      fontFamily: fonts.voice,
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
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    fulfilledWishUnmark: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
  });
}
