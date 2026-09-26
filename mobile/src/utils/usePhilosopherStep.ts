import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { usePhilosopherStore } from '../store/philosopherStore';
import { useMeasureStore } from '../store/measureStore';
import { useEngagementStore } from '../store/engagementStore';
import { useGuideChatStore } from '../store/guideChatStore';
import { useLocaleStore } from '../store/localeStore';
import { getSeamLine, getSeamState, SeamState } from '../content/depthsSeam';
import { MapPlaceId } from '../content/mapPlaces';
import { getLocalizedLevelName } from '../content/measureConfig';
import { buildReadingContext } from './readingContext';
import { track } from './analytics';

// The philosopher's one next step (RULES.md, "The philosopher always points
// to exactly one next step") — shared by Depths' seam and the map, so the
// line someone reads in the middle of Depths and the place that glows on
// the map are always the same step.
export function usePhilosopherStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const levelPageSeenFor = useEngagementStore((s) => s.levelPageSeenFor);
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);
  const addReading = useGuideChatStore((s) => s.addReading);
  const locale = useLocaleStore((s) => s.locale);

  const state: SeamState = getSeamState(currentResult, levelPageSeenFor);
  const line = philosopher ? getSeamLine(philosopher.id, state, locale) : '';
  const philosopherName = philosopher?.nameInstrumental ?? philosopher?.name ?? '';

  const actionLabel = (() => {
    switch (state) {
      case 'firstMeasure':
        return t('depths.measureLabel');
      case 'measureAgain':
        return t('depths.measureAgain');
      case 'learn':
        return t('depths.seamLearnAction', {
          level: currentResult ? getLocalizedLevelName(currentResult.vibrationLevel, locale) : '',
        });
      case 'talk':
        return t('depths.understandItDescription', { name: philosopherName });
    }
  })();

  // Where this step lives on the map. "Learn" goes to the reading's own
  // level page, which sits under Levels there.
  const mapTarget: MapPlaceId = state === 'talk' ? 'talk' : state === 'learn' ? 'levels' : 'measure';

  // Opens the conversation. With a reading, it joins the conversation
  // first (the philosopher's reflection as their latest message, its
  // details as context) so the person answers in their own words — never a
  // scripted message sent in their name. addReading is idempotent per
  // reading.
  const openConversation = () => {
    if (philosopher && currentResult) {
      recordTalkAboutIt();
      addReading(philosopher.id, {
        savedAt: currentResult.savedAt,
        reflection: currentResult.combinationMessage ?? null,
        context: buildReadingContext(currentResult),
        measureResultId: currentResult.measureResultId,
      });
    }
    router.push('/guide');
  };

  const run = () => {
    track('philosopher_step_taken', { state });
    switch (state) {
      case 'firstMeasure':
      case 'measureAgain':
        router.push('/(tabs)/depths/measure');
        break;
      case 'learn':
        if (currentResult) {
          router.push({ pathname: '/(tabs)/depths/level/[id]', params: { id: currentResult.vibrationLevel.slug } });
        }
        break;
      case 'talk':
        openConversation();
        break;
    }
  };

  return { philosopher, state, line, actionLabel, mapTarget, run, openConversation };
}
