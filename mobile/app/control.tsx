import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes } from '../src/theme/typography';
import { spacing } from '../src/theme/spacing';
import { useAuthStore } from '../src/store/authStore';
import { useJourneyPurchases } from '../src/utils/useJourneyPurchases';
import { purchaseJourney } from '../src/api/journeys';
import { AmbientGlow } from '../src/components/AmbientGlow';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { JourneyWizard } from '../src/components/JourneyWizard';
import { AgencySortPrimitive } from '../src/components/AgencySortPrimitive';
import { JourneyReflection } from '../src/components/JourneyReflection';
import { CONTROL_STAGES } from '../src/content/journeys/control';
import { JourneySessionDTO, JourneyPurchase } from '../src/types';
import { useAppAccentRgb } from '../src/utils/appAccent';

const KALEIDOSCOPE_LOADING_SIZE = 300;

// Control — "what am I really trying to control?" The reference
// implementation for the Journey architecture (see
// docs/journeys-concept.md for the full worked example this screen
// implements). Unlike Center, Control's own most-recent purchase is
// what's played — full multi-purchase browsable history (Center's
// PagedScrollView-of-past-purchases pattern) is deferred to the same
// follow-on pass as the other 11 Journeys; this build's job is proving
// the engine works end-to-end via one purchase.
export default function ControlScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const purchases = useJourneyPurchases('control');
  const accentRgb = useAppAccentRgb();
  const [completedSession, setCompletedSession] = useState<JourneySessionDTO | null>(null);
  // Selfinder is fully free for now (see RULES.md's Product/positioning
  // section) — a signed-in user with no existing Control purchase gets
  // one self-granted automatically, rather than seeing a "not purchased
  // yet" teaser. Tracked locally so the freshly-granted purchase is used
  // immediately, without waiting on a second useJourneyPurchases refetch.
  const [freeGrant, setFreeGrant] = useState<JourneyPurchase | null>(null);
  const grantRequestedRef = useRef(false);

  const mostRecentPurchase = purchases && purchases.length > 0
    ? [...purchases].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]
    : freeGrant;

  useEffect(() => {
    if (!session || purchases === null || mostRecentPurchase || grantRequestedRef.current) return;
    grantRequestedRef.current = true;
    purchaseJourney('control', session.token)
      .then(setFreeGrant)
      .catch(() => {
        grantRequestedRef.current = false; // allow a retry on the next render if this failed
      });
  }, [session, purchases, mostRecentPurchase]);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {!session ? (
        // Genuinely signed out — same distinct-from-loading honesty as
        // center.tsx's own !session branch.
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.title}>{t('products.controlLabel')}</Text>
          <Text style={styles.introLine}>{t('journey.signInBody')}</Text>
        </ScrollView>
      ) : purchases === null || !mostRecentPurchase ? (
        // Either still loading, or the free-grant request above is still
        // in flight — both read the same to the user (a brief spinner,
        // never a "not purchased" dead end now that everything's free).
        <View style={styles.centerFill}>
          <ArcKaleidoscopeLoading size={KALEIDOSCOPE_LOADING_SIZE * 0.6} accentRgb={accentRgb} />
        </View>
      ) : completedSession ? (
        <JourneyReflection
          beganLabelKey="control.reflectionBegan"
          beganAnswer={completedSession.stages[0]?.finalAnswer ?? ''}
          arrivedLabelKey="control.reflectionArrived"
          arrivedAnswer={completedSession.stages[completedSession.stages.length - 1]?.finalAnswer ?? ''}
        />
      ) : (
        <JourneyWizard
          journey="control"
          purchaseId={mostRecentPurchase.id}
          stages={CONTROL_STAGES}
          onComplete={setCompletedSession}
          renderStageInput={(stage, onSubmit, priorFinalAnswers, extractedPropositions) => {
            if (stage.primitive !== 'agency-sort') return null;
            return <AgencySortPrimitive items={extractedPropositions ?? priorFinalAnswers} onSubmit={onSubmit} />;
          }}
        />
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg.base },
    backRow: { alignSelf: 'flex-start', paddingHorizontal: spacing[6], paddingBottom: spacing[4] },
    backLink: { color: colors.text.faint, fontFamily: fonts.light, fontSize: fontSizes.xs },
    centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    teaserContent: { flexGrow: 1, justifyContent: 'center', padding: spacing[6], gap: spacing[3] },
    title: { color: colors.text.primary, fontFamily: fonts.medium, fontSize: fontSizes.xl, textAlign: 'center' },
    introLine: {
      color: colors.text.secondary,
      fontFamily: fonts.light,
      fontSize: fontSizes.base,
      textAlign: 'center',
    },
  });
}
