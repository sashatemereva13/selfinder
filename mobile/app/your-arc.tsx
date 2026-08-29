import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, InteractionManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useMeasureStore, ReadingLogEntry } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { getMe, getMeasureHistory } from '../src/api/user';
import { getConversationForMeasureResult, SavedConversation } from '../src/api/conversation';
import { listMySpillEntries, saveSpillEntryIfConsented, SavedSpillEntry } from '../src/api/spill';
import { listMyWishes, markWishResurfaced, saveWishIfConsented, markWishFulfilled, unmarkWishFulfilled, SavedWish } from '../src/api/wish';
import { routeToCrisisSupport } from '../src/utils/routeToCrisisSupport';
import { generateCrossing, answerCrossing, listMyCrossings, SavedCrossing } from '../src/api/crossing';
import { getArcLine } from '../src/api/arcLine';
import { selectWishToResurface } from '../src/utils/wishResurfacing';
import { findActiveWish, findExistingCrossing } from '../src/utils/crossingEligibility';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { useJourneyPurchases } from '../src/utils/useJourneyPurchases';
import { SavedMeasureResult } from '../src/types';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { PagedScrollView } from '../src/components/PagedScrollView';
import { buildArcFacts } from '../src/utils/arcFacts';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { getLocalizedLevelName, VIBRATION_LEVELS, useLevelColors } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';
import { ProfileIcon } from '../src/components/ProfileIcon';
import { ArcLinePage } from '../src/components/yourArcPages/ArcLinePage';
import { ResurfacedWishPage } from '../src/components/yourArcPages/ResurfacedWishPage';
import { DetailPage } from '../src/components/yourArcPages/DetailPage';
import { FactsPage } from '../src/components/yourArcPages/FactsPage';
import { TimeConePage } from '../src/components/yourArcPages/TimeConePage';
import { ClosingPage } from '../src/components/yourArcPages/ClosingPage';
import { WishCrossingPage } from '../src/components/yourArcPages/WishCrossingPage';

// Same loose-match window your-arc.tsx already uses for qaPairs/rich-
// history matching — Spill has no reading link (it's its own free-standing
// practice, not reading-scoped by design, see RULES.md), so a kept entry
// only counts as "from this moment" if it's close in time, not by a hard
// foreign key. Wider than the 60s used for matching a reading to itself,
// since writing a Spill entry is a separate, slightly later action.
const SPILL_MATCH_WINDOW_MS = 30 * 60 * 1000;

// Used by the first-paint loading placeholder (scaled down) — Your Arc no
// longer shows the real kaleidoscope itself (spun out into Center, see
// RULES.md's Product/positioning section), but keeps this same echo-of-
// the-cover-art loading treatment since it's still a cheap, on-brand
// placeholder shape independent of what the pager itself now contains.
const KALEIDOSCOPE_SIZE = 300;
// Upper bound on how long the first-paint loading state can show before
// pagerPainted flips even without its own onLayout signal firing — see
// that state's own comment for the full mechanism. Under normal
// conditions onLayout fires well before this, so it should rarely
// actually trigger — it's a backstop, not the primary mechanism.
const FIRST_PAINT_FALLBACK_MS = 900;
// The closing page's own arrival beat (2026-08-20, "journey, not
// equal-weight carousel") — same easing/duration ArcKaleidoscope's own
// entrance uses (docs/design/aesthetic.md's "gather, condense, become"
// motion language, one standing curve app-wide), so reaching the close
// feels like arriving somewhere rather than one more instant page swap.
const CLOSING_SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CLOSING_ENTRANCE_DURATION_MS = 900;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Subscribed — the real payoff Depths' "Your arc" row (and, before that,
// the preview screen) points to: full history, not just the last few
// readings, and tapping
// any point opens what that day actually was. Two tiers of detail
// depending on what data exists for it: the rich version (four spheres,
// the philosopher's reflection, the actual Q&A) only exists server-side,
// for a signed-in account with data-saving consent on — the same
// precondition AccountSection's own history list already requires. Without
// that, a tapped point still means something (the date, the level, the
// score) — just not the full story, since that was never saved anywhere
// to recover. Never pretend detail exists that doesn't.
// Thin wrapper mounted by the router — the real screen below builds its
// `pages` array directly in its component body on every render,
// unconditionally. Previously (before the time cone/kaleidoscope spun out
// into Center — see RULES.md's Product/positioning section) that build
// included ArcKaleidoscope's dozens of mirrored SVG Path/Filter nodes and
// the cone's per-reading circles, expensive enough that the whole 700+
// line build ran synchronously as part of the FIRST render expo-router
// produced for this route, so React had nothing to commit or paint — not
// even the pagerPainted loading dot the screen itself shows — until that
// heavy work finished. From the outside that read as "Depths stays on
// screen, frozen, until Your Arc suddenly appears already loaded,"
// reintroducing the exact freeze pagerPainted (see its own comment inside
// YourArcScreen) was built to hide, just one level higher up: pagerPainted
// only ever deferred work WITHIN an already-mounted YourArcScreen, never
// the screen's own first mount. This wrapper pattern is kept even now
// that Your Arc's own pages are lighter (Center inherited the real cost),
// since the record pages still do real work (facts, wish/crossing
// content) worth keeping off the route transition's own critical path.
export default function YourArcRoute() {
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

  return <YourArcScreen />;
}

