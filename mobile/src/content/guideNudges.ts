import { Href } from 'expo-router';
import { MeasureResult } from '../types';
import { getRelativeTimeBucket } from '../utils/relativeTime';

// yesterday/thisWeek/longerAgo split out from one "measured_not_today"
// bucket — two philosophers' lines named a specific elapsed time ("this
// morning"), which was simply false once the last reading was a day or
// more old, and the specificity is what makes a line like this land: "whoever
// you were three weeks ago" is a sharper claim than a vague one that doesn't
// match reality. The other three philosophers' original copy was already
// time-agnostic ("since you last looked") and works at any distance, but
// they get real per-bucket lines too now rather than reusing one line
// everywhere, so all five carry the same weight of specificity.
export type NudgeState = 'never_measured' | 'measured_today' | 'measured_yesterday' | 'measured_this_week' | 'measured_longer_ago';

// Pure state derivation from what's already in measureStore — no new
// persisted "today" flag needed, just a date comparison on the existing
// `savedAt` timestamp.
export function getNudgeState(
  currentResult: MeasureResult | null,
  previousResult: MeasureResult | null
): NudgeState {
  if (!currentResult && !previousResult) return 'never_measured';
  if (!currentResult) return 'measured_longer_ago';
  const bucket = getRelativeTimeBucket(currentResult.savedAt);
  if (bucket === 'today') return 'measured_today';
  if (bucket === 'yesterday') return 'measured_yesterday';
  if (bucket === 'thisWeek') return 'measured_this_week';
  return 'measured_longer_ago';
}

interface NudgeCopy {
  text: string;
  actionLabel: string;
  route: Href;
}

// Pre-written per philosopher, not a live LLM call — this needs to render
// instantly and reliably every time the Guide screen opens.
export const NUDGE_COPY: Record<string, Record<NudgeState, NudgeCopy>> = {
  socrates: {
    never_measured: { text: "You haven't asked yourself the first question yet.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've looked once today. Want to sit with what you found?", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
    measured_yesterday: { text: 'Has anything shifted since yesterday?', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_this_week: { text: 'Still the same answer as a few days ago — or has the question changed?', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_longer_ago: { text: "It's been a while since you asked. Have you noticed, or just not looked?", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
  },
  stoics: {
    never_measured: { text: "You can't govern what you haven't yet observed.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've taken your reading. Now steady what you found.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
    measured_yesterday: { text: 'The ground may have shifted since yesterday.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_this_week: { text: "Several days have passed. What was true then isn't owed to still be true.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_longer_ago: { text: "It's been weeks since you last observed yourself closely. That's long enough for the ground to have moved.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
  },
  kierkegaard: {
    never_measured: { text: "You haven't yet named where you actually are.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've named it once today. Sit inside it a while.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
    measured_yesterday: { text: 'Whoever you were yesterday may not be who you are now.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_this_week: { text: 'Whoever you were a few days ago has already had days to become someone else.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_longer_ago: { text: "Whoever you were weeks ago is nearly a stranger by now — and you've been calling yourself by their name since.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
  },
  camus: {
    never_measured: { text: "You haven't looked at where you're standing yet.", actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've looked once today. That's enough truth for now — or tune in a while.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
    measured_yesterday: { text: "The ground didn't stay still overnight. Worth a second look.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_this_week: { text: "Days have passed without you checking. The ground moved anyway — it doesn't wait for witnesses.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_longer_ago: { text: "Weeks since you looked. You've been standing somewhere new this whole time, unwitnessed.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
  },
  aristotle: {
    never_measured: { text: 'A good life starts with an honest reading of where you are.', actionLabel: 'Measure', route: '/(tabs)/depths/measure' },
    measured_today: { text: "You've checked in today. Now practice steadying it.", actionLabel: 'Tune In', route: '/(tabs)/depths/tunein' },
    measured_yesterday: { text: 'Habits are built daily. Worth checking in again.', actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_this_week: { text: "A few days without checking in is how good practice quietly lapses. Pick it back up.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
    measured_longer_ago: { text: "It's been weeks. A practice you don't return to isn't really a practice anymore.", actionLabel: 'Measure again', route: '/(tabs)/depths/measure' },
  },
};

export function getNudgeCopy(philosopherId: string, state: NudgeState): NudgeCopy {
  return NUDGE_COPY[philosopherId]?.[state] ?? NUDGE_COPY.socrates[state];
}
