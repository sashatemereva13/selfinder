import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useThemeColors } from '../../../theme/useThemeColors';
import type { Colors } from '../../../theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../../../theme/typography';
import { spacing, radius } from '../../../theme/spacing';
import { SavedWish } from '../../../api/wish';
import { JourneyKey } from '../../../types';
import { Locale } from '../../../store/localeStore';
import { WishPromptEntry } from '../../../content/wishPrompts';
import { JOURNEY_LABEL_KEYS } from './JourneysPage';
import { makeSharedArcPageStyles } from './arcPageShared';
import { WishPromptBankPage } from './WishPromptBankPage';

// 2026-09-13 — the wish is now assembled from named parts in one staged
// flow instead of a single free-text box with WOOP as a separate,
// optional exercise bolted on afterward. 'closed' = composer not open;
// 'wish' = entering/editing the wish text itself (unchanged — still its
// own first step, not collapsed into Outcome, since Wish.text is what
// every other system depends on and a wish isn't always naturally
// outcome-shaped); 'outcome'/'obstacle'/'plan' = the WOOP sequence,
// entered in order. Nothing is actually saved to the server until the
// end of 'plan' or an explicit skip-to-save at any stage (see
// your-arc-future.tsx's own handleSaveWish/handleSkipToSave) — WOOP must
// never gate the real save, a wish stays "sacred, always savable in its
// own right" regardless of how far through WOOP someone gets.
export type WishComposerStage = 'closed' | 'wish' | 'outcome' | 'obstacle' | 'plan';

