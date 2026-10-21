import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes, letterSpacings, lineHeights } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { ReadingLogEntry } from '../src/store/measureStore';
import { useAuthStore } from '../src/store/authStore';
import { getMeasureHistory } from '../src/api/user';
import { ArcKaleidoscope } from '../src/components/journeys/ArcKaleidoscope';
import { woopShapeParams } from '../src/components/journeys/kaleidoscopeData';
import { listMyWishes, WishWoop } from '../src/api/wish';
import { findActiveWish } from '../src/components/yourArc/crossingEligibility';
import { LongPressToSave } from '../src/components/shared/LongPressToSave';
import { ArcKaleidoscopeLoading } from '../src/components/shared/ArcKaleidoscopeLoading';
import { AmbientGlow } from '../src/components/shared/AmbientGlow';
import { BackLink } from '../src/components/shared/BackLink';
import { useAppAccentRgb } from '../src/utils/appAccent';
import { purchaseJourney } from '../src/api/journeys';
import { useReadingColumnWidth } from '../src/theme/responsive';
import { JourneyPurchase } from '../src/types';
import { useJourneySlot } from '../src/components/journeys/useJourneySlot';
import { formatDate } from '../src/utils/relativeTime';

// Center — Selfinder's first Journey: a one-time-purchase, repeatable
// experience (the kaleidoscope, spun out of what used to be Your Arc's
// Cover page; see RULES.md's Product/positioning section). Unlike Your
// Arc, this is NOT part of the record — each purchase generates its own,
// genuinely different result (a fresh seedNonce folded into
// kaleidoscopeData.ts's seedFromLog).
//
// 2026-08-30: this screen used to browse EVERY past purchase in-screen
// (a PagedScrollView, one page per purchase). That doesn't scale to 12
// Journeys each needing their own browsable-history UI, and control.tsx
// (the reference implementation for every OTHER Journey) never had
// browsing at all — it could only ever show its one most recent result,
// with no way to even start over. Reconciled the two: every Journey
// screen, this one included, now shows only its most recent result plus
// a "do it again" button; ALL historical browsing (every past purchase,
// real content — stages, answers, reflection) moved to exactly one place,
// Your Arc's own JourneysPage.tsx, consent-gated the same way Measure/
// Spill/Wish history already is. This screen keeps generating a fresh
// kaleidoscope each time (handleGetCenter, unchanged) — it just stops
// being the place you go to look BACK at past ones.
//
// 2026-08-29: the light cone (previously shown right below the
// kaleidoscope on this screen) moved to its own page on Your Arc
// (TimeConePage.tsx) — the cone is drawn from real saved history, the
// opposite kind of thing from a bought-again generated result, and
// belongs with Your Arc's other record pages, not bundled into Center.
// See TimeConePage.tsx's own header comment for the full reasoning.
//
// 2026-08-23 pivot: Center no longer requires an active Your Arc
// subscription — that gate was reversed once Center generalized into the
// first of an open-ended "Journey" family (see RULES.md). Every Journey
// is purchasable and completable standalone; Your Arc's role is additive
// (it's what would let a Journey's result connect into a person's
// broader longitudinal record over time), not a prerequisite to use one.
// Center still only needs a signed-in session — no server record to
// generate from requires no Your Arc, just an account (getMeasureHistory
// itself requires auth, so a fully signed-out visitor sees its own honest
// "sign in" state below, distinct from "signed in, nothing saved yet").
//
// Same "just the kaleidoscope and a header" reference-image treatment
// Cover used (see your-arc.tsx's own history) — the kaleidoscope fills
// nearly the whole column width, no competing text blocks.
const KALEIDOSCOPE_LOADING_SIZE = 300;
const KALEIDOSCOPE_PADDING = 24;

