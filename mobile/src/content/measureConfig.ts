import { Sphere, VibrationLevel } from '../types';
import { Locale } from '../store/localeStore';

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
export const LEVEL_COLORS: Record<string, string> = {
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

// Mirrors backend/data/vibrationLevels.js — used to resolve a level's slug for
// in-app navigation (`route` there is a web path, not usable directly here).
export const VIBRATION_LEVELS: VibrationLevel[] = [
  { name: 'Shame',              slug: 'shame',              score: 20,  route: '/levels/shame' },
  { name: 'Guilt',               slug: 'guilt',              score: 30,  route: '/levels/guilt' },
  { name: 'Apathy',              slug: 'apathy',             score: 50,  route: '/levels/apathy' },
  { name: 'Grief',               slug: 'grief',              score: 75,  route: '/levels/grief' },
  { name: 'Fear',                slug: 'fear',               score: 100, route: '/levels/fear' },
  { name: 'Desire',              slug: 'desire',             score: 125, route: '/levels/desire' },
  { name: 'Anger',               slug: 'anger',              score: 150, route: '/levels/anger' },
  { name: 'Pride',               slug: 'pride',              score: 175, route: '/levels/pride' },
  { name: 'Courage',             slug: 'courage',            score: 200, route: '/levels/courage' },
  { name: 'Neutrality',          slug: 'neutrality',         score: 250, route: '/levels/neutrality' },
  { name: 'Willingness',         slug: 'willingness',        score: 310, route: '/levels/willingness' },
  { name: 'Acceptance',          slug: 'acceptance',         score: 350, route: '/levels/acceptance' },
  { name: 'Reason',              slug: 'reason',             score: 400, route: '/levels/reason' },
  { name: 'Love',                slug: 'love',               score: 500, route: '/levels/love' },
  { name: 'Unconditional Love',  slug: 'unconditionallove',  score: 540, route: '/levels/unconditionallove' },
  { name: 'Peace',               slug: 'peace',              score: 600, route: '/levels/peace' },
  { name: 'Enlightenment',       slug: 'enlightenment',      score: 700, route: '/levels/enlightenment' },
];

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
