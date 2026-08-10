import { LEVEL_COLORS } from '../content/measureConfig';
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
  if (!slug) return colors.accent.ivoryRgb;
  return LEVEL_COLORS[slug] ?? colors.accent.ivoryRgb;
}
