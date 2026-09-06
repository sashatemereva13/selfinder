import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../src/theme/useThemeColors';
import { useThemeStore } from '../src/store/themeStore';
import type { Colors } from '../src/theme/colors';
import { fonts, fontSizes } from '../src/theme/typography';
import { spacing, radius } from '../src/theme/spacing';
import { useAuthStore } from '../src/store/authStore';
import { useJourneyPurchases } from '../src/utils/useJourneyPurchases';
import { purchaseJourney } from '../src/api/journeys';
import { AmbientGlow } from '../src/components/AmbientGlow';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { JourneyWizard } from '../src/components/JourneyWizard';
import { JourneyReflection } from '../src/components/JourneyReflection';
import { THE_LOOP_STAGES } from '../src/content/journeys/theLoop';
import { JourneySessionDTO, JourneyPurchase } from '../src/types';
import { useAppAccentRgb } from '../src/utils/appAccent';

const KALEIDOSCOPE_LOADING_SIZE = 300;

// The Loop — "why does this keep happening to me?" Third Journey built on
// the engine (see docs/journeys-concept.md). Structurally identical to
// the-choice.tsx — no custom renderStageInput, no authored reveal — every
// stage is a plain conversational exchange. The doc's own "Bringing in
// Your Arc" resemblance mechanic (surfacing the user's saved history
// mid-Journey) is deliberately not built yet — see theLoop.ts's own
// 2026-09-03 comment; this screen's "past" stage asks the person to
// recall an earlier moment from memory, same as Control/The Choice.
export default function TheLoopScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useAuthStore((s) => s.session);
  const hookPurchases = useJourneyPurchases('the-loop');
  const accentRgb = useAppAccentRgb();
  const [completedSession, setCompletedSession] = useState<JourneySessionDTO | null>(null);
  const [extraPurchases, setExtraPurchases] = useState<JourneyPurchase[]>([]);
  const purchases = hookPurchases === null ? null : [...hookPurchases, ...extraPurchases];
  const grantRequestedRef = useRef(false);

  const mostRecentPurchase = purchases && purchases.length > 0
    ? [...purchases].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]
    : null;

  useEffect(() => {
    if (!session || purchases === null || mostRecentPurchase || grantRequestedRef.current) return;
    grantRequestedRef.current = true;
    purchaseJourney('the-loop', session.token)
      .then((purchase) => setExtraPurchases((prev) => [...prev, purchase]))
      .catch(() => {
        grantRequestedRef.current = false;
      });
  }, [session, purchases, mostRecentPurchase]);

  const [restarting, setRestarting] = useState(false);
  const handleDoItAgain = async () => {
    if (!session || restarting) return;
    setRestarting(true);
    try {
      const purchase = await purchaseJourney('the-loop', session.token);
      setExtraPurchases((prev) => [...prev, purchase]);
      setCompletedSession(null);
    } catch {
      // Best-effort — the person can just tap again.
    } finally {
      setRestarting(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {!session ? (
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.title}>{t('products.theLoopLabel')}</Text>
          <Text style={styles.introLine}>{t('journey.signInBody')}</Text>
        </ScrollView>
      ) : purchases === null || !mostRecentPurchase ? (
        <View style={styles.centerFill}>
          <ArcKaleidoscopeLoading size={KALEIDOSCOPE_LOADING_SIZE * 0.6} accentRgb={accentRgb} />
        </View>
      ) : completedSession ? (
        <View style={styles.completedWrap}>
          <JourneyReflection
            beganLabelKey="journey.reflectionBegan"
            beganAnswer={completedSession.stages[0]?.finalAnswer ?? ''}
            arrivedLabelKey="journey.reflectionArrived"
            arrivedAnswer={completedSession.stages[completedSession.stages.length - 1]?.finalAnswer ?? ''}
          />
          <Pressable
            style={[styles.doItAgainButton, restarting && { opacity: 0.5 }]}
            onPress={handleDoItAgain}
            disabled={restarting}
          >
            <Text style={styles.doItAgainButtonText}>{t('journey.doItAgain')}</Text>
          </Pressable>
          <Text style={styles.savedInYourArcNote}>{t('journey.savedInYourArcNote')}</Text>
        </View>
      ) : (
        <JourneyWizard
          journey="the-loop"
          purchaseId={mostRecentPurchase.id}
          stages={THE_LOOP_STAGES}
          onComplete={setCompletedSession}
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
    completedWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: spacing[8] },
    doItAgainButton: {
      marginTop: spacing[2],
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[5],
      borderRadius: radius.full,
      backgroundColor: colors.accent.buttonFill,
    },
    doItAgainButtonText: { color: colors.onAccent, fontFamily: fonts.medium, fontSize: fontSizes.sm },
    savedInYourArcNote: {
      color: colors.text.faint,
      fontFamily: fonts.light,
      fontSize: fontSizes.xs,
      textAlign: 'center',
      marginTop: spacing[4],
    },
  });
}
