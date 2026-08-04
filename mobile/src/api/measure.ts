import request from './client';
import { MeasureResult, QAPair } from '../types';
import { useLocaleStore } from '../store/localeStore';

// Backend doesn't return `savedAt` — the caller stamps it on before persisting.
// Passing a token lets the backend save the reading to the user's account
// (only if they've also granted psychological-data consent) — anonymous
// either way if no token is passed. `systemPrompt` is the philosopher's own
// persona prompt, used server-side to generate a philosopher-voiced
// reflection tying the four sphere readings together (`combinationMessage`).
export function submitInterview(qaPairs: QAPair[], systemPrompt: string, token?: string | null) {
  return request<Omit<MeasureResult, 'savedAt'>>(
    '/measure/interview',
    { qaPairs, systemPrompt, locale: useLocaleStore.getState().locale },
    { token }
  );
}
