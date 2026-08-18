import request from './client';
import { Philosopher } from '../types';
import { useLocaleStore } from '../store/localeStore';

// Your Arc's Cover page line — one philosopher-voiced remark or question,
// generated from the person's own real record (reading count/streak,
// most recent level, active wish) rather than static copy that never
// changes visit to visit. Same hard content boundary as Crossing (see
// arcLineController.js's own prompt comment): quote/paraphrase real facts
// only, never assert a pattern or judge progress. Idempotent per
// calendar day server-side — calling this again the same day returns the
// same cached line rather than generating a new one, so this is safe to
// call every time the Cover page mounts.
export async function getArcLine(philosopher: Philosopher, token?: string): Promise<string | null> {
  if (!token) return null;
  try {
    const result = await request<{ line: string; cached: boolean }>(
      '/arc-line',
      {
        philosopherId: philosopher.id,
        systemPrompt: philosopher.systemPrompt,
        locale: useLocaleStore.getState().locale,
      },
      { token }
    );
    return result.line;
  } catch (err) {
    console.error('Failed to load arc line:', err);
    return null;
  }
}
