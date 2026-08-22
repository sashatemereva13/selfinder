// Two ways of touching the app that are genuinely non-standard (not
// covered by ordinary iOS/Android conventions) and easy to miss without
// being told — deliberately kept to just these two rather than an
// exhaustive feature list, so this stays a quick read rather than a
// manual. Shared between app/how-to-use.tsx (the standalone screen,
// reachable from the You tab any time) and HowToUseOverlay.tsx (shown
// once, right after onboarding) so the two never drift apart.
export interface HowToEntry {
  headingKey: string;
  bodyKey: string;
}

export const HOW_TO_USE_ENTRIES: HowToEntry[] = [
  { headingKey: 'howToUse.saveHeading', bodyKey: 'howToUse.saveBody' },
  { headingKey: 'howToUse.ringHeading', bodyKey: 'howToUse.ringBody' },
];
