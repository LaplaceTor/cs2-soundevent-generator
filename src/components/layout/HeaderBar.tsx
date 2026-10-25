import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart } from 'lucide-react';
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
    <header className="min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-2 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-sm sticky top-0 z-40 pl-[calc(1rem+env(safe-area-inset-left,0px))] pr-[calc(1rem+env(safe-area-inset-right,0px))] lg:px-6 flex items-center justify-between shrink-0">
      {/* Title */}
      <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
        <h1 className="text-xs font-bold uppercase tracking-widest text-black dark:text-white flex items-center gap-2 whitespace-nowrap m-0 font-sans">
          <span className="inline-block w-2 h-2 bg-black dark:bg-white rounded-none" aria-hidden="true" />
          CS2 SOUNDEVENT
        </h1>
      </div>

      {/* Preferences: [Support] [EN/中文] [Theme] */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
        {/* Support Developer Button */}
        <a
          href={lang === 'zh' ? 'https://afdian.com/a/laplacetor' : 'https://ko-fi.com/R5S426JG8P'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer text-black dark:text-white no-underline"
          title={t('ui.supportMe')}
          aria-label={t('ui.supportMe')}
        >
          <Heart className="w-3 h-3 text-red-500 fill-current" aria-hidden="true" />
          <span className="hidden sm:inline">{t('ui.supportMe')}</span>
        </a>

        {/* Language Toggle Button */}
        <button
          type="button"
          onClick={handleLangToggle}
          className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title={t('ui.langToggle')}
          aria-label={t('ui.langToggle')}
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm font-mono font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          title={t('ui.themeToggle')}
          aria-label={t('ui.themeToggle')}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
};
