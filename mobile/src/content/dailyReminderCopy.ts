// Three lines per philosopher for the daily local reminder notification —
// routine (the default), gentle (for a lapsing return pattern or a recent
// run of heavier readings), and dormant (a longer gap since anyone measured
// at all). Still fixed lines, not a rotating bank, for the same reason as
// before: this is a repeating OS-level trigger, re-picked only when the
// reminder gets (re)scheduled, not regenerated fresh each time it fires.
export type ReminderTone = 'routine' | 'gentle' | 'dormant';

export const DAILY_REMINDER_COPY: Record<string, Record<ReminderTone, string>> = {
  socrates: {
    routine: 'A quiet moment to ask: where are you, really?',
    gentle: "No question today, if you don't want one. Just notice what's true.",
    dormant: "It's been a while. Nothing was lost by the silence — come back whenever you're ready to look.",
  },
  stoics: {
    routine: 'A moment to look at where you actually stand today.',
    gentle: "Whatever today has been, you don't have to fix it right now — just notice it.",
    dormant: "It's been some time. Nothing to catch up on, nothing owed — just return to solid ground whenever you're ready.",
  },
  kierkegaard: {
    routine: "However you're arriving today, it's worth noticing.",
    gentle: 'No pressure to name it today. Just showing up, however you are, is enough.',
    dormant: "It's been a while since you were here. That's alright — come back whenever the moment is right, not before.",
  },
  camus: {
    routine: "Whatever's true for you right now is worth a moment's honesty.",
    gentle: 'No need to make sense of it today. Just being honest about it is enough.',
    dormant: "Time passed. That's not a debt — return whenever you feel like it, if you feel like it.",
  },
  aristotle: {
    routine: 'A small, deliberate moment — check in with yourself.',
    gentle: 'No need to act on anything today. Just noticing where you are is enough practice.',
    dormant: "It's been a while. No practice is wasted by a pause — come back whenever you're ready to begin again.",
  },
};

export function getDailyReminderCopy(philosopherId: string, tone: ReminderTone = 'routine'): string {
  const entry = DAILY_REMINDER_COPY[philosopherId] ?? DAILY_REMINDER_COPY.socrates;
  return entry[tone] ?? entry.routine;
}
