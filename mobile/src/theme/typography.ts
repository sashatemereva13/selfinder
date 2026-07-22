export const fonts = {
  // Deliberately mapped to the Medium weight file, not Light — thin strokes
  // on a near-black background blur at the edges (halation) and were hard
  // to read in longer body text. Kept the key name "light" rather than
  // renaming it everywhere, so this stays a one-line, easily reversible
  // change while it's being evaluated live.
  light: 'Panchang-Medium',
  medium: 'Panchang-Medium',
} as const;

export const fontSizes = {
  xs:   11,
  sm:   14,
  base: 16,
  md:   17,
  lg:   22,
  xl:   28,
  xxl:  36,
  hero: 48,
} as const;

export const lineHeights = {
  tight:  1.15,
  normal: 1.55,
  loose:  1.72,
} as const;

export const letterSpacings = {
  kicker: 2.8,
  wide:   1.2,
  normal: 0,
} as const;
