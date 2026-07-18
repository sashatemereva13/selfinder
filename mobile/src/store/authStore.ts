import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthSession } from '../types';
import * as authApi from '../api/auth';

const STORAGE_KEY = 'selfinder_auth_session';

interface AuthStore {
  session: AuthSession | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  register: (username: string, password: string, privacyPolicyAccepted: boolean) => Promise<void>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

async function persist(session: AuthSession | null) {
  try {
    if (session) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(session));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  } catch {
    // SecureStore is unavailable (e.g. web has no implementation) — keep the
    // session in memory for this run even though it won't persist.
  }
}

export const useAuthStore = create<AuthStore>((set) => ({
  session: null,
  hydrated: false,

  hydrate: async () => {
    let raw: string | null = null;
    try {
      raw = await SecureStore.getItemAsync(STORAGE_KEY);
    } catch {
      // SecureStore unavailable — boot as signed out.
    }
    let session: AuthSession | null = null;
    if (raw) {
      try { session = JSON.parse(raw); } catch { session = null; }
    }
    set({ session, hydrated: true });
  },

  register: async (username, password, privacyPolicyAccepted) => {
    const session = await authApi.register(username, password, privacyPolicyAccepted);
    await persist(session);
    set({ session });
  },

  login: async (username, password) => {
    const session = await authApi.login(username, password);
    await persist(session);
    set({ session });
  },

  logout: async () => {
    await persist(null);
    set({ session: null });
  },
}));
