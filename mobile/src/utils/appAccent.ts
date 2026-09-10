import { useLevelColors, useLevelTextColors } from '../content/measureConfig';
import { useMeasureStore } from '../store/measureStore';
import { useThemeColors } from '../theme/useThemeColors';

// One color for the whole app: the neutral aura tone before a first
// reading, the current vibration level's color after — replaces what used
// to be a per-philosopher accent (an arbitrary color assignment with no
// real meaning, and one that could land close to an unrelated vibration
// color and read as the wrong signal). Philosophers are still told apart by
// name, symbol, and voice — just not by a color that used to mean nothing.
// Neutral fallback is theme-aware (colors.accent.ivoryRgb) rather than a
// fixed constant — before this, the neutral default was hardcoded to
// literal ivory regardless of theme, matching AuraFigure's neutral tone in
// dark mode but reading as invisible-on-background in light mode (see
// colors.ts's own accent.ivory comment for the same underlying bug).
//
// For a DECORATIVE use (a dot, ring, wheel segment, SVG fill/stroke) —
// not for Text color. Use useAppAccentTextRgb() below for that instead;
// this value measures only 2.45:1 (light mode's neutral fallback) or as
// low as 2.89:1 (a level color) against the page background, well below
// WCAG AA for text of any size.
export function useAppAccentRgb(): string {
  const slug = useMeasureStore((s) => s.currentResult?.vibrationLevel.slug ?? null);
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  if (!slug) return colors.accent.ivoryRgb;
  return levelColors[slug] ?? colors.accent.ivoryRgb;
}

// The TEXT-safe equivalent of useAppAccentRgb() — every call site that
// colors an actual Text with "the current accent" (a philosopher's name,
// a headline reading, a nudge link, dialogue text) should use this
// instead. Identical to useAppAccentRgb() in dark mode; in light mode
// resolves through colors.accent.ivoryText / useLevelTextColors() (both
// darkened just enough to clear WCAG AA against bg.base) rather than the
// decorative-only ivoryRgb/levelColors values above.
export function useAppAccentTextRgb(): string {
  const slug = useMeasureStore((s) => s.currentResult?.vibrationLevel.slug ?? null);
  const colors = useThemeColors();
  const levelTextColors = useLevelTextColors();
  if (!slug) return colors.accent.ivoryTextRgb;
  return levelTextColors[slug] ?? colors.accent.ivoryTextRgb;
}

// Same neutral-before-first-reading / level-color-after logic as
// useAppAccentRgb, but for filled-button backgrounds specifically — once
// a reading exists this is identical to useAppAccentRgb (a level color is
// a level color, it doesn't get a separate "button" variant). Only the
// neutral fallback differs, using colors.accent.buttonFillRgb (a lighter
// gold in light mode) instead of ivoryRgb, since a flat mid-gold button
// fill with dark text read heavy/muddy — see colors.ts's own comment on
// buttonFill for where this was confirmed via screenshot.
export function useAppAccentButtonRgb(): string {
  const slug = useMeasureStore((s) => s.currentResult?.vibrationLevel.slug ?? null);
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  if (!slug) return colors.accent.buttonFillRgb;
  return levelColors[slug] ?? colors.accent.buttonFillRgb;
}
