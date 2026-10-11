import type { Locale } from '../store/localeStore';

// The Journey that fits a state — offered once in a while at the end of a
// Shift session as the longer version of what was just done
// (2026-10-09): Journeys meet people when they're relevant to how they
// feel, instead of waiting in a catalogue. One quiet line in the
// philosopher's voice, never a button competing with "Done", never a gate.
// Enlightenment has none: nothing there is asking for a longer walk.
type JourneyRef = { route: string; labelKey: string; questionKey: string };
const J = (route: string, name: string): JourneyRef => ({
  route,
  labelKey: `products.${name}Label`,
  questionKey: `products.${name}Description`,
});

const BY_STATE: Record<string, JourneyRef> = {
  shame: J('/whose-voice', 'whoseVoice'),
  guilt: J('/the-road-not-taken', 'theRoadNotTaken'),
  apathy: J('/becoming', 'becoming'),
  grief: J('/letting-go', 'lettingGo'),
  fear: J('/control', 'control'),
  desire: J('/enough', 'enough'),
  anger: J('/the-mirror', 'theMirror'),
  pride: J('/whose-voice', 'whoseVoice'),
  courage: J('/the-threshold', 'theThreshold'),
  neutrality: J('/the-choice', 'theChoice'),
  willingness: J('/possible-selves', 'possibleSelves'),
  acceptance: J('/letting-go', 'lettingGo'),
  reason: J('/the-loop', 'theLoop'),
  love: J('/the-unsaid', 'theUnsaid'),
  unconditionallove: J('/the-unsaid', 'theUnsaid'),
  peace: J('/becoming', 'becoming'),
};

export function getJourneyForState(slug: string): JourneyRef | null {
  return BY_STATE[slug] ?? null;
}

// How often the offer may appear — rarely enough that it stays an
// invitation, not a routine.
export const JOURNEY_OFFER_GAP_DAYS = 7;

// Marcus Aurelius' voice first; the others fall back to it until written.
const OFFER: Record<string, Record<Locale, string>> = {
  stoics: {
    en: 'If you want to go further with this one day, there is a longer walk:',
    ru: 'Если однажды захотите пойти с этим дальше, есть путь подлиннее:',
  },
};
export function getJourneyOfferLine(philosopherId: string, locale: Locale): string {
  const line = OFFER[philosopherId] ?? OFFER.stoics;
  return line[locale] ?? line.en;
}
