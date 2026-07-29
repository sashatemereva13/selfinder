import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

// Placeholder for real entitlement state — there is no purchase flow yet
// (see RULES.md, "No live purchase/subscribe flow exists yet"). This exists
// so the UI for both the subscribed and non-subscribed experience can be
// built and tested now; when a real subscription/purchase system lands,
// `isSubscribed` should be replaced by that system's own entitlement check
// rather than this local flag, and this store retired.
const STORAGE_KEY = 'selfinder_dev_subscribed';

interface SubscriptionStore {
  isSubscribed: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setSubscribed: (value: boolean) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionStore>((set) => ({
  isSubscribed: false,
  hydrated: false,

  hydrate: async () => {
    let raw: string | null = null;
    try {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — boot as if unset.
    }
    set({ isSubscribed: raw === 'true', hydrated: true });
  },

  setSubscribed: async (value) => {
    set({ isSubscribed: value });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, value ? 'true' : 'false');
    } catch {
      // SecureStore is unavailable — the flag is still set for this session.
    }
  },
}));
