import { useMemo, useState } from 'react';
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
import { AmbientGlow } from '../src/components/AmbientGlow';
import { ArcKaleidoscopeLoading } from '../src/components/ArcKaleidoscopeLoading';
import { JourneyWizard } from '../src/components/JourneyWizard';
import { AgencySortPrimitive } from '../src/components/AgencySortPrimitive';
import { JourneyReflection } from '../src/components/JourneyReflection';
import { CONTROL_STAGES } from '../src/content/journeys/control';
import { JourneySessionDTO } from '../src/types';
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

  const mostRecentPurchase = purchases && purchases.length > 0
    ? [...purchases].sort((a, b) => new Date(b.purchasedAt).getTime() - new Date(a.purchasedAt).getTime())[0]
    : null;

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
      ) : purchases === null ? (
        <View style={styles.centerFill}>
          <ArcKaleidoscopeLoading size={KALEIDOSCOPE_LOADING_SIZE * 0.6} accentRgb={accentRgb} />
        </View>
      ) : !mostRecentPurchase ? (
        // Signed in, never purchased — honest "not purchased yet," distinct
        // from JourneyComingSoonScreen's "not built yet" (this Journey is
        // built; there's simply no live purchase flow yet, matching every
        // other Journey's current entitlement status).
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.title}>{t('products.controlLabel')}</Text>
          <Text style={styles.introLine}>{t('products.controlDescription')}</Text>
          <Text style={styles.introLine}>{t('journey.notPurchasedBody')}</Text>
        </ScrollView>
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
