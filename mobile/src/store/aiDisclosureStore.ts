import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { File, Paths } from 'expo-file-system';

const STORAGE_KEY = 'selfinder_ai_disclosure_acknowledged';

// A plain document-directory marker, not Keychain-backed — this is the
// actual "have I been installed before" signal. iOS Keychain data (what
// SecureStore uses) is NOT cleared on app delete/reinstall by OS design;
// confirmed on-device that deleting and reinstalling the app left the
// disclosure acknowledged from the previous install, meaning a genuinely
// new install of the app on the same device never saw the notice. The
// document directory, by contrast, is real app-sandboxed storage that IS
// wiped on uninstall on both platforms, so its absence is a reliable
// "this is a fresh install" signal that Keychain alone can't provide.
//
// Constructed lazily inside hydrate(), not as a module-level constant —
// expo-file-system's web stub throws directly from its constructor
// (`this.validatePath is not a function`), and that throw happens at
// import time for a module-level `new File(...)`, before any try/catch
// anywhere else in the file gets a chance to run. A module-level throw
// here crashed the entire app on web (confirmed via the run-mobile web
// preview) since app/_layout.tsx imports this store unconditionally.
function getFirstLaunchMarker() {
  return new File(Paths.document, 'selfinder_has_launched_before');
}

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
    let isFreshInstall = true;
    try {
      const marker = getFirstLaunchMarker();
      isFreshInstall = !marker.exists;
      if (isFreshInstall) {
        marker.create();
      }
    } catch {
      // expo-file-system unavailable (e.g. web) — fall through to
      // Keychain-only behavior below, same as every other store.
      isFreshInstall = false;
    }

    if (isFreshInstall) {
      // A real fresh install — ignore whatever Keychain says (it may
      // still hold "acknowledged" from a previous install of this app on
      // the same device) and make sure it's cleared too, so the two
      // stores can't disagree with each other going forward.
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEY);
      } catch {
        // Unavailable — nothing to clear.
      }
      set({ acknowledged: false, hydrated: true });
      return;
    }

    let stored: string | null = null;
    try {
      stored = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore unavailable — fall through, same as every other store.
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
