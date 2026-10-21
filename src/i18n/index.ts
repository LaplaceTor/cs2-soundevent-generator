import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';

export const defaultNS = 'translation';
export const resources = {
  zh: { translation: zh },
  en: { translation: en },
} as const;

i18n.use(initReactI18next).init({
  lng: 'zh',
  fallbackLng: 'zh',
  resources,
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
