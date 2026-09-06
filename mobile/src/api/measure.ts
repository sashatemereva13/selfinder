import request from './client';
import { MeasureResult, QAPair } from '../types';
import { useLocaleStore } from '../store/localeStore';

// Backend doesn't return `savedAt` — the caller stamps it on before persisting.
// Passing a token lets the backend save the reading to the user's account
// (only if they've also granted psychological-data consent) — anonymous
// either way if no token is passed. `systemPrompt` is the philosopher's own
// persona prompt, used server-side to generate a philosopher-voiced
// reflection tying the four sphere readings together (`combinationMessage`).
//
// This endpoint runs two sequential Groq calls (scoring, then the
// combination message) rather than one — on the Russian locale it also
// runs on Qwen, whose hidden reasoning tokens vary a lot per request (see
// chatController.js's QWEN_REASONING_TOKEN_HEADROOM comment). Measured
// live against production: 22-37s for a real Russian interview submission,
// well past the client's default 15s timeout — a request in that range
// aborted client-side even though the backend would have answered
// successfully, which read as "Measure didn't go through" with no
// server-side error at all. 45s leaves headroom above the slowest run
// observed so far.
const INTERVIEW_TIMEOUT_MS = 45000;

export function submitInterview(qaPairs: QAPair[], systemPrompt: string, token?: string | null) {
  return request<Omit<MeasureResult, 'savedAt'>>(
    '/measure/interview',
    { qaPairs, systemPrompt, locale: useLocaleStore.getState().locale },
    { token, timeoutMs: INTERVIEW_TIMEOUT_MS }
  );
}
