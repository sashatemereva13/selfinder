import request from './client';
import { JourneyKey, JourneySessionDTO, AgencySortResult } from '../types';
import { useLocaleStore } from '../store/localeStore';

export interface JourneyExchangeResponse {
  engaged: boolean;
  goBack: boolean;
  stageComplete: boolean;
  showAcknowledgment: boolean;
  reply: string | null;
  nextQuestion: string | null;
  isComplete: boolean;
}

interface JourneyExchangeParams {
  purchaseId: string;
  journey: JourneyKey;
  stageIndex: number;
  stageId: string;
  openingQuestion: string;
  // Fail-open fallback text if the AI phrasing call fails, and the fixed
  // text a real stage transition's rephrasing is checked against — the
  // client already knows its own fixed stage list, so this costs
  // nothing, and it keeps the Journey moving even when the model is down
  // (matches chatController.js's fail-open discipline).
  nextOpeningQuestion: string | null;
  priorStages: { stageId: string; question: string; answer: string }[];
  answer: string;
  canGoBack: boolean;
  priorAsideCount: number;
  totalStages: number;
  structuredAnswer?: AgencySortResult;
}

// One turn of a Journey's stage exchange — mirrors chat.ts's
// sendMeasureExchange contract, extended since a Journey's AI must both
// judge whether a stage's own psychological goal is satisfied yet
// (stageComplete) and decide whether its own reply is worth showing at
// all (showAcknowledgment) — Measure's questions are static and every
// answer advances immediately; neither is true for a Journey's stages.
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

// Resumes an in-progress session, or fetches the stored stage answers for
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
