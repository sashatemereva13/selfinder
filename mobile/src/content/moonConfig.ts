import { MeasureResult } from '../types';

// Real synodic-month calculation — mirrors selfinder-web's lunarCalendar/LunarCalendar3D.jsx
// exactly, so both platforms report the same phase for the same moment.
export const SYNODIC_MONTH = 29.53058867;
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z').getTime();

export type MoonPhaseName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Last Quarter'
  | 'Waning Crescent';

export type MoonStage = 'Spark' | 'Friction' | 'Illumination' | 'Release';

export function getMoonPhaseFraction(date: Date = new Date()): number {
  const daysSince = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
  return (((daysSince % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH) / SYNODIC_MONTH;
}

export function getMoonPhaseInfo(fraction: number): { name: MoonPhaseName; symbol: string } {
  if (fraction < 0.03 || fraction > 0.97) return { name: 'New Moon', symbol: '🌑' };
  if (fraction < 0.22) return { name: 'Waxing Crescent', symbol: '🌒' };
  if (fraction < 0.28) return { name: 'First Quarter', symbol: '🌓' };
  if (fraction < 0.47) return { name: 'Waxing Gibbous', symbol: '🌔' };
  if (fraction < 0.53) return { name: 'Full Moon', symbol: '🌕' };
  if (fraction < 0.72) return { name: 'Waning Gibbous', symbol: '🌖' };
  if (fraction < 0.78) return { name: 'Last Quarter', symbol: '🌗' };
  return { name: 'Waning Crescent', symbol: '🌘' };
}

// Stage grouping: strictly refines web's binary building (fraction < 0.5) / releasing
// (fraction >= 0.5) split into the four-stage change-cycle the app names explicitly.
export const PHASE_STAGE: Record<MoonPhaseName, MoonStage> = {
  'New Moon': 'Spark',
  'Waxing Crescent': 'Spark',
  'First Quarter': 'Friction',
  'Waxing Gibbous': 'Friction',
  'Full Moon': 'Illumination',
  'Waning Gibbous': 'Illumination',
  'Last Quarter': 'Release',
  'Waning Crescent': 'Release',
};

export const STAGE_DESCRIPTIONS: Record<MoonStage, string> = {
  Spark: 'The desire arrives, mostly invisible. Direction isn’t clear yet — just the pull.',
  Friction: 'The old way stops working. Old structure suspended, new one not yet built.',
  Illumination: 'What was forming becomes visible. Tested against reality, not just imagined.',
  Release: 'What no longer serves is let go — clearing the ground for the next spark.',
};

interface MoonPhaseContent {
  nature: string;
  reflection: string;
  practice: string;
}

export const MOON_PHASE_CONTENT: Record<MoonPhaseName, MoonPhaseContent> = {
  'New Moon': {
    nature: 'The sky holds no moon. Seeds lie underground, invisible, already alive.',
    reflection: 'Something in you wants to move, before you can say toward what. What is the pull, not yet the plan?',
    practice: 'Name one direction — not a plan, just a direction — and let it stay unforced today.',
  },
  'Waxing Crescent': {
    nature: 'A thin edge of light returns. Nothing is certain yet, but the dark is no longer total.',
    reflection: 'What early spark needs protecting from your own impatience right now?',
    practice: 'Choose one small, repeatable action and take it once — not the whole plan, just once.',
  },
  'First Quarter': {
    nature: 'Light and dark split the sky evenly. Neither has won yet.',
    reflection: 'What old way of doing this has actually already stopped working, even if you haven’t admitted it yet?',
    practice: 'Name one decision you’ve been avoiding, and remove one thing that lets you keep avoiding it.',
  },
  'Waxing Gibbous': {
    nature: 'Almost full, almost whole, but not yet — the waiting has its own tension.',
    reflection: 'What is nearly ready? What one adjustment would make it true instead of almost-true?',
    practice: 'Refine one detail of what you’re building rather than starting something new.',
  },
  'Full Moon': {
    nature: 'The whole face is lit. Nothing hides tonight.',
    reflection: 'What has become visible now that was easy to avoid earlier in this cycle?',
    practice: 'Say out loud, or write down, what you now know that you didn’t know at the new moon.',
  },
  'Waning Gibbous': {
    nature: 'The light begins to recede, but slowly — most of it is still here.',
    reflection: 'What did this cycle teach you that becomes more real once you pass it on or use it?',
    practice: 'Share one thing you learned — with someone, or with yourself in writing.',
  },
  'Last Quarter': {
    nature: 'Half the sky again, but moving the other way now — toward dark, not away from it.',
    reflection: 'What is finished, but still taking up room in you — a habit, a story, an obligation?',
    practice: 'Remove one thing — an object, a commitment, a belief — that has already served its purpose.',
  },
  'Waning Crescent': {
    nature: 'A last thin edge before the sky goes dark again.',
    reflection: 'What would change if rest were part of the path, not a delay from it?',
    practice: 'Protect one block of time today for nothing — no input, no output.',
  },
};

export type MeasureBand = 'low' | 'mid' | 'high';

export function getMeasureBand(score: number): MeasureBand {
  if (score < 200) return 'low';
  if (score < 350) return 'mid';
  return 'high';
}

const AXIS_NUDGE: Record<string, string> = {
  calm: 'Let the phase shape your pacing more than your output.',
  clarity: 'Use the phase to decide what matters most, not to collect more input.',
  grounding: 'Anchor this in a body-based action before reflection.',
  intensity: 'Channel the phase into one direction so the charge becomes clean movement.',
};

export function getPersonalizedBridge(phaseName: MoonPhaseName, result: MeasureResult | null) {
  if (!result) {
    return {
      title: 'No recent reading yet',
      body: 'Take a Measure reading to see this phase in light of your current state, not just in the abstract.',
    };
  }

  const band = getMeasureBand(result.vibrationScore);
  const axisNudge = AXIS_NUDGE[result.dominantAxis] ?? 'Use this phase as a timing lens, not a rulebook.';
  const bodyByBand: Record<MeasureBand, string> = {
    low: `Your last reading pointed to ${result.vibrationLevel.name}. Under ${phaseName}, keep it gentle — reduce friction before building momentum.`,
    mid: `Your last reading sits near ${result.vibrationLevel.name}. Under ${phaseName}, use this phase to refine direction rather than force a reset.`,
    high: `Your last reading pointed to ${result.vibrationLevel.name}. Under ${phaseName}, the opening is to turn this clarity into something real.`,
  };

  return {
    title: 'In light of your last reading',
    body: `${bodyByBand[band]} ${axisNudge}`,
  };
}

interface FlowTool {
  label: string;
  route: string;
}

const TOOLS: Record<'measure' | 'tunein' | 'levels', FlowTool> = {
  measure: { label: 'Measure', route: '/(tabs)/depths/measure' },
  tunein: { label: 'Tune In', route: '/(tabs)/depths/tunein' },
  levels: { label: 'Levels', route: '/(tabs)/depths/levels' },
};

export function getFlowSuggestions(stage: MoonStage, band: MeasureBand | 'unknown'): FlowTool[] {
  const building = stage === 'Spark' || stage === 'Friction';

  if (band === 'low') return building ? [TOOLS.measure, TOOLS.tunein] : [TOOLS.measure, TOOLS.levels];
  if (band === 'high') return building ? [TOOLS.tunein, TOOLS.measure] : [TOOLS.levels, TOOLS.tunein];
  return building ? [TOOLS.measure, TOOLS.tunein] : [TOOLS.levels, TOOLS.measure];
}
