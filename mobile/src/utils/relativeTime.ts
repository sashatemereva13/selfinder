// Shared by Depths (the exact caption next to the kicker) and the Guide
// nudges (which need a coarser bucket to pick philosopher copy by) — one
// definition of "how long ago" so the two screens never drift into
// different vocabularies for the same thing.

import { Locale } from '../store/localeStore';

// A full "Jan 1, 2026"-style date — every Your Arc page and Journey
// screen that shows a purchase/reading date used to reimplement this
// themselves (six copies, two slightly different signatures). Accepts
// either a timestamp (most call sites) or an ISO string (JourneysPage's
// own JourneySessionDTO.completedAt), and an optional locale for the one
// call site (JourneysPage) that needs Russian date formatting.
export function formatDate(input: number | string, locale?: Locale): string {
  const date = typeof input === 'number' ? new Date(input) : new Date(input);
  return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysSince(isoString: string): number {
  const date = new Date(isoString);
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
}

// Makes clear whether a reading reflects right now or something from a
// while back — a bare level name otherwise reads identically whether it's
// five minutes or three weeks old.
export function formatRelativeDay(isoString: string): string {
  const diffDays = daysSince(isoString);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export type RelativeTimeBucket = 'today' | 'yesterday' | 'thisWeek' | 'longerAgo';

// Coarser than formatRelativeDay's display string — just enough buckets for
// the philosopher's "measure again" line to pick by, not a full calendar
// vocabulary. thisWeek covers 2-6 days; longerAgo is a week or more.
export function getRelativeTimeBucket(isoString: string): RelativeTimeBucket {
  const diffDays = daysSince(isoString);
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return 'thisWeek';
  return 'longerAgo';
}
