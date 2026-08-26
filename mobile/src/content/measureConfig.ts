import { Sphere, VibrationLevel } from '../types';
import { Locale } from '../store/localeStore';
import { useThemeStore } from '../store/themeStore';
import { VIBRATION_LEVELS as SHARED_VIBRATION_LEVELS } from '@selfinder/shared';

export const THERMOMETER_MAX = 750;

export const LINES: { key: Sphere; label: string }[] = [
  { key: 'body',   label: 'Body'   },
  { key: 'mind',   label: 'Mind'   },
  { key: 'heart',  label: 'Heart'  },
  { key: 'spirit', label: 'Spirit' },
];

// Keyed by the backend's dominant psychological axis (calm/clarity/intensity/grounding),
// not by sphere — matches selfinder-web's measureConfig.js exactly. Warmed
// toward ivory the same way as LEVEL_COLORS just below (same reasoning:
// this colors live text on the reveal screen, e.g. the philosopher's
// combinationMessage, so it can't sit at full saturation against the warm
// background without clashing).
export const AXIS_COLORS: Record<string, string> = {
  calm:      '187,243,208',
  clarity:   '187,215,237',
  grounding: '244,226,147',
  intensity: '245,160,154',
};

// Visual-only (no backend equivalent) — one point per level, low to high,
// used to color the Levels map, the reveal screen's spectrum, and the
// current-reading accent everywhere else in the app (see
// docs/design/aesthetic.md — this IS the accent color once a reading
// exists). Still runs muted red (low) to violet (high) — that gradient is
// real information, not decoration, so it's kept — but every stop is now
// blended toward AURA_NEUTRAL_COLOR (ivory, 239,227,207) and slightly
// desaturated. Previously these were fully saturated hues picked
// independently of the ivory background; the cool end especially (reason,
// love, unconditionallove, peace) read as a jarring blue-on-warm clash —
// e.g. Unconditional Love's old 140,170,240 was a near-saturated blue. This
// keeps the same relative ordering and hue family at every point, just
// warmed enough that nothing in the run fights the app's one accent color.
// Dark-mode only — see LEVEL_COLORS_LIGHT below and useLevelColors() for
// the theme-aware accessor every call site should actually use.
export const LEVEL_COLORS_DARK: Record<string, string> = {
  shame:              '160,112,106',
  guilt:              '178,118,112',
  apathy:             '197,134,119',
  grief:              '216,148,120',
  fear:               '228,163,124',
  desire:             '233,176,131',
  anger:              '238,190,138',
  pride:              '231,203,144',
  courage:            '218,214,150',
  neutrality:         '195,215,163',
  willingness:        '173,215,182',
  acceptance:         '157,218,193',
  reason:             '152,213,207',
  love:               '160,200,218',
  unconditionallove:  '174,189,226',
  peace:              '187,181,233',
  enlightenment:      '202,171,236',
};

// Light mode's own run — LEVEL_COLORS_DARK's whole palette was deliberately
// blended toward ivory for legibility against a near-black background, which
// makes it read as barely-there pastel against light mode's ivory PAGE
// (confirmed via screenshot: level names, "Talk to {name} about it," sphere
// labels, and reveal text were all nearly invisible). Same hue at every
// stop (so the shame→enlightenment ordering/family is unchanged), pulled
// darker and a little more saturated — not maximally saturated (an early
// pass at ~3.8:1 contrast read as a bold rainbow, well outside the app's
// muted register) but enough for real ~2.9:1 contrast against bg.base.
export const LEVEL_COLORS_LIGHT: Record<string, string> = {
  shame:              '169,105,97',
  guilt:              '187,110,103',
  apathy:             '199,108,86',
  grief:              '201,108,69',
  fear:               '198,110,58',
  desire:             '191,115,55',
  anger:              '182,120,53',
  pride:              '165,128,48',
  courage:            '142,136,41',
  neutrality:         '108,145,49',
  willingness:        '59,151,79',
  acceptance:         '44,150,107',
  reason:             '46,148,138',
  love:               '54,142,182',
  unconditionallove:  '99,131,210',
  peace:              '132,121,216',
  enlightenment:      '160,111,213',
};

// The theme-aware accessor every call site should use instead of importing
// LEVEL_COLORS_DARK/LIGHT directly — same "pick the right map for the
// current theme" shape as useThemeColors()/AURA_LEVEL_IMAGES_LIGHT.
export function useLevelColors(): Record<string, string> {
  const theme = useThemeStore((s) => s.theme);
  return theme === 'light' ? LEVEL_COLORS_LIGHT : LEVEL_COLORS_DARK;
}

// name/slug/score/route now come from shared/vibrationLevels.mjs — the
// single source of truth this file and backend/data/vibrationLevels.js
// both import, instead of two independently hardcoded 17-entry arrays.
// (`route` here is a web path, not usable directly for in-app navigation
// — use `slug` instead.) Backend layers its own local `frame` field over
// the same shared array; mobile's bundle has no use for that field, so
// it's deliberately not part of the shared source (see
// shared/vibrationLevels.mjs's own header comment).
export const VIBRATION_LEVELS: VibrationLevel[] = SHARED_VIBRATION_LEVELS;

// Display-only Russian names, keyed by slug — deliberately NOT a change to
// VIBRATION_LEVELS[].name itself. That field is the stable English
// identifier the backend's AI scoring reference table
// (backend/data/vibrationLevels.js's VIBRATION_SCALE_REFERENCE) and saved
// MeasureResult documents both key off — renaming it would desync the
// AI's own scoring prompt from what the app displays, and would make any
// already-saved reading's stored level name inconsistent with a
// newly-translated one. getLocalizedLevelName resolves a display string
// only, at the point of render.
const LEVEL_NAMES_RU: Record<string, string> = {
  shame: 'Стыд',
  guilt: 'Вина',
  apathy: 'Апатия',
  grief: 'Горе',
  fear: 'Страх',
  desire: 'Желание',
  anger: 'Гнев',
  pride: 'Гордость',
  courage: 'Смелость',
  neutrality: 'Нейтральность',
  willingness: 'Готовность',
  acceptance: 'Принятие',
  reason: 'Разум',
  love: 'Любовь',
  unconditionallove: 'Безусловная любовь',
  peace: 'Покой',
  enlightenment: 'Просветление',
};

export function getLocalizedLevelName(level: VibrationLevel, locale: Locale): string {
  return locale === 'ru' ? (LEVEL_NAMES_RU[level.slug] ?? level.name) : level.name;
}

// Position in the diamond grid: body=top, mind=right, heart=bottom, spirit=left
export const POSITION_ORDER = ['top', 'right', 'bottom', 'left'] as const;
