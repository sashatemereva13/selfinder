export const fonts = {
  // Switched from Panchang to Etude Noire — Panchang has zero Cyrillic
  // glyphs (confirmed via fonttools), so any Russian text fell back to a
  // system font. Etude Noire has full Cyrillic coverage plus correct
  // PostScript names in every weight file (Panchang's were corrupted —
  // literally the string "false" — which also caused it to render bold on
  // Android regardless of the weight requested). One typeface for every
  // language, per RULES.md's "one typeface" rule — not a per-locale font.
  // Deliberately mapped to the Medium weight file, not Light — thin strokes
  // on a near-black background blur at the edges (halation) and were hard
  // to read in longer body text. Kept the key name "light" rather than
  // renaming it everywhere, so this stays a one-line, easily reversible
  // change while it's being evaluated live.
  light: "EtudeNoire-Medium",
  medium: "EtudeNoire-Medium",
  // 2026-09-02 — the REAL Light face, added specifically for Depths'
  // sphere labels (unselected state needs to read as genuinely lighter
  // than the selected one — see that screen's own comment on why
  // synthetic fontWeight alone didn't work against fonts.light/medium,
  // which are both really Medium under the hood). Deliberately a
  // separate key, not a change to fonts.light itself — fonts.light is
  // used everywhere in the app per RULES.md's "one typeface" rule, and
  // swapping ITS mapping to true Light would change every screen at
  // once, not just this one deliberate contrast.
  trueLight: "EtudeNoire-Light",
} as const;

export const fontSizes = {
  xs: 11,
  sm: 14,
  base: 16,
  md: 15,
  lg: 22,
  xl: 28,
  xxl: 36,
  hero: 48,
} as const;

export const lineHeights = {
  tight: 1.15,
  // Loosened from 1.32 (review, 2026-08-19: a long philosopher reply in
  // Guide read as dense/hard to follow on a real device). Moved most of
  // the way toward `normal` (1.55) rather than all the way — chat text
  // still benefits from reading a little tighter than a long-form page
  // like Measure's own copy, just not as tight as the original value.
  chat: 1.48,
  normal: 1.55,
  loose: 1.72,
} as const;

export const letterSpacings = {
  kicker: 2.8,
  wide: 1.2,
  normal: 0,
  // A small positive value for body/chat text specifically (2026-08-19,
  // same readability review as lineHeights.chat above) — the Medium
  // weight file body text is set in (see fonts.light's own comment) reads
  // slightly cramped at its default tracking, especially in a long Guide
  // reply. Deliberately much smaller than `wide`/`kicker`, which are
  // meant to read as a label's own distinct register, not body prose.
  body: 0.15,
} as const;
