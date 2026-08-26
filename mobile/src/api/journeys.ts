import request from './client';
import { JourneyKey, JourneySessionDTO, AgencySortResult } from '../types';
import { useLocaleStore } from '../store/localeStore';

export interface JourneyExchangeResponse {
  advance: boolean;
  goBack: boolean;
  reply: string;
  nextQuestion: string | null;
  isComplete: boolean;
}

interface JourneyExchangeParams {
  purchaseId: string;
  journey: JourneyKey;
  slotIndex: number;
  slotId: string;
  baseQuestion: string;
  // Fail-open fallback text if the AI phrasing call fails — the client
  // already knows its own fixed slot list, so this costs nothing, and it
  // keeps the Journey moving even when the model is down (matches
  // chatController.js's fail-open discipline).
  nextBaseQuestion: string | null;
  priorSlots: { slotId: string; question: string; answer: string }[];
  answer: string;
  canGoBack: boolean;
  priorAsideCount: number;
  totalSlots: number;
  structuredAnswer?: AgencySortResult;
}

// One turn of a Journey's slot exchange — mirrors chat.ts's
// sendMeasureExchange contract, extended with nextQuestion/isComplete
// since a Journey's AI must phrase its own fixed next question live
// (Measure's questions are static, sent by the client, never phrased).
export function sendJourneyExchange(
  params: JourneyExchangeParams,
  token: string
): Promise<JourneyExchangeResponse> {
  return request<JourneyExchangeResponse>(
    '/journeys/exchange',
    { ...params, locale: useLocaleStore.getState().locale },
    { token }
  );
}

// Resumes an in-progress session, or fetches the stored slot answers for
// the reflection screen after an app restart. null = no session yet for
// this purchase (a normal state — start fresh), matching
// getConversationForMeasureResult's own "missing thing is not an error"
// convention.
export async function getJourneySession(
  purchaseId: string,
  token: string
): Promise<JourneySessionDTO | null> {
  try {
    return await request<JourneySessionDTO>(
      `/journeys/session?purchaseId=${encodeURIComponent(purchaseId)}`,
      undefined,
      { method: 'GET', token }
    );
  } catch {
    return null;
  }
}
