// Hand-written literal type for journeyKeys.mjs, for anything that
// imports './journeyKeys.mjs' directly rather than through index.mjs/
// index.d.ts (the barrel most consumers use — see index.d.ts, which
// declares its own inline JOURNEY_KEYS type since a `.d.ts` file
// re-exporting from a plain `.mjs` does NOT pick up this sibling
// declaration file automatically — confirmed live: TS infers a widened
// `string[]` through that re-export path unless the type is declared
// directly in index.d.ts itself). Both declarations must stay in sync
// with journeyKeys.mjs's actual literal values by hand — there is no way
// to derive a `.d.ts` from a plain `.mjs` array automatically — so a new
// Journey key needs an edit here too.
export declare const JOURNEY_KEYS: readonly [
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
