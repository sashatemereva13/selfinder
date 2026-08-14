import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, TextInput, InteractionManager } from 'react-native';
import Svg, { Path } from 'react-native-svg';
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
import { listMySpillEntries, SavedSpillEntry } from '../src/api/spill';
import { listMyWishes, markWishResurfaced, saveWishIfConsented, SavedWish } from '../src/api/wish';
import { routeToCrisisSupport } from '../src/utils/routeToCrisisSupport';
import { generateCrossing, answerCrossing, listMyCrossings, SavedCrossing } from '../src/api/crossing';
import { selectWishToResurface } from '../src/utils/wishResurfacing';
import { findActiveWish, findExistingCrossing } from '../src/utils/crossingEligibility';
import { usePhilosopherStore } from '../src/store/philosopherStore';
import { SavedMeasureResult } from '../src/types';
import { SPARKLINE_VIEW_W, SPARKLINE_VIEW_H } from '../src/components/arcSparkline';
import { SphereArc } from '../src/components/SphereArc';
import { TimeCone, TimeConePoint } from '../src/components/TimeCone';
import { ArcKaleidoscope } from '../src/components/ArcKaleidoscope';
import { ChatTurn } from '../src/components/ChatTurn';
import { PagedScrollView } from '../src/components/PagedScrollView';
import { buildSphereHistory } from '../src/utils/sphereHistory';
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