interface WishCrossingPageProps {
  locale: Locale;
  activeWish: SavedWish | null;
  composerStage: WishComposerStage;
  setComposerStage: (stage: WishComposerStage) => void;
  newWishInput: string;
  setNewWishInput: (v: string) => void;
  newWishSubmitting: boolean;
  newWishRetryOffered: boolean;
  wishFulfillPending: string | null;
  accentRgb: string;
  // Text-safe variant — this page's "Set the plan" link is bare Text on
  // the page background (no fill), unlike accentRgb's other uses here
  // (send-button fills, which pair with a fixed onAccent-style text color
  // instead and don't need this).
  accentTextRgb: string;
  // Skip-to-save — available at EVERY stage of the assembled flow (see
  // WishComposerStage's own comment above for why this must never be
  // gated on WOOP completion). Saves the wish text plus whatever WOOP
  // has been committed so far (possibly none).
  onSkipToSave: () => void;
  onToggleWishFulfilled: (wish: SavedWish) => void;
  // 2026-09-12, at the user's own request — a quiet Tune In invite before
  // the WOOP invite (see this file's own WOOP section comment below for
  // why). Tune In only exists as one real screen (its own player/state,
  // app/(tabs)/depths/tunein/index.tsx) — no lightweight embeddable
  // version exists anywhere in the app — so this stays a plain
  // navigation callback, same "page stays navigation-agnostic, parent
  // owns the router" pattern FactsPage's own onPressCenter already uses,
  // rather than this page reaching for expo-router directly.
  onPressTuneIn: () => void;
  // 2026-09-13, at the user's own request — a completed Journey's own
  // "arrived" answer (its last stage's finalAnswer), offered as an
  // optional starting point when opening the wish composer with no
  // active wish yet. Null when no completed Journey exists, or its
  // arrived stage has no finalAnswer. This is the person's OWN words
  // from a Journey they already did, offered back to them as a possible
  // wish — never auto-filled/submitted, never presented as the app's own
  // claim about what they want (see onUseJourneySuggestion below for the
  // actual insertion behavior). No "already used" tracking — see
  // your-arc-future.tsx's own journeySuggestion comment for why.
  journeySuggestion: { journey: JourneyKey; answer: string } | null;
  // Fired only when the person actually taps the suggestion to use it
  // (not on render) — analytics-only signal, kept as its own callback
  // rather than folded into a submit handler so it's not conflated with
  // every wish submission, most of which won't have come from a
  // suggestion at all.
  onUseJourneySuggestion: () => void;
  // Fired only when a prompt from the bank is actually tapped-to-use
  // (not just when the bank is opened/browsed) — same analytics-only
  // pattern as onUseJourneySuggestion above, kept separate since most
  // wishes won't come from either source.
  onUsePromptBank: () => void;
  // WOOP's own state — lifted up into your-arc-future.tsx (see Phase 1's
  // own comment history) so the parent's handleSaveWish can actually
  // read and persist it. This component stays a pure prop-driven view.
  outcomeInput: string;
  setOutcomeInput: (v: string) => void;
  outcomeLine: string | null;
  onSetOutcome: () => void;
  obstacleInput: string;
  setObstacleInput: (v: string) => void;
  obstacleLine: string | null;
  onSetObstacle: () => void;
  planIfInput: string;
  setPlanIfInput: (v: string) => void;
  planThenInput: string;
  setPlanThenInput: (v: string) => void;
  planSet: boolean;
  onSetPlan: () => void;
  // Distinct from onSetPlan — this is "set the plan AND save the wish in
  // one action," the actual end-of-flow button once Plan's own two
  // blanks are filled in (see your-arc-future.tsx's own comment on why
  // this needs to be a single combined action rather than two sequential
  // calls: planSet's own state hasn't flushed by the time a second call
  // in the same handler would read it).
  onSetPlanAndSave: () => void;
  // Derived in the parent from the same fields above (outcomeLine ||
  // obstacleLine || planSet) — passed down rather than recomputed here,
  // since the parent also needs it for the same discard-confirm decision
  // this component's own "change wish" flow makes.
  hasWoopProgress: boolean;
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
  locale,
  activeWish,
  composerStage,
  setComposerStage,
  newWishInput,
  setNewWishInput,
  newWishSubmitting,
  newWishRetryOffered,
  wishFulfillPending,
  accentRgb,
  accentTextRgb,
  onSkipToSave,
  onToggleWishFulfilled,
  onPressTuneIn,
  journeySuggestion,
  onUseJourneySuggestion,
  onUsePromptBank,
  outcomeInput,
  setOutcomeInput,
  outcomeLine,
  onSetOutcome,
  obstacleInput,
  setObstacleInput,
  obstacleLine,
  onSetObstacle,
  planIfInput,
  setPlanIfInput,
  planThenInput,
  setPlanThenInput,
  planSet,
  onSetPlan,
  onSetPlanAndSave,
  hasWoopProgress,
}: WishCrossingPageProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const sharedStyles = useMemo(() => makeSharedArcPageStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const composerOpen = composerStage !== 'closed';
  // Local, UI-only navigation state — unlike composerStage (which the
  // parent needs to drive handleSaveWish), nothing outside this
  // component ever needs to know the bank is open, so it isn't lifted.
  const [promptBankOpen, setPromptBankOpen] = useState(false);

  // 2026-09-13 — see hasWoopProgress's own comment on its own prop above.
  // A plain native confirm rather than a custom dialog — this is a
  // one-off, low-frequency moment (only reachable when real WOOP
  // progress already exists AND someone is actively changing to a
  // different wish), not worth a bespoke UI, and Alert.alert is already
  // the app's own pattern for a blocking yes/no confirmation elsewhere
  // in the codebase. Advances to 'outcome' rather than saving directly —
  // saving now only ever happens at the true end of the flow or via
  // skip (see onSkipToSave), never the moment wish text alone is
  // entered.
  const handleWishNextPress = () => {
    if (!hasWoopProgress) {
      setComposerStage('outcome');
      return;
    }
    Alert.alert(
      t('yourArc.woopDiscardTitle'),
      t('yourArc.woopDiscardMessage'),
      [
        { text: t('yourArc.woopDiscardCancel'), style: 'cancel' },
        { text: t('yourArc.woopDiscardConfirm'), style: 'destructive', onPress: () => setComposerStage('outcome') },
      ],
    );
  };

  if (promptBankOpen) {
    return (
      <WishPromptBankPage
        locale={locale}
        onClose={() => setPromptBankOpen(false)}
        onPickPrompt={(prompt: WishPromptEntry) => {
          setNewWishInput(prompt.text[locale] ?? prompt.text.en);
          setPromptBankOpen(false);
          onUsePromptBank();
        }}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={sharedStyles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.whatCallsYou')}</Text>
      <View style={sharedStyles.wishSection}>
        {activeWish && composerStage === 'closed' && (
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
            {/* Once a WOOP already exists for this wish, show it read-only
                below the wish itself — reaching this page again shouldn't
                lose sight of work already done, even though re-EDITING an
                already-saved WOOP isn't offered yet (see setWishWoop/PATCH
                on the backend for a future entry point into that). */}
            {activeWish.woop && (
              <View style={styles.savedWoopSection}>
                <Text style={styles.woopStepLabel}>{t('yourArc.woopOutcomeLabel')}</Text>
                <Text style={styles.woopStepLine}>{activeWish.woop.outcome}</Text>
                <Text style={[styles.woopStepLabel, styles.woopNextHint]}>{t('yourArc.woopObstacleLabel')}</Text>
                <Text style={styles.woopStepLine}>{activeWish.woop.obstacle}</Text>
                <Text style={[styles.woopStepLabel, styles.woopNextHint]}>{t('yourArc.woopPlanLabel')}</Text>
                <Text style={styles.woopStepLine}>
                  {t('yourArc.woopPlanSentence', { obstacle: activeWish.woop.planIf, response: activeWish.woop.planThen })}
                </Text>
              </View>
            )}
          </>
        )}
        {composerStage === 'wish' ? (
          <>
            <View style={styles.woopInputRow}>
              <TextInput
                style={styles.woopInput}
                value={newWishInput}
                onChangeText={setNewWishInput}
                placeholder={t('measure.wishPlaceholder')}
                placeholderTextColor={colors.text.muted}
                multiline
                editable={!newWishSubmitting}
                autoFocus
              />
              <Pressable
                style={[
                  styles.woopSendButton,
                  { backgroundColor: `rgb(${accentRgb})`, opacity: newWishInput.trim() ? 1 : 0.4 },
                ]}
                onPress={handleWishNextPress}
                disabled={!newWishInput.trim()}
              >
                <Text style={styles.woopSendButtonText}>↑</Text>
              </Pressable>
            </View>
            {/* 2026-09-13 — see this page's own journeySuggestion prop
                comment. Only offered while composing a genuinely NEW wish
                (no activeWish yet) with nothing typed yet — once real
                words exist in the input, or an active wish already
                exists, this has nothing useful left to add. Tapping it
                fills the input with the Journey's own answer, still
                fully editable and NOT submitted — same "the wish is
                sacred, user-authored material" rule the WOOP section's
                own header comment already states; offering a starting
                point is not the same as supplying the wish itself, and
                the person can freely change or clear it before sending. */}
            {!activeWish && !newWishInput && journeySuggestion && (
              <Pressable
                style={styles.journeySuggestionRow}
                onPress={() => {
                  setNewWishInput(journeySuggestion.answer);
                  onUseJourneySuggestion();
                }}
              >
                <Text style={styles.journeySuggestionLabel}>
                  {t('yourArc.wishFromJourneyLabel', {
                    journey: t(JOURNEY_LABEL_KEYS[journeySuggestion.journey] ?? journeySuggestion.journey),
                  })}
                </Text>
                <Text style={styles.journeySuggestionText}>{`"${journeySuggestion.answer}"`}</Text>
              </Pressable>
            )}
            {/* 2026-09-13, at the user's own request (inspired by The
                School of Life's "What Do I Really Want to Achieve?" card
                set) — a curated bank of pre-written ambitions to
                recognize from, offered alongside the Journey suggestion
                above with the same gating (only while composing fresh,
                nothing typed yet). See WishPromptBankPage's own header
                comment for why this is a full browsable list rather than
                Cards' own single-random-draw pattern. */}
            {!activeWish && !newWishInput && (
              <Pressable style={styles.promptBankInviteRow} onPress={() => setPromptBankOpen(true)}>
                <Text style={styles.promptBankInviteText}>{t('yourArc.wishPromptBankInvite')}</Text>
              </Pressable>
            )}
          </>
        ) : null}
        {composerStage === 'closed' && (
          <Pressable style={sharedStyles.wishRow} onPress={() => setComposerStage('wish')}>
            <Text style={sharedStyles.wishRowText}>
              {activeWish ? t('yourArc.changeWish') : t('measure.wishQuestion')}
            </Text>
          </Pressable>
        )}
        <Text style={[sharedStyles.aside, styles.voiceAside]}>{t('measure.wishGroundRule')}</Text>
        {newWishRetryOffered && <Text style={sharedStyles.aside}>{t('measure.wishRetryNote')}</Text>}
      </View>

      {/* WOOP — Outcome, Obstacle, Plan, now the composer's own middle
          steps (2026-09-13 — previously a separate, optional exercise
          offered only once a wish already existed; see this file's own
          top-of-file header comment for the full "assembled from parts"
          redesign). Never auto-advances past a step the person hasn't
          actually filled in; each step's own line is rendered back to
          them (their own words, unedited) before the next question
          appears, so the growing WOOP is visible as it builds rather
          than disappearing behind a form. A skip-to-save row sits at
          every stage — WOOP is never a gate on the actual save. */}
      {(composerStage === 'outcome' || composerStage === 'obstacle' || composerStage === 'plan') && (
        <View style={styles.woopSection}>
          {/* The wish text itself, echoed read-only for context above
              each WOOP step — never re-editable from here (going back
              would need discarding forward progress, out of scope for
              this pass) and never rephrased. */}
          <Text style={styles.woopStepLabel}>{t('yourArc.whatCallsYou')}</Text>
          <Text style={styles.woopStepLine}>{newWishInput}</Text>

          {/* 2026-09-12, at the user's own request — a quiet Tune In
              invite before the OUTCOME step specifically (the natural
              first pause point once a wish is named), same row weight/
              register as before. A soft suggestion, not a gate. */}
          {composerStage === 'outcome' && !outcomeLine && (
            <Pressable style={styles.tuneInInviteRow} onPress={onPressTuneIn}>
              <Text style={styles.tuneInInviteText}>{t('yourArc.tuneInBeforeWoopInvite')}</Text>
            </Pressable>
          )}

          {/* OUTCOME */}
          {composerStage === 'outcome' && (
            <>
              <Text style={[sharedStyles.wishHint, styles.woopNextHint]}>{t('yourArc.woopOutcomeExplain')}</Text>
              <View style={styles.woopInputRow}>
                <TextInput
                  style={styles.woopInput}
                  value={outcomeInput}
                  onChangeText={setOutcomeInput}
                  placeholder={t('yourArc.woopOutcomePlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  multiline
                  autoFocus
                />
                <Pressable
                  style={[styles.woopSendButton, { backgroundColor: `rgb(${accentRgb})`, opacity: outcomeInput.trim() ? 1 : 0.4 }]}
                  onPress={onSetOutcome}
                  disabled={!outcomeInput.trim()}
                >
                  <Text style={styles.woopSendButtonText}>↑</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* OBSTACLE — outcomeLine is always set by the time this stage
              is reached (onSetOutcome sets it before advancing the
              stage), so echoing it here is always safe. */}
          {composerStage === 'obstacle' && (
            <>
              <Text style={styles.woopStepLabel}>{t('yourArc.woopOutcomeLabel')}</Text>
              <Text style={styles.woopStepLine}>{outcomeLine}</Text>
              <Text style={[sharedStyles.wishHint, styles.woopNextHint]}>{t('yourArc.woopObstacleExplain')}</Text>
              <View style={styles.woopInputRow}>
                <TextInput
                  style={styles.woopInput}
                  value={obstacleInput}
                  onChangeText={setObstacleInput}
                  placeholder={t('yourArc.woopObstaclePlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  multiline
                  autoFocus
                />
                <Pressable
                  style={[styles.woopSendButton, { backgroundColor: `rgb(${accentRgb})`, opacity: obstacleInput.trim() ? 1 : 0.4 }]}
                  onPress={onSetObstacle}
                  disabled={!obstacleInput.trim()}
                >
                  <Text style={styles.woopSendButtonText}>↑</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* PLAN — a fixed if/then FRAME, both blanks filled by the
              person; the app supplies only the sentence structure the
              research calls for, never the content of either half. The
              send action here both sets the plan AND saves the wish in
              one step (onSetPlanAndSave) — this is the true end of the
              assembled flow, not a step with more after it. */}
          {composerStage === 'plan' && (
            <>
              <Text style={styles.woopStepLabel}>{t('yourArc.woopOutcomeLabel')}</Text>
              <Text style={styles.woopStepLine}>{outcomeLine}</Text>
              <Text style={[styles.woopStepLabel, styles.woopNextHint]}>{t('yourArc.woopObstacleLabel')}</Text>
              <Text style={styles.woopStepLine}>{obstacleLine}</Text>
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
                  { opacity: planIfInput.trim() && planThenInput.trim() && !newWishSubmitting ? 1 : 0.4 },
                ]}
                onPress={onSetPlanAndSave}
                disabled={!planIfInput.trim() || !planThenInput.trim() || newWishSubmitting}
              >
                <Text style={[styles.planSetButtonText, { color: `rgb(${accentTextRgb})` }]}>
                  {newWishSubmitting ? t('yourArc.woopSaving') : t('yourArc.woopPlanSetAndSave')}
                </Text>
              </Pressable>
            </>
          )}

          {/* Skip-to-save — available at every WOOP stage, never gates
              the real save behind exercise completion. */}
          <Pressable
            style={styles.skipToSaveRow}
            onPress={onSkipToSave}
            disabled={newWishSubmitting}
          >
            <Text style={styles.skipToSaveText}>{t('yourArc.woopSkipToSave')}</Text>
          </Pressable>
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
      fontFamily: fonts.voice,
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * lineHeights.normal,
      marginTop: spacing[2],
    },
    voiceAside: { fontFamily: fonts.voice },
    wishFulfillRow: { paddingVertical: spacing[1], marginTop: spacing[2] },
    wishFulfillText: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
    },
    // A quieter register than the wish composer itself (this is an
    // optional suggestion, not the wish being composed) — label names
    // where it came from, text shows the actual offered words quoted, so
    // it reads as "here's something you already said" rather than the
    // app inventing a wish.
    journeySuggestionRow: { paddingVertical: spacing[2], marginTop: spacing[2] },
    journeySuggestionLabel: {
      color: colors.text.muted,
      fontFamily: fonts.medium,
      fontSize: fontSizes.xs,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
    },
    journeySuggestionText: {
      color: colors.text.secondary,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
      marginTop: spacing[1],
    },
    // Same quiet, single-line register as tuneInInviteRow — an optional
    // suggestion, not a second competing primary action next to the
    // wish input's own send button.
    promptBankInviteRow: { paddingVertical: spacing[2] },
    promptBankInviteText: {
      color: colors.text.muted,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    woopSection: { marginBottom: spacing[6] },
    // Fainter than woopInviteRow below (text.muted, not text.secondary) —
    // this is the secondary/optional suggestion sitting above the
    // exercise's own actual entry point, not a second competing primary
    // action.
    tuneInInviteRow: { paddingVertical: spacing[1] },
    tuneInInviteText: {
      color: colors.text.muted,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
    woopInviteRow: { paddingVertical: spacing[1] },
    woopInviteText: {
      color: colors.text.secondary,
      fontFamily: fonts.voice,
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
      fontFamily: fonts.voice,
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
      fontFamily: fonts.voice,
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
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
    },
    planSetButton: { alignSelf: 'flex-start', marginTop: spacing[4], paddingVertical: spacing[1] },
    planSetButtonText: { fontFamily: fonts.medium, fontSize: fontSizes.sm },
    // A previously-saved WOOP, shown read-only under the active wish
    // headline — reuses woopStepLabel/woopStepLine's own register so it
    // reads as the same kind of content as the live in-progress steps.
    savedWoopSection: { marginTop: spacing[5] },
    skipToSaveRow: { alignSelf: 'flex-start', marginTop: spacing[5], paddingVertical: spacing[1] },
    skipToSaveText: {
      color: colors.text.muted,
      fontFamily: fonts.voice,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * lineHeights.normal,
    },
  });
}
