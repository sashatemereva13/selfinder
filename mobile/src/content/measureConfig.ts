import { Sphere, VibrationLevel } from '../types';

export const THERMOMETER_MAX = 750;

export const LINES: { key: Sphere; label: string }[] = [
  { key: 'body',   label: 'Body'   },
  { key: 'mind',   label: 'Mind'   },
  { key: 'heart',  label: 'Heart'  },
  { key: 'spirit', label: 'Spirit' },
];

// Keyed by the backend's dominant psychological axis (calm/clarity/intensity/grounding),
// not by sphere — matches selfinder-web's measureConfig.js exactly.
export const AXIS_COLORS: Record<string, string> = {
  calm:      '159,255,208',
  clarity:   '159,211,255',
  grounding: '255,232,112',
  intensity: '255,123,123',
};

// Visual-only (no backend equivalent) — one point per level, low to high, used
// to color the Levels map from a muted red at the bottom to violet at the top.
export const LEVEL_COLORS: Record<string, string> = {
  shame:             '130,58,58',
  guilt:              '158,66,66',
  apathy:             '186,90,74',
  grief:              '214,110,74',
  fear:               '232,132,80',
  desire:             '240,152,90',
  anger:              '246,175,100',
  pride:              '235,196,110',
  courage:            '214,214,120',
  neutrality:         '176,214,140',
  willingness:        '140,214,170',
  acceptance:         '116,221,190',
  reason:             '108,214,214',
  love:               '120,190,230',
  unconditionallove:  '140,170,240',
  peace:              '160,155,250',
  enlightenment:      '185,140,255',
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

// Position in the diamond grid: body=top, mind=right, heart=bottom, spirit=left
export const POSITION_ORDER = ['top', 'right', 'bottom', 'left'] as const;
