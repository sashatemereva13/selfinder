// One line per philosopher for the daily local reminder notification.
// Deliberately a single fixed line each, not a rotating bank — this is a
// repeating OS-level trigger, not something re-scheduled per day, so there's
// nowhere for variation to come from without real added complexity.
export const DAILY_REMINDER_COPY: Record<string, string> = {
  socrates: 'A quiet moment to ask: where are you, really?',
  stoics: 'A moment to look at where you actually stand today.',
  kierkegaard: "However you're arriving today, it's worth noticing.",
  camus: "Whatever's true for you right now is worth a moment's honesty.",
  aristotle: 'A small, deliberate moment — check in with yourself.',
};

export function getDailyReminderCopy(philosopherId: string): string {
  return DAILY_REMINDER_COPY[philosopherId] ?? DAILY_REMINDER_COPY.socrates;
}
