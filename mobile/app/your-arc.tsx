import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, InteractionManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
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
import { SavedMeasureResult } from '../src/types';
import { TimeCone, TimeConePoint } from '../src/components/TimeCone';
import { TimeConeRing } from '../src/components/TimeConeRing';
import { CrossfadeSwitcher } from '../src/components/CrossfadeSwitcher';
import { ArcKaleidoscope } from '../src/components/ArcKaleidoscope';
import { LongPressToSave } from '../src/components/LongPressToSave';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { ChatTurn } from '../src/components/ChatTurn';
import { PagedScrollView } from '../src/components/PagedScrollView';
import { buildArcFacts } from '../src/utils/arcFacts';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { getLocalizedLevelName, VIBRATION_LEVELS, useLevelColors } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';

// Same loose-match window your-arc.tsx already uses for qaPairs/rich-
// history matching — Spill has no reading link (it's its own free-standing
// practice, not reading-scoped by design, see RULES.md), so a kept entry
// only counts as "from this moment" if it's close in time, not by a hard
// foreign key. Wider than the 60s used for matching a reading to itself,
// since writing a Spill entry is a separate, slightly later action.
const SPILL_MATCH_WINDOW_MS = 30 * 60 * 1000;

// Fills most of the content column's own width without touching its
// padding — the kaleidoscope reads as a real, spacious presence (same
// reasoning DepthsSpiral's own canvas sizing uses), not a small diagram.
const KALEIDOSCOPE_SIZE = 300;
// Taller than wide — TimeCone's own two-cone-plus-vertex shape needs
// vertical room (see TimeCone.tsx's CONE_HEIGHT_RATIO) more than it
// needs width, unlike the kaleidoscope's square footprint.
const CONE_SIZE = 260;
// Upper bound on how long the first-paint loading state can show before
// pagerPainted flips even without its own onLayout signal firing — see
// that state's own comment for the full mechanism. Under normal
// conditions onLayout fires well before this, so it should rarely
// actually trigger — it's a backstop, not the primary mechanism.
const FIRST_PAINT_FALLBACK_MS = 900;
// How long the cone's long-press preview stays up before clearing itself.
const CONE_PREVIEW_DISMISS_MS = 4000;
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
// `pages` array (including ArcKaleidoscope's dozens of mirrored SVG
// Path/Filter nodes and the time cone's per-reading circles) directly in
// its component body on every render, unconditionally. Previously that
// whole 700+ line build ran synchronously as part of the FIRST render
// expo-router produced for this route, so React had nothing to commit or
// paint — not even the pagerPainted loading dot the screen itself shows —
// until that heavy work finished. From the outside that read as "Depths
// stays on screen, frozen, until Your Arc suddenly appears already
// loaded," reintroducing the exact freeze pagerPainted (see its own
// comment inside YourArcScreen) was built to hide, just one level higher
// up: pagerPainted only ever deferred work WITHIN an already-mounted
// YourArcScreen, never the screen's own first mount. Rendering a bare
// loading placeholder here first, then swapping to the real screen a
// frame later via requestAnimationFrame, guarantees the route transition
// itself always paints instantly regardless of how expensive the real
// screen's first render is.
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
  // The cone's own long-press preview (2026-08-20 review: "the dots don't
  // make sense to anybody apart from me") — a quick date+level label for
  // a reading, or a quick date label for a wish, shown without leaving
  // the page. Separate from `selected` (which drives the full detail page
  // opened by a plain tap) — long-press is a lighter, non-navigating
  // preview of the same point. Auto-dismissed a few seconds after being
  // set (see handleConePointLongPress) rather than tracked against page
  // navigation — simpler than wiring PagedScrollView's active index back
  // up to this screen just to clear a transient preview.
  const [conePreview, setConePreview] = useState<{ date: string; label: string } | null>(null);
  // Which rim the cone is "rotated" to face on, if any (2026-08-20
  // review: "what if, on the cone screen, it will be possible to rotate
  // the cone... to see the bottom and top circles as surfaces") — null
  // means the normal side view. See TimeConeRing.tsx's own header
  // comment for why this is a crossfade between two fully-rendered
  // static views, not a live geometry rotation.
  const [coneFacing, setConeFacing] = useState<'past' | 'future' | null>(null);
  // Set by handleConePointPress — see PagedScrollView's own jumpTo prop
  // for why this is a token (a value that changes per tap), not a plain
  // boolean/index: the detail page always lands in the same page slot,
  // so two separate cone taps can resolve to an identical target index,
  // and only a per-request token reliably tells them apart.
  const [coneJumpToken, setConeJumpToken] = useState<number | null>(null);
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
  // "Try it as if it's already true" (2026-08-18) — an explicitly-named
  // EXERCISE, not the app asserting anything as fact: the user writes
  // their OWN present-tense, feeling-based version of their wish (e.g.
  // "I feel calm and present with my family," never generated or
  // rephrased by the app — see the copy in tryAsTrueExplain for the
  // "trying it on, not claiming it" framing this whole feature depends
  // on to stay compatible with RULES.md's anti-cosmology rule). Fully
  // ephemeral by design (2026-08-18 decision): none of this — the
  // present-tense line, the repeat count, anything written — is sent to
  // the server or persisted across a visit. Resets whenever the active
  // wish itself changes, since the practice is scoped to whichever wish
  // is live right now.
  const [tryAsTrueOpen, setTryAsTrueOpen] = useState(false);
  const [presentTenseInput, setPresentTenseInput] = useState('');
  const [presentTenseLine, setPresentTenseLine] = useState<string | null>(null);
  const REPEAT_WRITING_TARGET = 5;
  const [repeatWritingCount, setRepeatWritingCount] = useState(0);
  const [repeatWritingInput, setRepeatWritingInput] = useState('');

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
  // request" reasoning coneJumpToken already uses.
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

  // "Try it as if it's already true" is scoped to whichever wish is
  // currently active — changing the wish (handleSubmitNewWish) should
  // never leave a stale present-tense line or repeat count sitting around
  // for a wish that's no longer live.
  useEffect(() => {
    setTryAsTrueOpen(false);
    setPresentTenseInput('');
    setPresentTenseLine(null);
    setRepeatWritingCount(0);
    setRepeatWritingInput('');
  }, [activeWish?.id]);

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

  // Locks in the user's own present-tense line — no moderation call here
  // (unlike the wish itself), since this text is never sent to the
  // server or stored anywhere; it only ever lives in this screen's own
  // state for as long as the person is looking at it. Purely their own
  // words, exactly as they typed them — the app never rephrases this.
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

  // Sets the tapped reading as `selected` — same state the Detail page
  // and Facts page's reading list already share — but, as of 2026-08-20
  // round 3, no longer auto-jumps the pager there. Previously this fired
  // setConeJumpToken immediately, so a single tap swiped the whole screen
  // to a separate page — reported as "a bit unexpected... it would be
  // smoother to open the reading on the same page somewhere near, in case
  // they want to press on the other dot next." Now the cone page renders
  // its own inline summary for `selected` directly (see conePointSummary
  // below the cone) and the person can tap a different dot right after
  // without leaving the page; handleOpenFullReading is the new, explicit
  // step that jumps to the fuller Detail page, only when asked. Point ids
  // are built as `reading-${entry.ts}` in timeConeGeometry above; wish
  // points (`wish-...`) are a different kind of point with no
  // reading-detail equivalent, so they're a no-op here rather than
  // silently opening the wrong thing.
  const handleConePointPress = (pointId: string) => {
    if (!pointId.startsWith('reading-')) return;
    const ts = Number(pointId.slice('reading-'.length));
    const entry = readingLog.find((e) => e.ts === ts);
    if (entry) setSelected(entry);
  };

  // The explicit "open full reading" step (2026-08-20 round 3) — jumps to
  // the same rich Detail page handleConePointPress used to open
  // automatically. Only reachable from the inline cone summary, once
  // `selected` is already set.
  const handleOpenFullReading = () => {
    // A fresh token per tap (Date.now() is unique enough here — this
    // fires from a discrete user tap, never in a tight loop) — see
    // PagedScrollView's own jumpTo prop comment for why a plain
    // boolean/index isn't enough to guarantee a second, distinct tap
    // still triggers a fresh jump.
    setConeJumpToken(Date.now());
  };

  // Opens the detail page from a tap on the Facts page's own reading list
  // (2026-08-20 review: "add the list of past readings... so they look
  // like the list of past readings on 'You' page") — reuses the exact
  // same `selected` state/detail page the cone and sparkline already
  // drive, so this is a third entry point into one shared detail, not a
  // fourth, separate mechanism (e.g. an inline expand like AccountSection's
  // own list uses). Resolves a richHistory item back to its matching
  // readingLog entry by closest timestamp — same 60s tolerance
  // selectedRich already uses in the opposite direction.
  //
  // Also sets coneJumpToken (fixed 2026-08-20, "Detail page prominence"
  // pass) — this was a real bug: unlike the cone's own explicit "Open full
  // reading" link (handleOpenFullReading), tapping a row here only ever
  // set `selected` and appended the Detail page to the end of the pager
  // without navigating there, so nothing visibly happened unless the
  // person manually swiped all the way to the last page. A list row's own
  // affordance is "tap to open" — it should actually open.
  const handleFactsReadingPress = (rich: SavedMeasureResult) => {
    const entry = readingLog.find((e) => Math.abs(e.ts - new Date(rich.savedAt).getTime()) < 60_000);
    if (entry) {
      setSelected(entry);
      setConeJumpToken(Date.now());
    }
  };

  // Long-press preview (2026-08-20) — a quick date+level label for a
  // reading dot, or date+"a wish" for a wish dot, shown right on the page
  // without opening anything. This is the per-dot half of the "dots don't
  // make sense to anybody" fix; the legend (coneLegend below) is the
  // other half, explaining the color convention once rather than per-dot.
  const handleConePointLongPress = (pointId: string) => {
    if (pointId.startsWith('reading-')) {
      const ts = Number(pointId.slice('reading-'.length));
      const entry = readingLog.find((e) => e.ts === ts);
      if (!entry) return;
      const level = VIBRATION_LEVELS.find((l) => l.slug === entry.levelSlug);
      setConePreview({
        date: formatDate(entry.ts),
        label: level ? getLocalizedLevelName(level, locale) : entry.levelSlug,
      });
      setTimeout(() => setConePreview(null), CONE_PREVIEW_DISMISS_MS);
    } else if (pointId.startsWith('wish-')) {
      const id = pointId.slice('wish-'.length);
      const wish = allWishes.find((w) => w.id === id);
      if (!wish) return;
      setConePreview({
        date: formatDate(new Date(wish.savedAt).getTime()),
        label: t('yourArc.coneLegendWishLabel'),
      });
      setTimeout(() => setConePreview(null), CONE_PREVIEW_DISMISS_MS);
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

  // The time cone's own points (see TimeCone.tsx) — past cone gets every
  // reading plus every wish OTHER than the current active one, spread by
  // AGE alone (oldest = furthest from the vertex), never by anything
  // about what a reading/wish says. Future cone gets only the active
  // wish, per RULES.md's existing "no fabricated trajectory" rule — this
  // is never a forecast, only the one real, stated thing reaching
  // forward. `angle` uses a cheap deterministic hash of each id so a
  // given point's angular position is stable across re-renders instead
  // of jumping around, but carries no real information itself (see
  // TimeConePoint's own comment).
  const timeConeGeometry = useMemo(() => {
    const now = Date.now();
    const oldestTs = readingLog.length > 0 ? readingLog[0].ts : now;
    const span = Math.max(now - oldestTs, 1);
    const hashAngle = (id: string) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) % 1000;
      return hash / 1000;
    };
    const pastFromReadings: TimeConePoint[] = readingLog.map((entry) => ({
      id: `reading-${entry.ts}`,
      depth: Math.min(1, (now - entry.ts) / span),
      angle: hashAngle(`reading-${entry.ts}`),
      colorRgb: levelColors[entry.levelSlug],
    }));
    // Wishes have no vibration level, so they never get a level color —
    // the neutral accent (ivoryRgb, the same pre-reading fallback used
    // everywhere else) marks them as a different KIND of past point from
    // a reading, not a missing/default color.
    const pastFromWishes: TimeConePoint[] = allWishes
      .filter((w) => w.id !== activeWish?.id)
      .map((w) => {
        const ts = new Date(w.savedAt).getTime();
        return {
          id: `wish-${w.id}`,
          depth: Math.min(1, (now - ts) / span),
          angle: hashAngle(`wish-${w.id}`),
          colorRgb: colors.accent.ivoryRgb,
        };
      });
    const futurePoints: TimeConePoint[] = activeWish ? [{ id: `active-wish-${activeWish.id}`, depth: 1, angle: 0.25 }] : [];
    return { pastPoints: [...pastFromReadings, ...pastFromWishes], futurePoints };
  }, [readingLog, allWishes, activeWish, levelColors, colors.accent.ivoryRgb]);

  // Building the page list explicitly (not conditionally spread inline in
  // JSX) so PagedScrollView's dot count and the pages actually shown never
  // drift apart — a resurfaced wish or a tapped detail page changes how
  // many pages exist, and both need to agree on that number.
  const pages: React.ReactNode[] = [];
  // Recorded at push time, below, the same way coneJumpTo tracks the
  // Detail page's own index — the closing page (Thread 2) is always the
  // true last STATIC page (Detail is appended dynamically afterward, only
  // once something's selected), but its exact index still shifts
  // depending on which conditional pages exist above it (resurfaced wish,
  // etc.), so it can't be hardcoded.
  let closingPageIndex: number | null = null;

  // Page 1 — Cover. Restructured 2026-08-20 (review round 1): the
  // kaleidoscope is "the main event" and previously had a caption sitting
  // directly under it competing for the same first glance — moved to a
  // quiet save-hint at the very bottom of the page instead, so the image
  // stands alone. The kicker ("YOUR ARC") was dropped entirely — Cover
  // isn't a page ABOUT a topic the way every other page is, it's the
  // entry point itself, so a section-label above the title didn't fit.
  //
  // Restructured again 2026-08-20 (review round 2, on-device): the
  // philosopher line moved ABOVE the kaleidoscope entirely (not just
  // above the title, which is where round 1 left it) — matching RULES.md's
  // standing "philosopher voice first, then a plain clarifying line"
  // pattern, now read as the voice that INTRODUCES the image rather than
  // commentary trailing it. Sized down and kept purely italic/light
  // weight (never bold) so it stays a quiet spoken line, not competing
  // with the kaleidoscope for visual weight below it. "A living record"
  // became a real, large, left-aligned header (fontSizes.xl, not the
  // small centered md/title treatment round 1 used) sitting at the
  // bottom near the save-hint caption — its own distinct anchor for the
  // page's name, separate from the philosopher's spoken introduction up
  // top.
  //
  // Long-press the kaleidoscope to save it — now via the shared
  // LongPressToSave component (2026-08-20, unified app-wide: Depths'
  // headline, Cards, and Feeling Lucky all switched from a visible Save/
  // Share button to the same long-press gesture this page introduced).
  // captureChildren mode captures the kaleidoscope's own on-screen View
  // directly (it contains its own react-native-svg content) rather than
  // rendering a separate off-screen MessageCard, since the kaleidoscope
  // itself — not a text card — is the thing worth saving here.
  pages.push(
    <ScrollView key="cover" contentContainerStyle={styles.coverPageContent}>
      {/* Philosopher line, quoted (2026-08-20 round 3) — fontStyle:
          'italic' turned out to be a silent no-op the whole time: Etude
          Noire's 4 weight files all have italicAngle 0 (confirmed via
          fonttools), so nothing was ever actually slanting, on any
          platform. No real italic/cursive face exists in this typeface,
          and RULES.md's "one typeface" rule rules out adding a second
          font just for this line. Quote marks + size/color do the
          "this is spoken, not the app's own voice" job instead. */}
      <Text style={styles.coverPhilosopherLine}>{`"${arcLine ?? t('yourArc.coneFramingLine')}"`}</Text>
      <LongPressToSave captureChildren>
        <View style={styles.kaleidoscopeWrap}>
          <ArcKaleidoscope readingLog={readingLog} size={KALEIDOSCOPE_SIZE} />
        </View>
      </LongPressToSave>
      {/* "A living record" now closes the centered quote+image+title
          cluster (2026-08-22 editorial-cover pass) — an album/magazine
          cover's title sits directly under its art as one balanced group,
          not as a header for whatever scrolls after it. */}
      <Text style={styles.coverTitle}>{t('yourArc.title')}</Text>
      {/* Save-hint caption — pinned to the true bottom of the page via
          coverCaptionRow, deliberately outside the centered cluster above
          (small print under a cover, not part of the art itself). */}
      <View style={styles.coverCaptionRow}>
        <Text style={styles.kaleidoscopeCaption}>{t('yourArc.kaleidoscopeCaption')}</Text>
      </View>
    </ScrollView>
  );

  // Page 2 — Now. The time cone, given real room — the present moment in
  // light of the person's own past and future (RULES.md, Product/
  // positioning, 2026-08-14). Static for now, deliberately — see
  // TimeCone.tsx's own comment on why motion/interaction is a later pass.
  // Merged with the former standalone "This month" facts page (2026-08-18
  // review: "let's move this page, combine it with 'this month'... every
  // dot in the cone can be colored in the reading's color") — the cone's
  // own past-point dots now carry each reading's real level color (see
  // timeConeGeometry above), so this page and the facts page were both
  // "about the shape of the whole record," not two separate ideas
  // sharing a swipe slot by convenience. Facts sit below the cone, in
  // place of the old static introLine.
  if (timeConeGeometry.pastPoints.length > 0 || timeConeGeometry.futurePoints.length > 0) {
    pages.push(
      <ScrollView key="cone" contentContainerStyle={styles.conePageContent}>
        <View style={styles.coneTopSpacer} />
        {/* Top framing line — reframed 2026-08-20 around the cone's real
            phenomenological grounding (see docs/your-arc-expansion-plan.md,
            Thread 1) rather than personal-history/goal-setting language
            alone. The claim: a present moment isn't a bare instant — it
            already HOLDS what's reaching forward in it, the way a single
            note only sounds like music because of where it's heading, not
            as an isolated sound. This is a checkable, felt structure
            (listen to a few notes of anything), not a new belief to take
            on — same "ask them to remember something they've already
            experienced" rule RULES.md already holds everywhere else.
            Deliberately never says "the future pulls/calls you" — HELD,
            not reaching or pulling, keeps agency with the person, same
            "you are shaping your future" rule RULES.md already states for
            this cone (the older wording risked implying the opposite).
            Still true to the older framing underneath (only ever the
            active wish, never a forecast) — this changes HOW it's said,
            not what's allowed to appear here.
            2026-08-20 round 3: hidden while facing the PAST rim
            specifically ("when the cone is turned one of the ways, the
            other hint disappears") — this line is about the future rim,
            so it has nothing to say while the past rim is what's actually
            being looked at; still shown in the normal side view and while
            facing the future rim itself. */}
        {coneFacing !== 'past' && (
          <Text style={styles.coneFramingTop}>{t('yourArc.coneFutureFraming')}</Text>
        )}
        {/* Rotating to view a rim face-on (2026-08-20 review: "what if...
            it will be possible to rotate the cone... to see the bottom
            and top circles as surfaces with readings/wishes on them").
            CrossfadeSwitcher fades between the normal side-view TimeCone
            and a flat, unranked TimeConeRing of whichever rim is being
            faced — see TimeConeRing.tsx's own header comment for why
            this exists: the previous "Every walk" sparkline page mapped
            vibration score directly to vertical position, a real,
            longstanding violation of RULES.md's own anti-ranking rule
            that this face-on ring replaces it with. coneFacing null
            means the normal view; 'past' or 'future' means facing that
            rim.
            2026-08-20 round 3: dots are now tappable ONLY once a rim is
            actually faced (TimeCone in the normal side view no longer
            takes onPointPress/onPointLongPress at all) — tapping a dot
            in the angled side view, then having the whole pager instantly
            swipe to a detail page, read as unexpectedly abrupt ("a bit
            unexpected how the whole screen swipes instantly"). Facing a
            rim first is now the deliberate step that says "I want to
            look at these points," matching TimeConeRing's own pre-
            existing "only past points are tappable" scoping — this just
            extends the same discipline to the side view too, rather than
            leaving it as an inconsistent, easier-to-trigger back door. */}
        <View style={styles.timeConeWrap}>
          <CrossfadeSwitcher
            showSecond={coneFacing !== null}
            first={
              <TimeCone
                width={CONE_SIZE}
                height={CONE_SIZE * 1.3}
                pastPoints={timeConeGeometry.pastPoints}
                futurePoints={timeConeGeometry.futurePoints}
              />
            }
            second={
              <TimeConeRing
                size={CONE_SIZE}
                points={coneFacing === 'future' ? timeConeGeometry.futurePoints : timeConeGeometry.pastPoints}
                onPointPress={coneFacing === 'past' ? handleConePointPress : undefined}
                onPointLongPress={coneFacing === 'past' ? handleConePointLongPress : undefined}
              />
            }
          />
        </View>
        {/* The rotation controls — quiet text links, not icons (no new
            iconography per aesthetic.md), below the shape so they don't
            compete with the framing text for the space right around the
            cone itself. Only offered when there's actually something to
            face (a rim with at least one point) — facing an empty rim
            would just be a bare circle with nothing on it. */}
        <View style={styles.coneRotateRow}>
          {timeConeGeometry.futurePoints.length > 0 && (
            <Pressable onPress={() => setConeFacing(coneFacing === 'future' ? null : 'future')}>
              <Text style={styles.coneRotateLink}>
                {coneFacing === 'future' ? t('yourArc.coneRotateBack') : t('yourArc.coneRotateFuture')}
              </Text>
            </Pressable>
          )}
          {timeConeGeometry.pastPoints.length > 0 && (
            <Pressable onPress={() => setConeFacing(coneFacing === 'past' ? null : 'past')}>
              <Text style={styles.coneRotateLink}>
                {coneFacing === 'past' ? t('yourArc.coneRotateBack') : t('yourArc.coneRotatePast')}
              </Text>
            </Pressable>
          )}
        </View>
        {/* Bottom framing line — same reframe as the top line (see its own
            comment): this moment still HOLDS what came before it, the way
            a note carries the ones just played, not a claim that the past
            is a burden to release (an earlier "letting go" framing was
            considered and rejected for exactly this reason — see
            docs/your-arc-expansion-plan.md, Thread 2). Still true to the
            older framing underneath: the past shown here is the user's
            OWN account of it (their reading, in their own words if they
            tap in), never asserted as objective record — RULES.md's "the
            past cone is the user's own account... never asserted as raw
            objective fact" still fully applies, this only changes HOW
            it's said.
            2026-08-20 round 3: hidden while facing the FUTURE rim, same
            reasoning as coneFramingTop's own comment above — this line is
            about the past rim, nothing to say while the future rim is
            what's being looked at. */}
        {coneFacing !== 'future' && (
          <Text style={styles.coneFramingBottom}>{t('yourArc.conePastFraming')}</Text>
        )}
        {/* The long-press preview (2026-08-20) — appears right under the
            bottom framing line once a dot's been long-pressed, cleared
            whenever a DIFFERENT page is swiped to (see the pager-index
            effect below) so a stale preview doesn't linger after leaving
            this page. */}
        {conePreview && (
          <Text style={styles.conePreviewText}>
            {conePreview.date} — {conePreview.label}
          </Text>
        )}
        {/* The tap summary (2026-08-20 round 3) — replaces the old
            instant pager-jump to the Detail page (see
            handleConePointPress's own comment). Richer than the
            long-press preview above (date + level + the philosopher's
            own reflection line, when it exists) but still inline, right
            on the cone page, so a second dot is one tap away rather than
            a swipe back first. "Open full reading" is the one explicit
            step that still reaches the fuller Detail page (transcript,
            Spill entry, Guide conversation) — never automatic anymore. */}
        {selected && (
          <View style={styles.conePointSummary}>
            <Text style={styles.conePointSummaryDate}>{formatDate(selected.ts)}</Text>
            <Text style={styles.conePointSummaryLevel}>
              {selectedRich
                ? getLocalizedLevelName(selectedRich.vibrationLevel, locale)
                : (VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug)
                    ? getLocalizedLevelName(VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug)!, locale)
                    : selected.levelSlug)}
            </Text>
            {selectedRich?.combinationMessage && (
              <Text style={styles.conePointSummaryReflection}>{selectedRich.combinationMessage}</Text>
            )}
            <Pressable onPress={handleOpenFullReading}>
              <Text style={styles.conePointSummaryLink}>{t('yourArc.openFullReading')}</Text>
            </Pressable>
          </View>
        )}
        <Text style={styles.tapPointHint}>{t('yourArc.coneTapHint')}</Text>
        {/* The legend (2026-08-20 review: "the dots don't make sense to
            anybody apart from me") — explains the color convention once,
            in plain language, rather than requiring every dot to carry
            its own label. Two lines: what a colored dot is (a reading, in
            that reading's own real level color — same convention the
            kaleidoscope and sphere history already use), and what a pale/
            neutral dot is (a wish, which has no level to color it by). */}
        <View style={styles.coneLegend}>
          <View style={styles.coneLegendRow}>
            <View style={[styles.coneLegendDot, { backgroundColor: `rgb(${accentRgb})` }]} />
            <Text style={styles.coneLegendText}>{t('yourArc.coneLegendReading')}</Text>
          </View>
          <View style={styles.coneLegendRow}>
            <View style={[styles.coneLegendDot, { backgroundColor: `rgb(${colors.accent.ivoryRgb})` }]} />
            <Text style={styles.coneLegendText}>{t('yourArc.coneLegendWish')}</Text>
          </View>
        </View>
        <View style={styles.coneBottomSpacer} />
      </ScrollView>
    );
  }

  // Facts (2026-08-19: un-merged from the cone page — the top/bottom
  // framing lines above claim the space facts previously sat in, and a
  // full-cone moment reads better as its own uncluttered page). Real,
  // true facts about this person's OWN record — never an interpretation
  // of what a pattern means (see arcFacts.ts's own header comment).
  if (facts.length > 0) {
    pages.push(
      <ScrollView key="facts" contentContainerStyle={styles.pageContent}>
        <Text style={styles.kicker}>{t('yourArc.factsKicker')}</Text>
        <Text style={styles.introLine}>
          {t('yourArc.introLine', { count: readingLog.length, sinceDate })}
        </Text>
        <View style={styles.factsSection}>
          {facts.map((fact) => {
            if (fact.key === 'steadiest') {
              const level = VIBRATION_LEVELS.find((l) => l.slug === fact.params.levelSlug);
              const dotColor = level ? levelColors[level.slug] : undefined;
              return (
                <View key={fact.key} style={styles.factRow}>
                  <View style={[styles.factDot, dotColor && { backgroundColor: `rgb(${dotColor})` }]} />
                  <Text style={styles.factLine}>
                    {t('yourArc.factSteadiest', {
                      level: level ? getLocalizedLevelName(level, locale).toLowerCase() : fact.params.levelSlug,
                    })}
                  </Text>
                </View>
              );
            }
            const i18nKey =
              fact.key === 'thisMonth' ? 'yourArc.factThisMonth'
              : fact.key === 'streak' ? 'yourArc.factStreak'
              : 'yourArc.factAllTime';
            return (
              <View key={fact.key} style={styles.factRow}>
                <View style={[styles.factDot, { backgroundColor: `rgb(${accentRgb})` }]} />
                <Text style={styles.factLine}>{t(i18nKey, { count: fact.params.count })}</Text>
              </View>
            );
          })}
        </View>
        {/* Past readings list (2026-08-20 review: "add the list of past
            readings to this page, so they will look like the list of past
            readings on 'You' page") — same date + level row shape as
            AccountSection's own history list (fixed 2026-08-20 to drop
            the bare score number there too — see that file's own
            comment), but tapping a row here opens Your Arc's existing
            rich Detail page instead of expanding inline, since that page
            already holds more than just the Q&A transcript. Only shown
            once richHistory exists (signed-in + consented) — a stricter
            condition than the facts above it, which only need the
            local-only readingLog. */}
        {richHistory && richHistory.length > 0 && (
          <View style={styles.pastReadingsSection}>
            <Text style={styles.pastReadingsKicker}>{t('yourArc.pastReadingsHeading')}</Text>
            {/* fullLineNote moved here from the now-removed "Every walk"
                sparkline page (2026-08-20) — the same free-vs-paid signal
                ("the FULL line, not just the last few") stated once,
                quietly, on the paid screen itself. */}
            <Text style={styles.fullLineNote}>{t('yourArc.fullLineNote')}</Text>
            {/* "Detail page prominence" pass (2026-08-20) — this list's own
                tap-to-open affordance was never stated anywhere, so a
                first-time visitor had no reason to expect tapping a row
                did anything. Same quiet register as the cone's own
                tapPointHint, not a bordered callout. */}
            <Text style={styles.pastReadingsTapHint}>{t('yourArc.pastReadingsTapHint')}</Text>
            {[...richHistory]
              .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
              .map((reading) => (
                <Pressable
                  key={reading.id}
                  style={styles.pastReadingRow}
                  onPress={() => handleFactsReadingPress(reading)}
                >
                  <Text style={styles.pastReadingDate}>{formatDate(new Date(reading.savedAt).getTime())}</Text>
                  <Text style={styles.pastReadingLevel}>
                    {getLocalizedLevelName(reading.vibrationLevel, locale)}
                  </Text>
                </Pressable>
              ))}
          </View>
        )}
      </ScrollView>
    );
  }

  // "Every walk" (the sparkline page) REMOVED entirely 2026-08-20 —
  // review: "it shows a graph with ups and downs but it goes against my
  // intentional design that vibrations aren't better or worse one
  // another, they just are." arcSparkline.ts's sparklineCoords mapped
  // vibration score directly to vertical position — a real, longstanding
  // violation of RULES.md/aesthetic.md's own anti-ranking rule ("never
  // show a bare numeric score," "no gradient bars... up=better, down=
  // worse"), not just a styling issue. What it did is now covered two
  // other ways, neither of which encodes a ranking: the cone's own
  // rotate-to-face-a-rim view (TimeConeRing, see that file's header
  // comment) for "every reading, unranked, as a shape," and the Facts
  // page's own past-readings list (date + level, chronological, tap for
  // detail) for "browse in order." fullLineNote (the free-vs-paid "the
  // FULL line, not just the last few" signal) moved onto that list.

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
      <ScrollView key="resurfaced-wish" contentContainerStyle={styles.pageContent}>
        <View style={styles.wishSection}>
          {wishRevealed ? (
            <>
              <Text style={styles.wishHeading}>{t('yourArc.wishResurfaceHeading')}</Text>
              <Text style={styles.wishDate}>{formatDate(new Date(resurfacedWish.savedAt).getTime())}</Text>
              <Text style={styles.wishText}>{resurfacedWish.text}</Text>
              <Text style={styles.wishHint}>{t('yourArc.wishResurfaceHint')}</Text>
            </>
          ) : (
            <Pressable style={styles.wishRow} onPress={handleRevealWish}>
              <Text style={styles.wishRowText}>
                {t('yourArc.wishResurfaceRow', { date: formatDate(new Date(resurfacedWish.savedAt).getTime()) })}
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    );
  }

  // Page 4 — What calls you. The ACTIVE wish, standing on its own (moved
  // off Measure, 2026-08-14), plus the Crossing that builds from it —
  // both "present reaching toward future" material, so they share a page.
  // Unlike the resurfaced wish just above (a past moment, held until
  // tapped), the active wish is shown plainly — nothing to protect it
  // from, it's what's live right now.
  pages.push(
    <ScrollView key="wish-crossing" contentContainerStyle={styles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.whatCallsYou')}</Text>
      <View style={styles.wishSection}>
        {activeWish && !wishComposerOpen && (
          <>
            <Text style={styles.wishText}>{activeWish.text}</Text>
            {/* Ticking fulfilled (2026-08-19) — a real, positive claim
                the user makes about their own wish, separate from just
                writing a new one (see Wish.js's own comment on why this
                isn't the same as being superseded). Reversible — tapping
                again un-ticks, matching the app's "never a one-way,
                high-stakes commitment" posture elsewhere. */}
            <Pressable
              style={styles.wishFulfillRow}
              onPress={() => handleToggleWishFulfilled(activeWish)}
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
              onPress={handleSubmitNewWish}
              disabled={!newWishInput.trim() || newWishSubmitting}
            >
              <Text style={styles.crossingSendButtonText}>↑</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.wishRow} onPress={() => setWishComposerOpen(true)}>
            <Text style={styles.wishRowText}>
              {activeWish ? t('yourArc.changeWish') : t('measure.wishQuestion')}
            </Text>
          </Pressable>
        )}
        <Text style={styles.wishGroundRuleNote}>{t('measure.wishGroundRule')}</Text>
        {newWishRetryOffered && <Text style={styles.wishHint}>{t('measure.wishRetryNote')}</Text>}
      </View>

      {/* "Try it as if it's already true" (2026-08-18) — an explicitly-
          named EXERCISE (see tryAsTrueExplain's copy), not the app
          asserting anything as fact. Three states: closed (a quiet
          invite, same row register as the Crossing invite below),
          setting the present-tense line (the user's own words, once),
          then the repeat-writing pass itself (5 fresh, typed passes,
          no score/streak/judgment on how it went — see
          handleSubmitRepeatWriting's own comment). Only offered once a
          wish exists — this is explicitly about THIS wish, not a
          generic affirmation tool. */}
      {activeWish && !wishComposerOpen && (
        <View style={styles.crossingSection}>
          {!tryAsTrueOpen ? (
            <Pressable style={styles.crossingInviteRow} onPress={() => setTryAsTrueOpen(true)}>
              <Text style={styles.crossingInviteText}>{t('yourArc.tryAsTrueInvite')}</Text>
            </Pressable>
          ) : !presentTenseLine ? (
            <>
              <Text style={styles.wishHint}>{t('yourArc.tryAsTrueExplain')}</Text>
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
                  <Text style={styles.wishHint}>{t('yourArc.repeatWritingDone')}</Text>
                  <Pressable
                    style={styles.wishRow}
                    onPress={() => {
                      setRepeatWritingCount(0);
                      setPresentTenseLine(null);
                    }}
                  >
                    <Text style={styles.wishRowText}>{t('yourArc.repeatWritingRestart')}</Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.wishHint}>
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

      {/* The Crossing (docs/session-result-concept.md Phase 4 / the
          2026-08-13 "Crossing" design) — one philosopher-voiced question
          built from the active wish, offered only once it exists and
          nothing was generated for it yet. Not auto-fired on page load —
          a quiet, named invitation, matching "offered, not pushed." Once
          a Crossing exists, the philosopher's QUESTION is shown, but the
          user's own ANSWER — not the question — is the thing that gets
          kept; generation is idempotent per wish+reading pair (visiting
          again never regenerates a new question). */}
      {activeWish && !crossing && (
        <View style={styles.crossingSection}>
          <Pressable style={styles.crossingInviteRow} onPress={handleGenerateCrossing} disabled={crossingLoading}>
            <Text style={styles.crossingInviteText}>
              {crossingLoading
                ? t('yourArc.crossingLoading')
                : t('yourArc.crossingInvite', { name: philosopher?.name ?? '' })}
            </Text>
          </Pressable>
        </View>
      )}

      {crossing && (
        <View style={styles.crossingSection}>
          <Text style={styles.crossingHeading}>
            {t('yourArc.crossingHeading', { name: philosopher?.name ?? '' })}
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
                onPress={handleSubmitCrossingAnswer}
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
          reads as "wishes that came true," a record of what was WISHED,
          not a log of ticking activity). Only rendered once at least one
          exists; a person with none ticked yet sees no empty-state
          placeholder here, matching the rest of this screen's "a
          section that has nothing to show just doesn't render" pattern
          (e.g. the resurfaced-wish page). Each row can be un-ticked the
          same way it was ticked. */}
      {fulfilledWishes.length > 0 && (
        <View style={styles.fulfilledWishesSection}>
          <Text style={styles.wishHeading}>{t('yourArc.fulfilledWishesHeading')}</Text>
          {fulfilledWishes.map((wish) => (
            <View key={wish.id} style={styles.fulfilledWishRow}>
              <Text style={styles.fulfilledWishText}>{wish.text}</Text>
              <Pressable
                onPress={() => handleToggleWishFulfilled(wish)}
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
  {
    const latestReading = readingLog.length > 0 ? readingLog[readingLog.length - 1] : null;
    const latestLevel = latestReading
      ? VIBRATION_LEVELS.find((l) => l.slug === latestReading.levelSlug)
      : null;
    const latestLevelName = latestLevel ? getLocalizedLevelName(latestLevel, locale) : null;

    if (latestReading) {
      closingPageIndex = pages.length;
      pages.push(
        <ScrollView key="closing" contentContainerStyle={styles.pageCentered}>
          {/* Arrival beat (2026-08-20) — closingArrivalStyle animates
              scale+opacity from 0.94/0 to 1/1 each time closingArrivalToken
              changes (see that state's own comment for why a token, not a
              boolean, and why this can't just be a mount effect). Same
              curve/duration ArcKaleidoscope's own entrance uses, so
              reaching this page reads as arriving, matching "gather,
              condense, become," not one more instant page swap. */}
          <Animated.View style={closingArrivalStyle}>
            <Text style={styles.closingSynthesis}>
              {activeWish
                ? t('yourArc.closingSynthesisWithWish', { level: latestLevelName, wish: activeWish.text })
                : t('yourArc.closingSynthesisNoWish', { level: latestLevelName })}
            </Text>
            <Text style={styles.closingNeedLine}>{t('yourArc.closingNeedLine')}</Text>
            {!activeWish && !wishComposerOpen && (
              <Pressable style={styles.closingWishInvite} onPress={() => setWishComposerOpen(true)}>
                <Text style={styles.closingWishInviteText}>{t('yourArc.closingWishInvite')}</Text>
              </Pressable>
            )}
            {closingWriteSaved ? (
              <Text style={styles.closingWriteSavedText}>{t('yourArc.closingWriteSaved')}</Text>
            ) : (
              <View style={styles.closingWriteSection}>
                <Text style={styles.closingPrompt}>{t('yourArc.closingPrompt')}</Text>
                <TextInput
                  style={styles.closingWriteInput}
                  value={closingWriteInput}
                  onChangeText={setClosingWriteInput}
                  placeholder={t('yourArc.closingPromptPlaceholder')}
                  placeholderTextColor={colors.text.muted}
                  multiline
                  editable={!closingWriteSubmitting}
                />
                <Pressable
                  style={[
                    styles.closingWriteButton,
                    { opacity: closingWriteInput.trim() && !closingWriteSubmitting ? 1 : 0.4 },
                  ]}
                  onPress={handleSubmitClosingWrite}
                  disabled={!closingWriteInput.trim() || closingWriteSubmitting}
                >
                  <Text style={styles.closingWriteButtonText}>{t('yourArc.closingWriteButton')}</Text>
                </Pressable>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      );
    }
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
      <ScrollView key="detail" contentContainerStyle={styles.pageContent}>
        <Text style={styles.detailDate}>{formatDate(selected.ts)}</Text>
        {selectedRich ? (
          <>
            <Text style={styles.detailLevel}>
              {getLocalizedLevelName(selectedRich.vibrationLevel, locale)}
            </Text>
            {selectedRich.combinationMessage && (
              <Text style={styles.detailReflection}>{selectedRich.combinationMessage}</Text>
            )}

            {/* What you said — grouped by sphere, reusing AccountSection's
                own question/answer rendering pattern rather than
                inventing a second one. Purely descriptive, same as
                everywhere else on this screen — never captioned with
                what any of it means. */}
            {selectedRich.qaPairs.length > 0 && (
              <View style={styles.momentSection}>
                <Text style={styles.momentHeading}>{t('yourArc.whatYouSaid')}</Text>
                {selectedRich.qaPairs.map((pair, i) => (
                  <View key={i} style={styles.momentQA}>
                    <Text style={styles.momentQuestion}>{pair.question}</Text>
                    <Text style={styles.momentAnswer}>{pair.answer}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* The conversation that followed, if one was saved (Selfinder+). */}
            {loadingConversation ? null : linkedConversation && (
              <View style={styles.momentSection}>
                <Text style={styles.momentHeading}>{t('yourArc.whatYouTalkedAbout')}</Text>
                {linkedConversation.messages.map((msg, i) => (
                  <ChatTurn key={i} role={msg.role}>{msg.content}</ChatTurn>
                ))}
              </View>
            )}

            {/* A Spill entry kept close in time to this reading, if any —
                see SPILL_MATCH_WINDOW_MS's own comment for why this is a
                loose match, not a hard link. */}
            {linkedSpillEntry && (
              <View style={styles.momentSection}>
                <Text style={styles.momentHeading}>{t('yourArc.whatYouWrote')}</Text>
                <Text style={styles.momentSpillText}>{linkedSpillEntry.text}</Text>
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={styles.detailLevel}>{selected.levelSlug}</Text>
            {session && !richHistory && (
              <Text style={styles.detailNote}>
                {t('yourArc.turnOnSavingNote')}
              </Text>
            )}
            {!session && (
              <Text style={styles.detailNote}>
                {t('yourArc.signInToSaveNote')}
              </Text>
            )}
          </>
        )}
      </ScrollView>
    );
  }

  // Resolves handleConePointPress's request into a real { index, token }
  // for PagedScrollView, now that `pages` is fully built — the detail
  // page pushed just above is always the LAST page when `selected` is
  // set, so its index is simply pages.length - 1.
  const coneJumpTo = useMemo(
    () => (coneJumpToken !== null && selected ? { index: pages.length - 1, token: coneJumpToken } : null),
    [coneJumpToken, selected, pages.length]
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {/* Explicit destination, not router.back() — Your Arc's only real
          entry point is Depths' "Your arc" row, but this is now a
          top-level route (see app/_layout.tsx), so router.back()'s actual
          target depends on navigation-stack internals rather than where
          the user thinks they came from. Same fix as /sources. Sits above
          the pager, fixed, so it stays reachable from every page rather
          than only the first one. */}
      <Pressable style={styles.backRow} onPress={() => router.replace('/(tabs)/depths')}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>
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
          jumpTo={coneJumpTo}
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
  // Each swipeable page is its own ScrollView (per PagedScrollView's own
  // contract — a child that needs vertical scroll wraps its own content),
  // so there are two content-container shapes rather than one shared
  // `content`: pageCentered vertically centers short, hero-like pages
  // (Cover, Now) so they don't read as a tall page with content stranded
  // at the top; pageContent is a plain top-anchored padded column for
  // pages with more to read (What calls you, facts, Every walk, sphere
  // history, detail).
  pageCentered: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[12],
  },
  pageContent: {
    flexGrow: 1,
    padding: spacing[6],
    paddingBottom: spacing[16],
  },
  // The cone page's own layout (2026-08-19) — space-between spreads the
  // top framing line, the cone itself, and the bottom framing line across
  // the full page height, rather than clustering everything at vertical
  // center the way pageCentered does. This is what makes "top says
  // future, bottom says past, cone fills the big space between them"
  // actually read as three deliberately-placed zones instead of one
  // centered stack.
  // justifyContent: 'space-between' (removed 2026-08-20) pushed the top/
  // bottom framing lines all the way to the page edges, as far from the
  // cone as possible — review: "the clarifiers 'above' and 'below' should
  // be positioned closer to the cone to make it more visible what they're
  // clarifying." Real flex spacers above/below the whole content block
  // (coneTopSpacer/coneBottomSpacer) center the block vertically instead,
  // while the framing text keeps a small fixed margin to the cone itself
  // (see coneFramingTop/Bottom's own marginBottom/marginTop) — same fix
  // shape as Cover's own space-between bug from the same review pass.
  conePageContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[10],
  },
  coneTopSpacer: { flex: 1, minHeight: spacing[4] },
  coneBottomSpacer: { flex: 1, minHeight: spacing[4] },
  // Editorial-cover layout (2026-08-22): quote, kaleidoscope, and title
  // are now ONE centered composition — the "subject" of the cover, per
  // how a magazine or album cover balances art+title as a single group
  // rather than pinning each element to its own edge and letting
  // whatever's left over become one large, accidental-looking gap.
  // justifyContent: 'center' centers that whole cluster in the space
  // between the back link and the caption; the caption stays pinned to
  // the true bottom via coverCaptionRow below (a colophon/imprint line,
  // deliberately outside the centered art group, the way a cover's small
  // print sits apart from the cover art itself).
  coverPageContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    paddingTop: spacing[8],
    paddingBottom: spacing[10],
  },
  backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  // Consistent rhythm across the whole centered cluster (quote →
  // kaleidoscope → title) — same spacing[6] gap on both sides of the
  // image, replacing three different ad hoc gaps (tight/tight/huge) that
  // made the page read as unfinished rather than composed.
  kaleidoscopeWrap: { alignSelf: 'center', marginTop: spacing[6], marginBottom: spacing[6] },
  // Pinned to the true bottom of the page, deliberately separate from the
  // centered quote+image+title cluster above — small print under a cover,
  // not part of the composed art itself. flex: 1 pushes it down whenever
  // the centered cluster doesn't already fill the page; minHeight keeps a
  // minimum gap on tall screens where the cluster is short enough that
  // centering alone would land it close to the caption.
  coverCaptionRow: { flex: 1, minHeight: spacing[8], justifyContent: 'flex-end', width: '100%' },
  kaleidoscopeCaption: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    textAlign: 'left',
    alignSelf: 'flex-start',
    width: '100%',
  },
  // Fixed height matching TimeCone's own taller shape (CONE_SIZE * 1.3,
  // the tallest of the two things CrossfadeSwitcher swaps between here —
  // TimeConeRing is only CONE_SIZE square) — 2026-08-20 round 3: "make
  // the rest of the page content stay in their dedicated positions while
  // the cone is turning." Without this, CrossfadeSwitcher's wrapper
  // shrinks to whichever child is currently mounted alone once its fade
  // settles, so everything below (rotation links, framing text, legend)
  // visibly jumped up/down on every rotation. justifyContent centers
  // TimeConeRing's shorter square vertically in the reserved space
  // instead of pinning it to the top.
  timeConeWrap: {
    alignSelf: 'center',
    marginBottom: spacing[3],
    height: CONE_SIZE * 1.3,
    justifyContent: 'center',
  },
  // The rotation controls (2026-08-20) — quiet, side-by-side text links,
  // same register as tapPointHint below them.
  coneRotateRow: {
    flexDirection: 'row',
    gap: spacing[5],
    marginBottom: spacing[4],
  },
  coneRotateLink: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
  },
  kicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  // Cover's own title — now the closing element of the centered
  // quote+image+title cluster (2026-08-22 editorial-cover pass), the way
  // an album/magazine cover's title sits directly under its art as one
  // balanced group rather than acting as a section header for whatever
  // follows. Centered, not left-aligned/full-width, to match the quote
  // and image above it — a left-aligned block would break the cluster's
  // own symmetry now that it's a self-contained centered composition
  // rather than the top of a top-anchored page.
  coverTitle: {
    alignSelf: 'center',
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * lineHeights.tight,
    textAlign: 'center',
  },
  // Philosopher voice, opening the page (2026-08-20 round 3, moved above
  // the kaleidoscope entirely rather than centered with it in a middle
  // group) — matches RULES.md's standing "philosopher voice, then plain
  // clarifying line" pattern. No fontStyle: 'italic' (dropped — it was a
  // silent no-op on this typeface, see the JSX comment above this line's
  // own Text element); the quote marks in the string itself now carry the
  // "this is spoken" signal instead of a slant that was never rendering.
  coverPhilosopherLine: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  // The cone page's own top/bottom framing (2026-08-19) — centered, not
  // left-aligned like coneFramingLine above, since these sit directly
  // above/below the cone itself (a centered shape) rather than under a
  // left-aligned title block the way the Cover page's framing line does.
  // marginBottom/marginTop (2026-08-20) pull these close to the cone
  // itself, replacing the old justifyContent: space-between layout that
  // pushed them to the page's own top/bottom edges — see conePageContent's
  // own comment.
  coneFramingTop: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[4],
  },
  coneFramingBottom: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
    marginTop: spacing[4],
  },
  // The long-press preview (2026-08-20) — same restrained register as the
  // rest of this page's supporting text, not a popover/tooltip box (no
  // "cards" per aesthetic.md).
  conePreviewText: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  // The tap summary (2026-08-20 round 3) — a fuller, inline alternative
  // to the pager jump handleConePointPress used to trigger automatically.
  // Centered, same register as the rest of this page (framing lines,
  // preview text) rather than the Detail page's own left-aligned block —
  // this is a quieter, in-place look at one reading, not a full page.
  conePointSummary: {
    alignItems: 'center',
    marginTop: spacing[4],
    paddingHorizontal: spacing[4],
  },
  conePointSummaryDate: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  conePointSummaryLevel: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    textTransform: 'capitalize',
    marginTop: spacing[1],
  },
  conePointSummaryReflection: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  conePointSummaryLink: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[3],
  },
  // The legend (2026-08-20) — two quiet rows, dot + label, same "a dot,
  // colored by what's actually true" register the facts page's own
  // factDot/factRow already use.
  coneLegend: {
    marginTop: spacing[5],
    gap: spacing[2],
    alignItems: 'flex-start',
  },
  coneLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  coneLegendDot: { width: 6, height: 6, borderRadius: 3 },
  coneLegendText: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  introLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[8],
  },
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
  // Still real sentences, same voice as introLine (not a stat-block/badge
  // register — no bare numbers, no label-colon-value rows) — these are
  // the immediate answer to "what is this page," sitting before the
  // sparkline rather than only surfacing after a tap. Pulled up slightly
  // to sit closer to introLine than the sparkline below it (introLine's
  // own marginBottom already provides the gap down to the sparkline when
  // there are no facts to show). Real gap between rows (not factLine's
  // own line-height alone) is what sets this apart from a paragraph —
  // each fact now reads as its own noticed thing, not a continuation of
  // the sentence above it.
  // alignSelf: 'flex-start' — needed once this section moved onto the Now
  // page (2026-08-18 merge), whose pageCentered container horizontally
  // centers its children by default; without this the facts block (and
  // each left-aligned row inside it) would float centered instead of
  // reading as a continuation of introLine's own left-aligned column
  // directly above it. The original standalone facts page used
  // pageContent (already left-anchored), so this wasn't needed there.
  // width: '100%' (not just alignSelf: 'flex-start') is load-bearing: a
  // flex column with no explicit width shrinks to fit its content in
  // React Native, and factLine below (flex: 1, meant to let long fact
  // text wrap) computes to zero width inside a shrink-to-fit parent with
  // nothing to flex against — confirmed live (2026-08-19): the dots
  // rendered but every fact's text was invisible, collapsed to nothing,
  // on a real device. width: '100%' gives factRow's flex: 1 children a
  // real container width to divide.
  factsSection: {
    alignSelf: 'flex-start',
    width: '100%',
    marginTop: spacing[3],
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  factRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  // Same restrained "a dot, colored by what's actually true" language
  // SphereArc's own trace dots already use — steadiest takes its real
  // level's color; the count-based facts take the page's one accent color
  // (never a second invented hue, per aesthetic.md's "one color per
  // screen" rule). Sized to sit level with the first line of text, not
  // vertically centered on a wrapped two-line fact.
  factDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    backgroundColor: colors.text.faint,
  },
  factLine: {
    flex: 1,
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  // Past readings list (2026-08-20) — same date-then-level row shape as
  // AccountSection's own history list on the You page, no bare score
  // (per RULES.md — see that file's own fix). No border/box per
  // aesthetic.md's "no cards" rule; a thin top border on the section as a
  // whole (matching AccountSection's historySection) is enough to
  // separate this from the facts above it without boxing each row.
  pastReadingsSection: {
    marginTop: spacing[6],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
    gap: spacing[1],
  },
  pastReadingsKicker: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  pastReadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  pastReadingDate: { color: colors.text.muted, fontFamily: fonts.light, fontSize: fontSizes.xs },
  pastReadingLevel: { color: colors.text.primary, fontFamily: fonts.light, fontSize: fontSizes.sm },
  // "Held, not displayed" — the row itself is a plain sentence, same
  // register as tapPointHint below (an instruction/label, not a card),
  // no border/box per aesthetic.md's "no cards" rule. Sits between the
  // facts and the sparkline: it's its own kind of true, real information
  // about the record, same tier as the facts above it, but distinct
  // enough (a private, held thing rather than a public count) to get its
  // own quiet section instead of joining the factsSection list.
  wishSection: {
    marginBottom: spacing[6],
  },
  wishRow: { paddingVertical: spacing[1] },
  wishRowText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  // Revealed state — same visual register as momentHeading/momentSpillText
  // below (the wish is the person's own written words, same kind of
  // material as a kept Spill entry), not a new visual language invented
  // just for this one row.
  wishHeading: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  wishDate: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[1],
  },
  wishText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[2],
  },
  wishHint: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginTop: spacing[2],
  },
  wishGroundRuleNote: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    marginTop: spacing[2],
  },
  // Ticking fulfilled (2026-08-19) — deliberately quiet, same weight as
  // wishHint/wishGroundRuleNote rather than a prominent button; this is
  // an optional, low-ceremony action, not the page's main call to action.
  wishFulfillRow: { paddingVertical: spacing[1], marginTop: spacing[2] },
  wishFulfillText: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
  },
  // The fulfilled-wishes list — same "no cards" register as everything
  // else on this page. Each row pairs the wish's own words (italic, same
  // register as wishText — it's the same kind of material) with a small
  // trailing un-tick control, not a checkbox/badge icon (per aesthetic.md,
  // no new iconography for something a plain word already says).
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
  // The closing page (2026-08-20, Thread 2) — centered like Cover/Cone,
  // not left-aligned like the list-style pages, since this is a single
  // felt moment, not content to scan.
  closingSynthesis: {
    color: colors.text.primary,
    fontFamily: fonts.light,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * lineHeights.normal,
    textAlign: 'center',
  },
  closingNeedLine: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    textAlign: 'center',
    marginTop: spacing[5],
    paddingHorizontal: spacing[4],
  },
  closingWishInvite: { marginTop: spacing[5] },
  closingWishInviteText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
  },
  closingWriteSection: { width: '100%', marginTop: spacing[8], alignItems: 'center' },
  closingPrompt: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  closingWriteInput: {
    width: '100%',
    minHeight: 80,
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
  closingWriteButton: { alignSelf: 'center', marginTop: spacing[3], paddingVertical: spacing[1] },
  closingWriteButtonText: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
  },
  closingWriteSavedText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  // The Crossing — same "no cards" register as the wish section above
  // (a plain sentence/row, not a bordered box), until it's answered, at
  // which point it reads as its own small moment (heading, question,
  // saved answer) matching momentSection's own visual language.
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
  fullLineNote: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginBottom: spacing[3],
  },
  pastReadingsTapHint: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginBottom: spacing[3],
  },
  tapPointHint: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    marginBottom: spacing[2],
  },
  detailSection: {
    gap: spacing[2],
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.bg.border,
  },
  detailDate: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
  },
  detailLevel: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.md,
    textTransform: 'capitalize',
  },
  detailReflection: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[1],
  },
  detailNote: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
    marginTop: spacing[1],
  },
  momentSection: { marginTop: spacing[5], gap: spacing[3] },
  momentHeading: {
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  momentQA: { gap: spacing[1] },
  momentQuestion: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * lineHeights.normal,
  },
  momentAnswer: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  momentSpillText: {
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
  },
  });
}
