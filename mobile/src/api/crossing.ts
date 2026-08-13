import request from './client';
import { Philosopher } from '../types';
import { useLocaleStore } from '../store/localeStore';

export interface SavedCrossing {
  id: string;
  wishId: string;
  measureResultId: string;
  pastWishId: string | null;
  philosopherId: string;
  question: string;
  answer: string | null;
  createdAt: string;
  answeredAt: string | null;
}

// One philosopher-voiced question built from the active wish, today's
// reading, and (optionally) one past wish the user chose to carry in —
// see docs/session-result-concept.md and crossingController.js's own
// header comment on the hard content boundary this depends on (quoted
// facts only, never an asserted pattern). Idempotent server-side: calling
// this again for the same wishId+measureResultId returns the SAME
// already-generated Crossing rather than creating a new one — this is
// what makes "only offered when genuinely new material exists" true
// without the client needing its own eligibility bookkeeping beyond
// checking listMyCrossings first.
export async function generateCrossing(
  wishId: string,
  measureResultId: string,
  levelName: string,
  philosopher: Philosopher,
  pastWishId?: string | null,
  token?: string
): Promise<{ id: string; question: string } | null> {
  if (!token) return null;
  try {
    return await request<{ id: string; question: string }>(
      '/crossing/generate',
      {
        wishId,
        measureResultId,
        levelName,
        pastWishId: pastWishId ?? null,
        philosopherId: philosopher.id,
        systemPrompt: philosopher.systemPrompt,
        locale: useLocaleStore.getState().locale,
      },
      { token }
    );
  } catch (err) {
    console.error('Failed to generate Crossing:', err);
    return null;
  }
}

// Saves the user's own answer — the thing worth keeping, not the
// generated question (see Crossing.js's own header comment).
export async function answerCrossing(id: string, answer: string, token: string): Promise<boolean> {
  try {
    await request(`/crossing/${id}/answer`, { answer }, { token });
    return true;
  } catch (err) {
    console.error('Failed to save Crossing answer:', err);
    return false;
  }
}

export async function listMyCrossings(token: string): Promise<SavedCrossing[]> {
  try {
    return await request<SavedCrossing[]>('/crossing/mine', undefined, { method: 'GET', token });
  } catch (err) {
    console.error('Failed to load Crossings:', err);
    return [];
  }
}
