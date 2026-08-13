import { ReadingLogEntry } from '../store/measureStore';
import { HEAVY_REGISTER_THRESHOLD } from '../store/engagementStore';
import { VIBRATION_LEVELS } from '../content/measureConfig';

// Real, true facts drawn from someone's own reading history — never an
// interpretation of what a pattern means (see SphereArc.tsx's own header
// comment: "may say what a shape IS... never what it MEANS", the same
// discipline this module holds to). "Portray the better parts first" is
// implemented here as a SELECTION order, never as concealment or spin: a
// true fact is never hidden or distorted, but when there's a choice of
// which true things to lead with, warmth wins. Count-based facts are
// always safe to lead with (more engagement is never spun as bad); the
// one fact that touches state QUALITY is gated by the same threshold the
// app already uses elsewhere to mean "constructive register"
// (HEAVY_REGISTER_THRESHOLD) — either genuinely true-and-positive, or
// silently absent. No version of this shows a heavy month dressed up as
// a good one.
export interface ArcFact {
  key: 'thisMonth' | 'streak' | 'steadiest' | 'allTime';
  params: Record<string, string | number>;
}

// Max facts shown at once — keeps the opening short and legible, not a
// data dump competing with the sparkline below it for attention.
const MAX_FACTS = 2;

const LEVEL_SCORE_BY_SLUG: Record<string, number> = Object.fromEntries(
  VIBRATION_LEVELS.map((l) => [l.slug, l.score])
);

function isSameCalendarDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isSameCalendarMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

// Consecutive calendar days, walking backward from today, with at least
// one reading each — stops at the first gap. A "streak" of 1 isn't a
// streak (that's just "you measured today"), so callers only surface
// this at >= 2. Readings on the SAME day count once toward that day,
// not once per reading.
function currentStreakDays(readingLog: ReadingLogEntry[], now: Date): number {
  if (readingLog.length === 0) return 0;
  const daysWithReading = new Set(
    readingLog.map((e) => {
      const d = new Date(e.ts);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  let streak = 0;
  const cursor = new Date(now);
  // Today itself doesn't have to have a reading yet for a streak that
  // started yesterday to still count — only walk backward from the most
  // recent day that HAS a reading.
  if (!daysWithReading.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (daysWithReading.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// The most-read level slug within the given month's entries, IF there's
// a genuine single mode — a full tie (every level distinct, or two+
// levels sharing the top count) means there's no real "most" to report,
// so this returns null rather than picking arbitrarily.
function modeLevelSlug(entries: ReadingLogEntry[]): string | null {
  if (entries.length === 0) return null;
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.levelSlug, (counts.get(e.levelSlug) ?? 0) + 1);
  let topSlug: string | null = null;
  let topCount = 0;
  let tie = false;
  for (const [slug, count] of counts) {
    if (count > topCount) {
      topSlug = slug;
      topCount = count;
      tie = false;
    } else if (count === topCount) {
      tie = true;
    }
  }
  if (tie || topCount <= 1) return null;
  return topSlug;
}

export function buildArcFacts(readingLog: ReadingLogEntry[], now: Date = new Date()): ArcFact[] {
  const candidates: ArcFact[] = [];

  const thisMonthEntries = readingLog.filter((e) => isSameCalendarMonth(new Date(e.ts), now));
  if (thisMonthEntries.length > 0) {
    candidates.push({ key: 'thisMonth', params: { count: thisMonthEntries.length } });
  }

  const streak = currentStreakDays(readingLog, now);
  if (streak >= 2) {
    candidates.push({ key: 'streak', params: { count: streak } });
  }

  const steadySlug = modeLevelSlug(thisMonthEntries);
  if (steadySlug && (LEVEL_SCORE_BY_SLUG[steadySlug] ?? 0) >= HEAVY_REGISTER_THRESHOLD) {
    candidates.push({ key: 'steadiest', params: { levelSlug: steadySlug } });
  }

  if (candidates.length === 0 && readingLog.length > 0) {
    candidates.push({ key: 'allTime', params: { count: readingLog.length } });
  }

  return candidates.slice(0, MAX_FACTS);
}
