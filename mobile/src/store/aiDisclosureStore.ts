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
  // True while AIConsentSheet is up, waiting on the person's answer.
  pending: boolean;
  hydrate: () => Promise<void>;
  acknowledge: () => Promise<void>;
  // Resolves true immediately if already acknowledged; otherwise raises
  // AIConsentSheet and resolves with the person's answer.
  requestConsent: () => Promise<boolean>;
  respond: (accepted: boolean) => Promise<void>;
}

// Resolvers for every requestConsent() call made while the sheet is up —
// several can pile up (e.g. a tap on "Begin" racing a stray send), and each
// one must get the same answer rather than the first swallowing the rest.
let pendingResolvers: ((accepted: boolean) => void)[] = [];

// Gates the one-time notice (AIConsentSheet.tsx) shown before any feature
// sends a user's words to the third-party AI provider (Guide, Measure,
// Journeys) — accountless usage is the primary path (see RULES.md), so this
// can't be folded into the signup-only privacy-policy checkbox in
// AccountSection.tsx; it needs to catch every user, account or not, before
// their first message is ever sent. Asked at the moment of first send
// (2026-09-26), not up front after onboarding: explicit permission right
// where the data would leave the device (App Store 5.1.2(i)), and someone
// who never types anything is never asked.
export const useAIDisclosureStore = create<AIDisclosureStore>((set, get) => ({
  acknowledged: false,
  hydrated: false,
  pending: false,

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

  requestConsent: () => {
    if (get().acknowledged) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      pendingResolvers.push(resolve);
      set({ pending: true });
    });
  },

  respond: async (accepted) => {
    if (accepted) await get().acknowledge();
    const resolvers = pendingResolvers;
    pendingResolvers = [];
    set({ pending: false });
    resolvers.forEach((resolve) => resolve(accepted));
  },
}));

// For API call sites the person started themselves (a message, an answer)
// — raises the sheet if needed.
export function ensureAIConsent(): Promise<boolean> {
  return useAIDisclosureStore.getState().requestConsent();
}

// For background generation nobody asked for in the moment (Your Arc's
// line, a Crossing) — never raises the sheet, just skips until consent
// exists.
export function hasAIConsent(): boolean {
  return useAIDisclosureStore.getState().acknowledged;
}

export class AIConsentDeclinedError extends Error {
  constructor() {
    super('AI consent declined');
    this.name = 'AIConsentDeclinedError';
  }
}

// Last line of defense inside the API layer itself, so a future call site
// that forgets to ask first still can't send anything without consent.
export async function requireAIConsent(): Promise<void> {
  if (!(await ensureAIConsent())) throw new AIConsentDeclinedError();
}
