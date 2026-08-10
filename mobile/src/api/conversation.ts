import request from './client';
import { useAuthStore } from '../store/authStore';
import { ChatCompletionMessage } from './chat';

// Best-effort, mirrors the backend's saveMeasureResultIfConsented pattern —
// a save failure here should never surface to the user or block Guide
// itself. Requires both a signed-in account and explicit psychological-data
// consent (Art. 9), the same gate assessment results already use. Silently
// no-ops otherwise, exactly as the privacy policy promises.
export async function saveConversationIfConsented(
  philosopherId: string,
  messages: ChatCompletionMessage[],
  measureResultId?: string | null
): Promise<void> {
  const session = useAuthStore.getState().session;
  if (!session || messages.length === 0) return;

  try {
    const { getMe } = await import('./user');
    const profile = await getMe(session.token);
    if (!profile.consent?.psychologicalData?.given) return;

    // suggestSpill is client-only bookkeeping kept on assistant messages —
    // strip it before sending, same as chat.ts's wireMessages does, since
    // an unknown property here would be an unnecessary field to persist
    // (this endpoint doesn't reject it like Groq's does, but there's no
    // reason to store UI-only state alongside the actual conversation).
    const wireMessages = messages.map(({ role, content }) => ({ role, content }));

    await request(
      '/conversation/save',
      { philosopherId, messages: wireMessages, measureResultId: measureResultId ?? null },
      { token: session.token }
    );
  } catch (err) {
    console.error('Failed to save conversation:', err);
  }
}

export interface SavedConversation {
  id: string;
  philosopherId: string;
  messages: ChatCompletionMessage[];
  measureResultId: string | null;
  savedAt: string;
}

// Powers Your Arc's rich re-entry — best-effort, returns null rather than
// throwing, since a missing linked conversation is a normal state (most
// readings won't have one), not an error.
export async function getConversationForMeasureResult(
  measureResultId: string,
  token: string
): Promise<SavedConversation | null> {
  try {
    const conversations = await request<SavedConversation[]>(
      `/conversation/by-measure-result/${measureResultId}`,
      undefined,
      { method: 'GET', token }
    );
    return conversations[0] ?? null;
  } catch (err) {
    console.error('Failed to load linked conversation:', err);
    return null;
  }
}
