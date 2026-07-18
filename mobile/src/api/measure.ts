import request from './client';
import { MeasureResult, QAPair } from '../types';

// Backend doesn't return `savedAt` — the caller stamps it on before persisting.
// Passing a token lets the backend save the reading to the user's account
// (only if they've also granted psychological-data consent) — anonymous
// either way if no token is passed.
export function submitInterview(qaPairs: QAPair[], token?: string | null) {
  return request<Omit<MeasureResult, 'savedAt'>>('/measure/interview', { qaPairs }, { token });
}
