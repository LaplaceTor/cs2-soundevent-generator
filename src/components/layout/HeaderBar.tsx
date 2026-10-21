import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';

export const HeaderBar: React.FC = () => {
  const { t } = useTranslation();
  const lang = useSoundEventStore((s) => s.lang);
  const theme = useSoundEventStore((s) => s.theme);
  const setLang = useSoundEventStore((s) => s.setLang);
  const setTheme = useSoundEventStore((s) => s.setTheme);

  const handleLangToggle = () => {
    const next = lang === 'zh' ? 'en' : 'zh';
    setLang(next);
  };

  const handleThemeToggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  return (
    <header className="min-h-14 py-2 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-6 flex items-center justify-between flex-shrink-0">
      {/* Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        <span className="text-xs font-bold uppercase tracking-widest text-black dark:text-white flex items-center gap-2 whitespace-nowrap">
          <span className="inline-block w-2 h-2 bg-black dark:bg-white rounded-none" />
          CS2 SOUNDEVENT
        </span>
        <span className="text-[11px] font-mono px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 text-gray-500 rounded whitespace-nowrap">
          KV3 SPEC
        </span>
      </div>

      {/* Preferences: [EN/中文] [Theme] */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-shrink-0">
        {/* Language Toggle Button */}
        <button
          type="button"
          onClick={handleLangToggle}
          className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded font-mono font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
          title={t('ui.langToggle')}
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded font-mono font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer"
          title={t('ui.themeToggle')}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};
