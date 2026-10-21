import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, InteractionManager } from 'react-native';
import Animated, { Easing, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useMeasureStore } from '../src/store/measureStore';
import { useShiftStore } from '../src/store/shiftStore';
import { useAuthStore } from '../src/store/authStore';
import { useLocaleStore } from '../src/store/localeStore';
import { getMe, getMeasureHistory } from '../src/api/user';
import { getConversationForMeasureResult, SavedConversation } from '../src/api/conversation';
import { listMySpillEntries, SavedSpillEntry } from '../src/api/spill';
import { listMyJourneySessions } from '../src/api/journeys';
import type { SavedMeasureResult, JourneySessionDTO } from '../src/types';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { BackLink } from '../src/components/shared/BackLink';
import { ArcDial } from '../src/components/yourArc/ArcDial';
import { DetailPage } from '../src/components/yourArc/pages/DetailPage';
import { JourneyMoment, ShiftMoment } from '../src/components/yourArc/moments';
import { track } from '../src/utils/analytics';

const SOFT_EASE = Easing.bezier(0.16, 1, 0.3, 1);
// Spill has no reading link — kept writing counts as "from this moment"
// only if it's close in time.
const SPILL_MATCH_WINDOW_MS = 30 * 60 * 1000;

type Stop =
  | { id: string; ts: number; kind: 'reading' }
  | { id: string; ts: number; kind: 'shift'; at: string }
  | { id: string; ts: number; kind: 'journey'; session: JourneySessionDTO };

// Where you've been (2026-10-21 — docs/your-arc-concept.md §3): every
// moment, reached from the past part of Your Arc's cone. The dial moves
// through them, oldest to newest, landing on the most recent, and the
// moment it's on shows in full right above it — what was said, the
// reflection, the conversation and writing kept close to it; a Shift
// session's from → to and its words; a Journey's result. A record, never
// an analysis.
export default function YourArcPastScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const locale = useLocaleStore((s) => s.locale);
  const readingLog = useMeasureStore((s) => s.readingLog);
  const sessions = useShiftStore((s) => s.sessions);
  const hydrateShifts = useShiftStore((s) => s.hydrate);
  const session = useAuthStore((s) => s.session);

  const [richHistory, setRichHistory] = useState<SavedMeasureResult[] | null>(null);
  const [spillEntries, setSpillEntries] = useState<SavedSpillEntry[] | null>(null);
  const [journeySessions, setJourneySessions] = useState<JourneySessionDTO[]>([]);
  const [conversation, setConversation] = useState<SavedConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    hydrateShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Once, after the screen transition — the moments still show their date
  // and state without it.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        const [profile, history, entries, journeys] = await Promise.all([
          getMe(session.token),
          getMeasureHistory(session.token),
          listMySpillEntries(session.token),
          listMyJourneySessions(session.token),
        ]);
        if (cancelled || !profile.consent?.psychologicalData?.given) return;
        setRichHistory(history);
        setSpillEntries(entries);
        setJourneySessions(journeys.filter((j) => j.completedAt));
      } catch {
        // Best-effort.
      }
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
  }, [session]);

  const stops: Stop[] = useMemo(
    () =>
      [
        ...readingLog.map((e) => ({ id: `reading-${e.ts}`, ts: e.ts, kind: 'reading' as const })),
        ...sessions.map((s) => ({ id: `shift-${s.at}`, ts: new Date(s.at).getTime(), kind: 'shift' as const, at: s.at })),
        ...journeySessions.map((j) => ({
          id: `journey-${j.id}`,
          ts: new Date(j.completedAt!).getTime(),
          kind: 'journey' as const,
          session: j,
        })),
      ].sort((a, b) => a.ts - b.ts),
    [readingLog, sessions, journeySessions],
  );

  const [index, setIndex] = useState(Math.max(0, stops.length - 1));
  // Lands on the most recent whenever the record grows (a Journey's
  // results arriving from the server, say).
  useEffect(() => setIndex(Math.max(0, stops.length - 1)), [stops.length]);
  const focused = stops[Math.min(index, stops.length - 1)] as Stop | undefined;

  const reading = focused?.kind === 'reading' ? readingLog.find((e) => e.ts === focused.ts) : undefined;
  const readingRich = reading
    ? richHistory?.find((r) => Math.abs(new Date(r.savedAt).getTime() - reading.ts) < 60_000)
    : undefined;
  const readingSpill = reading
    ? spillEntries?.find((e) => Math.abs(new Date(e.savedAt).getTime() - reading.ts) < SPILL_MATCH_WINDOW_MS)
    : undefined;

  useEffect(() => {
    if (!readingRich?.id || !session) {
      setConversation(null);
      return;
    }
    let cancelled = false;
    setLoadingConversation(true);
    getConversationForMeasureResult(readingRich.id, session.token).then((c) => {
      if (!cancelled) {
        setConversation(c);
        setLoadingConversation(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [readingRich?.id, session]);

  useEffect(() => {
    if (focused) track('your_arc_moment_opened', { kind: focused.kind });
  }, [focused?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const shift = focused?.kind === 'shift' ? sessions.find((s) => s.at === focused.at) : undefined;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <BackLink style={styles.backRow} />
      <Text style={styles.kicker} accessibilityRole="header">{t('yourArc.zonePastLabel')}</Text>

      <View style={styles.moment}>
        {!focused ? (
          <Text style={styles.empty}>{t('yourArc.pastEmpty')}</Text>
        ) : (
          <Animated.View key={focused.id} style={styles.moment} entering={FadeIn.duration(400).easing(SOFT_EASE)}>
            {reading ? (
              <DetailPage
                selected={reading}
                selectedRich={readingRich}
                linkedConversation={conversation}
                loadingConversation={loadingConversation}
                linkedSpillEntry={readingSpill}
                hasSession={!!session}
                hasRichHistory={!!richHistory}
                locale={locale}
              />
            ) : shift ? (
              <ShiftMoment session={shift} />
            ) : focused.kind === 'journey' ? (
              <JourneyMoment session={focused.session} />
            ) : null}
          </Animated.View>
        )}
      </View>

      {stops.length > 1 && (
        // Only the top of the wheel shows: the pointer and the moments
        // either side of it, the rest turning out of view below.
        <View style={[styles.dialWindow, { marginBottom: insets.bottom + spacing[2] }]}>
          <ArcDial
            total={stops.length}
            activeIndex={Math.min(index, stops.length - 1)}
            pageLabels={stops.map(() => undefined)}
            onRequestIndex={setIndex}
          />
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6] },
    kicker: {
      color: colors.text.faint,
      fontFamily: fonts.medium,
      fontSize: 10,
      letterSpacing: letterSpacings.kicker,
      textTransform: 'uppercase',
      paddingHorizontal: spacing[6],
      marginTop: spacing[4],
    },
    moment: { flex: 1 },
    empty: {
      color: colors.text.secondary,
      fontFamily: fonts.medium,
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * 1.5,
      padding: spacing[6],
    },
    dialWindow: { height: 58, overflow: 'hidden', alignSelf: 'stretch', alignItems: 'center' },
  });
}
