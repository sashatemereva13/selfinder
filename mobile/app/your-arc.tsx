import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
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
import { SavedMeasureResult } from '../src/types';
import { SPARKLINE_VIEW_W, SPARKLINE_VIEW_H } from '../src/components/arcSparkline';
import { SphereArc } from '../src/components/SphereArc';
import { ArcKaleidoscope } from '../src/components/ArcKaleidoscope';
import { ChatTurn } from '../src/components/ChatTurn';
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
  const session = useAuthStore((s) => s.session);
  const accentRgb = useAppAccentRgb();
  const levelColors = useLevelColors();

  const [richHistory, setRichHistory] = useState<SavedMeasureResult[] | null>(null);
  const [spillEntries, setSpillEntries] = useState<SavedSpillEntry[] | null>(null);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);
  const [linkedConversation, setLinkedConversation] = useState<SavedConversation | null>(null);
  const [loadingConversation, setLoadingConversation] = useState(false);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await getMe(session.token);
        if (cancelled || !profile.consent?.psychologicalData?.given) return;
        const [history, entries] = await Promise.all([
          getMeasureHistory(session.token),
          listMySpillEntries(session.token),
        ]);
        if (!cancelled) {
          setRichHistory(history);
          setSpillEntries(entries);
        }
      } catch {
        // Best-effort — the local-only readingLog view still works without this.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

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

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[4] }]}
    >
      {/* Explicit destination, not router.back() — Your Arc's only real
          entry point is Depths' "Your arc" row, but this is now a
          top-level route (see app/_layout.tsx), so router.back()'s actual
          target depends on navigation-stack internals rather than where
          the user thinks they came from. Same fix as /sources. */}
      <Pressable style={styles.backRow} onPress={() => router.replace('/(tabs)/depths')}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {/* The literal first thing on the page, above even the kicker/
          title — a generated pattern built entirely from this person's
          own reading-history colors. Not meant to be studied (the real
          data lives in the facts/sparkline below); its only job is to
          feel unmistakably theirs the instant the screen opens. */}
      <View style={styles.kaleidoscopeWrap}>
        <ArcKaleidoscope readingLog={readingLog} size={KALEIDOSCOPE_SIZE} />
      </View>

      <Text style={styles.kicker}>{t('yourArc.kicker')}</Text>
      <Text style={styles.title}>{t('yourArc.title')}</Text>
      <Text style={styles.introLine}>
        {t('yourArc.introLine', { count: readingLog.length, sinceDate })}
      </Text>

      {/* Set apart from plain paragraph text (per collaboration notes: the
          facts previously read as an undifferentiated block of prose, no
          different from introLine above or sphereArcHeading below) — each
          fact gets its own small marker, same restrained "a dot, colored
          by what's actually true" language SphereArc's own trace dots
          already use, rather than a new visual system invented just for
          this section. steadiest is the one fact with a real level behind
          it, so its marker takes that level's actual color; the count-
          based facts (thisMonth/streak/allTime) have no single level to
          point to, so they take the page's own one accent color instead
          of inventing a second hue (aesthetic.md's "one color per
          screen" rule). Facts sit in their own row-group with real gap
          between them, not stacked as continuous-looking paragraphs. */}
      {facts.length > 0 && (
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
      )}

      {readingLog.length >= 2 ? (
        <View style={styles.sparklineWrap}>
          {/* Moved here from the top-of-page intro line — it's an
              instruction about THIS shape specifically, so it belongs
              sitting against it, not several elements above it where the
              thing it's describing isn't even visible yet. */}
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

      {sphereHistory && <SphereArc history={sphereHistory} />}

      {selected && (
        <View style={styles.detailSection}>
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
        </View>
      )}
    </ScrollView>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  content: { padding: spacing[6], paddingBottom: spacing[12] },
  backRow: { alignSelf: 'flex-start', paddingBottom: spacing[8] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  kaleidoscopeWrap: { alignSelf: 'center', marginBottom: spacing[8] },
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
  introLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[3],
    marginBottom: spacing[8],
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
    marginTop: -spacing[6],
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
  sparklineWrap: {
    width: '100%',
    marginBottom: spacing[6],
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
