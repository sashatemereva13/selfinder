// The 17-level vibration catalog's shared fields — name, slug, score, and
// web route, in Shame (lowest) -> Enlightenment (highest) order. This is
// the single source of truth for backend/data/vibrationLevels.js and
// mobile/src/content/measureConfig.ts's own VIBRATION_LEVELS exports.
//
// `frame` (a one-line qualitative anchor used to ground the interview
// scoring prompt) is deliberately NOT here — it's backend-only LLM-prompt
// content mobile's bundle has no use for. Backend layers its own local
// `frame` text over this array by slug (see vibrationLevels.js). Note:
// mobile/src/content/levelsContent.ts has its own, separate `frame` field
// (richer, reader-facing Level-detail copy) — that's a different,
// still-unfixed duplication against this file and frontend/'s copy, not
// addressed here (see RULES.md's collaboration-log-equivalent notes for
// why that's out of scope for this pass).
export const VIBRATION_LEVELS = [
  { name: 'Shame', slug: 'shame', score: 20, route: '/levels/shame' },
  { name: 'Guilt', slug: 'guilt', score: 30, route: '/levels/guilt' },
  { name: 'Apathy', slug: 'apathy', score: 50, route: '/levels/apathy' },
  { name: 'Grief', slug: 'grief', score: 75, route: '/levels/grief' },
  { name: 'Fear', slug: 'fear', score: 100, route: '/levels/fear' },
  { name: 'Desire', slug: 'desire', score: 125, route: '/levels/desire' },
  { name: 'Anger', slug: 'anger', score: 150, route: '/levels/anger' },
  { name: 'Pride', slug: 'pride', score: 175, route: '/levels/pride' },
  { name: 'Courage', slug: 'courage', score: 200, route: '/levels/courage' },
  { name: 'Neutrality', slug: 'neutrality', score: 250, route: '/levels/neutrality' },
  { name: 'Willingness', slug: 'willingness', score: 310, route: '/levels/willingness' },
  { name: 'Acceptance', slug: 'acceptance', score: 350, route: '/levels/acceptance' },
  { name: 'Reason', slug: 'reason', score: 400, route: '/levels/reason' },
  { name: 'Love', slug: 'love', score: 500, route: '/levels/love' },
  { name: 'Unconditional Love', slug: 'unconditionallove', score: 540, route: '/levels/unconditionallove' },
  { name: 'Peace', slug: 'peace', score: 600, route: '/levels/peace' },
  { name: 'Enlightenment', slug: 'enlightenment', score: 700, route: '/levels/enlightenment' },
];
