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
  key: 'thisMonth' | 'streak' | 'steadiest' | 'allTime' | 'dayOfWeek' | 'timeOfDay' | 'dayAndTime' | 'cadence';
  params: Record<string, string | number>;
}

// Max facts shown at once — keeps the opening short and legible, not a
// data dump competing with the sparkline below it for attention.
//
// 2026-09-05: raised from 2 to 3 to make real room for a rhythm fact
// (day-of-week/time-of-day/cadence, see buildRhythmFacts below) alongside
// the existing count-based facts, without displacing them — rhythm facts
// are the one genuinely NEW category of insight added since this file
// was first built, and were at real risk of never being seen if they had
// to compete for the same 2 slots count-based facts already filled.
const MAX_FACTS = 3;

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
// Coarse enough that this never reads as surveillance ("you measured at
// 7:42pm") — four wide, named windows, the same register a person would
// describe their own day in, not a precise clock reading.
type TimeWindow = 'morning' | 'afternoon' | 'evening' | 'night';
function timeWindowForHour(hour: number): TimeWindow {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'night';
}

// Generic "is there a real, non-tied plurality" mode-finder — the same
// discipline modeLevelSlug (below) already uses for levels, generalized
// so day-of-week and time-of-day facts can share one implementation
// rather than each hand-rolling their own tie-detection. Requires the
// winning bucket to have strictly more entries than every other bucket
// AND at least MIN_COUNT entries outright — a plurality of 2-out-of-3
// isn't a real rhythm yet, it's just how few data points happened to
// land.
function modeOf<T extends string>(values: T[], minCount: number): T | null {
  if (values.length === 0) return null;
  const counts = new Map<T, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let top: T | null = null;
  let topCount = 0;
  let tie = false;
  for (const [v, count] of counts) {
    if (count > topCount) {
      top = v;
      topCount = count;
      tie = false;
    } else if (count === topCount) {
      tie = true;
    }
  }
  if (tie || topCount < minCount) return null;
  return top;
}

// Requires the winning bucket to be a genuine plurality relative to the
// TOTAL sample, not just relative to its rivals — e.g. with 10 readings
// spread 3/3/2/2 across four days, "3" wins modeOf's tie-check but is
// really just noise; requiring the winner to cover at least this
// fraction of all readings keeps the fact honest about how real the
// pattern actually is.
const MIN_MODE_SHARE = 0.34;
function hasRealShare<T>(winner: T, values: T[]): boolean {
  const count = values.filter((v) => v === winner).length;
  return count / values.length >= MIN_MODE_SHARE;
}

// Median (not mean) gap in whole days between consecutive readings —
// median so one long gap after a break, or one unusually quick same-day
// re-check, doesn't skew what's presented as the person's OWN typical
// cadence. Needs readingLog sorted ascending by ts (measureStore's own
// stored order) and at least 2 entries to have any gap at all.
function medianGapDays(sortedTs: number[]): number | null {
  if (sortedTs.length < 2) return null;
  const gaps: number[] = [];
  for (let i = 1; i < sortedTs.length; i++) {
    gaps.push((sortedTs[i] - sortedTs[i - 1]) / (24 * 60 * 60 * 1000));
  }
  gaps.sort((a, b) => a - b);
  const mid = Math.floor(gaps.length / 2);
  const median = gaps.length % 2 === 0 ? (gaps[mid - 1] + gaps[mid]) / 2 : gaps[mid];
  return median;
}

// A cadence is only worth stating as "your rhythm" if the gaps
// themselves are reasonably CONSISTENT — a median of 4 days computed
// from gaps of {1, 1, 1, 20} is technically a number but isn't a real
// rhythm, it's one outlier plus a cluster. Gated on the interquartile-ish
// spread staying within a generous multiple of the median, rather than
// requiring strict regularity — real usage is never perfectly even, this
// just excludes the genuinely chaotic case.
function cadenceIsConsistent(sortedTs: number[], median: number): boolean {
  const gaps: number[] = [];
  for (let i = 1; i < sortedTs.length; i++) {
    gaps.push((sortedTs[i] - sortedTs[i - 1]) / (24 * 60 * 60 * 1000));
  }
  const withinRange = gaps.filter((g) => g <= median * 2.5 + 1).length;
  return withinRange / gaps.length >= 0.6;
}

