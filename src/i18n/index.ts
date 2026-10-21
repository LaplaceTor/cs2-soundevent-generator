import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';

export const defaultNS = 'translation';
export const resources = {
  zh: { translation: zh },
};

i18n.use(initReactI18next).init({
  lng: 'zh',
  fallbackLng: 'zh',
  resources,
  defaultNS,
  interpolation: {
    escapeValue: false,
  },
});

export async function loadLanguage(lang: 'zh' | 'en'): Promise<void> {
  if (lang === 'en' && !i18n.hasResourceBundle('en', defaultNS)) {
    const enModule = await import('./locales/en.json');
    i18n.addResourceBundle('en', defaultNS, enModule.default || enModule, true, true);
  }
  await i18n.changeLanguage(lang);
}

export default i18n;
