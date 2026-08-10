// Ivory is the one brand color in dark mode — see docs/design/aesthetic.md
// for the full rule. 239,227,207 is AURA_NEUTRAL_COLOR (#efe3cf, defined
// canonically in AuraFigure.tsx) expressed as an RGB triplet so this file
// can build the same four-step opacity ladder text.* always had. Never
// redeclare the hex elsewhere — import AURA_NEUTRAL_COLOR or use
// darkColors.text.primary/etc, so there is exactly one source of truth.
const IVORY_RGB = '239,227,207';

// Gold is light mode's equivalent load-bearing tone — see the light-mode
// design exploration this palette came out of: the aura figure's neutral
// (pre-reading) color, and the base tone the text ladder below is built
// from. 180,140,60 is the same gold used for the aura figure's neutral
// outline/fill — kept as its own name since AuraFigure's neutralColor and
// other non-text uses still want the lighter/brighter version.
const GOLD_RGB = '180,140,60';
// A deeper, more saturated version of the same gold, used only for the
// light-mode text ladder — text.primary at 180,140,60 was confirmed the
// one clearly-readable shade in the original ladder (see the "map of
// consciousness" title on Levels), and pushing the base hue itself darker
// (not just raising opacity) is what makes the rest of the ladder read as
// genuinely darker ink rather than merely less see-through.
const TEXT_GOLD_RGB = '120,90,40';

export interface Colors {
  bg: {
    base: string;
    mid: string;
    surface: string;
    elevated: string;
    border: string;
  };
  accent: {
    ivory: string;
    ivoryRgb: string;
  };
  // Text color for content sitting on a filled colors.accent.ivory (or
  // LEVEL_COLORS) surface — e.g. a filled button's label. Deliberately NOT
  // colors.bg.base: bg.base is the page's own background, and in light
  // mode that's ivory too, the same value as the fill it would sit on top
  // of (confirmed via a real invisible-text bug on the You tab's language/
  // theme toggle pills — bg.base-as-button-text silently broke the moment
  // bg.base stopped being dark). This token is always dark, in both
  // themes, because a filled ivory-family surface is always light.
  onAccent: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
    faint: string;
  };
  danger: string;
}

export const darkColors: Colors = {
  bg: {
    base: '#06060d',
    mid: '#0c0717',
    surface: 'rgba(10,10,14,0.54)',
    elevated: 'rgba(255,255,255,0.04)',
    border: 'rgba(255,255,255,0.10)',
  },
  // The app's one level-agnostic accent — used wherever there's no current
  // reading to color by (buttons, links, errors, focus states on screens
  // like sign-in/account that aren't reading-scoped). Where a screen DOES
  // have a current reading, prefer that reading's LEVEL_COLORS hue instead;
  // accent is the fallback, not a competing brand color.
  // The app's one bright, always-legible accent — ivory, since dark mode's
  // background is always near-black. This is deliberately NOT the same
  // value in both themes (see lightColors.accent below): "accent" here
  // means "the app's one foreground accent tone," not "literally the hex
  // efe3cf" — a distinction that matters once the background itself can
  // be ivory too.
  accent: {
    ivory: '#efe3cf',
    ivoryRgb: IVORY_RGB,
  },
  onAccent: '#06060d',
  text: {
    primary: `rgba(${IVORY_RGB},0.97)`,
    secondary: `rgba(${IVORY_RGB},0.70)`,
    muted: `rgba(${IVORY_RGB},0.52)`,
    faint: `rgba(${IVORY_RGB},0.32)`,
  },
  // The one deliberate exception to "one accent color everywhere": a
  // destructive action (delete account) needs to read as different from
  // the calm accent, not softened into it. Same value in both themes — a
  // solid filled button's contrast against its own fill doesn't depend on
  // the page background around it.
  danger: '#f67474',
};

// Light mode's own palette — not a computed inverse of dark mode (an
// inverse lands on a clashing cool tone, see the light-mode design
// exploration), a separately-considered set of values in the same shape.
// bg.base is the same ivory dark mode uses only as an accent — in light
// mode ivory is the page's own ground, not a foreground color on it.
export const lightColors: Colors = {
  bg: {
    base: '#efe3cf',
    mid: '#e9dcc3',
    surface: 'rgba(180,140,60,0.06)',
    elevated: 'rgba(30,27,40,0.04)',
    border: 'rgba(30,27,40,0.12)',
  },
  // Gold, not literal ivory — accent.ivory in dark mode is "the one bright
  // foreground tone against a dark background," and in light mode the
  // background IS ivory, so the literal hex would be invisible as a
  // foreground color. This is what fixed a real bug: Depths' "Talk about
  // it"/"Measure again" row labels and several other call sites read
  // colors.accent.ivory directly as a text color, assuming it would always
  // contrast against the page — confirmed via screenshot that those rows
  // were fully invisible (same-color text on background) before this.
  // Matches AuraFigure's own neutralColor gold.
  accent: {
    ivory: '#b48c3c',
    ivoryRgb: '180,140,60',
  },
  // Same dark ink AuraFigure's body gradient uses (rgb(30,27,40)) — not
  // bg.base, which is ivory in this theme (see the Colors interface's own
  // comment on onAccent for why that distinction matters).
  onAccent: '#1e1b28',
  // Same four-step opacity shape as dark mode's ivory ladder, built from
  // the darker TEXT_GOLD_RGB rather than the brighter GOLD_RGB used
  // elsewhere (AuraFigure's neutral tone, etc.) — confirmed on-device that
  // the brighter gold read as too washed-out against bg.base at every step
  // but text.primary.
  text: {
    primary: `rgba(${TEXT_GOLD_RGB},0.92)`,
    secondary: `rgba(${TEXT_GOLD_RGB},0.68)`,
    muted: `rgba(${TEXT_GOLD_RGB},0.50)`,
    faint: `rgba(${TEXT_GOLD_RGB},0.32)`,
  },
  danger: '#f67474',
};
