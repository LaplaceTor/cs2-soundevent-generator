import React from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Sun, Moon } from 'lucide-react';
import { useSoundEventStore } from '@/store/useSoundEventStore';

const SUPPORT_URLS: Record<'zh' | 'en', string> = {
  zh: 'https://afdian.com/a/laplacetor',
  en: 'https://ko-fi.com/R5S426JG8P',
};

const GITHUB_URL = 'https://github.com/LaplaceTor/cs2-soundevent-generator';

const HEADER_ACTION_CLASS =
  'h-7 px-2.5 inline-flex items-center justify-center gap-1.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm font-mono text-xs font-medium text-black dark:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer no-underline';

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

      {/* Preferences: [Support] [GitHub] [EN/中文] [Theme] */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
        {/* Support Developer Button */}
        <a
          href={SUPPORT_URLS[lang] || SUPPORT_URLS.en}
          target="_blank"
          rel="noopener noreferrer"
          className={HEADER_ACTION_CLASS}
          title={t('ui.supportMe')}
          aria-label={t('ui.supportMe')}
        >
          <Heart className="w-3.5 h-3.5 text-red-500 fill-current shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t('ui.supportMe')}</span>
        </a>

        {/* GitHub Repository Button */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={HEADER_ACTION_CLASS}
          title={t('ui.githubSource')}
          aria-label={t('ui.githubSource')}
        >
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 fill-current shrink-0"
            aria-hidden="true"
          >
            <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
          </svg>
        </a>

        {/* Language Toggle Button */}
        <button
          type="button"
          onClick={handleLangToggle}
          className={HEADER_ACTION_CLASS}
          title={t('ui.langToggle')}
          aria-label={t('ui.langToggle')}
        >
          {lang === 'zh' ? 'EN' : '中文'}
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={handleThemeToggle}
          className={HEADER_ACTION_CLASS}
          title={t('ui.themeToggle')}
          aria-label={t('ui.themeToggle')}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <Moon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
};
