import request from './client';
import { useAuthStore } from '../store/authStore';

export interface SavedWish {
  id: string;
  text: string;
  measureResultId: string | null;
  savedAt: string;
}

export type SaveWishResult =
  | { ok: true; id: string }
  | { ok: false; blocked: true; category: 'concerning' | 'self-harm' }
  | { ok: false; blocked: false }; // not signed in, not consented, or a network/save failure

// "If this could feel like anything you wanted, what would that be?" —
// captured once per reading (see docs/session-result-concept.md). The
// backend moderates BEFORE persisting anything (moderateWish.js) — this
// function surfaces that outcome as a real result the caller can branch
// on (save vs. retry-prompt vs. crisis-support redirect), never silently
// swallowing a block the way the rest of this app's best-effort saves do,
// since a block here needs to change what the person sees next, not just
// fail quietly.
export async function saveWishIfConsented(text: string, measureResultId: string | null): Promise<SaveWishResult> {
  const session = useAuthStore.getState().session;
  if (!session || !text.trim()) return { ok: false, blocked: false };

  try {
    const { getMe } = await import('./user');
    const profile = await getMe(session.token);
    if (!profile.consent?.psychologicalData?.given) return { ok: false, blocked: false };

    const result = await request<{ id: string } | { blocked: true; category: 'concerning' | 'self-harm' }>(
      '/wish/save',
      { text, measureResultId },
      { token: session.token }
    );
    if ('blocked' in result && result.blocked) {
      return { ok: false, blocked: true, category: result.category };
    }
    return { ok: true, id: (result as { id: string }).id };
  } catch (err) {
    console.error('Failed to save wish:', err);
    return { ok: false, blocked: false };
  }
}

// Powers Your Arc/Depths' own "held, not displayed" disclosure — best-
// effort, returns [] rather than throwing on failure, same discipline as
// listMySpillEntries.
export async function listMyWishes(token: string): Promise<SavedWish[]> {
  try {
    return await request<SavedWish[]>('/wish/mine', undefined, { method: 'GET', token });
  } catch (err) {
    console.error('Failed to load wishes:', err);
    return [];
  }
}
