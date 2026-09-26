// Ways of touching the app that are genuinely non-standard (not covered
// by ordinary iOS/Android conventions, or — for guideEntry/profileEntry
// below — a real behavior change from the 2026-08-27 navigation
// restructure that isn't obvious from looking at the new tab bar alone)
// and easy to miss without being told. Deliberately kept short rather
// than an exhaustive feature list, so this stays a quick read rather
// than a manual. Rendered by app/how-to-use.tsx (reachable via the
// profile icon any time).
export interface HowToEntry {
  headingKey: string;
  bodyKey: string;
}

export const HOW_TO_USE_ENTRIES: HowToEntry[] = [
  { headingKey: 'howToUse.saveHeading', bodyKey: 'howToUse.saveBody' },
  { headingKey: 'howToUse.ringHeading', bodyKey: 'howToUse.ringBody' },
  { headingKey: 'howToUse.mapHeading', bodyKey: 'howToUse.mapBody' },
  { headingKey: 'howToUse.guideHeading', bodyKey: 'howToUse.guideBody' },
  { headingKey: 'howToUse.profileHeading', bodyKey: 'howToUse.profileBody' },
];
