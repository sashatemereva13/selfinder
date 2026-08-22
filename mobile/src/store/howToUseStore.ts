import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const STORAGE_KEY = 'selfinder_how_to_use_acknowledged';

interface HowToUseStore {
  acknowledged: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  acknowledge: () => Promise<void>;
}

// Gates the one-time "how to use Selfinder" overlay (HowToUseOverlay.tsx)
// — same mechanism as aiDisclosureStore.ts (plain SecureStore persistence,
// gated on `philosopher` existing in _layout.tsx), but deliberately
// without that store's fresh-install filesystem marker: that extra check
// exists there specifically because re-showing a LEGAL disclosure after a
// reinstall matters, while re-showing a tips screen once after a reinstall
// is harmless — plain Keychain persistence is enough here.
export const useHowToUseStore = create<HowToUseStore>((set) => ({
  acknowledged: false,
  hydrated: false,

  hydrate: async () => {
    let stored: string | null = null;
    try {
      stored = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore unavailable (e.g. web) — fall through, same as every
      // other store.
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