function YourArcScreen() {
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
  const centerPurchases = useJourneyPurchases('center');
  const accentRgb = useAppAccentRgb();
  const levelColors = useLevelColors();

  const [richHistory, setRichHistory] = useState<SavedMeasureResult[] | null>(null);
  const [spillEntries, setSpillEntries] = useState<SavedSpillEntry[] | null>(null);
  // True while the 5-call server fetch (getMe, history, spill, wishes,
  // crossings) is in flight — the facts row, sphere-arc trace, wish
  // resurfacing, and Crossing sections all depend on it and previously
  // just popped in silently with no indication more was coming, which
  // read as the page sitting there rather than loading (2026-08-14
  // collaboration notes). The bare kaleidoscope/local-readingLog sparkline
  // render immediately regardless — this only covers the richer sections.
  const [richDataLoading, setRichDataLoading] = useState(false);
  // Gates the pager itself, not just the richer server-fed sections below.
  // The cover kaleidoscope (ArcKaleidoscope — dozens of blurred SVG paths,
  // mirrored eightfold) and the time-cone page (one SvgCircle per past
  // reading, unbounded up to readingLog's own cap) are both expensive
  // enough to mount synchronously that they were freezing the Depths→Your
  // Arc transition itself for several seconds with nothing on screen to
  // show it was working (2026-08-14 device logs: "Hang detected: 13.03s"
  // on the main thread, well after the network side had already finished).
  // Starts false so the spinner below gets an actual paint frame before
  // the heavy pages mount; flips true on the next tick via
  // InteractionManager so the route transition itself is never competing
  // with this mount, same reasoning as the richDataLoading effect above.
  //
  // 2026-08-20: this alone wasn't enough — reported live, the loading dot
  // disappeared and the screen still hung for a beat before the real
  // pages appeared. Root cause: firstPaintReady only deferred WHEN the
  // heavy pages mount, it never made the mount itself cheaper — the real
  // ArcKaleidoscope alone renders shapes × 8 mirrored native SVG
  // Path/Filter nodes, a genuinely expensive synchronous native render
  // (the same class of cost the "Hang detected" log above already
  // caught, just relocated to right after this flag flips instead of
  // during the route transition). Fix: mount the real pager BEHIND the
  // loading state (hidden via absolute+opacity 0, not conditionally
  // rendered) so that expensive render happens while the loading
  // animation is still visibly playing, then swap visibility once
  // onLayout below confirms a real frame actually painted — the stall
  // now happens WITH the loading dot on screen, not silently after it's
  // gone.
  const [pagerPainted, setPagerPainted] = useState(false);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);
  // Set by handleFactsReadingPress — see PagedScrollView's own jumpTo prop
  // for why this is a token (a value that changes per tap), not a plain
  // boolean/index: the detail page always lands in the same page slot,
  // so two separate cone taps can resolve to an identical target index,
  // and only a per-request token reliably tells them apart.
  const [detailJumpToken, setDetailJumpToken] = useState<number | null>(null);
  const [linkedConversation, setLinkedConversation] = useState<SavedConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);
  // The one wish eligible for "pure resurfacing" this visit (see
  // wishResurfacing.ts) — chosen once when the screen's data loads, not
  // re-picked on every render, so it stays stable while the person is
  // looking at the page even if they linger past the 30-day threshold.
  const [resurfacedWish, setResurfacedWish] = useState<SavedWish | null>(null);
  const [wishRevealed, setWishRevealed] = useState(false);
  // All wishes, kept for the past cone (see TimeCone.tsx) — every wish
  // OTHER than the current active one is a real past moment worth
  // showing on the cone's own past side, the same "your own account of
  // what happened" material the resurfacing row already draws from.
  const [allWishes, setAllWishes] = useState<SavedWish[]>([]);
  // The Crossing (see docs/session-result-concept.md's Phase 4 / the
  // 2026-08-13 "Crossing" design) — one philosopher-voiced question built
  // from the CURRENT reading's own wish, offered only when that wish
  // exists and hasn't already been crossed (see crossingEligibility.ts).
  // null throughout means "not eligible this visit," not "loading."
  const [activeWish, setActiveWish] = useState<SavedWish | null>(null);
  // Which wish is mid-tick right now (fulfilling or un-fulfilling) —
  // disables that row's own button while the request is in flight,
  // without blocking every other row on the page.
  const [wishFulfillPending, setWishFulfillPending] = useState<string | null>(null);
  const [crossing, setCrossing] = useState<SavedCrossing | null>(null);
  const [crossingLoading, setCrossingLoading] = useState(false);
  const [crossingAnswerInput, setCrossingAnswerInput] = useState('');
  const [crossingSubmitting, setCrossingSubmitting] = useState(false);
  // Creating a new wish, directly on Your Arc's own future section — moved
  // off Measure entirely on 2026-08-14 (see interview.tsx's own comment:
  // "the wish technically depends on the user's current feeling, not on
  // their reading"). Same moderation/safety infrastructure as before
  // (moderateWish.js on the backend, self-harm routing to crisis-support),
  // just relocated — nothing about the safety design changed, only where
  // the question is asked.
  const [wishComposerOpen, setWishComposerOpen] = useState(false);
  const [newWishInput, setNewWishInput] = useState('');
  const [newWishSubmitting, setNewWishSubmitting] = useState(false);
  const [newWishRetryOffered, setNewWishRetryOffered] = useState(false);
  // The Cover page's own line — real per-user content (reading count/
  // streak/latest level/active wish, see arcLineController.js) instead of
  // the same static framing line on every visit. null means "not loaded
  // yet or unavailable," in which case the Cover page falls back to the
  // original static copy rather than showing nothing.
  const [arcLine, setArcLine] = useState<string | null>(null);
  // Thread 2's closing page (docs/your-arc-expansion-plan.md) — the one
  // small optional act at the end of the pager: a single free-text
  // prompt, saved as a real Spill entry via the same explicit,
  // affirmative-save convention Spill's own "keep this moment" button
  // uses (never auto-saved). closingWriteSaved just drives the
  // confirmation message; it isn't itself the source of truth for
  // whether the save happened.
  const [closingWriteInput, setClosingWriteInput] = useState('');
  const [closingWriteSubmitting, setClosingWriteSubmitting] = useState(false);
  const [closingWriteSaved, setClosingWriteSaved] = useState(false);
  // Bumped (never just booleaned) each time the pager's active page
  // becomes the closing page — see PagedScrollView's own onActiveIndexChange
  // comment for why all pages stay mounted, so a mount-only entrance would
  // only ever play once. A token, not a boolean, so swiping away and back
  // replays the arrival beat every time, the same "fresh value per
  // request" reasoning detailJumpToken already uses.
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
    // Deferred until the screen-transition animation actually finishes,
    // not fired the instant this effect runs — confirmed on a real device
    // (2026-08-14: Console.app showed "Hang detected: 4.52s" right as the
    // network connection for this fetch started setting up) that kicking
    // off 5 requests' worth of native connection/TLS setup DURING the
    // navigation transition can compete with it for the main thread and
    // visibly freeze the transition itself — Depths stayed on screen,
    // frozen, for several seconds before Your Arc ever appeared, rather
    // than Your Arc appearing immediately and its own content loading in
    // (which is what richDataLoading's own loading note was built for).
    // InteractionManager guarantees the transition/any other queued
    // interaction completes first, so navigation always paints instantly
    // regardless of how slow the network is that day.
    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          // All 5 requests fire together — getMe's own result is only used
          // to decide whether to APPLY the others (consent gate), not to
          // decide whether to START them. This used to await getMe first,
          // then Promise.all the rest — a real serial waterfall (2+ round
          // trips stacked before anything richer than the bare local
          // readingLog appeared), confirmed as the actual cause of "Your
          // Arc takes a long time to load" on a real device (2026-08-14
          // collaboration notes), not a tap-target issue as first assumed.
          const [profile, history, entries, wishes, crossings] = await Promise.all([
            getMe(session.token),
            getMeasureHistory(session.token),
            listMySpillEntries(session.token),
            listMyWishes(session.token),
            listMyCrossings(session.token),
          ]);
          if (cancelled || !profile.consent?.psychologicalData?.given) return;
          setRichHistory(history);
          setSpillEntries(entries);
          setResurfacedWish(selectWishToResurface(wishes));
          setAllWishes(wishes);

          const wish = findActiveWish(wishes);
          setActiveWish(wish);
          if (wish && currentResult?.measureResultId) {
            const existing = findExistingCrossing(crossings, wish.id, currentResult.measureResultId);
            if (existing) setCrossing(existing);
          }
        } catch {
          // Best-effort — the local-only readingLog view still works without this.
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

  // The Cover page's own line, fetched independently of the 5-call rich-
  // data batch above (it has its own single endpoint, cached server-side
  // per calendar day, so there's no cost to calling it every visit).
  // Requires a chosen philosopher (the line is generated in their voice)
  // and at least one reading server-side, or the backend 404s and this
  // stays null — the Cover page's static fallback line covers that case.
  useEffect(() => {
    if (!session || !philosopher) return;
    let cancelled = false;
    (async () => {
      const line = await getArcLine(philosopher, session.token);
      if (!cancelled) setArcLine(line);
    })();
    return () => {
      cancelled = true;
    };
  }, [session, philosopher]);

  // FIRST_PAINT_FALLBACK_MS bounds how long the loading dot shows even if
  // pagerPainted's own onLayout signal (see the pager's JSX below) never
  // fires for some reason — a person should never be stuck looking at the
  // loading state for an unbounded amount of time regardless of the
  // actual root cause. Under normal conditions onLayout fires first and
  // this timer is just a backstop, same relationship the old
  // InteractionManager version had to its own timeout.
  useEffect(() => {
    const fallback = setTimeout(() => setPagerPainted(true), FIRST_PAINT_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, []);

  // Generated on demand (tap "Ask [philosopher]"), not automatically on
  // page load — even though eligibility is otherwise met, the Groq call
  // itself is real cost/latency that shouldn't fire just from opening
  // Your Arc. See crossingController.js's own idempotency: calling this
  // again for the same wish+reading is safe, always returns the same
  // question.
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
      }
    } finally {
      setCrossingSubmitting(false);
    }
  };

  // Marks the wish resurfaced only once actually opened — see
  // markWishResurfaced's own comment on why this can't happen just from
  // being selected/offered (the same "held, not displayed until tapped"
  // rule the same-session version already follows).
  const handleRevealWish = () => {
    setWishRevealed(true);
    if (resurfacedWish && session) {
      markWishResurfaced(resurfacedWish.id, session.token);
    }
  };

  // The wish's own capture flow, relocated from Measure's interview.tsx
  // (2026-08-14) — same moderation-before-save discipline, same self-harm
  // routing, same "optional, never blocks anything" stance, just standing
  // on its own here instead of gated behind finishing four sphere
  // questions first. measureResultId stays null — the wish was never
  // really reading-scoped in the first place (see findActiveWish's own
  // comment); this makes that explicit rather than a leftover artifact.
  const handleSubmitNewWish = async () => {
    const text = newWishInput.trim();
    if (!text || newWishSubmitting) return;
    setNewWishSubmitting(true);
    setNewWishRetryOffered(false);
    try {
      const result = await saveWishIfConsented(text, null);
      if (!result.ok && result.blocked && result.category === 'self-harm') {
        routeToCrisisSupport();
        return;
      }
      if (!result.ok && result.blocked) {
        setNewWishRetryOffered(true);
        return;
      }
      setWishComposerOpen(false);
      setNewWishInput('');
      if (result.ok && session) {
        // Reflect the new wish immediately as the active one, rather than
        // waiting for a full page refetch — the Crossing invite (which
        // depends on activeWish) should be able to use it right away.
        const fresh: SavedWish = { id: result.id, text, measureResultId: null, savedAt: new Date().toISOString(), resurfacedAt: null, fulfilledAt: null };
        setActiveWish(fresh);
        setAllWishes((prev) => [fresh, ...prev]);
        setCrossing(null);
      }
    } finally {
      setNewWishSubmitting(false);
    }
  };

  // Ticking a wish fulfilled (2026-08-19) — or reversing that tick.
  // Optimistic: updates allWishes locally first (the fulfilled-wishes
  // list and the tick affordance both read straight from allWishes, no
  // separate tracked list), then confirms with the server; on failure it
  // reverts. Works on ANY wish in allWishes, not just the active one —
  // an older, superseded wish can still be ticked fulfilled later.
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
      if (!ok) {
        // Revert on failure — the request functions already log the error;
        // this just keeps the UI honest about what's actually saved.
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

  // Thread 2's closing prompt — saved as a real Spill entry (same
  // explicit, best-effort, affirmative-save convention Spill's own "keep
  // this moment" button uses; never auto-saved, silent on failure). Not
  // scored, not reflected back by the app in any way — the point is the
  // act of writing it, not what the app does with it afterward.
  const handleSubmitClosingWrite = async () => {
    if (!closingWriteInput.trim() || closingWriteSubmitting) return;
    setClosingWriteSubmitting(true);
    const saved = await saveSpillEntryIfConsented(closingWriteInput);
    setClosingWriteSubmitting(false);
    setClosingWriteInput('');
    if (saved) setClosingWriteSaved(true);
  };

  // Opens the detail page from a tap on the Facts page's own reading list
  // (2026-08-20 review: "add the list of past readings... so they look
  // like the list of past readings on 'You' page") — reuses the exact
  // same `selected` state the Detail page already drives, so this is a
  // second entry point into one shared detail, not a separate mechanism
  // (e.g. an inline expand like AccountSection's own list uses). Resolves
  // a richHistory item back to its matching readingLog entry by closest
  // timestamp — same 60s tolerance selectedRich already uses in the
  // opposite direction. Sets detailJumpToken (2026-08-20, "Detail page
  // prominence" pass) to actually navigate there — a list row's own
  // affordance is "tap to open," not just marking something selected
  // without visibly going anywhere.
  const handleFactsReadingPress = (rich: SavedMeasureResult) => {
    const entry = readingLog.find((e) => Math.abs(e.ts - new Date(rich.savedAt).getTime()) < 60_000);
    if (entry) {
      setSelected(entry);
      setDetailJumpToken(Date.now());
    }
  };

  const selectedRich = selected
    ? richHistory?.find((r) => Math.abs(new Date(r.savedAt).getTime() - selected.ts) < 60_000)
    : undefined;

  // The Guide conversation that followed this specific reading, if any and
  // if it was saved (Selfinder+ — see guideChatStore.ts's flushPendingSave).
  // Re-fetched per selection rather than bulk-loaded up front, since most
  // readings won't have one and there's no reason to pull every saved
  // conversation just to check.
  useEffect(() => {
    const measureResultId = selectedRich?.id;
    if (!measureResultId || !session) {
      setLinkedConversation(null);
      return;
    }
    let cancelled = false;
    setLoadingConversation(true);
    (async () => {
      const conversation = await getConversationForMeasureResult(measureResultId, session.token);
      if (!cancelled) {
        setLinkedConversation(conversation);
        setLoadingConversation(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedRich?.id, session]);

  // Spill has no reading link by design (see the module comment on
  // SPILL_MATCH_WINDOW_MS) — the closest kept entry in time, if any is
  // close enough to plausibly belong to this moment.
  const linkedSpillEntry = selected
    ? spillEntries?.find((e) => Math.abs(new Date(e.savedAt).getTime() - selected.ts) < SPILL_MATCH_WINDOW_MS)
    : undefined;

  // Real, true facts about this person's OWN record — never an
  // interpretation of what a pattern means (see arcFacts.ts's own header
  // comment). Sits right after introLine, before the sparkline, so it's
  // the immediate answer to "what is this page" rather than something you
  // only get to after tapping around — see collaboration notes on making
  // Your Arc's value legible on open.
  const facts = useMemo(() => buildArcFacts(readingLog), [readingLog]);

  // Every ticked wish, oldest-savedAt-first — see the render site's own
  // comment for why savedAt (not fulfilledAt) orders this list.
  const fulfilledWishes = useMemo(
    () =>
      allWishes
        .filter((w) => w.fulfilledAt)
        .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()),
    [allWishes]
  );

  // readingLog is stored oldest-first (see measureStore.ts) — [0] is the
  // very first reading ever taken, real information worth surfacing in
  // the opening line instead of a bare count. Same formatDate used by the
  // detail section below, so this reads as the same voice, not a second
  // date convention.
  const sinceDate = readingLog.length > 0 ? formatDate(readingLog[0].ts) : '';

  // The closing page's own synthesis material — real, true facts about
  // the latest reading, same as facts/fulfilledWishes above.
  const latestReading = readingLog.length > 0 ? readingLog[readingLog.length - 1] : null;
  const latestLevel = useMemo(
    () => (latestReading ? VIBRATION_LEVELS.find((l) => l.slug === latestReading.levelSlug) : null),
    [latestReading]
  );
  const latestLevelName = latestLevel ? getLocalizedLevelName(latestLevel, locale) : null;

  // Building the page list explicitly (not conditionally spread inline in
  // JSX) so PagedScrollView's dot count and the pages actually shown never
  // drift apart — a resurfaced wish or a tapped detail page changes how
  // many pages exist, and both need to agree on that number.
  const pages: React.ReactNode[] = [];
  // Recorded at push time, below, the same way detailJumpTo tracks the
  // Detail page's own index — the closing page (Thread 2) is always the
  // true last STATIC page (Detail is appended dynamically afterward, only
  // once something's selected), but its exact index still shifts
  // depending on which conditional pages exist above it (resurfaced wish,
  // etc.), so it can't be hardcoded.
  let closingPageIndex: number | null = null;

  // Page 1 — Arc line. 2026-08-22: previously opened Cover, above the
  // kaleidoscope — now Your Arc's own opening page, since Cover and the
  // time cone both spun out into Center (see RULES.md's Product/
  // positioning section, the Your Arc + Center split). Deliberately the
  // quietest page in the whole pager (one spoken line, nothing else),
  // opening onto Facts (dense: stat rows, past-readings list) with a
  // breath first rather than launching straight into the densest content.
  // Reuses coverPhilosopherLine's own styling unchanged (quote marks
  // carry "this is spoken" — see that style's own comment for why not
  // real italics) and arcLine/coneFramingLine's own fallback exactly as
  // Cover used to.
  pages.push(<ArcLinePage key="arc-line" arcLine={arcLine} />);

  // Facts — the pager's second page now that the time cone has moved to
  // Center (2026-08-22, see RULES.md's Product/positioning section). Real,
  // true facts about this person's OWN record — never an interpretation
  // of what a pattern means (see arcFacts.ts's own header comment).
  //
  // Always pushed now (2026-08-28 fix), not gated on facts.length > 0 —
  // this page is also Center's real primary home (2026-08-27 restructure,
  // see docs/app-architecture-concept.md), and Center needs zero reading
  // history to open (it's generated fresh from whatever's there). Gating
  // the whole page on facts existing meant Center was invisible for
  // anyone whose local readingLog was empty (a fresh device, a second
  // device, or simply zero readings yet) even with a real server-side
  // history — the bug the "I don't see Center on Your Arc" report was
  // actually catching. FactsPage itself already renders facts.length ===
  // 0 gracefully (the stat rows are conditional on individual facts, not
  // the array as a whole).
  pages.push(
    <FactsPage
      key="facts"
      readingLog={readingLog}
      sinceDate={sinceDate}
      facts={facts}
      richHistory={richHistory}
      levelColors={levelColors}
      accentRgb={accentRgb}
      locale={locale}
      onReadingPress={handleFactsReadingPress}
      centerPurchaseCount={centerPurchases?.length ?? null}
      onPressCenter={() => router.push('/center')}
    />
  );

  // The light cone — split out of Center 2026-08-29 (see TimeConePage.tsx's
  // own header comment for the full reasoning: the cone is drawn from real
  // history, unlike Center's kaleidoscope, which is generated fresh each
  // time and never part of the record). Right after Facts, matching this
  // page's own job — "every reading, unranked, as a shape" — as the
  // natural sequel to Facts' own "browse in order" list.
  pages.push(
    <TimeConePage
      key="time-cone"
      readingLog={readingLog}
      allWishes={allWishes}
      activeWish={activeWish}
      locale={locale}
    />
  );

  // "Every walk" (the sparkline page) REMOVED entirely 2026-08-20 —
  // review: "it shows a graph with ups and downs but it goes against my
  // intentional design that vibrations aren't better or worse one
  // another, they just are." arcSparkline.ts's sparklineCoords mapped
  // vibration score directly to vertical position — a real, longstanding
  // violation of RULES.md/aesthetic.md's own anti-ranking rule ("never
  // show a bare numeric score," "no gradient bars... up=better, down=
  // worse"), not just a styling issue. What it did is now covered two
  // other ways, neither of which encodes a ranking: TimeConePage above
  // ("every reading, unranked, as a shape") and the Facts page's own
  // past-readings list (date + level, chronological, tap for detail) for
  // "browse in order." fullLineNote (the free-vs-paid "the FULL line, not
  // just the last few" signal) moved onto that list.

  // Page 3 — A wish from before. Pure resurfacing (docs/session-result-
  // concept.md, Phase 4), offered quietly, not pushed — only exists as its
  // own page when there's actually one eligible this visit. Held behind a
  // tap until opened (same "held, not displayed" rule the same-session
  // version follows): no comparison to the current reading is ever drawn
  // here — showing the wish's own words is the whole mechanism.
  //
  // Reordered 2026-08-20 (Thread 2 follow-up: "every connection between
  // pages should be logical") — previously sat AFTER "What calls you"
  // (the active wish), right before the new Closing page, which meant an
  // OLD wish surfaced right before a close built around the ACTIVE wish —
  // a detour into the past interrupting the climb toward "now." Moved
  // here, right after Cone/Facts (the past) and before "What calls you"
  // (the present), so the sequence reads in one direction: your past
  // shape → an old wish returning as part of that past → your active
  // wish now → the close that synthesizes the reading and the active
  // wish together.
  if (resurfacedWish) {
    pages.push(
      <ResurfacedWishPage
        key="resurfaced-wish"
        resurfacedWish={resurfacedWish}
        wishRevealed={wishRevealed}
        onReveal={handleRevealWish}
      />
    );
  }

  // Page 4 — What calls you. The ACTIVE wish, standing on its own (moved
  // off Measure, 2026-08-14), plus the Crossing that builds from it —
  // both "present reaching toward future" material, so they share a page.
  // Unlike the resurfaced wish just above (a past moment, held until
  // tapped), the active wish is shown plainly — nothing to protect it
  // from, it's what's live right now.
  pages.push(
    <WishCrossingPage
      key="wish-crossing"
      activeWish={activeWish}
      wishComposerOpen={wishComposerOpen}
      setWishComposerOpen={setWishComposerOpen}
      newWishInput={newWishInput}
      setNewWishInput={setNewWishInput}
      newWishSubmitting={newWishSubmitting}
      newWishRetryOffered={newWishRetryOffered}
      wishFulfillPending={wishFulfillPending}
      crossing={crossing}
      crossingLoading={crossingLoading}
      crossingAnswerInput={crossingAnswerInput}
      setCrossingAnswerInput={setCrossingAnswerInput}
      crossingSubmitting={crossingSubmitting}
      fulfilledWishes={fulfilledWishes}
      philosopherName={philosopher?.name}
      accentRgb={accentRgb}
      onGenerateCrossing={handleGenerateCrossing}
      onSubmitCrossingAnswer={handleSubmitCrossingAnswer}
      onSubmitNewWish={handleSubmitNewWish}
      onToggleWishFulfilled={handleToggleWishFulfilled}
    />
  );

  // Page 5 — the closing page (docs/your-arc-expansion-plan.md, Thread 2,
  // built 2026-08-20). Positioned as the true last static page in the
  // pager, before the dynamically-appended Detail page — see this file's
  // own conversation history: Your Arc previously ended by simply running
  // out of pages, all of them separate "views onto the same record"
  // (kaleidoscope, cone, list, wish) with no page that answered "so what"
  // once you'd swiped through the rest. This is the missing ending
  // gesture.
  //
  // Three parts, in the phenomenological voice Thread 1 already settled
  // for the cone (retention/protention, "held," never a verdict):
  // 1. A synthesis line naming that the latest reading and the active
  //    wish are BOTH still held right now, together — the direct "held"
  //    callback to the cone's own framing text, personalized with real
  //    data (the latest reading's actual level word, the wish's own
  //    words) rather than staying abstract the way the cone's lines do.
  //    Adapts if either is missing: with no wish yet, this line still
  //    names the reading alone and the row below invites a wish instead
  //    of assuming one exists — never forces writing one, matches "free
  //    core, paid depth — never gated like therapy" (RULES.md).
  // 2. The structural "a need exists" line, exactly as settled in the
  //    plan doc — names that a reason exists without naming what it is
  //    (the app never outputs a specific need on the person's behalf).
  // 3. One small optional act: a single free-text prompt ("what would it
  //    mean to let this be enough, for now?"), saved as a real Spill
  //    entry only if the person chooses to keep it (same explicit,
  //    affirmative-save convention as Spill's own "keep this moment"
  //    button) — never scored, never reflected back by the app. This is
  //    what makes the page a CLOSE rather than one more view: something
  //    done, not just read.
  if (latestReading) {
    closingPageIndex = pages.length;
    pages.push(
      <ClosingPage
        key="closing"
        activeWish={activeWish}
        wishComposerOpen={wishComposerOpen}
        setWishComposerOpen={setWishComposerOpen}
        latestReading={latestReading}
        latestLevelName={latestLevelName}
        closingWriteSaved={closingWriteSaved}
        closingWriteInput={closingWriteInput}
        setClosingWriteInput={setClosingWriteInput}
        closingWriteSubmitting={closingWriteSubmitting}
        onSubmitClosingWrite={handleSubmitClosingWrite}
        closingArrivalStyle={closingArrivalStyle}
      />
    );
  }

  // (Former Page 5 slot — "This month" facts page — merged into the
  // Now/Cone page above, 2026-08-18. See that page's own comment. The
  // real Page 5 is now the closing page above; this slot's old number
  // was never reused for anything else.)

  // (Former Page 6 — "Body, mind, heart, spirit" sphere-history page,
  // removed 2026-08-20: SphereArc.tsx mapped vibration score directly to
  // vertical Y position via the same sparklinePath/sparklineCoords helpers
  // the "Every walk" sparkline used — a real, recurring instance of the
  // exact ranking violation "Every walk" was already removed for once
  // (score-as-height implies "higher reading = better"). Never rebuilt as
  // a face-on ring the way "Every walk" was — see TimeConeRing.tsx —
  // because a four-trace, per-sphere version of that ring would need four
  // distinct hues to tell the traces apart, which is its own separate
  // aesthetic.md violation ("no per-item color variety on a reading-scoped
  // screen"). No replacement page; sphere-level detail still lives on the
  // Detail page below via each reading's own four answers.)

  // Page 7 — the tapped point's own detail, inserted dynamically only once
  // something's selected on the Every Walk sparkline (2026-08-14 decision:
  // "its own dedicated page, inserted after Every Walk," not a modal/
  // overlay).
  if (selected) {
    pages.push(
      <DetailPage
        key="detail"
        selected={selected}
        selectedRich={selectedRich}
        linkedConversation={linkedConversation}
        loadingConversation={loadingConversation}
        linkedSpillEntry={linkedSpillEntry}
        hasSession={!!session}
        hasRichHistory={!!richHistory}
        locale={locale}
      />
    );
  }

  // Resolves handleFactsReadingPress's request into a real { index, token }
  // for PagedScrollView, now that `pages` is fully built — the detail
  // page pushed just above is always the LAST page when `selected` is
  // set, so its index is simply pages.length - 1.
  const detailJumpTo = useMemo(
    () => (detailJumpToken !== null && selected ? { index: pages.length - 1, token: detailJumpToken } : null),
    [detailJumpToken, selected, pages.length]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <ProfileIcon />
      {/* Quiet signal that the facts/sphere-history/wish/Crossing pages
          are still coming, not just absent — previously this gap was
          silent (nothing rendered until the whole 5-call fetch resolved,
          then everything popped in at once), which read as the page
          being slow/stuck rather than loading. No spinner-heavy UI,
          matching the app's own restrained register. */}
      {richDataLoading && <Text style={styles.loadingNote}>{t('yourArc.loadingMore')}</Text>}
      {/* The real pager is always mounted once `pages` exist — not gated
          behind a timer — so its expensive first render (ArcKaleidoscope's
          shapes × 8 mirrored native SVG Path/Filter nodes, TimeCone's own
          per-reading circles) happens WHILE the loading dot below is still
          visibly on screen, rather than being merely delayed until after
          it disappears (2026-08-20: reported live that the dot vanished
          and the screen still hung for a beat — the old firstPaintReady
          gate deferred WHEN this mounted but never made the mount itself
          cheaper). Hidden via absolute+opacity rather than conditional
          rendering, so it still actually paints; onLayout is the real
          native signal that a frame was produced, which is what flips
          pagerPainted and swaps the two views. pointerEvents keeps it
          untouchable while hidden so a stray tap during the overlap can't
          land on it. */}
      <View
        style={pagerPainted ? styles.pagerVisible : styles.pagerHidden}
        pointerEvents={pagerPainted ? 'auto' : 'none'}
        onLayout={() => setPagerPainted(true)}
      >
        <PagedScrollView
          jumpTo={detailJumpTo}
          distinctLastDot={closingPageIndex !== null}
          onActiveIndexChange={(index) => {
            if (closingPageIndex !== null && index === closingPageIndex) {
              setClosingArrivalToken((n) => n + 1);
            }
          }}
        >
          {pages}
        </PagedScrollView>
      </View>
      {!pagerPainted && (
        // A cheap echo of the real ArcKaleidoscope cover page (same 8-fold
        // radial language, same accent color) rather than a bare
        // ActivityIndicator spinner — this is the first thing anyone sees
        // after tapping "Your arc," and a generic spinner didn't feel like
        // Your Arc at all (aesthetic.md's "cosy fireplace, not a UI" test).
        // Deliberately NOT the real ArcKaleidoscope — see
        // ArcKaleidoscopeLoading's own comment for why that would
        // reintroduce the exact freeze this loading state exists to hide.
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
  loadingNote: {
    alignSelf: 'flex-start',
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    paddingHorizontal: spacing[6],
    marginBottom: spacing[2],
  },
  // Placeholder for the pager's own first, expensive mount (kaleidoscope +
  // time cone) — fills the same space the pager will occupy once it
  // mounts, so nothing jumps when it swaps in.
  firstPaintLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // The real pager while it's already mounted and painting but not yet
  // confirmed on screen (see pagerPainted's own comment) — absolute +
  // opacity 0, not `display: none`, since it needs to actually lay out
  // and render to trigger its own onLayout; display:none would never
  // fire it at all.
  pagerHidden: {
    ...StyleSheet.absoluteFill,
    opacity: 0,
  },
  pagerVisible: {
    flex: 1,
  },
  });
}
