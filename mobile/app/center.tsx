import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { ReadingLogEntry } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { getMeasureHistory } from '../src/api/user';
import { listMyWishes, SavedWish } from '../src/api/wish';
import { findActiveWish } from '../src/utils/crossingEligibility';
import { TimeCone } from '../src/components/TimeCone';
import { TimeConeRing } from '../src/components/TimeConeRing';
import { CrossfadeSwitcher } from '../src/components/CrossfadeSwitcher';
import { ArcKaleidoscope } from '../src/components/ArcKaleidoscope';
import { LongPressToSave } from '../src/components/LongPressToSave';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { PagedScrollView } from '../src/components/PagedScrollView';
import { AmbientGlow } from '../src/components/AmbientGlow';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { useArcSubscription } from '../src/utils/useArcSubscription';
import { useCenterPurchases } from '../src/utils/useCenterPurchases';
import { useTimeConeGeometry } from '../src/utils/useTimeConeGeometry';
import { useReadingColumnWidth } from '../src/theme/responsive';
import { getLocalizedLevelName, VIBRATION_LEVELS } from '../src/content/measureConfig';
import { useLocaleStore } from '../src/store/localeStore';
import { CenterPurchase } from '../src/types';

// Center — Selfinder's first one-time-purchase, repeatable experience (the
// light cone + kaleidoscope, spun out of what used to be Your Arc's Cover/
// Cone pages; see RULES.md's Product/positioning section, 2026-08-22
// pivot). Unlike Your Arc, this is NOT part of the record — each purchase
// generates its own, genuinely different result (a fresh seedNonce folded
// into kaleidoscopeData.ts's seedFromLog), and every past purchase stays
// individually browsable rather than being replaced by the latest one.
//
// Center requires an active Your Arc subscription as a real prerequisite,
// not an arbitrary upsell gate — Center is generated from the person's
// SERVER-SAVED reading history (getMeasureHistory), the same record data
// Your Arc's own pages read, not the local-only readingLog every device
// keeps regardless of account/subscription status. Without Your Arc,
// there's no reachable server record for Center to be generated from —
// deliberately, so this dependency is real, not just a business rule
// layered on top of data that would work anyway. Someone without Your Arc
// sees a plain "requires Your Arc" state (with a path to
// /your-arc-preview, the same place Depths' own gate sends a non-
// subscriber) rather than the teaser/purchase flow below.
//
// Same "just the kaleidoscope and a header" reference-image treatment
// Cover used (see your-arc.tsx's own history) — the kaleidoscope fills
// nearly the whole column width, the cone gets real room below it, no
// competing text blocks.
const KALEIDOSCOPE_LOADING_SIZE = 300;
const KALEIDOSCOPE_PADDING = 24;
const CONE_SIZE = 260;

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

// Thin wrapper mounted by the router — same requestAnimationFrame-deferred
// pattern your-arc.tsx's own YourArcRoute uses, for the same reason: the
// real screen below mounts ArcKaleidoscope/TimeCone synchronously, and
// without deferring past the FIRST render, the Depths/You-tab → Center
// route transition itself would freeze rather than paint instantly. See
// your-arc.tsx's YourArcRoute for the full history of why this pattern
// exists (a real, confirmed ~9.8s hang was the original motivation).
export default function CenterRoute() {
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
        <ArcKaleidoscopeLoading size={KALEIDOSCOPE_LOADING_SIZE * 0.6} accentRgb={accentRgb} />
      </View>
    );
  }

  return <CenterScreen />;
}

function CenterScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const locale = useLocaleStore((s) => s.locale);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const columnWidth = useReadingColumnWidth();
  const accentRgb = useAppAccentRgb();
  const hasArc = useArcSubscription();
  const purchases = useCenterPurchases();

  // The server-saved record, not local readingLog — see this file's own
  // header comment for why: Center's dependency on Your Arc needs to be a
  // real one, not just a gate on top of data that would render fine
  // without it. Only fetched once hasArc is true; without Your Arc there's
  // nothing to fetch this for (the gated "requires Your Arc" state below
  // never reaches this data at all).
  const [serverReadingLog, setServerReadingLog] = useState<ReadingLogEntry[]>([]);
  const [allWishes, setAllWishes] = useState<SavedWish[]>([]);
  useEffect(() => {
    if (!session || !hasArc) return;
    let cancelled = false;
    (async () => {
      try {
        const [history, wishes] = await Promise.all([
          getMeasureHistory(session.token),
          listMyWishes(session.token),
        ]);
        if (cancelled) return;
        // SavedMeasureResult (server shape: vibrationLevel.slug, savedAt as
        // an ISO string) → ReadingLogEntry (local shape: levelSlug, ts as a
        // number) — the shape every consumer here (ArcKaleidoscope,
        // useTimeConeGeometry) already expects, oldest-first to match
        // measureStore's own readingLog convention.
        const mapped: ReadingLogEntry[] = history
          .map((r) => ({ ts: new Date(r.savedAt).getTime(), score: r.vibrationScore, levelSlug: r.vibrationLevel.slug }))
          .sort((a, b) => a.ts - b.ts);
        setServerReadingLog(mapped);
        setAllWishes(wishes);
      } catch {
        // Best-effort — an empty cone/kaleidoscope is still an honest
        // reflection of "nothing loaded," not a crash.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, hasArc]);
  const activeWish = findActiveWish(allWishes);

  const timeConeGeometry = useTimeConeGeometry(serverReadingLog, allWishes, activeWish);

  // Long-press preview + tap summary — same interaction shape Your Arc's
  // own cone page used, minus "Open full reading": that link jumped to
  // Your Arc's own Detail page, a different, subscription-gated product
  // now, with nowhere appropriate to send a Center-only viewer. Center's
  // tap summary shows date + level only — the richer per-reading
  // reflection (combinationMessage) is a separate, heavier fetch Your
  // Arc's own record pages do; Center never needed it, since a plain
  // date+level summary is enough for a quick in-place look at one point.
  const [conePreview, setConePreview] = useState<{ date: string; label: string } | null>(null);
  const [coneFacing, setConeFacing] = useState<'past' | 'future' | null>(null);
  const [selected, setSelected] = useState<ReadingLogEntry | null>(null);

  const handleConePointPress = (pointId: string) => {
    if (!pointId.startsWith('reading-')) return;
    const ts = Number(pointId.slice('reading-'.length));
    const entry = serverReadingLog.find((e) => e.ts === ts);
    if (entry) setSelected(entry);
  };

  const handleConePointLongPress = (pointId: string) => {
    if (pointId.startsWith('reading-')) {
      const ts = Number(pointId.slice('reading-'.length));
      const entry = serverReadingLog.find((e) => e.ts === ts);
      if (!entry) return;
      const level = VIBRATION_LEVELS.find((l) => l.slug === entry.levelSlug);
      setConePreview({
        date: formatDate(entry.ts),
        label: level ? getLocalizedLevelName(level, locale) : entry.levelSlug,
      });
      setTimeout(() => setConePreview(null), 4000);
    } else if (pointId.startsWith('wish-')) {
      const id = pointId.slice('wish-'.length);
      const wish = allWishes.find((w) => w.id === id);
      if (!wish) return;
      setConePreview({ date: formatDate(new Date(wish.savedAt).getTime()), label: t('yourArc.coneLegendWishLabel') });
      setTimeout(() => setConePreview(null), 4000);
    }
  };

  // Pre-real-IAP (Phase 4, deferred — see RULES.md) — honest "not yet
  // available" rather than a dead tap target or a hidden button, per this
  // project's own standing "never build a tap target that looks like a
  // purchase and doesn't" discipline, applied here as "look like a
  // purchase and say so plainly" instead of pretending it isn't a button.
  const handleGetCenter = () => {
    Alert.alert(t('center.comingSoonTitle'), t('center.comingSoonBody'));
  };

  const kaleidoscopeSize = columnWidth - KALEIDOSCOPE_PADDING * 2;

  const renderExperience = (purchase: CenterPurchase | null) => (
    <View style={styles.experienceBlock}>
      <LongPressToSave captureChildren>
        <View style={styles.kaleidoscopeWrap}>
          <ArcKaleidoscope readingLog={serverReadingLog} size={kaleidoscopeSize} seed={purchase?.seedNonce} />
        </View>
      </LongPressToSave>
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
        <View style={styles.coneArrowLayer} pointerEvents="box-none">
          {timeConeGeometry.futurePoints.length > 0 && (
            <Pressable
              hitSlop={16}
              style={styles.coneArrowUp}
              onPress={() => setConeFacing(coneFacing === 'future' ? null : 'future')}
            >
              <Text style={[styles.coneArrow, coneFacing === 'future' && styles.coneArrowActive]}>↑</Text>
            </Pressable>
          )}
          {timeConeGeometry.pastPoints.length > 0 && (
            <Pressable
              hitSlop={16}
              style={styles.coneArrowDown}
              onPress={() => setConeFacing(coneFacing === 'past' ? null : 'past')}
            >
              <Text style={[styles.coneArrow, coneFacing === 'past' && styles.coneArrowActive]}>↓</Text>
            </Pressable>
          )}
        </View>
      </View>
      {conePreview && (
        <Text style={styles.conePreviewText}>
          {conePreview.date} — {conePreview.label}
        </Text>
      )}
      {selected && (
        <View style={styles.conePointSummary}>
          <Text style={styles.conePointSummaryDate}>{formatDate(selected.ts)}</Text>
          <Text style={styles.conePointSummaryLevel}>
            {VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug)
              ? getLocalizedLevelName(VIBRATION_LEVELS.find((l) => l.slug === selected.levelSlug)!, locale)
              : selected.levelSlug}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {!hasArc ? (
        // No Your Arc subscription — Center's real prerequisite (see this
        // file's own header comment). Sends the same place Depths' own
        // gate sends a non-subscriber, rather than a dead end.
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.kicker}>{t('center.kicker')}</Text>
          <Text style={styles.title}>{t('center.title')}</Text>
          <Text style={styles.introLine}>{t('center.requiresArcLine')}</Text>
          <Pressable style={styles.getButton} onPress={() => router.push('/your-arc-preview')}>
            <Text style={styles.getButtonText}>{t('center.seeYourArc')}</Text>
          </Pressable>
        </ScrollView>
      ) : purchases === null ? (
        // Loading/signed-out — a bare wait state, matching the app's
        // existing "no spinner-heavy UI" restraint (see richDataLoading's
        // own comment in your-arc.tsx) rather than a bespoke loading UI.
        <View style={styles.centerFill}>
          <ArcKaleidoscopeLoading size={KALEIDOSCOPE_LOADING_SIZE * 0.6} accentRgb={accentRgb} />
        </View>
      ) : purchases.length === 0 ? (
        // Never purchased — honest teaser, same register your-arc-
        // preview.tsx uses: real copy about what Center is, no fake
        // blurred kaleidoscope standing in for a locked one.
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.kicker}>{t('center.kicker')}</Text>
          <Text style={styles.title}>{t('center.title')}</Text>
          <Text style={styles.introLine}>{t('center.introLine')}</Text>
          <Text style={styles.introLine}>{t('center.repeatLine')}</Text>
          <Pressable style={styles.getButton} onPress={handleGetCenter}>
            <Text style={styles.getButtonText}>{t('center.getCenter')}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        // Every past purchase, most recent first — browsable, not
        // latest-only (confirmed with the user: "the user should be able
        // to see everything they've previously purchased because every
        // purchasable experience will create a result"). One more page at
        // the end offers to generate a new one.
        <PagedScrollView>
          {[...purchases]
            .sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())
            .map((purchase) => (
              <ScrollView key={purchase.id} contentContainerStyle={styles.pageContent}>
                <Text style={styles.kicker}>{t('center.title')}</Text>
                <Text style={styles.purchaseDate}>{formatDate(new Date(purchase.purchasedAt).getTime())}</Text>
                {renderExperience(purchase)}
              </ScrollView>
            ))}
          <ScrollView key="get-another" contentContainerStyle={styles.pageContent}>
            <Text style={styles.kicker}>{t('center.kicker')}</Text>
            <Text style={styles.introLine}>{t('center.repeatLine')}</Text>
            <Pressable style={styles.getButton} onPress={handleGetCenter}>
              <Text style={styles.getButtonText}>{t('center.getCenter')}</Text>
            </Pressable>
          </ScrollView>
        </PagedScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
  backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
  teaserContent: { flexGrow: 1, padding: spacing[6], paddingBottom: spacing[12] },
  pageContent: { flexGrow: 1, alignItems: 'center', padding: spacing[6], paddingBottom: spacing[12] },
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
    marginBottom: spacing[3],
  },
  purchaseDate: {
    color: colors.text.muted,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: letterSpacings.wide,
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
  experienceBlock: { alignItems: 'center', width: '100%' },
  kaleidoscopeWrap: { alignSelf: 'center', marginBottom: spacing[6] },
  timeConeWrap: {
    alignSelf: 'center',
    width: CONE_SIZE,
    marginBottom: spacing[3],
    height: CONE_SIZE * 1.3,
    justifyContent: 'center',
    position: 'relative',
  },
  coneArrowLayer: { ...StyleSheet.absoluteFill, justifyContent: 'center', alignItems: 'center' },
  coneArrowUp: { position: 'absolute', top: CONE_SIZE * 0.65 - 18 },
  coneArrowDown: { position: 'absolute', top: CONE_SIZE * 0.65 + 18 },
  coneArrow: { color: colors.text.muted, fontSize: fontSizes.lg },
  coneArrowActive: { color: colors.text.primary },
  conePreviewText: {
    color: colors.text.primary,
    fontFamily: fonts.medium,
    fontSize: fontSizes.sm,
    textAlign: 'center',
    marginTop: spacing[3],
  },
  conePointSummary: { alignItems: 'center', marginTop: spacing[4] },
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
  getButton: {
    alignSelf: 'flex-start',
    marginTop: spacing[5],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    borderRadius: 999,
    backgroundColor: colors.accent.buttonFill,
  },
  getButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.sm },
  });
}
