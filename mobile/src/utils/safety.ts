import { getLocales } from 'expo-localization';
import request from '../api/client';

// The crisis safety net (2026-10-10). Three parts:
//
// 1. checkTextForCrisis — the server's classifier, for text that's already
//    on its way to the AI (a conversation message, a Journey answer):
//    nothing new leaves the phone. Measure is checked server-side during
//    scoring instead (see postMeasureInterview).
// 2. mentionsCrisisOnDevice — a short list of unmistakable phrases, checked
//    on the phone only, for words promised never to leave it (Spill before
//    it's kept, a Shift session's own words).
// 3. crisisResources — the right line for the person's country, read from
//    the phone's region (not the app's language: a Russian speaker in
//    France needs France's number).
//
// Only danger to life triggers anything — heavy feelings are what the app
// is for, and never interrupt. Nothing about a check is stored or logged.

export async function checkTextForCrisis(text: string): Promise<boolean> {
  try {
    const { crisis } = await request<{ crisis: boolean }>('/chat/safety-check', { text });
    return crisis === true;
  } catch {
    return false;
  }
}

// Phrases only, never single words ("die", "end") — those appear in
// ordinary sentences far too often. Lower-cased, matched as substrings.
const PHRASES = [
  'kill myself',
  'killing myself',
  'end my life',
  'end it all',
  'take my own life',
  'want to die',
  "don't want to live",
  'dont want to live',
  'no reason to live',
  'better off dead',
  'better off without me',
  'hurt myself',
  'harm myself',
  'suicide',
  'suicidal',
  'не хочу жить',
  'хочу умереть',
  'покончить с собой',
  'убить себя',
  'свести счёты',
  'свести счеты',
  'суицид',
  'самоубий',
  'причинить себе вред',
  'лучше бы меня не было',
];

export function mentionsCrisisOnDevice(...texts: (string | undefined)[]): boolean {
  const all = texts.filter(Boolean).join(' ').toLowerCase();
  return PHRASES.some((p) => all.includes(p));
}

export interface CrisisResources {
  // A national crisis line, where one is confirmed; otherwise the
  // country's page on findahelpline.com.
  line?: { name: string; number: string };
  emergency: string;
  directoryUrl: string;
}

// Only lines confirmed to be national, free and 24/7. Everywhere else —
// Russia included — the country's own page on findahelpline.com, a
// maintained directory, rather than a number this app would have to keep
// accurate itself.
const LINES: Record<string, { name: string; number: string }> = {
  FR: { name: '3114', number: '3114' },
  GB: { name: 'Samaritans', number: '116123' },
  IE: { name: 'Samaritans', number: '116123' },
  US: { name: '988', number: '988' },
  CA: { name: '988', number: '988' },
  DE: { name: 'TelefonSeelsorge', number: '08001110111' },
};

const NORTH_AMERICA = ['US', 'CA'];

export function crisisResources(): CrisisResources {
  const region = (getLocales()[0]?.regionCode ?? '').toUpperCase();
  return {
    line: LINES[region],
    emergency: NORTH_AMERICA.includes(region) ? '911' : '112',
    directoryUrl: region
      ? `https://findahelpline.com/countries/${region.toLowerCase()}`
      : 'https://findahelpline.com',
  };
}

// The four states whose readings carry the quiet support line on their
// own, whatever was said (2026-10-10, the founder's addition): how heavy
// they can feel, never a claim that the state is dangerous.
export const HEAVY_STATES = ['shame', 'guilt', 'apathy', 'grief'];