// Thin wrapper mounted by the router — same requestAnimationFrame-deferred
// pattern your-arc.tsx's own YourArcRoute uses, for the same reason: the
// real screen below mounts ArcKaleidoscope synchronously, and without
// deferring past the FIRST render, the route transition into Center
// itself would freeze rather than paint instantly. See your-arc.tsx's
// YourArcRoute for the full history of why this pattern exists (a real,
// confirmed ~9.8s hang was the original motivation).
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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const columnWidth = useReadingColumnWidth();
  const accentRgb = useAppAccentRgb();
  // Selfinder is fully free for now (see RULES.md's Product/positioning
  // section) — "getting Center" self-grants a free purchase instead of
  // going through real IAP. useJourneySlot (shared with every other
  // Journey screen) tracks a freshly self-granted purchase locally and
  // merges it in immediately rather than waiting on a refetch. Center
  // doesn't use the hook's auto-grant-on-mount or "do it again" pieces
  // (it grants explicitly via handleGetCenter below, with its own
  // "get"/"repeat" copy), just its purchase list and setter.
  const { purchases, mostRecentPurchase, addPurchase } = useJourneySlot('center');
  const [purchasing, setPurchasing] = useState(false);

  // The server-saved record — fetched for any signed-in session, no Your
  // Arc subscription required (see this file's own header comment for the
  // 2026-08-23 gate reversal). A fully signed-out visitor never reaches
  // this fetch at all (getMeasureHistory requires auth) — see the
  // `!session` branch in the render below.
  const [serverReadingLog, setServerReadingLog] = useState<ReadingLogEntry[]>([]);
  // 2026-09-13 — "past creates color, future creates shape" (see
  // kaleidoscopeData.ts's own woopShapeParams comment). Wishes were
  // previously never fetched here at all — they only ever fed the light
  // cone, which moved to Your Arc's own TimeConePage.tsx (2026-08-29) —
  // this is a new, small, best-effort fetch added specifically for this
  // feature. No WOOP (or no wish at all) resolves to
  // woopShapeParams(null)'s own defaults, which produce byte-identical
  // shape output to before this feature existed.
  const [activeWishWoop, setActiveWishWoop] = useState<WishWoop | null>(null);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      const wishes = await listMyWishes(session.token);
      if (cancelled) return;
      setActiveWishWoop(findActiveWish(wishes)?.woop ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);
  const shapeParams = useMemo(() => woopShapeParams(activeWishWoop), [activeWishWoop]);
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    (async () => {
      try {
        const history = await getMeasureHistory(session.token);
        if (cancelled) return;
        // SavedMeasureResult (server shape: vibrationLevel.slug, savedAt as
        // an ISO string) → ReadingLogEntry (local shape: levelSlug, ts as a
        // number) — the shape ArcKaleidoscope already expects, oldest-first
        // to match measureStore's own readingLog convention.
        const mapped: ReadingLogEntry[] = history
          .map((r) => ({ ts: new Date(r.savedAt).getTime(), score: r.vibrationScore, levelSlug: r.vibrationLevel.slug }))
          .sort((a, b) => a.ts - b.ts);
        setServerReadingLog(mapped);
      } catch {
        // Best-effort — an empty kaleidoscope is still an honest
        // reflection of "nothing loaded," not a crash.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  // Selfinder is fully free for now (see RULES.md's Product/positioning
  // section) — self-grants a real journeyPurchases[] entry via the same
  // POST /journeys/purchase endpoint control.tsx uses, rather than
  // showing the old "not yet available" Alert. Each call genuinely
  // creates a NEW purchase (fresh seedNonce), matching "bought again, not
  // owned once" — pressing this a second time produces a new, different
  // result, exactly like a real repeat purchase would.
  const handleGetCenter = async () => {
    if (!session || purchasing) return;
    setPurchasing(true);
    try {
      const purchase = await purchaseJourney('center', session.token);
      addPurchase(purchase);
    } catch {
      Alert.alert(t('center.getCenterErrorTitle'), t('center.getCenterErrorBody'));
    } finally {
      setPurchasing(false);
    }
  };

  const kaleidoscopeSize = columnWidth - KALEIDOSCOPE_PADDING * 2;

  const renderExperience = (purchase: JourneyPurchase | null) => (
    <View style={styles.experienceBlock}>
      <LongPressToSave captureChildren>
        <View style={styles.kaleidoscopeWrap}>
          <ArcKaleidoscope
            readingLog={serverReadingLog}
            size={kaleidoscopeSize}
            seed={purchase?.seedNonce}
            woopShapeParams={shapeParams}
          />
        </View>
      </LongPressToSave>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <BackLink style={styles.backRow} />

      {!session ? (
        // Genuinely signed out — Center's real prerequisite now that the
        // Your Arc gate is reversed (see this file's own header comment).
        // Distinct from `purchases === null`'s loading state below: that
        // state also covers signed-out per useJourneyPurchases' own
        // contract, but rendering it as a bare spinner for a signed-out
        // visitor would be silently unhelpful rather than honest about
        // what's actually needed.
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.kicker}>{t('center.kicker')}</Text>
          <Text style={styles.title}>{t('center.title')}</Text>
          <Text style={styles.introLine}>{t('center.signInLine')}</Text>
          <Pressable style={styles.getButton} onPress={() => router.push('/profile')} accessibilityRole="button">
            <Text style={styles.getButtonText}>{t('journey.signInAction')}</Text>
          </Pressable>
        </ScrollView>
      ) : purchases === null ? (
        // Loading (session exists, profile fetch still in flight) — a bare
        // wait state, matching the app's existing "no spinner-heavy UI"
        // restraint (see richDataLoading's own comment in your-arc.tsx)
        // rather than a bespoke loading UI.
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
          <Pressable style={[styles.getButton, purchasing && { opacity: 0.5 }]} onPress={handleGetCenter} disabled={purchasing}>
            <Text style={styles.getButtonText}>{purchasing ? t('center.getCenterBusy') : t('center.getCenter')}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        // 2026-08-30: only the most recent purchase now, not every past
        // one browsable in-screen — that history moved to Your Arc's own
        // JourneysPage.tsx (see this file's own header comment). Same
        // "do it again" action as before (handleGetCenter, unchanged),
        // just no longer paired with in-screen browsing of what it
        // replaces.
        <ScrollView contentContainerStyle={styles.pageContent}>
          <Text style={styles.kicker}>{t('center.title')}</Text>
          <Text style={styles.purchaseDate}>
            {formatDate(new Date(mostRecentPurchase!.purchasedAt).getTime())}
          </Text>
          {renderExperience(mostRecentPurchase)}
          {/* 2026-09-13, at the user's own request — this settled view had
              no descriptive text at all near the kaleidoscope (introLine
              only ever showed in the pre-purchase teaser branch above).
              This names what Center actually IS, now that "the eternal
              now" on Your Arc's own hub opens straight here (see
              your-arc.tsx's own header comment): not a claim stated as
              fact ("the past and future literally exist right now" would
              be exactly the belief-requiring cosmological claim RULES.md
              rules out), but something pointed at the person's own felt
              experience instead — what already shaped them and what
              they're already reaching for are both still live, right now,
              in the pattern they're looking at. No wish/reading specifics
              named (this screen doesn't fetch wish data — see this file's
              own header comment on why) — general enough to stay true
              regardless of what's actually in their record. */}
          <Text style={styles.presentMomentLine}>{t('center.presentMomentLine')}</Text>
          <Pressable style={[styles.getButton, purchasing && { opacity: 0.5 }]} onPress={handleGetCenter} disabled={purchasing}>
            <Text style={styles.getButtonText}>{purchasing ? t('center.getCenterBusy') : t('center.getCenter')}</Text>
          </Pressable>
          <Text style={styles.savedInYourArcNote}>{t('journey.savedInYourArcNote')}</Text>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg.base },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
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
  // Same register as introLine above (sm/secondary/light) — this is the
  // settled view's own equivalent, shown once the kaleidoscope is
  // actually visible rather than only in the pre-purchase teaser.
  presentMomentLine: {
    alignSelf: 'flex-start',
    color: colors.text.secondary,
    fontFamily: fonts.light,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * lineHeights.normal,
    marginTop: spacing[2],
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
  savedInYourArcNote: {
    color: colors.text.faint,
    fontFamily: fonts.light,
    fontSize: fontSizes.xs,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  });
}
