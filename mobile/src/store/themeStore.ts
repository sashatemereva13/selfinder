import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { Appearance } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'selfinder_theme';
const OVERRIDE_STORAGE_KEY = 'selfinder_theme_is_override';

// 'unspecified' (some Android versions, or a device that hasn't set a
// preference) falls back to dark — matches the app's existing default
// look rather than guessing light for an unknown state.
function detectDeviceTheme(): ResolvedTheme {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

interface ThemeStore {
  // The saved/selected preference itself — 'system' is a real, persisted
  // choice (not just "never touched"), so a later app update still knows
  // the user explicitly wants to follow the OS rather than defaulting to
  // it silently.
  preference: ThemePreference;
  // What the rest of the app actually renders with — resolved from
  // `preference`, live-updated from the OS when preference is 'system'.
  theme: ResolvedTheme;
  isUserOverride: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setPreference: (preference: ThemePreference) => Promise<void>;
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  preference: 'system',
  theme: 'dark',
  isUserOverride: false,
  hydrated: false,

  hydrate: async () => {
    let storedPreference: string | null = null;
    let storedOverride: string | null = null;
    try {
      [storedPreference, storedOverride] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEY),
        SecureStore.getItemAsync(OVERRIDE_STORAGE_KEY),
      ]);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — fall
      // through to system detection below, same as every other store.
    }

    const isUserOverride = storedOverride === 'true';
    const preference: ThemePreference =
      isUserOverride && (storedPreference === 'light' || storedPreference === 'dark' || storedPreference === 'system')
        ? storedPreference
        : 'system';
    const theme: ResolvedTheme = preference === 'system' ? detectDeviceTheme() : preference;

    set({ preference, theme, isUserOverride, hydrated: true });

    // Theme can change while the app is open (unlike locale) — keep
    // `theme` live whenever the user is following the system setting.
    // Registered once, here, rather than as a separate effect in
    // _layout.tsx, so this store owns its whole lifecycle the same way
    // hydrate() already owns reading persisted state.
    Appearance.addChangeListener(({ colorScheme }) => {
      if (get().preference !== 'system') return;
      set({ theme: colorScheme === 'light' ? 'light' : 'dark' });
    });
  },

  setPreference: async (preference) => {
    const theme: ResolvedTheme = preference === 'system' ? detectDeviceTheme() : preference;
    set({ preference, theme, isUserOverride: true });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, preference);
      await SecureStore.setItemAsync(OVERRIDE_STORAGE_KEY, 'true');
    } catch {
      // SecureStore is unavailable — keep the choice in memory for this
      // session even though it won't persist.
    }
  },
}));
