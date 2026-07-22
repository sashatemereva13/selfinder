import { Href } from 'expo-router';
import { MeasureResult } from '../types';

export type NudgeState = 'never_measured' | 'measured_not_today' | 'measured_today';

function isToday(isoString: string): boolean {
  const date = new Date(isoString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  );
}

// Pure state derivation from what's already in measureStore — no new
// persisted "today" flag needed, just a date comparison on the existing
// `savedAt` timestamp.
export function getNudgeState(
  currentResult: MeasureResult | null,
  previousResult: MeasureResult | null
): NudgeState {
  if (!currentResult && !previousResult) return 'never_measured';
  if (currentResult && isToday(currentResult.savedAt)) return 'measured_today';
  return 'measured_not_today';
}

interface NudgeCopy {
  text: string;
  actionLabel: string;
  route: Href;
}

// Pre-written per philosopher, not a live LLM call — this needs to render
// instantly and reliably every time the Guide screen opens. Deliberately
// kept to three states for now; resist branching on band/score/axis yet.
export const NUDGE_COPY: Record<string, Record<NudgeState, NudgeCopy>> = {
  socrates: {
    never_measured: { text: "You haven't asked yourself the first question yet.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_not_today: { text: 'Has anything shifted since you last looked?', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've looked once today. Want to sit with what you found?", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
  },
  stoics: {
    never_measured: { text: "You can't govern what you haven't yet observed.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_not_today: { text: 'The ground may have shifted since this morning.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've taken your reading. Now steady what you found.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
  },
  kierkegaard: {
    never_measured: { text: "You haven't yet named where you actually are.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_not_today: { text: 'Whoever you were this morning may not be who you are now.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've named it once today. Sit inside it a while.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
  },
  camus: {
    never_measured: { text: "You haven't looked at where you're standing yet.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_not_today: { text: "The ground doesn't stay still. Worth a second look.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've looked once today. That's enough truth for now — or tune in a while.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
  },
  aristotle: {
    never_measured: { text: 'A good life starts with an honest reading of where you are.', actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_not_today: { text: 'Habits are built daily. Worth checking in again.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've checked in today. Now practice steadying it.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
  },
};

export function getNudgeCopy(philosopherId: string, state: NudgeState): NudgeCopy {
  return NUDGE_COPY[philosopherId]?.[state] ?? NUDGE_COPY.socrates[state];
}
