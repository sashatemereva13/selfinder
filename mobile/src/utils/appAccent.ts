import { useLevelColors } from '../content/measureConfig';
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
export function useAppAccentRgb(): string {
  const slug = useMeasureStore((s) => s.currentResult?.vibrationLevel.slug ?? null);
  const colors = useThemeColors();
  const levelColors = useLevelColors();
  if (!slug) return colors.accent.ivoryRgb;
  return levelColors[slug] ?? colors.accent.ivoryRgb;
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
