// The open-ended family of one-time-purchase Journey products (see
// RULES.md's Product/positioning section and docs/journeys-concept.md
// for the full architecture — Center is the only Journey with real
// content today; the rest are named, reachable, "not yet available").
// Source of truth for backend's Mongoose enum (backend/models/User.js)
// and mobile's derived JourneyKey union (mobile/src/types/index.ts).
// Adding a new Journey means adding one value here plus one entry in
// mobile/app/products.tsx's own catalog — that catalog stays a plain
// string-keyed array on purpose (see its own comment), not a closed
// union, since the family is expected to keep growing.
//
// 2026-08-23: replaced the earlier placeholder either-or/identity
// entries (named but with no worked-through architecture) with this
// question-first catalog — Control is the reference implementation, see
// docs/journeys-concept.md's full worked example.
export const JOURNEY_KEYS = [
  'center',
  'control',
  'the-choice',
  'the-loop',
  'whose-voice',
  'the-road-not-taken',
  'letting-go',
  'the-mirror',
  'the-unsaid',
  'becoming',
  'the-threshold',
  'possible-selves',
  'enough',
];