const VIEW_W = SPARKLINE_VIEW_W;
const VIEW_H = SPARKLINE_VIEW_H;
const PAD_Y = 4;
// Points closer together than this many view-units don't get their own
// tap target — at full history, a long line can pack dozens of points
// within a few pixels of each other, and a marker too small to reliably
// tap is worse than no marker at all.
const MIN_TAP_SPACING = 3;
// Fills most of the content column's own width without touching its
// padding — the kaleidoscope reads as a real, spacious presence (same
// reasoning DepthsSpiral's own canvas sizing uses), not a small diagram.
const KALEIDOSCOPE_SIZE = 300;
// Taller than wide — TimeCone's own two-cone-plus-vertex shape needs
// vertical room (see TimeCone.tsx's CONE_HEIGHT_RATIO) more than it
// needs width, unlike the kaleidoscope's square footprint.
const CONE_SIZE = 260;

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
export default function YourArcScreen() {
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
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);
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
        const fresh: SavedWish = { id: result.id, text, measureResultId: null, savedAt: new Date().toISOString(), resurfacedAt: null };
        setActiveWish(fresh);
        setCrossing(null);
      }
    } finally {
      setNewWishSubmitting(false);
    }
  };

  const points = readingLog.map((e) => e.score);
  const min = Math.min(...points, 0);
  const max = Math.max(...points, 1);
  const span = max - min || 1;
  const xAt = (i: number) => (i / Math.max(points.length - 1, 1)) * VIEW_W;
  const yAt = (score: number) => PAD_Y + (1 - (score - min) / span) * (VIEW_H - PAD_Y * 2);
  const d = readingLog
    .map((e, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)},${yAt(e.score).toFixed(1)}`)
    .join(' ');

  // Only every Nth point gets a tap target once points are packed tighter
  // than MIN_TAP_SPACING, evenly thinned rather than just taking the first
  // N — otherwise a long history's tappable points would all bunch at one
  // end of the line.
  const tapStep = Math.max(1, Math.ceil(MIN_TAP_SPACING / (VIEW_W / Math.max(points.length - 1, 1))));
  const tappablePoints = readingLog.filter((_, i) => i % tapStep === 0 || i === readingLog.length - 1);

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

  // Sphere breakdown only exists in richHistory (server-side, signed-in +
  // consented) — the local-only readingLog never carried per-sphere data.
  // No sphere trace at all is a legitimate state (not every account has
  // opted into saving), same as the rest of this screen's two-tier detail.
  const sphereHistory = useMemo(
    () => (richHistory ? buildSphereHistory(richHistory) : null),
    [richHistory]
  );

  // Real, true facts about this person's OWN record — never an
  // interpretation of what a pattern means (see arcFacts.ts's own header
  // comment). Sits right after introLine, before the sparkline, so it's
  // the immediate answer to "what is this page" rather than something you
  // only get to after tapping around — see collaboration notes on making
  // Your Arc's value legible on open.
  const facts = useMemo(() => buildArcFacts(readingLog), [readingLog]);

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
    }));
    const pastFromWishes: TimeConePoint[] = allWishes
      .filter((w) => w.id !== activeWish?.id)
      .map((w) => {
        const ts = new Date(w.savedAt).getTime();
        return { id: `wish-${w.id}`, depth: Math.min(1, (now - ts) / span), angle: hashAngle(`wish-${w.id}`) };
      });
    const futurePoints: TimeConePoint[] = activeWish ? [{ id: `active-wish-${activeWish.id}`, depth: 1, angle: 0.25 }] : [];
    return { pastPoints: [...pastFromReadings, ...pastFromWishes], futurePoints };
  }, [readingLog, allWishes, activeWish]);

  // Building the page list explicitly (not conditionally spread inline in
  // JSX) so PagedScrollView's dot count and the pages actually shown never
  // drift apart — a resurfaced wish or a tapped detail page changes how
  // many pages exist, and both need to agree on that number.
  const pages: React.ReactNode[] = [];

  // Page 1 — Cover. Kaleidoscope first, title/framing line BELOW it (per
  // collaboration notes, 2026-08-14: "they see the kaleidoscope in the
  // middle of the screen and header 'Your Arc' at the bottom with a brief
  // description") — the pattern is the first thing anyone sees, not a
  // heading above a picture.
  pages.push(
    <ScrollView key="cover" contentContainerStyle={styles.pageCentered}>
      <View style={styles.kaleidoscopeWrap}>
        <ArcKaleidoscope readingLog={readingLog} size={KALEIDOSCOPE_SIZE} />
        <Text style={styles.kaleidoscopeCaption}>{t('yourArc.kaleidoscopeCaption')}</Text>
      </View>
      <Text style={styles.kicker}>{t('yourArc.kicker')}</Text>
      <Text style={styles.title}>{t('yourArc.title')}</Text>
      <Text style={styles.coneFramingLine}>{t('yourArc.coneFramingLine')}</Text>
    </ScrollView>
  );

  // Page 2 — Now. The time cone alone, given real room — the present
  // moment in light of the person's own past and future (RULES.md,
  // Product/positioning, 2026-08-14). Static for now, deliberately — see
  // TimeCone.tsx's own comment on why motion/interaction is a later pass.
  if (timeConeGeometry.pastPoints.length > 0 || timeConeGeometry.futurePoints.length > 0) {
    pages.push(
      <ScrollView key="cone" contentContainerStyle={styles.pageCentered}>
        <Text style={styles.kicker}>{t('yourArc.nowKicker')}</Text>
        <View style={styles.timeConeWrap}>
          <TimeCone
            width={CONE_SIZE}
            height={CONE_SIZE * 1.3}
            pastPoints={timeConeGeometry.pastPoints}
            futurePoints={timeConeGeometry.futurePoints}
          />
        </View>
        <Text style={styles.introLine}>
          {t('yourArc.introLine', { count: readingLog.length, sinceDate })}
        </Text>
      </ScrollView>
    );
  }

  // Page 3 — What calls you. The ACTIVE wish, standing on its own (moved
  // off Measure, 2026-08-14), plus the Crossing that builds from it —
  // both "present reaching toward future" material, so they share a page.
  // Unlike the resurfaced wish (a past moment, held until tapped), the
  // active wish is shown plainly — nothing to protect it from, it's what's
  // live right now.
  pages.push(
    <ScrollView key="wish-crossing" contentContainerStyle={styles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.whatCallsYou')}</Text>
      <View style={styles.wishSection}>
        {activeWish && !wishComposerOpen && (
          <Text style={styles.wishText}>{activeWish.text}</Text>
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
    </ScrollView>
  );

  // Page 4 — A wish from before. Pure resurfacing (docs/session-result-
  // concept.md, Phase 4), offered quietly, not pushed — only exists as its
  // own page when there's actually one eligible this visit. Held behind a
  // tap until opened (same "held, not displayed" rule the same-session
  // version follows): no comparison to the current reading is ever drawn
  // here — showing the wish's own words is the whole mechanism.
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

  // Page 5 — This month. Real, true facts about this person's OWN record
  // — never an interpretation of what a pattern means. Each fact gets its
  // own small marker, same restrained "a dot, colored by what's actually
  // true" language SphereArc's own trace dots already use.
  if (facts.length > 0) {
    pages.push(
      <ScrollView key="facts" contentContainerStyle={styles.pageContent}>
        <Text style={styles.kicker}>{t('yourArc.factsKicker')}</Text>
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
      </ScrollView>
    );
  }

  // Page 6 — Every walk. The archive: the full sparkline, tap any point to
  // open a dedicated detail page (page 7, inserted only once something's
  // selected) — "the graph becomes one navigation method, rather than the
  // definition of Your Arc," not the page's own headline anymore.
  pages.push(
    <ScrollView key="every-walk" contentContainerStyle={styles.pageContent}>
      <Text style={styles.kicker}>{t('yourArc.everyWalkHeading')}</Text>
      {readingLog.length >= 2 ? (
        <View style={styles.sparklineWrap}>
          {/* Stated once, quietly, on the paid screen itself — not just
              at the paywall (your-arc-preview.tsx). Without this, nothing
              on THIS screen ever confirms what's actually different from
              the free preview once you're already looking at it. One
              plain sentence, not a badge or upsell tone. */}
          <Text style={styles.fullLineNote}>{t('yourArc.fullLineNote')}</Text>
          <Text style={styles.tapPointHint}>{t('yourArc.tapPointHint')}</Text>
          <Svg
            width="100%"
            height={140}
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
          >
            <Path
              d={d}
              fill="none"
              stroke={`rgb(${accentRgb})`}
              strokeOpacity={0.7}
              strokeWidth={1}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
          {/* A separate absolutely-positioned tap layer, not SVG onPress per
              point — react-native-svg shapes don't reliably take touch
              events at this marker size across platforms, plain Views do. */}
          <View style={styles.tapLayer} pointerEvents="box-none">
            {tappablePoints.map((entry) => {
              const i = readingLog.indexOf(entry);
              const leftPct = (xAt(i) / VIEW_W) * 100;
              const topPct = (yAt(entry.score) / VIEW_H) * 100;
              return (
                <Pressable
                  key={entry.ts}
                  style={[styles.tapTarget, { left: `${leftPct}%`, top: `${topPct}%` }]}
                  onPress={() => setSelected(entry)}
                  hitSlop={10}
                />
              );
            })}
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {t('yourArc.notEnoughReadings')}
        </Text>
      )}
    </ScrollView>
  );

  // Page 7 — Body, mind, heart, spirit. The sphere history, its own page
  // rather than tacked onto the sparkline's — a genuinely separate kind
  // of record (four traces, not one).
  if (sphereHistory) {
    pages.push(
      <ScrollView key="sphere-history" contentContainerStyle={styles.pageContent}>
        <SphereArc history={sphereHistory} />
      </ScrollView>
    );
  }

  // Page 8 — the tapped point's own detail, inserted dynamically only once
  // something's selected on page 6's sparkline (2026-08-14 decision: "its
  // own dedicated page, inserted after Every Walk," not a modal/overlay).
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
      <PagedScrollView>{pages}</PagedScrollView>
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
  backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  kaleidoscopeWrap: { alignSelf: 'center', marginBottom: spacing[8] },
  kaleidoscopeCaption: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  timeConeWrap: { alignSelf: 'center', marginBottom: spacing[6] },
  everyWalkHeading: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  kicker: {
    alignSelf: 'flex-start',
    color: colors.text.muted,
    fontFamily: fonts.medium,
    fontSize: fontSizes.xs,
    letterSpacing: letterSpacings.kicker,
    textTransform: 'uppercase',
  },
  title: {
    alignSelf: 'flex-start',
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * lineHeights.tight,
    marginTop: spacing[2],
  },
  coneFramingLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
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
  factsSection: {
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
  sparklineWrap: {
    width: '100%',
    marginBottom: spacing[6],
  },
  fullLineNote: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    marginBottom: spacing[1],
  },
  tapPointHint: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontStyle: 'italic',
    fontSize: fontSizes.xs,
    marginBottom: spacing[2],
  },
  tapLayer: { ...StyleSheet.absoluteFill },
  tapTarget: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    borderRadius: 6,
    backgroundColor: colors.accent.ivory,
    opacity: 0.5,
  },
  emptyText: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginBottom: spacing[6],
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
