import request from './client';
import { useAuthStore } from '../store/authStore';

export interface SavedWish {
  id: string;
  text: string;
  measureResultId: string | null;
  savedAt: string;
  // Set once this wish has actually been opened via Your Arc's
  // resurfacing row (see markWishResurfaced) — null until then. Drives
  // FIFO selection (see selectWishToResurface): oldest not-yet-resurfaced
  // wish first, no content-based ranking.
  resurfacedAt: string | null;
  // The user's own claim that this wish came true (2026-08-19) — set only
  // by their own explicit tap (markWishFulfilled), never inferred. See
  // Wish.js's own comment: distinct from a wish simply being superseded
  // by a newer active one.
  fulfilledAt: string | null;
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

// Marks a wish as resurfaced — call only when the person actually opens
// it via Your Arc's resurfacing row, never just because it was selected
// as eligible (see selectWishToResurface). Best-effort: a failure here
// just means the same wish might resurface again next time, which is a
// harmless repeat, not a broken feature — never worth surfacing an error
// to the user over.
export async function markWishResurfaced(id: string, token: string): Promise<void> {
  try {
    await request(`/wish/${id}/resurface`, {}, { token });
  } catch (err) {
    console.error('Failed to mark wish resurfaced:', err);
  }
}

// Ticking a wish as fulfilled/came true (2026-08-19) — only ever called
// from the user's own explicit tap, never automatically. Returns whether
// it succeeded so the caller can update local state optimistically;
// unlike markWishResurfaced this DOES need to be reflected in the UI
// immediately (the wish moves into the fulfilled list right away), so a
// silent best-effort swallow isn't appropriate here the way it is for
// resurfacing.
export async function markWishFulfilled(id: string, token: string): Promise<boolean> {
  try {
    await request(`/wish/${id}/fulfill`, {}, { token });
    return true;
  } catch (err) {
    console.error('Failed to mark wish fulfilled:', err);
    return false;
  }
}

// Reverses a tick — a person may mark something fulfilled and change
// their mind; nothing about this feature should feel like a one-way,
// high-stakes commitment.
export async function unmarkWishFulfilled(id: string, token: string): Promise<boolean> {
  try {
    await request(`/wish/${id}/fulfill`, undefined, { method: 'DELETE', token });
    return true;
  } catch (err) {
    console.error('Failed to unmark wish fulfilled:', err);
    return false;
  }
}
