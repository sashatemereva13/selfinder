// Ivory is the one brand color — see docs/design/aesthetic.md for the full
// rule. 239,227,207 is AURA_NEUTRAL_COLOR (#efe3cf, defined canonically in
// AuraFigure.tsx) expressed as an RGB triplet so this file can build the
// same four-step opacity ladder text.* always had, just warm instead of
// cool. Never redeclare the hex elsewhere — import AURA_NEUTRAL_COLOR or
// use colors.text.primary/etc, so there is exactly one source of truth for
// the tone.
const IVORY_RGB = '239,227,207';

export const colors = {
  bg: {
    base: '#06060d',
    mid: '#0c0717',
    surface: 'rgba(10,10,14,0.54)',
    elevated: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.10)',
  },
  // The app's one level-agnostic accent — used wherever there's no current
  // reading to color by (buttons, links, errors, focus states on screens
  // like sign-in/account that aren't reading-scoped). Replaces the old
  // colors.brand.purple/teal, which were cool-toned and are being retired
  // app-wide — see docs/design/aesthetic.md. Where a screen DOES have a
  // current reading, prefer that reading's LEVEL_COLORS hue instead; accent
  // is the fallback, not a competing brand color.
  accent: {
    ivory: '#efe3cf',
    ivoryRgb: IVORY_RGB,
  },
  text: {
    primary: `rgba(${IVORY_RGB},0.97)`,
    secondary: `rgba(${IVORY_RGB},0.70)`,
    muted: `rgba(${IVORY_RGB},0.52)`,
    faint: `rgba(${IVORY_RGB},0.32)`,
  },
  // The one deliberate exception to "one accent color everywhere": a
  // destructive action (delete account) needs to read as different from
  // the calm ivory accent, not softened into it. Previously borrowed
  // colors.axis.heart, a coincidence of that color system having a
  // red-orange in it — this names the role directly instead.
  danger: '#f67474',
} as const;

export type Colors = typeof colors;
