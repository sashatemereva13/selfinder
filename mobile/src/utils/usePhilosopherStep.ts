import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { usePhilosopherStore } from '../store/philosopherStore';
import { useMeasureStore } from '../store/measureStore';
import { useEngagementStore } from '../store/engagementStore';
import { useGuideChatStore } from '../store/guideChatStore';
import { useShiftStore } from '../store/shiftStore';
import { useLocaleStore } from '../store/localeStore';
import { getSeamLine, getSeamState, SeamState } from '../content/depthsSeam';
import { getLocalizedLevelName } from '../content/measureConfig';
import { buildReadingContext } from './readingContext';
import { track } from './analytics';

// The philosopher's one next step (RULES.md, "The philosopher always points
// to exactly one next step") — the minimap handle's label, and the way
// back into Today's chain from anywhere in the app.
export function usePhilosopherStep() {
  const { t } = useTranslation();
  const router = useRouter();
  const philosopher = usePhilosopherStore((s) => s.philosopher);
  const currentResult = useMeasureStore((s) => s.currentResult);
  const levelPageSeenFor = useEngagementStore((s) => s.levelPageSeenFor);
  // Which of today's two practices have been walked from this reading —
  // the step moves on through them in order (2026-10-18).
  const sessions = useShiftStore((s) => s.sessions);
  const hydrateShifts = useShiftStore((s) => s.hydrate);
  useEffect(() => {
    hydrateShifts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const usedFor = !!currentResult && sessions.some((x) => x.readingAt === currentResult.savedAt && x.door === 'use');
  const shiftedFor = !!currentResult && sessions.some((x) => x.readingAt === currentResult.savedAt && x.door === 'love');
  const recordTalkAboutIt = useEngagementStore((s) => s.recordTalkAboutIt);
  const addReading = useGuideChatStore((s) => s.addReading);
  const locale = useLocaleStore((s) => s.locale);

  const state: SeamState = getSeamState(currentResult, { levelPageSeenFor, usedFor, shiftedFor });
  const line = philosopher ? getSeamLine(philosopher.id, state, locale, currentResult?.savedAt) : '';
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
      case 'use':
        return t('shift.useAction', {
          level: currentResult ? getLocalizedLevelName(currentResult.vibrationLevel, locale).toLowerCase() : '',
        });
      case 'shift':
        return t('shift.loveLabel');
    }
  })();

  // Every step leads somewhere — the day never ends (2026-10-18).
  const hasAction = true;

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
      case 'use':
        router.push({ pathname: '/(tabs)/depths/session', params: { door: 'use' } });
        break;
      case 'shift':
        router.push({ pathname: '/(tabs)/depths/session', params: { door: 'love' } });
        break;
    }
  };

  return { philosopher, state, line, actionLabel, hasAction, run, openConversation };
}
