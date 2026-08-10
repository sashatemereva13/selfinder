import request from './client';
import { useAuthStore } from '../store/authStore';

export interface SavedSpillEntry {
  id: string;
  text: string;
  savedAt: string;
}

// Explicit, per-entry save — never called automatically. Spill is "never
// judged" (see RULES.md); persistence has to stay an affirmative choice for
// one specific entry, not a side effect of consent being on in general.
// Best-effort, mirrors the pattern used for saveConversationIfConsented and
// saveMeasureResultIfConsented — a save failure never surfaces to the user.
// Returns whether the save actually happened, so the "keep this moment"
// button can show real confirmation rather than always claiming success.
export async function saveSpillEntryIfConsented(text: string): Promise<boolean> {
  const session = useAuthStore.getState().session;
  if (!session || !text.trim()) return false;

  try {
    const { getMe } = await import('./user');
    const profile = await getMe(session.token);
    if (!profile.consent?.psychologicalData?.given) return false;

    await request('/spill/save', { text }, { token: session.token });
    return true;
  } catch (err) {
    console.error('Failed to save Spill entry:', err);
    return false;
  }
}

// Powers Your Arc's rich re-entry — best-effort, returns [] rather than
// throwing on failure, since Spill history is supplementary detail, not
// something that should break the rest of the screen if it fails to load.
export async function listMySpillEntries(token: string): Promise<SavedSpillEntry[]> {
  try {
    return await request<SavedSpillEntry[]>('/spill/mine', undefined, { method: 'GET', token });
  } catch (err) {
    console.error('Failed to load Spill entries:', err);
    return [];
  }
}
