import { LEVEL_COLORS } from '../content/measureConfig';
import { useMeasureStore } from '../store/measureStore';

// The same neutral tone AuraFigure shows before a first reading (see
// AURA_NEUTRAL_COLOR in AuraFigure.tsx — #efe3cf), expressed as an rgb
// triplet so it composes the same way LEVEL_COLORS values already do
// everywhere (`rgb(${accentRgb})`, SVG stopColor, etc).
export const APP_ACCENT_NEUTRAL_RGB = '239,227,207';

export function getAppAccentRgb(levelSlug: string | null | undefined): string {
  if (!levelSlug) return APP_ACCENT_NEUTRAL_RGB;
  return LEVEL_COLORS[levelSlug] ?? APP_ACCENT_NEUTRAL_RGB;
}

// One color for the whole app: the neutral aura tone before a first
// reading, the current vibration level's color after — replaces what used
// to be a per-philosopher accent (an arbitrary color assignment with no
// real meaning, and one that could land close to an unrelated vibration
// color and read as the wrong signal). Philosophers are still told apart by
// name, symbol, and voice — just not by a color that used to mean nothing.
export function useAppAccentRgb(): string {
  const slug = useMeasureStore((s) => s.currentResult?.vibrationLevel.slug ?? null);
  return getAppAccentRgb(slug);
}
