import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, StyleSheet, InteractionManager } from 'react-native';
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
import { getArcLine } from '../src/api/arcLine';
import { listMySpillEntries, SavedSpillEntry } from '../src/api/spill';
import { listMyWishes, SavedWish } from '../src/api/wish';
import { listMyCrossings } from '../src/api/crossing';
import { findActiveWish } from '../src/components/yourArc/crossingEligibility';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { listMyJourneySessions } from '../src/api/journeys';
import { SavedMeasureResult, JourneySessionDTO } from '../src/types';
import { ArcKaleidoscopeLoading } from '../src/components/shared/ArcKaleidoscopeLoading';
import { BackLink } from '../src/components/shared/BackLink';
import { PagedScrollView } from '../src/components/yourArc/PagedScrollView';
import { ArcDial } from '../src/components/yourArc/ArcDial';
import { buildArcFacts } from '../src/components/yourArc/arcFacts';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { track } from '../src/utils/analytics';
import { useLevelColors } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';
import { DetailPage } from '../src/components/yourArc/pages/DetailPage';
import { FactsPage } from '../src/components/yourArc/pages/FactsPage';
import { JourneysPage } from '../src/components/yourArc/pages/JourneysPage';
import { TimeConePage } from '../src/components/yourArc/pages/TimeConePage';

// Same loose-match window your-arc.tsx used to use for qaPairs/rich-history
// matching — Spill has no reading link (it's its own free-standing
// practice, not reading-scoped by design, see RULES.md), so a kept entry
// only counts as "from this moment" if it's close in time, not by a hard
// foreign key.
const SPILL_MATCH_WINDOW_MS = 30 * 60 * 1000;

const KALEIDOSCOPE_SIZE = 300;
const FIRST_PAINT_FALLBACK_MS = 900;

// Your Arc's past sub-pager (2026-09-05 hub restructure — see
// your-arc.tsx's own header comment for the full before/after). Everything
// this file contains — Facts, the light cone, Journeys, and the
// dynamically-appended Detail page — used to live in your-arc.tsx's single
// flat pager; it's unchanged in substance here, just split into its own
// standalone route reached by tapping the hub's PAST zone. Its own scoped
// data fetch below is the readingLog/richHistory/facts/journeySessions half
// of the old single 6-call Promise.all — the wish/crossing half moved to
// your-arc-future.tsx instead, since only the future pager's pages actually
// read it.
export default function YourArcPastRoute() {
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

  return <YourArcPastScreen />;
}

function YourArcPastScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const readingLog = useMeasureStore((s) => s.readingLog);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const session = useAuthStore((s) => s.session);
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const accentRgb = useAppAccentRgb();
  const levelColors = useLevelColors();

  const [richHistory, setRichHistory] = useState<SavedMeasureResult[] | null>(null);
  const [spillEntries, setSpillEntries] = useState<SavedSpillEntry[] | null>(null);
  const [journeySessions, setJourneySessions] = useState<JourneySessionDTO[] | null>(null);
  const [allWishes, setAllWishes] = useState<SavedWish[]>([]);
  // 2026-09-13, at the user's own request — arcLine used to live on
  // ArcLinePage (the hub screen) as a philosopher-voiced remark layered
  // over the light cone; removed from there because it competed with the
  // cone's own tap affordances (see ArcLinePage's own header comment).
  // Its actual content — one remark generated from the WHOLE record
  // (reading count/streak, most recent level, active wish; see
  // arcLine.ts's own header comment) — matches FactsPage's own scope
  // (this page already opens on a factual summary of the whole record)
  // more than any single-reading page would, so it's re-homed here
  // instead of being left orphaned. Fetched alongside this file's own
  // existing rich-data Promise.all rather than a separate effect.
  const [arcLine, setArcLine] = useState<string | null>(null);
  // richDataLoading: true while the scoped server fetch (getMe, history,
  // spill, wishes, crossings, journey sessions) is in flight — the facts
  // row, sphere-arc trace, and Journeys section all depend on it and
  // previously just popped in silently with no indication more was coming
  // (2026-08-14 collaboration notes, carried over unchanged from
  // your-arc.tsx). The bare local-readingLog render still happens
  // immediately regardless — this only covers the richer sections.
  const [richDataLoading, setRichDataLoading] = useState(false);
  // Gates the pager itself — see your-arc.tsx's OLD pagerPainted comment
  // (2026-08-14/20 "Hang detected" device logs) for the full reasoning this
  // preserves unchanged: mount the real pager hidden via absolute+opacity,
  // swap visible once onLayout fires, so the expensive first render (the
  // time cone's own per-reading circles) happens WHILE the loading
  // animation is still visibly playing rather than silently after it
  // disappears.
  const [pagerPainted, setPagerPainted] = useState(false);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);
  const [activeDialIndex, setActiveDialIndex] = useState(0);
  const [dialJumpRequest, setDialJumpRequest] = useState<{ index: number; token: number } | null>(null);
  // Set by handleFactsReadingPress — see PagedScrollView's own jumpTo prop
  // for why this is a token (a value that changes per tap), not a plain
  // boolean/index: the detail page always lands in the same page slot, so
  // two separate taps can resolve to an identical target index, and only a
  // per-request token reliably tells them apart.
  const [detailJumpToken, setDetailJumpToken] = useState<number | null>(null);
  const [linkedConversation, setLinkedConversation] = useState<SavedConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setRichDataLoading(true);
    // Deferred until the screen-transition animation actually finishes —
    // same InteractionManager reasoning your-arc.tsx's original fetch
    // documented (2026-08-14: "Hang detected: 4.52s" right as the network
    // connection for this fetch started setting up, competing with the
    // route transition for the main thread). Preserved unchanged here.
    const task = InteractionManager.runAfterInteractions(() => {
      (async () => {
        try {
          const [profile, history, entries, wishes, , sessions] = await Promise.all([
            getMe(session.token),
            getMeasureHistory(session.token),
            listMySpillEntries(session.token),
            listMyWishes(session.token),
            listMyCrossings(session.token),
            listMyJourneySessions(session.token),
          ]);
          if (cancelled || !profile.consent?.psychologicalData?.given) return;
          setRichHistory(history);
          setSpillEntries(entries);
          setJourneySessions(sessions);
          setAllWishes(wishes);
          // Best-effort, separate from the Promise.all above — arcLine
          // needs `philosopher` (unlike every other fetch here), and its
          // own function already returns null on any failure/missing
          // token, so a plain sequential call (not blocking the rest of
          // this fetch on it) is enough.
          if (philosopher) {
            const line = await getArcLine(philosopher, session.token);
            if (!cancelled) setArcLine(line);
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
  }, [session, currentResult?.savedAt, currentResult?.measureResultId, philosopher]);

  useEffect(() => {
    const fallback = setTimeout(() => setPagerPainted(true), FIRST_PAINT_FALLBACK_MS);
    return () => clearTimeout(fallback);
  }, []);

  // Opens the detail page from a tap on the Facts page's own reading list
  // — reuses the exact same `selected` state the Detail page already
  // drives, so this is a second entry point into one shared detail, not a
  // separate mechanism. Resolves a richHistory item back to its matching
  // readingLog entry by closest timestamp — same 60s tolerance
  // selectedRich already uses in the opposite direction.
  const handleFactsReadingPress = (rich: SavedMeasureResult) => {
    const entry = readingLog.find((e) => Math.abs(e.ts - new Date(rich.savedAt).getTime()) < 60_000);
    if (entry) {
      setSelected(entry);
      setDetailJumpToken(Date.now());
      track('your_arc_past_detail_viewed', { levelSlug: entry.levelSlug });
    }
  };

  const selectedRich = selected
    ? richHistory?.find((r) => Math.abs(new Date(r.savedAt).getTime() - selected.ts) < 60_000)
    : undefined;

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

  const linkedSpillEntry = selected
    ? spillEntries?.find((e) => Math.abs(new Date(e.savedAt).getTime() - selected.ts) < SPILL_MATCH_WINDOW_MS)
    : undefined;

  const facts = useMemo(() => buildArcFacts(readingLog), [readingLog]);
  const sinceDate = readingLog.length > 0 ? formatDate(readingLog[0].ts) : '';
  const activeWish = useMemo(() => findActiveWish(allWishes), [allWishes]);

  const pages: React.ReactNode[] = [];
  const pageLabels: string[] = [];
  // Stable, untranslated identifiers parallel to pageLabels/pages — used
  // only for analytics (see onActiveIndexChange below); pageLabels itself
  // is user-facing translated text and the wrong thing to send as an
  // event property.
  const pageIds: string[] = [];

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
      arcLine={arcLine}
    />
  );
  pageLabels.push(t('yourArc.factsKicker'));
  pageIds.push('facts');

  pages.push(
    <TimeConePage
      key="time-cone"
      readingLog={readingLog}
      allWishes={allWishes}
      activeWish={activeWish}
      locale={locale}
    />
  );
  pageLabels.push(t('yourArc.coneKicker'));
  pageIds.push('time_cone');

  if (journeySessions !== null) {
    pages.push(<JourneysPage key="journeys" sessions={journeySessions} locale={locale} />);
    pageLabels.push(t('yourArc.journeysKicker'));
    pageIds.push('journeys');
  }

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
    pageLabels.push(t('yourArc.detailDialLabel'));
    pageIds.push('detail');
  }

  const detailJumpTo = useMemo(
    () => (detailJumpToken !== null && selected ? { index: pages.length - 1, token: detailJumpToken } : null),
    [detailJumpToken, selected, pages.length]
  );

  const combinedJumpTo = useMemo(() => {
    if (detailJumpTo && dialJumpRequest) {
      return detailJumpTo.token >= dialJumpRequest.token ? detailJumpTo : dialJumpRequest;
    }
    return detailJumpTo ?? dialJumpRequest;
  }, [detailJumpTo, dialJumpRequest]);

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
          jumpTo={combinedJumpTo}
          hideDots
          onActiveIndexChange={(index) => {
            setActiveDialIndex(index);
            const pageId = pageIds[index];
            if (pageId) track('your_arc_past_page_viewed', { page: pageId });
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

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
