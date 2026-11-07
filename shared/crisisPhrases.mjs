// The crisis safety net's phrase list (2026-10-10; shared 2026-11-07).
//
// Phrases only, never single words ("die", "end") — those appear in
// ordinary sentences far too often. Lower-cased, matched as substrings.
//
// Used in three places, always as the deterministic floor under the AI
// classifier, never instead of it:
//   - on the phone, for words promised never to leave it (Spill before it's
//     kept, a Shift session's own words) — the only check those get;
//   - on the phone, when the server's check can't be reached;
//   - on the server, when the classifier fails, and for any text past what
//     the classifier reads.
// Only danger to life triggers anything (RULES.md, "The crisis safety net").
export const CRISIS_PHRASES = Object.freeze([
  'kill myself',
  'killing myself',
  'end my life',
  'end it all',
  'take my own life',
  'want to die',
  "don't want to live",
  'dont want to live',
  'no reason to live',
  'better off dead',
  'better off without me',
  'hurt myself',
  'harm myself',
  'suicide',
  'suicidal',
  'не хочу жить',
  'хочу умереть',
  'покончить с собой',
  'убить себя',
  'свести счёты',
  'свести счеты',
  'суицид',
  'самоубий',
  'причинить себе вред',
  'лучше бы меня не было',
]);

export function mentionsCrisis(...texts) {
  const all = texts.filter((t) => typeof t === "string").join(" ").toLowerCase();
  return CRISIS_PHRASES.some((phrase) => all.includes(phrase));
}
