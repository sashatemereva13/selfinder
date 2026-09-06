import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '../../theme/useThemeColors';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { SavedWish } from '../../api/wish';
import { makeSharedArcPageStyles } from './arcPageShared';

interface WishCrossingPageProps {
  activeWish: SavedWish | null;
  wishComposerOpen: boolean;
  setWishComposerOpen: (open: boolean) => void;
  newWishInput: string;
  setNewWishInput: (v: string) => void;
  newWishSubmitting: boolean;
  newWishRetryOffered: boolean;
  wishFulfillPending: string | null;
  accentRgb: string;
  onSubmitNewWish: () => void;
  onToggleWishFulfilled: (wish: SavedWish) => void;
}

// "What calls you" — the ACTIVE wish, standing on its own (moved off
// Measure, 2026-08-14), plus a WOOP-shaped practice built from it
// (2026-09-03 redesign — see this component's own header comment below
// for the research this replaces).
//
// 2026-09-03: this page used to also hold the Crossing (a philosopher-
// voiced question) and the fulfilled-wishes list — both moved to a new,
// separate CrossingPage.tsx. Two independent reasons drove the split:
// (1) this single page had grown to do the work of what elsewhere in
// the pager is 3-4 separate pages (wish, an exercise, a second exercise,
// a Crossing Q&A, a fulfilled-wishes list, all stacked on one screen —
// flagged in review as the pager's one real density spike); (2) the
// exercise itself needed a real content rework (see below), which was
// the natural moment to also fix the density problem rather than
// patching content into an already-overloaded page.
//
// THE CONTENT REWORK — replacing "try it as if it's already true" +
// 5x repeat-writing with a real WOOP practice (Wish-Outcome-Obstacle-
// Plan, Gabriele Oettingen's mental contrasting with implementation
// intentions research). A research pass (2026-09-03) found the OLD
// exercise's actual shape — a one-time present-tense "as if it's already
// true" rewrite, then hand-copying that same line 5 times, no obstacle,
// no plan — is close to a textbook description of what Oettingen's own
// research specifically studied and found REDUCES effort and energy
// toward a goal: positive fantasy, dwelling in the wish-fulfilled feeling
// with nothing to contrast it against, measurably lowers achievement
// versus mental contrasting (outcome imagined AGAINST a real obstacle).
// The 5x repeat-writing mechanic had no evidence base at all in the
// literature reviewed (the nearest real research, self-affirmation
// theory, is about elaborated writing on core values, not verbatim
// repetition of a fixed sentence, and repeated self-statements that feel
// untrue have been found to backfire for exactly the people most likely
// to need this). The one well-evidenced, currently-MISSING piece was
// Gollwitzer's implementation intentions ("if situation X, then I will
// do Y") — a well-replicated, medium-to-large effect size for actual
// goal attainment.
//
// The WOOP shape below keeps every hard product rule intact: OUTCOME and
// OBSTACLE are the user's own words, never generated, rephrased, or
// supplied by the app (same "the wish is sacred, user-authored material"
// rule the original wish composer already followed); PLAN is a fixed
// sentence FRAME ("If ___, then I will ___") the user fills in, not
// content the app invents. The app never asserts that the plan will
// work, never claims the obstacle is real or true, never diagnoses why
// the obstacle exists — it only offers the structure the research shows
// actually helps, then gets out of the way.
export function WishCrossingPage({
  activeWish,
  wishComposerOpen,
  setWishComposerOpen,
  newWishInput,
  setNewWishInput,
  newWishSubmitting,
  newWishRetryOffered,
  wishFulfillPending,
  accentRgb,
  onSubmitNewWish,
  onToggleWishFulfilled,
}: WishCrossingPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // WOOP's own three steps, entered in order — Outcome, then Obstacle,
  // then Plan (the if/then frame's two blanks). Fully ephemeral by
  // design, same as the exercise this replaces: none of this is sent to
  // the server or persisted across a visit — the practice is the point,
  // not a record of having done it. Resets whenever the active wish
  // itself changes, since the practice is scoped to whichever wish is
  // live now.
  const [woopOpen, setWoopOpen] = useState(false);
  const [outcomeInput, setOutcomeInput] = useState('');
  const [outcomeLine, setOutcomeLine] = useState<string | null>(null);
  const [obstacleInput, setObstacleInput] = useState('');
  const [obstacleLine, setObstacleLine] = useState<string | null>(null);
  const [planIfInput, setPlanIfInput] = useState('');
  const [planThenInput, setPlanThenInput] = useState('');
  const [planSet, setPlanSet] = useState(false);

  useEffect(() => {
    setWoopOpen(false);
    setOutcomeInput('');
    setOutcomeLine(null);
    setObstacleInput('');
    setObstacleLine(null);
    setPlanIfInput('');
    setPlanThenInput('');
    setPlanSet(false);
  }, [activeWish?.id]);

  const handleSetOutcome = () => {
    const text = outcomeInput.trim();
    if (!text) return;
    setOutcomeLine(text);
    setOutcomeInput('');
  };

  const handleSetObstacle = () => {
    const text = obstacleInput.trim();
    if (!text) return;
    setObstacleLine(text);
    setObstacleInput('');
    // Pre-fill the plan's own "if" half with the obstacle just named —
    // the person already said what it is; re-typing it a second time
    // would just be friction, and the "if" half is meant to directly
    // reference the obstacle, not introduce a new one.
    setPlanIfInput(text);
  };

  const handleSetPlan = () => {
    if (!planIfInput.trim() || !planThenInput.trim()) return;
    setPlanSet(true);
  };

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.whatCallsYou')}</Text>
      <View style={sharedStyles.wishSection}>
        {activeWish && !wishComposerOpen && (
          <>
            {/* The active wish is this page's real headline — same
                register WOOP's own step headings use below. */}
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
          <View style={styles.woopInputRow}>
            <TextInput
              style={styles.woopInput}
              value={newWishInput}
              onChangeText={setNewWishInput}
              placeholder={t('measure.wishPlaceholder')}
              placeholderTextColor={colors.text.muted}
              multiline
              editable={!newWishSubmitting}
            />
            <Pressable
              style={[
                styles.woopSendButton,
                { backgroundColor: `rgb(${accentRgb})`, opacity: newWishInput.trim() && !newWishSubmitting ? 1 : 0.4 },
              ]}
              onPress={onSubmitNewWish}
              disabled={!newWishInput.trim() || newWishSubmitting}
            >
              <Text style={styles.woopSendButtonText}>↑</Text>
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

      {/* WOOP — Outcome, Obstacle, Plan, each its own step, only offered
          once a wish exists (this is explicitly about THIS wish, not a
          generic goal-setting tool). Never auto-advances past a step the
          person hasn't actually filled in; each step's own line is
          rendered back to them (their own words, unedited) before the
          next question appears, so the growing WOOP is visible as it
          builds rather than disappearing behind a form. */}
      {activeWish && !wishComposerOpen && (
        <View style={styles.woopSection}>
          {!woopOpen ? (
            <Pressable style={styles.woopInviteRow} onPress={() => setWoopOpen(true)}>
              <Text style={styles.woopInviteText}>{t('yourArc.woopInvite')}</Text>
            </Pressable>
          ) : (
            <>
              {/* OUTCOME */}
              {!outcomeLine ? (
                <>
                  <Text style={sharedStyles.wishHint}>{t('yourArc.woopOutcomeExplain')}</Text>
                  <View style={styles.woopInputRow}>
                    <TextInput
                      style={styles.woopInput}
                      value={outcomeInput}
                      onChangeText={setOutcomeInput}
                      placeholder={t('yourArc.woopOutcomePlaceholder')}
                      placeholderTextColor={colors.text.muted}
                      multiline
                    />
                    <Pressable
                      style={[styles.woopSendButton, { backgroundColor: `rgb(${accentRgb})`, opacity: outcomeInput.trim() ? 1 : 0.4 }]}
                      onPress={handleSetOutcome}
                      disabled={!outcomeInput.trim()}
                    >
                      <Text style={styles.woopSendButtonText}>↑</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.woopStepLabel}>{t('yourArc.woopOutcomeLabel')}</Text>
                  <Text style={styles.woopStepLine}>{outcomeLine}</Text>

                  {/* OBSTACLE */}
                  {!obstacleLine ? (
                    <>
                      <Text style={[sharedStyles.wishHint, styles.woopNextHint]}>{t('yourArc.woopObstacleExplain')}</Text>
                      <View style={styles.woopInputRow}>
                        <TextInput
                          style={styles.woopInput}
                          value={obstacleInput}
                          onChangeText={setObstacleInput}
                          placeholder={t('yourArc.woopObstaclePlaceholder')}
                          placeholderTextColor={colors.text.muted}
                          multiline
                        />
                        <Pressable
                          style={[styles.woopSendButton, { backgroundColor: `rgb(${accentRgb})`, opacity: obstacleInput.trim() ? 1 : 0.4 }]}
                          onPress={handleSetObstacle}
                          disabled={!obstacleInput.trim()}
                        >
                          <Text style={styles.woopSendButtonText}>↑</Text>
                        </Pressable>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text style={[styles.woopStepLabel, styles.woopNextHint]}>{t('yourArc.woopObstacleLabel')}</Text>
                      <Text style={styles.woopStepLine}>{obstacleLine}</Text>

                      {/* PLAN — a fixed if/then FRAME, both blanks filled
                          by the person; the app supplies only the
                          sentence structure the research calls for, never
                          the content of either half. */}
                      {!planSet ? (
                        <>
                          <Text style={[sharedStyles.wishHint, styles.woopNextHint]}>{t('yourArc.woopPlanExplain')}</Text>
                          <View style={styles.planFrameRow}>
                            <Text style={styles.planFrameWord}>{t('yourArc.woopPlanIf')}</Text>
                            <TextInput
                              style={styles.planFrameInput}
                              value={planIfInput}
                              onChangeText={setPlanIfInput}
                              placeholder={t('yourArc.woopPlanIfPlaceholder')}
                              placeholderTextColor={colors.text.muted}
                              multiline
                            />
                          </View>
                          <View style={styles.planFrameRow}>
                            <Text style={styles.planFrameWord}>{t('yourArc.woopPlanThen')}</Text>
                            <TextInput
                              style={styles.planFrameInput}
                              value={planThenInput}
                              onChangeText={setPlanThenInput}
                              placeholder={t('yourArc.woopPlanThenPlaceholder')}
                              placeholderTextColor={colors.text.muted}
                              multiline
                            />
                          </View>
                          <Pressable
                            style={[
                              styles.planSetButton,
                              { opacity: planIfInput.trim() && planThenInput.trim() ? 1 : 0.4 },
                            ]}
                            onPress={handleSetPlan}
                            disabled={!planIfInput.trim() || !planThenInput.trim()}
                          >
                            <Text style={[styles.planSetButtonText, { color: `rgb(${accentRgb})` }]}>
                              {t('yourArc.woopPlanSet')}
                            </Text>
                          </Pressable>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.woopStepLabel, styles.woopNextHint]}>{t('yourArc.woopPlanLabel')}</Text>
                          <Text style={styles.woopStepLine}>
                            {t('yourArc.woopPlanSentence', { obstacle: planIfInput, response: planThenInput })}
                          </Text>
                          <Text style={styles.woopClosingNote}>{t('yourArc.woopClosingNote')}</Text>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
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
    woopSection: { marginBottom: spacing[6] },
    woopInviteRow: { paddingVertical: spacing[1] },
    woopInviteText: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    woopStepLabel: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    woopNextHint: { marginTop: spacing[5] },
    woopStepLine: {
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      marginTop: spacing[2],
    },
    woopClosingNote: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      marginTop: spacing[4],
    },
    woopInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2] },
    woopInput: {
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
    woopSendButton: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    woopSendButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.lg },
    // The if/then frame — a fixed word ("If" / "then I will") beside an
    // inline input, so the sentence structure itself is visibly the
    // app's contribution while both blanks are visibly the person's own.
    planFrameRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing[2], marginTop: spacing[3] },
    planFrameWord: {
      color: colors.text.muted,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      paddingBottom: spacing[3],
    },
    planFrameInput: {
      flex: 1,
      minHeight: 44,
      maxHeight: 100,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.bg.border,
      backgroundColor: colors.bg.elevated,
      color: colors.text.primary,
      fontFamily: fonts.light,
      fontStyle: 'italic',
      fontSize: fontSizes.sm,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    planSetButton: { alignSelf: 'flex-start', marginTop: spacing[4], paddingVertical: spacing[1] },
    planSetButtonText: { fontFamily: fonts.medium, fontSize: fontSizes.sm },
  });
}
