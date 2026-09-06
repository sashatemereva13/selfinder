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
import { routeToCrisisSupport } from '../src/utils/routeToCrisisSupport';
import { generateCrossing, answerCrossing, listMyCrossings, SavedCrossing } from '../src/api/crossing';
import { selectWishToResurface } from '../src/utils/wishResurfacing';
import { findActiveWish, findExistingCrossing } from '../src/utils/crossingEligibility';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { PagedScrollView } from '../src/components/PagedScrollView';
import { ArcDial } from '../src/components/ArcDial';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { getLocalizedLevelName, VIBRATION_LEVELS } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';
import { ResurfacedWishPage } from '../src/components/yourArcPages/ResurfacedWishPage';
import { WishCrossingPage } from '../src/components/yourArcPages/WishCrossingPage';
import { CrossingPage } from '../src/components/yourArcPages/CrossingPage';
import { ClosingPage } from '../src/components/yourArcPages/ClosingPage';

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

  const [richDataLoading, setRichDataLoading] = useState(false);
  const [pagerPainted, setPagerPainted] = useState(false);
  const [activeDialIndex, setActiveDialIndex] = useState(0);
  const [dialJumpRequest, setDialJumpRequest] = useState<{ index: number; token: number } | null>(null);

  const [resurfacedWish, setResurfacedWish] = useState<SavedWish | null>(null);
  const [wishRevealed, setWishRevealed] = useState(false);
  const [allWishes, setAllWishes] = useState<SavedWish[]>([]);
  const [activeWish, setActiveWish] = useState<SavedWish | null>(null);
  const [wishFulfillPending, setWishFulfillPending] = useState<string | null>(null);
  const [crossing, setCrossing] = useState<SavedCrossing | null>(null);
  const [crossingLoading, setCrossingLoading] = useState(false);
  const [crossingAnswerInput, setCrossingAnswerInput] = useState('');
  const [crossingSubmitting, setCrossingSubmitting] = useState(false);
  const [wishComposerOpen, setWishComposerOpen] = useState(false);
  const [newWishInput, setNewWishInput] = useState('');
  const [newWishSubmitting, setNewWishSubmitting] = useState(false);
  const [newWishRetryOffered, setNewWishRetryOffered] = useState(false);
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
          const [profile, wishes, crossings] = await Promise.all([
            getMe(session.token),
            listMyWishes(session.token),
            listMyCrossings(session.token),
          ]);
          if (cancelled || !profile.consent?.psychologicalData?.given) return;
          setResurfacedWish(selectWishToResurface(wishes));
          setAllWishes(wishes);

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

  const handleRevealWish = () => {
    setWishRevealed(true);
    if (resurfacedWish && session) {
      markWishResurfaced(resurfacedWish.id, session.token);
    }
  };

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
        const fresh: SavedWish = { id: result.id, text, measureResultId: null, savedAt: new Date().toISOString(), resurfacedAt: null, fulfilledAt: null };
        setActiveWish(fresh);
        setAllWishes((prev) => [fresh, ...prev]);
        setCrossing(null);
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
    if (saved) setClosingWriteSaved(true);
  };

  const fulfilledWishes = useMemo(
    () =>
      allWishes
        .filter((w) => w.fulfilledAt)
        .sort((a, b) => new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime()),
    [allWishes]
  );

  const latestReading = readingLog.length > 0 ? readingLog[readingLog.length - 1] : null;
  const latestLevel = useMemo(
    () => (latestReading ? VIBRATION_LEVELS.find((l) => l.slug === latestReading.levelSlug) : null),
    [latestReading]
  );
  const latestLevelName = latestLevel ? getLocalizedLevelName(latestLevel, locale) : null;

  const pages: React.ReactNode[] = [];
  const pageLabels: string[] = [];
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
  }

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
      accentRgb={accentRgb}
      onSubmitNewWish={handleSubmitNewWish}
      onToggleWishFulfilled={handleToggleWishFulfilled}
    />
  );
  pageLabels.push(t('yourArc.whatCallsYou'));

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
      onGenerateCrossing={handleGenerateCrossing}
      onSubmitCrossingAnswer={handleSubmitCrossingAnswer}
      onToggleWishFulfilled={handleToggleWishFulfilled}
    />
  );
  pageLabels.push(t('yourArc.crossingKicker'));

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
        accentRgb={accentRgb}
      />
    );
    pageLabels.push(t('yourArc.closingDialLabel'));
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>
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
    backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
    loadingNote: {
      alignSelf: 'flex-start',
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontStyle: 'italic',
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
