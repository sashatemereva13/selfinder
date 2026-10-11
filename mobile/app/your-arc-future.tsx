import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, InteractionManager } from 'react-native';
import { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useMeasureStore } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { getMe } from '../src/api/user';
import { saveSpillEntryIfConsented } from '../src/api/spill';
import { listMyWishes, markWishResurfaced, saveWishIfConsented, markWishFulfilled, unmarkWishFulfilled, SavedWish } from '../src/api/wish';
import { routeToCrisisSupport } from '../src/components/yourArc/routeToCrisisSupport';
import { generateCrossing, answerCrossing, listMyCrossings, SavedCrossing } from '../src/api/crossing';
import { listMyJourneySessions } from '../src/api/journeys';
import { JourneySessionDTO } from '../src/types';
import { selectWishToResurface } from '../src/components/yourArc/wishResurfacing';
import { findActiveWish, findExistingCrossing } from '../src/components/yourArc/crossingEligibility';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { ArcKaleidoscopeLoading } from '../src/components/shared/ArcKaleidoscopeLoading';
import { BackLink } from '../src/components/shared/BackLink';
import { PagedScrollView } from '../src/components/yourArc/PagedScrollView';
import { ArcDial } from '../src/components/yourArc/ArcDial';
import { useAppAccentRgb, useAppAccentTextRgb } from '../src/utils/appAccent';
import { track } from '../src/utils/analytics';
import { getLocalizedLevelName, VIBRATION_LEVELS } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';
import { ResurfacedWishPage } from '../src/components/yourArc/pages/ResurfacedWishPage';
import { WishCrossingPage } from '../src/components/yourArc/pages/WishCrossingPage';
import { CrossingPage } from '../src/components/yourArc/pages/CrossingPage';
import { ClosingPage } from '../src/components/yourArc/pages/ClosingPage';

const KALEIDOSCOPE_SIZE = 300;
const FIRST_PAINT_FALLBACK_MS = 900;
// The closing page's own arrival beat (2026-08-20, "journey, not
// equal-weight carousel") — same easing/duration ArcKaleidoscope's own
// entrance uses, carried over unchanged from your-arc.tsx now that Closing
// lives in this file instead.
const CLOSING_SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLOSING_ENTRANCE_DURATION_MS = 900;

// Your Arc's future sub-pager (2026-09-05 hub restructure — see
// your-arc.tsx's own header comment for the full before/after). Contains
// ResurfacedWish (conditional), WishCrossing, Crossing, and Closing
// (conditional, always the true last page in this sequence, per the user's
// explicit choice to keep it here rather than a separate third hub
// destination) — reached by tapping the hub's FUTURE zone. Its own scoped
// data fetch below is the wishes/crossings half of the old single 6-call
// Promise.all on your-arc.tsx — the readingLog/richHistory/journey-sessions
// half moved to your-arc-past.tsx instead. currentResult (the just-taken
// reading, if any) still comes straight from measureStore, same as before.
export default function YourArcFutureRoute() {
  const colors = useThemeColors();
  const accentRgb = useAppAccentRgb();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg.base, justifyContent: 'center', alignItems: 'center' }}>
        <ArcKaleidoscopeLoading size={KALEIDOSCOPE_SIZE * 0.6} accentRgb={accentRgb} />
      </View>
    );
  }

  return <YourArcFutureScreen />;
}

function YourArcFutureScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const session = useAuthStore((s) => s.session);
  const accentRgb = useAppAccentRgb();
  const accentTextRgb = useAppAccentTextRgb();

  const [richDataLoading, setRichDataLoading] = useState(false);
  const [pagerPainted, setPagerPainted] = useState(false);
  const [activeDialIndex, setActiveDialIndex] = useState(0);
  const [dialJumpRequest, setDialJumpRequest] = useState<{ index: number; token: number } | null>(null);

  const [resurfacedWish, setResurfacedWish] = useState<SavedWish | null>(null);
  const [wishRevealed, setWishRevealed] = useState(false);
  const [allWishes, setAllWishes] = useState<SavedWish[]>([]);
  // 2026-09-13, at the user's own request — lets WishCrossingPage's own
  // composer offer a completed Journey's own "arrived" answer as an
  // optional starting point for a new wish (see that page's own
  // journeySuggestion prop comment). No per-Journey "already offered"
  // tracking (SavedWish has no field linking it back to a Journey
  // session — a real one would need a backend schema change, out of
  // scope here) — this always just offers the most recent completed
  // Journey's own answer, a lightweight suggestion offered fresh each
  // time the composer opens, not a tracked one-time nudge.
  const [journeySessions, setJourneySessions] = useState<JourneySessionDTO[]>([]);
  const [activeWish, setActiveWish] = useState<SavedWish | null>(null);
  const [wishFulfillPending, setWishFulfillPending] = useState<string | null>(null);
  const [crossing, setCrossing] = useState<SavedCrossing | null>(null);
  const [crossingLoading, setCrossingLoading] = useState(false);
  const [crossingAnswerInput, setCrossingAnswerInput] = useState('');
  const [crossingSubmitting, setCrossingSubmitting] = useState(false);
  // 2026-09-13 — replaces the old wishComposerOpen(bool) + WOOP's own
  // separate woopOpen(bool). The composer is now one assembled, staged
  // flow: typing the wish text no longer saves it immediately — it
  // advances to 'outcome', then 'obstacle', then 'plan', and the actual
  // saveWishIfConsented call fires once, at the end of 'plan' (or
  // whenever a "skip to save" action is taken at any stage), sending the
  // wish text plus whatever WOOP was actually completed together in one
  // request (see handleSaveWish/handleSkipToSave below). 'closed'
  // is the resting state (composer not open at all) — distinct from
  // 'wish', the first real stage, which is what wishComposerOpen used to
  // mean alone.
  type ComposerStage = 'closed' | 'wish' | 'outcome' | 'obstacle' | 'plan';
  const [composerStage, setComposerStage] = useState<ComposerStage>('closed');
  const [newWishInput, setNewWishInput] = useState('');
  const [newWishSubmitting, setNewWishSubmitting] = useState(false);
  const [newWishRetryOffered, setNewWishRetryOffered] = useState(false);
  // WOOP's own state — unchanged in shape from Phase 1's lift, just now
  // driven by composerStage instead of its own separate boolean. Fully
  // ephemeral-by-design intent is UNCHANGED for the in-progress *_Input
  // fields (a draft mid-step is still lost on navigation, same as any
  // other unsent text anywhere in this app) — only a FULLY COMMITTED
  // WOOP (outcomeLine + obstacleLine + planSet) survives past this
  // screen, by actually being sent to the server.
  const [outcomeInput, setOutcomeInput] = useState('');
  const [outcomeLine, setOutcomeLine] = useState<string | null>(null);
  const [obstacleInput, setObstacleInput] = useState('');
  const [obstacleLine, setObstacleLine] = useState<string | null>(null);
  const [planIfInput, setPlanIfInput] = useState('');
  const [planThenInput, setPlanThenInput] = useState('');
  const [planSet, setPlanSet] = useState(false);
  // Real, committed progress only — same reasoning as before this state
  // moved here (see WishCrossingPage.tsx's own prior comment, now
  // relocated): NOT the raw *_Input fields, which are just an
  // in-progress, unsubmitted draft.
  const hasWoopProgress = !!(outcomeLine || obstacleLine || planSet);
  const [closingWriteInput, setClosingWriteInput] = useState('');
  const [closingWriteSubmitting, setClosingWriteSubmitting] = useState(false);
  const [closingWriteSaved, setClosingWriteSaved] = useState(false);
  // Bumped (never just booleaned) each time the pager's active page becomes
  // the closing page — see PagedScrollView's own onActiveIndexChange
  // comment for why all pages stay mounted, so a mount-only entrance would
  // only ever play once. Carried over unchanged from your-arc.tsx.
  const [closingArrivalToken, setClosingArrivalToken] = useState(0);
  const closingScale = useSharedValue(0.94);
  const closingOpacity = useSharedValue(0);
  useEffect(() => {
    if (closingArrivalToken === 0) return; // 0 is the initial, pre-arrival value — nothing to animate yet
    closingScale.value = 0.94;
    closingOpacity.value = 0;
    closingScale.value = withTiming(1, { duration: CLOSING_ENTRANCE_DURATION_MS, easing: CLOSING_SOFT_EASE });
    closingOpacity.value = withTiming(1, { duration: CLOSING_ENTRANCE_DURATION_MS, easing: CLOSING_SOFT_EASE });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closingArrivalToken]);
  const closingArrivalStyle = useAnimatedStyle(() => ({
    opacity: closingOpacity.value,
    transform: [{ scale: closingScale.value }],
  }));

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setRichDataLoading(true);
    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const [profile, wishes, crossings, sessions] = await Promise.all([
            getMe(session.token),
            listMyWishes(session.token),
            listMyCrossings(session.token),
            listMyJourneySessions(session.token),
          ]);
          if (cancelled || !profile.consent?.psychologicalData?.given) return;
          setResurfacedWish(selectWishToResurface(wishes));
          setAllWishes(wishes);
          setJourneySessions(sessions);

          const wish = findActiveWish(wishes);
          setActiveWish(wish);
          if (wish && currentResult?.measureResultId) {
            const existing = findExistingCrossing(crossings, wish.id, currentResult.measureResultId);
            if (existing) setCrossing(existing);
          }
        } catch {
          // Best-effort — the wish/crossing pages just render their own honest empty state without this.
        } finally {
          if (!cancelled) setRichDataLoading(false);
        }
      })();
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [session, currentResult?.savedAt, currentResult?.measureResultId]);

  useEffect(() => {
    const fallback = setTimeout(() => setPagerPainted(true), FIRST_PAINT_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, []);

  // WOOP resets whenever the active wish itself changes — the practice
  // is scoped to whichever wish is live now. Relocated from
  // WishCrossingPage.tsx's own former local effect; no longer touches
  // composerStage here (a wish CHANGING, i.e. a fresh save already
  // completed, is a different moment from the in-progress composer flow
  // itself, which manages its own stage transitions below).
  useEffect(() => {
    setOutcomeInput('');
    setOutcomeLine(null);
    setObstacleInput('');
    setObstacleLine(null);
    setPlanIfInput('');
    setPlanThenInput('');
    setPlanSet(false);
  }, [activeWish?.id]);

  // 2026-09-13 — each Set* handler now also advances composerStage to
  // the next step, since the assembled flow moves forward as each part
  // is committed (previously these only ever updated WOOP's own local
  // state; the separate woopOpen boolean and the linear-reveal JSX in
  // WishCrossingPage.tsx handled "what shows next" on their own).
  const handleSetOutcome = () => {
    const text = outcomeInput.trim();
    if (!text) return;
    setOutcomeLine(text);
    setOutcomeInput('');
    setComposerStage('obstacle');
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
    setComposerStage('plan');
  };

  const handleSetPlan = () => {
    if (!planIfInput.trim() || !planThenInput.trim()) return;
    setPlanSet(true);
  };

  // 2026-09-13 — the skip-to-save control available at every stage (see
  // WishCrossingPage.tsx's own render) — WOOP must never gate the actual
  // save, since a wish is "sacred, user-authored material, always
  // savable in its own right" (this file's own WOOP-section header
  // comment, unchanged intent, just relocated). Simply calls the same
  // handleSaveWish the end-of-Plan path uses — whatever WOOP has been
  // committed SO FAR (possibly none) is what gets sent; nothing forces
  // completion of a step that hasn't been reached yet.
  const handleSkipToSave = () => {
    handleSaveWish();
  };

  const handleGenerateCrossing = async () => {
    if (!activeWish || !currentResult?.measureResultId || !philosopher || !session || crossingLoading) return;
    setCrossingLoading(true);
    try {
      const result = await generateCrossing(
        activeWish.id,
        currentResult.measureResultId,
        getLocalizedLevelName(currentResult.vibrationLevel, locale),
        philosopher,
        null,
        session.token
      );
      if (result) {
        setCrossing({
          id: result.id,
          wishId: activeWish.id,
          measureResultId: currentResult.measureResultId,
          pastWishId: null,
          philosopherId: philosopher.id,
          question: result.question,
          answer: null,
          createdAt: new Date().toISOString(),
          answeredAt: null,
        });
        track('your_arc_crossing_generated');
      }
    } finally {
      setCrossingLoading(false);
    }
  };

  const handleSubmitCrossingAnswer = async () => {
    const answer = crossingAnswerInput.trim();
    if (!answer || !crossing || !session || crossingSubmitting) return;
    setCrossingSubmitting(true);
    try {
      const ok = await answerCrossing(crossing.id, answer, session.token);
      if (ok) {
        setCrossing({ ...crossing, answer, answeredAt: new Date().toISOString() });
        setCrossingAnswerInput('');
        track('your_arc_crossing_answered');
      }
    } finally {
      setCrossingSubmitting(false);
    }
  };

  const handleRevealWish = () => {
    setWishRevealed(true);
    track('your_arc_wish_resurfaced_revealed');
    if (resurfacedWish && session) {
      markWishResurfaced(resurfacedWish.id, session.token);
    }
  };

  // 2026-09-13 — the actual save, now fired once at the true end of the
  // assembled flow: either reaching the end of Plan, or an explicit
  // "skip to save" at any stage (see WishCrossingPage.tsx's own
  // composerStage-driven UI for where this is called from). No longer
  // fires the moment wish text alone is submitted — the wish text is
  // held in newWishInput across the whole staged flow and only actually
  // sent here, together with whatever WOOP was completed by that point.
  // planIsComplete defaults to reading the planSet STATE, but accepts an
  // explicit override for the one call site (onSetPlanAndSave below)
  // that fires in the same synchronous handler as handleSetPlan's own
  // setPlanSet(true) — React state updates aren't applied until the next
  // render, so reading `planSet` itself in that same tick would still
  // see the OLD (false) value and silently save with woop: null right
  // when Plan was just completed. The override lets that one call site
  // pass the value it already knows synchronously, instead.
  const handleSaveWish = async (planIsComplete: boolean = planSet) => {
    const text = newWishInput.trim();
    if (!text || newWishSubmitting) return;
    setNewWishSubmitting(true);
    setNewWishRetryOffered(false);
    // Only a FULLY completed WOOP is sent — no partial/abandoned WOOP
    // payloads. See mobile/src/api/wish.ts's own WishWoop type and
    // saveWishIfConsented's own comment.
    const woop = planIsComplete
      ? { outcome: outcomeLine!, obstacle: obstacleLine!, planIf: planIfInput, planThen: planThenInput }
      : null;
    try {
      const result = await saveWishIfConsented(text, null, woop);
      if (!result.ok && result.blocked && result.category === 'self-harm') {
        routeToCrisisSupport();
        return;
      }
      if (!result.ok && result.blocked) {
        setNewWishRetryOffered(true);
        return;
      }
      setComposerStage('closed');
      setNewWishInput('');
      if (result.ok && session) {
        const fresh: SavedWish = { id: result.id, text, measureResultId: null, savedAt: new Date().toISOString(), resurfacedAt: null, fulfilledAt: null, woop };
        setActiveWish(fresh);
        setAllWishes((prev) => [fresh, ...prev]);
        setCrossing(null);
        track('your_arc_wish_saved');
      }
    } finally {
      setNewWishSubmitting(false);
    }
  };

  const handleToggleWishFulfilled = async (wish: SavedWish) => {
    if (!session || wishFulfillPending) return;
    const wasFulfilled = !!wish.fulfilledAt;
    setWishFulfillPending(wish.id);
    const optimisticTimestamp = wasFulfilled ? null : new Date().toISOString();
    setAllWishes((prev) =>
      prev.map((w) => (w.id === wish.id ? { ...w, fulfilledAt: optimisticTimestamp } : w))
    );
    if (activeWish?.id === wish.id) {
      setActiveWish((prev) => (prev ? { ...prev, fulfilledAt: optimisticTimestamp } : prev));
    }
    try {
      const ok = wasFulfilled
        ? await unmarkWishFulfilled(wish.id, session.token)
        : await markWishFulfilled(wish.id, session.token);
      if (ok) {
        track(wasFulfilled ? 'your_arc_wish_unfulfilled' : 'your_arc_wish_fulfilled');
      }
      if (!ok) {
        setAllWishes((prev) =>
          prev.map((w) => (w.id === wish.id ? { ...w, fulfilledAt: wish.fulfilledAt } : w))
        );
        if (activeWish?.id === wish.id) {
          setActiveWish((prev) => (prev ? { ...prev, fulfilledAt: wish.fulfilledAt } : prev));
        }
      }
    } finally {
      setWishFulfillPending(null);
    }
  };

  const handleSubmitClosingWrite = async () => {
    if (!closingWriteInput.trim() || closingWriteSubmitting) return;
    setClosingWriteSubmitting(true);
    const saved = await saveSpillEntryIfConsented(closingWriteInput);
    setClosingWriteSubmitting(false);
    setClosingWriteInput('');
    if (saved) {
      setClosingWriteSaved(true);
      track('your_arc_closing_write_saved');
    }
  };

  const fulfilledWishes = useMemo(
    () =>
      allWishes
        .filter((w) => w.fulfilledAt)
        .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()),
    [allWishes]
  );

  // 2026-09-13 — the most recent COMPLETED Journey's own "arrived"
  // answer (its last stage's finalAnswer — same field/position
  // JourneysPage's own arrivedStage already reads), offered to
  // WishCrossingPage as an optional wish-composer starting point. Most
  // recent by completedAt, matching JourneysPage's own sort order.
  const journeySuggestion = useMemo(() => {
    const completed = journeySessions
      .filter((s) => s.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());
    const mostRecent = completed[0];
    if (!mostRecent) return null;
    const arrivedStage = mostRecent.stages[mostRecent.stages.length - 1];
    if (!arrivedStage?.finalAnswer) return null;
    return { journey: mostRecent.journey, answer: arrivedStage.finalAnswer };
  }, [journeySessions]);

  const latestReading = readingLog.length > 0 ? readingLog[readingLog.length - 1] : null;
  const latestLevel = useMemo(
    () => (latestReading ? VIBRATION_LEVELS.find((l) => l.slug === latestReading.levelSlug) : null),
    [latestReading]
  );
  const latestLevelName = latestLevel ? getLocalizedLevelName(latestLevel, locale) : null;

  const pages: React.ReactNode[] = [];
  const pageLabels: string[] = [];
  // Stable, untranslated identifiers parallel to pageLabels/pages — same
  // analytics-only purpose as your-arc-past.tsx's own pageIds.
  const pageIds: string[] = [];
  let closingPageIndex: number | null = null;

  if (resurfacedWish) {
    pages.push(
      <ResurfacedWishPage
        key="resurfaced-wish"
        resurfacedWish={resurfacedWish}
        wishRevealed={wishRevealed}
        onReveal={handleRevealWish}
      />
    );
    pageLabels.push(t('yourArc.wishResurfaceHeading'));
    pageIds.push('resurfaced_wish');
  }

  pages.push(
    <WishCrossingPage
      key="wish-crossing"
      locale={locale}
      activeWish={activeWish}
      composerStage={composerStage}
      setComposerStage={setComposerStage}
      newWishInput={newWishInput}
      setNewWishInput={setNewWishInput}
      newWishSubmitting={newWishSubmitting}
      newWishRetryOffered={newWishRetryOffered}
      wishFulfillPending={wishFulfillPending}
      accentRgb={accentRgb}
      accentTextRgb={accentTextRgb}
      onSkipToSave={handleSkipToSave}
      onToggleWishFulfilled={handleToggleWishFulfilled}
      onPressTuneIn={() => {
        track('your_arc_tune_in_before_woop');
        router.push('/(tabs)/explore/tunein');
      }}
      journeySuggestion={journeySuggestion}
      onUseJourneySuggestion={() => track('your_arc_wish_from_journey_used')}
      onUsePromptBank={() => track('your_arc_wish_from_prompt_bank_used')}
      outcomeInput={outcomeInput}
      setOutcomeInput={setOutcomeInput}
      outcomeLine={outcomeLine}
      onSetOutcome={handleSetOutcome}
      obstacleInput={obstacleInput}
      setObstacleInput={setObstacleInput}
      obstacleLine={obstacleLine}
      onSetObstacle={handleSetObstacle}
      planIfInput={planIfInput}
      setPlanIfInput={setPlanIfInput}
      planThenInput={planThenInput}
      setPlanThenInput={setPlanThenInput}
      planSet={planSet}
      onSetPlan={handleSetPlan}
      onSetPlanAndSave={() => {
        if (!planIfInput.trim() || !planThenInput.trim()) return;
        handleSetPlan();
        // Passes true explicitly rather than relying on planSet's own
        // state — see handleSaveWish's own planIsComplete param comment
        // for why: setPlanSet(true) just above hasn't been applied to
        // state yet in this same synchronous handler.
        handleSaveWish(true);
      }}
      hasWoopProgress={hasWoopProgress}
    />
  );
  pageLabels.push(t('yourArc.whatCallsYou'));
  pageIds.push('wish_crossing');

  pages.push(
    <CrossingPage
      key="crossing"
      activeWish={activeWish}
      crossing={crossing}
      crossingLoading={crossingLoading}
      crossingAnswerInput={crossingAnswerInput}
      setCrossingAnswerInput={setCrossingAnswerInput}
      crossingSubmitting={crossingSubmitting}
      fulfilledWishes={fulfilledWishes}
      wishFulfillPending={wishFulfillPending}
      philosopherName={philosopher?.name}
      accentRgb={accentRgb}
      hasCurrentReading={!!currentResult?.measureResultId}
      onGenerateCrossing={handleGenerateCrossing}
      onSubmitCrossingAnswer={handleSubmitCrossingAnswer}
      onToggleWishFulfilled={handleToggleWishFulfilled}
    />
  );
  pageLabels.push(t('yourArc.crossingKicker'));
  pageIds.push('crossing');

  if (latestReading) {
    closingPageIndex = pages.length;
    pages.push(
      <ClosingPage
        key="closing"
        activeWish={activeWish}
        latestReading={latestReading}
        latestLevelName={latestLevelName}
        closingWriteSaved={closingWriteSaved}
        closingWriteInput={closingWriteInput}
        setClosingWriteInput={setClosingWriteInput}
        closingWriteSubmitting={closingWriteSubmitting}
        onSubmitClosingWrite={handleSubmitClosingWrite}
        closingArrivalStyle={closingArrivalStyle}
        accentTextRgb={accentTextRgb}
        onExploreJourney={() => {
          track('your_arc_closing_explore_journey');
          router.push('/(tabs)/explore/journeys');
        }}
      />
    );
    pageLabels.push(t('yourArc.closingDialLabel'));
    pageIds.push('closing');
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <BackLink style={styles.backRow} />
      {richDataLoading && <Text style={styles.loadingNote}>{t('yourArc.loadingMore')}</Text>}
      <View
        style={pagerPainted ? styles.pagerVisible : styles.pagerHidden}
        pointerEvents={pagerPainted ? 'auto' : 'none'}
        onLayout={() => setPagerPainted(true)}
      >
        <PagedScrollView
          jumpTo={dialJumpRequest}
          distinctLastDot={closingPageIndex !== null}
          hideDots
          onActiveIndexChange={(index) => {
            setActiveDialIndex(index);
            const pageId = pageIds[index];
            if (pageId) track('your_arc_future_page_viewed', { page: pageId });
            if (closingPageIndex !== null && index === closingPageIndex) {
              setClosingArrivalToken((n) => n + 1);
            }
          }}
        >
          {pages}
        </PagedScrollView>
      </View>
      {pagerPainted && pages.length > 1 && (
        <ArcDial
          total={pages.length}
          activeIndex={Math.min(activeDialIndex, pages.length - 1)}
          pageLabels={pageLabels}
          onRequestIndex={(index) => setDialJumpRequest({ index, token: Date.now() })}
        />
      )}
      {!pagerPainted && (
        <View style={styles.firstPaintLoading}>
          <ArcKaleidoscopeLoading size={KALEIDOSCOPE_SIZE * 0.6} accentRgb={accentRgb} />
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
    loadingNote: {
      alignSelf: 'flex-start',
      color: colors.text.faint,
      fontFamily: fonts.voice,
      fontSize: fontSizes.xs,
      paddingHorizontal: spacing[6],
      marginBottom: spacing[2],
    },
    firstPaintLoading: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    pagerHidden: {
      ...StyleSheet.absoluteFill,
      opacity: 0,
    },
    pagerVisible: {
      flex: 1,
    },
  });
}
