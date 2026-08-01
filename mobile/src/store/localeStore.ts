import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { getLocales } from 'expo-localization';

export type Locale = 'en' | 'ru';

const STORAGE_KEY = 'selfinder_locale';
const OVERRIDE_STORAGE_KEY = 'selfinder_locale_is_override';

const SUPPORTED_LOCALES: Locale[] = ['en', 'ru'];

// The device's own preferred language, mapped down to a locale we actually
// support — anything we don't have a translation for falls back to English
// rather than showing an unsupported language.
function detectDeviceLocale(): Locale {
  const languageCode = getLocales()[0]?.languageCode;
  return languageCode && SUPPORTED_LOCALES.includes(languageCode as Locale)
    ? (languageCode as Locale)
    : 'en';
}

interface LocaleStore {
  locale: Locale;
  // True once the user has explicitly chosen a language in settings — once
  // set, a later device-locale change (or app update) must not silently
  // override their choice. False means `locale` is still just whatever the
  // device reported on first launch.
  isUserOverride: boolean;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setLocale: (locale: Locale) => Promise<void>;
}

export const useLocaleStore = create<LocaleStore>((set) => ({
  locale: 'en',
  isUserOverride: false,
  hydrated: false,

  hydrate: async () => {
    let storedLocale: string | null = null;
    let storedOverride: string | null = null;
    try {
      [storedLocale, storedOverride] = await Promise.all([
        SecureStore.getItemAsync(STORAGE_KEY),
        SecureStore.getItemAsync(OVERRIDE_STORAGE_KEY),
      ]);
    } catch {
      // SecureStore is unavailable (e.g. web has no implementation) — fall
      // through to device detection below, same as every other store.
    }

    const isUserOverride = storedOverride === 'true';
    const locale =
      isUserOverride && storedLocale && SUPPORTED_LOCALES.includes(storedLocale as Locale)
        ? (storedLocale as Locale)
        : detectDeviceLocale();

    set({ locale, isUserOverride, hydrated: true });
  },

  setLocale: async (locale: Locale) => {
    set({ locale, isUserOverride: true });
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, locale);
      await SecureStore.setItemAsync(OVERRIDE_STORAGE_KEY, 'true');
    } catch {
      // SecureStore is unavailable — keep the choice in memory for this
      // session even though it won't persist.
    }
  },
}));