// Rhythm facts (2026-09-05) — the one genuinely new category since this
// file was first built: real, checkable STRUCTURE (when readings happen,
// how often) rather than counts. Deliberately still holds this file's
// own anti-diagnosis line exactly: these facts describe TIMING patterns
// in the data, never a vibration/level, and never what the timing means
// about the person (no "you check in when you're anxious," just "you
// tend to check in on Sundays" — the same "may say what a shape IS,
// never what it MEANS" discipline this file's own header comment already
// establishes for everything else here). Computed from the FULL
// readingLog (not scoped to this month, unlike thisMonth/steadiest) —
// a rhythm is a longer-run property, a few weeks of data reads it more
// reliably than one calendar month alone.
function buildRhythmFacts(readingLog: ReadingLogEntry[]): ArcFact[] {
  if (readingLog.length < 4) return []; // too little data for a real pattern claim
  const facts: ArcFact[] = [];
  const sortedTs = [...readingLog].map((e) => e.ts).sort((a, b) => a - b);
  const dates = readingLog.map((e) => new Date(e.ts));

  const days = dates.map((d) => DAY_NAMES[d.getDay()]);
  const dayMode = modeOf(days, 3);
  const dayIsReal = dayMode !== null && hasRealShare(dayMode, days);

  const windows = dates.map((d) => timeWindowForHour(d.getHours()));
  const timeMode = modeOf(windows, 3);
  const timeIsReal = timeMode !== null && hasRealShare(timeMode, windows);

  if (dayIsReal && timeIsReal) {
    facts.push({ key: 'dayAndTime', params: { day: dayMode!, time: timeMode! } });
  } else if (dayIsReal) {
    facts.push({ key: 'dayOfWeek', params: { day: dayMode! } });
  } else if (timeIsReal) {
    facts.push({ key: 'timeOfDay', params: { time: timeMode! } });
  }

  // Cadence specifically needs a higher minimum sample than day/time
  // facts do — a 4-point cadence claim has no equivalent to
  // hasRealShare's own "at least 34% of all readings" bar (there's no
  // natural "share" concept for a median gap the way there is for a
  // day-of-week bucket), so with only 4 readings, 3 scattered gaps that
  // merely happen to be within 2.5x of each other's median can read as
  // "consistent" by the letter of cadenceIsConsistent's own check while
  // still being too thin a sample to honestly call a rhythm (confirmed
  // by hand-testing: 4 genuinely random dates 2-3 weeks apart passed the
  // consistency check even though neither their day-of-week nor their
  // time-of-day showed any real pattern at all). Requiring at least 6
  // readings (5 gaps) before trusting a cadence claim is a cheap, blunt
  // fix for that specific false-positive shape.
  const MIN_READINGS_FOR_CADENCE = 6;
  const median = medianGapDays(sortedTs);
  if (
    readingLog.length >= MIN_READINGS_FOR_CADENCE &&
    median !== null &&
    median >= 1 &&
    cadenceIsConsistent(sortedTs, median)
  ) {
    facts.push({ key: 'cadence', params: { days: Math.round(median) } });
  }

  return facts;
}

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

  // Rhythm facts (2026-09-05) — inserted here, after the baseline
  // orientation facts (this month/streak/steadiest) but BEFORE the
  // final slice, so they get real priority within MAX_FACTS rather than
  // only surfacing for someone who happens to have room left after the
  // more common count-based facts fill every slot. This is deliberate:
  // rhythm facts are the one category here that's genuinely NEW
  // information a person likely hasn't consciously noticed about
  // themselves (see this file's own review notes on Your Arc needing
  // real structural insight, not just counts) — they should compete for
  // visibility, not just get whatever's left over.
  candidates.push(...buildRhythmFacts(readingLog));

  if (candidates.length === 0 && readingLog.length > 0) {
    candidates.push({ key: 'allTime', params: { count: readingLog.length } });
  }

  return candidates.slice(0, MAX_FACTS);
}
