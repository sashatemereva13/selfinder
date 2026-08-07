import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'selfinder_ai_disclosure_acknowledged';

interface AIDisclosureStore {
  acknowledged: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  acknowledge: () => Promise<void>;
}

// Gates the one-time notice (AIDisclosureOverlay.tsx) shown before any
// feature that sends a user's words to the third-party AI provider (Guide,
// Measure) — accountless usage is the primary path (see RULES.md), so this
// can't be folded into the signup-only privacy-policy checkbox in
// AccountSection.tsx; it needs to catch every user, account or not, before
// their first message is ever sent.
export const useAIDisclosureStore = create<AIDisclosureStore>((set) => ({
  acknowledged: false,
  hydrated: false,

  hydrate: async () => {
    let stored: string | null = null;
    try {
      stored = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore unavailable (e.g. web) — fall through, same as every
      // other store; the notice will just show every session there.
    }
    set({ acknowledged: stored === 'true', hydrated: true });
  },

  acknowledge: async () => {
    set({ acknowledged: true });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, 'true');
    } catch {
      // Unavailable — acknowledged stays true for this session only.
    }
  },
}));
