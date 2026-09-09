import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '../../theme/useThemeColors';
import { useThemeStore } from '../../store/themeStore';
import type { Colors } from '../../theme/colors';
import { fonts, fontSizes } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { AmbientGlow } from '../shared/AmbientGlow';
import { ArcKaleidoscopeLoading } from '../shared/ArcKaleidoscopeLoading';
import { useAppAccentRgb } from '../../utils/appAccent';
import { JourneyKey, JourneyStage, JourneySessionDTO, AgencySortResult } from '../../types';
import { useJourneySlot } from './useJourneySlot';
import { JourneyWizard } from './JourneyWizard';
import { JourneyReflection } from './JourneyReflection';

const KALEIDOSCOPE_LOADING_SIZE = 300;

// The shared shell for every conversational Journey screen (Control,
// Becoming, Enough, ...) — before this, each Journey's route file pasted
// the same ~150 lines: the grant/restart hook-up (now useJourneySlot),
// the 4-state render (signed-out / loading / completed-with-reflection /
// active wizard), and an identical makeStyles. A route file now supplies
// only what actually varies between Journeys: which stages, which
// title/reflection copy, and — for Control alone so far — a custom
// renderStageInput for its non-text agency-sort stage. See RULES.md's
// engineering-conventions section on not leaving duplicated logic pasted
// across files.
interface ReflectionConfig {
  beganLabelKey: string;
  beganAnswer: (session: JourneySessionDTO) => string;
  shiftLabelKey?: string;
  shiftText?: (session: JourneySessionDTO) => string | undefined;
  arrivedLabelKey: string;
  arrivedAnswer: (session: JourneySessionDTO) => string;
}

const DEFAULT_REFLECTION: ReflectionConfig = {
  beganLabelKey: 'journey.reflectionBegan',
  beganAnswer: (session) => session.stages[0]?.finalAnswer ?? '',
  arrivedLabelKey: 'journey.reflectionArrived',
  arrivedAnswer: (session) => session.stages[session.stages.length - 1]?.finalAnswer ?? '',
};

interface JourneyScreenShellProps {
  journeyKey: JourneyKey;
  stages: JourneyStage[];
  titleKey: string;
  reflection?: ReflectionConfig;
  renderStageInput?: (
    stage: JourneyStage,
    onSubmit: (answer: string, structuredAnswer?: AgencySortResult) => void,
    priorFinalAnswers: string[],
    extractedPropositions?: string[]
  ) => React.ReactNode | null;
}

export function JourneyScreenShell({
  journeyKey,
  stages,
  titleKey,
  reflection = DEFAULT_REFLECTION,
  renderStageInput,
}: JourneyScreenShellProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const theme = useThemeStore((s) => s.theme);
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const accentRgb = useAppAccentRgb();
  const {
    session,
    purchases,
    mostRecentPurchase,
    completedSession,
    setCompletedSession,
    restarting,
    handleDoItAgain,
  } = useJourneySlot(journeyKey);

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing[4] }]}>
      {theme === 'dark' && <AmbientGlow />}
      <Pressable
        style={styles.backRow}
        onPress={() => router.back()}
        accessibilityRole="button"
      >
        <Text style={styles.backLink}>{t('common.back')}</Text>
      </Pressable>

      {!session ? (
        <ScrollView contentContainerStyle={styles.teaserContent}>
          <Text style={styles.title}>{t(titleKey)}</Text>
          <Text style={styles.introLine}>{t('journey.signInBody')}</Text>
        </ScrollView>
      ) : purchases === null || !mostRecentPurchase ? (
        <View style={styles.centerFill}>
          <ArcKaleidoscopeLoading size={KALEIDOSCOPE_LOADING_SIZE * 0.6} accentRgb={accentRgb} />
        </View>
      ) : completedSession ? (
        <View style={styles.completedWrap}>
          <JourneyReflection
            beganLabelKey={reflection.beganLabelKey}
            beganAnswer={reflection.beganAnswer(completedSession)}
            shiftLabelKey={reflection.shiftLabelKey}
            shiftText={reflection.shiftText?.(completedSession)}
            arrivedLabelKey={reflection.arrivedLabelKey}
            arrivedAnswer={reflection.arrivedAnswer(completedSession)}
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
          journey={journeyKey}
          purchaseId={mostRecentPurchase.id}
          stages={stages}
          onComplete={setCompletedSession}
          renderStageInput={renderStageInput}
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
