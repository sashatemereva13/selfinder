import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ru from './locales/ru.json';

// Started at 'en' and switched by src/store/localeStore.ts once it hydrates
// (see setI18nLocale below) — i18next itself never touches SecureStore or
// device-locale detection directly, localeStore already owns both.
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export function setI18nLocale(locale: 'en' | 'ru') {
  i18n.changeLanguage(locale);
}

export default i18n;
