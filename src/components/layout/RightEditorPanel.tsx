import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { Kv3CodeMirror } from '@/components/editor/Kv3CodeMirror';
import { HowToUseModal } from '@/components/layout/HowToUseModal';
import { toast } from 'sonner';
import { Copy, Zap, Lightbulb, X, Share2 } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';

export const RightEditorPanel: React.FC = () => {
  const { t } = useTranslation();
  const lang = useSoundEventStore((s) => s.lang);
  const code = useSoundEventStore((s) => s.code);
  const diagnostics = useSoundEventStore((s) => s.diagnostics);
  const includeComments = useSoundEventStore((s) => s.includeComments);
  const setIncludeComments = useSoundEventStore((s) => s.setIncludeComments);
  const updateCodeFromEditor = useSoundEventStore((s) => s.updateCodeFromEditor);
  const formatCurrentCode = useSoundEventStore((s) => s.formatCurrentCode);
  const exportShareHash = useSoundEventStore((s) => s.exportShareHash);
  const isDrawerOpen = useSoundEventStore((s) => s.isEditorDrawerOpen);
  const setDrawerOpen = useSoundEventStore((s) => s.setEditorDrawerOpen);

  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

  const toolbarRef = useRef<HTMLDivElement>(null);
  const titleGroupRef = useRef<HTMLDivElement>(null);
  const measureActionsRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  const [isUltraCompact, setIsUltraCompact] = useState(false);

  const hasError = diagnostics.length > 0;
  const firstError = diagnostics[0];

  // Accurately check remaining width by measuring actual toolbar width minus Title & "格式正确" badge minus paddings & gaps
  const checkLayout = useCallback(() => {
    if (!toolbarRef.current || !titleGroupRef.current) return;
    const toolbar = toolbarRef.current;
    const titleGroup = titleGroupRef.current;

    const style = window.getComputedStyle(toolbar);
    const paddingLeft = parseFloat(style.paddingLeft) || 16;
    const paddingRight = parseFloat(style.paddingRight) || 16;
    const gap = parseFloat(style.gap) || 8;

    // Available width strictly inside the toolbar, respecting paddingRight (distance to floating window edge)
    const maxAllowedActionsWidth = toolbar.clientWidth - paddingLeft - paddingRight - titleGroup.offsetWidth - gap;

    // Real required full-text width directly measured from the hidden full-text clone
    const requiredFullWidth = measureActionsRef.current
      ? measureActionsRef.current.offsetWidth
      : (lang === 'zh' ? 455 : 510);

    setIsCompact(requiredFullWidth > maxAllowedActionsWidth);
    setIsUltraCompact(maxAllowedActionsWidth < (lang === 'zh' ? 255 : 270));
  }, [lang]);

  useEffect(() => {
    checkLayout();
    if (!toolbarRef.current) return;
    const ro = new ResizeObserver(() => {
      checkLayout();
    });
    ro.observe(toolbarRef.current);
    if (titleGroupRef.current) {
      ro.observe(titleGroupRef.current);
    }
    if (measureActionsRef.current) {
      ro.observe(measureActionsRef.current);
    }
    return () => ro.disconnect();
  }, [checkLayout, diagnostics.length, lang]);

  const handleShare = async () => {
    const hash = exportShareHash();
    const shareUrl = `${window.location.origin}${window.location.pathname}#s=${hash}`;
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      toast.success(t('ui.shareSuccessTip'));
    } else {
      toast.error(t('ui.copyShareFailed'));
    }
  };

  // Mobile drawer scroll lock & keyboard / resize listeners
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.classList.add('drawer-open');
      const groupsContainer = document.getElementById('groupsContainer');
      if (groupsContainer) {
        groupsContainer.style.overflow = 'hidden';
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setDrawerOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      const handleResize = () => {
        if (window.innerWidth >= 1024) {
          setDrawerOpen(false);
        }
      };
      window.addEventListener('resize', handleResize);

      return () => {
        document.body.classList.remove('drawer-open');
        if (groupsContainer) {
          groupsContainer.style.overflow = '';
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      document.body.classList.remove('drawer-open');
      const groupsContainer = document.getElementById('groupsContainer');
      if (groupsContainer) {
        groupsContainer.style.overflow = '';
      }
    }
  }, [isDrawerOpen, setDrawerOpen]);

  const handleCopy = async () => {
    const ok = await copyToClipboard(code);
    if (ok) {
      toast.success(t('ui.copiedTip'));
    } else {
      toast.error(t('ui.copyCodeFailed'));
    }
  };

  const handleFormat = () => {
    const success = formatCurrentCode();
    if (success) {
      toast.success(t('ui.formatSuccess'));
    } else {
      toast.error(t('ui.formatError'));
    }
  };

  const getErrorMessage = () => {
    if (!firstError) return '';
    const codeKey = `errors.${firstError.code}`;
    return t(codeKey as any, { line: firstError.line, ...firstError.params });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-200 lg:hidden touch-none ${
          isDrawerOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setDrawerOpen(false)}
        onTouchMove={(e) => e.preventDefault()}
      />

      {/* Floating Button for Mobile */}
      <button
        type="button"
        onClick={() => setDrawerOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-30 flex items-center gap-2 px-4 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-full shadow-2xl border border-gray-800/20 dark:border-white/20 font-mono text-xs font-semibold hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        <span>📄</span>
        <span>{t('ui.viewCodeBtn')}</span>
        <span
          className={`w-2 h-2 rounded-full ${
            hasError ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
          }`}
        />
      </button>

      {/* Main Right Section (Flex-1 on wide, Slide Drawer on narrow) */}
      <section
        id="rightEditorSection"
        className={`
          fixed inset-x-0 bottom-0 z-50 h-[84vh] rounded-t-2xl border-t border-gray-300 dark:border-gray-700 shadow-2xl transform transition-transform duration-300 ease-out
          lg:static lg:inset-auto lg:bottom-auto lg:z-auto lg:h-full lg:rounded-none lg:border-t-0 lg:shadow-none lg:transform-none lg:transition-none
          flex flex-col bg-white dark:bg-[#0B0F17] overflow-hidden flex-1 min-w-0 overscroll-contain
          ${isDrawerOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}
        `}
        onWheel={(e) => {
          // Stop wheel events inside drawer from bubbling to the background page
          e.stopPropagation();
        }}
      >
        {/* Editor Toolbar - Single-row flex container, never wraps */}
        <div
          ref={toolbarRef}
          className="editor-responsive-bar min-h-11 px-3 sm:px-4 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex items-center justify-between gap-2 flex-nowrap flex-shrink-0"
        >
          {/* Zone 1: Title & Status Badge (measured to accurately calculate remaining space) */}
          <div
            ref={titleGroupRef}
            className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 min-w-0"
          >
            <span className="hidden min-[420px]:inline text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {t('ui.editorTitle')}
            </span>

            {/* Validation Badge */}
            <div
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition-colors whitespace-nowrap flex-shrink-0 ${
                hasError ? 'badge-error' : 'badge-valid'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  hasError ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
                }`}
              />
              <span>{hasError ? t('ui.statusInvalid') : t('ui.statusValid')}</span>
            </div>
          </div>

          {/* Zone 2: Editor Actions & Mobile Close on the same line */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0 flex-nowrap">
            {/* Include Comments Checkbox */}
            <label
              className="inline-flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-black dark:hover:text-white cursor-pointer select-none whitespace-nowrap flex-shrink-0 transition-colors"
              title={t('ui.includeCommentsTooltip')}
            >
              <input
                type="checkbox"
                checked={includeComments}
                onChange={(e) => setIncludeComments(e.target.checked)}
                className="custom-checkbox"
              />
              <span className={isUltraCompact ? 'hidden' : 'inline'}>{t('ui.includeComments')}</span>
            </label>

            <span className="inline-block w-px h-3.5 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

            {/* 4 Action Buttons */}
            <div className="flex items-center flex-nowrap gap-1 sm:gap-1.5 flex-shrink-0">
              {/* Share Button */}
              <button
                type="button"
                onClick={handleShare}
                className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
                title={t('ui.shareBtn')}
                aria-label={t('ui.shareBtn')}
              >
                <Share2 className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />
                {!isCompact && <span>{t('ui.shareBtn')}</span>}
              </button>

              {/* How To Use Button */}
              <button
                type="button"
                onClick={() => setIsHowToUseOpen(true)}
                className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
                title={t('ui.howToUseBtn')}
                aria-label={t('ui.howToUseBtn')}
              >
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />
                {!isCompact && <span>{t('ui.howToUseBtn')}</span>}
              </button>

              {/* Format Button */}
              <button
                type="button"
                onClick={handleFormat}
                className="py-1 px-2 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded text-[11px] font-medium transition-colors whitespace-nowrap flex-shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
                title={t('ui.formatBtn')}
                aria-label={t('ui.formatBtn')}
              >
                <Zap className="w-3.5 h-3.5 flex-shrink-0 text-gray-600 dark:text-gray-300" />
                {!isCompact && <span>{t('ui.formatBtn')}</span>}
              </button>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="py-1 px-2 sm:px-2.5 bg-black text-white dark:bg-white dark:text-black rounded text-[11px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap flex-shrink-0 cursor-pointer inline-flex items-center justify-center gap-1.5"
                title={t('ui.copyCodeBtn')}
                aria-label={t('ui.copyCodeBtn')}
              >
                <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                {!isCompact && <span>{t('ui.copyCodeBtn')}</span>}
              </button>
            </div>

            {/* Mobile Close Button */}
            <div
              className="lg:hidden flex items-center justify-end flex-shrink-0 pl-1.5 sm:pl-2.5 border-l border-gray-200 dark:border-gray-800"
            >
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-black dark:hover:border-white text-gray-700 dark:text-gray-200 hover:text-black dark:hover:text-white rounded text-base font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                title={t('ui.closeDrawer')}
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Off-screen measurement clone: renders full-text version of actions to measure exact required width */}
        <div
          ref={measureActionsRef}
          aria-hidden="true"
          className="absolute left-[-9999px] top-[-9999px] invisible pointer-events-none flex items-center gap-1.5 sm:gap-2.5 flex-nowrap whitespace-nowrap"
        >
          <div className="inline-flex items-center gap-1.5 text-[11px] whitespace-nowrap">
            <span className="custom-checkbox" />
            <span>{t('ui.includeComments')}</span>
          </div>

          <span className="inline-block w-px h-3.5 bg-gray-200 dark:bg-gray-800 flex-shrink-0" />

          <div className="flex items-center flex-nowrap gap-1 sm:gap-1.5 flex-shrink-0">
            <div className="py-1 px-2 border border-transparent rounded text-[11px] font-medium whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('ui.shareBtn')}</span>
            </div>
            <div className="py-1 px-2 border border-transparent rounded text-[11px] font-medium whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('ui.howToUseBtn')}</span>
            </div>
            <div className="py-1 px-2 border border-transparent rounded text-[11px] font-medium whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('ui.formatBtn')}</span>
            </div>
            <div className="py-1 px-2 sm:px-2.5 rounded text-[11px] font-medium whitespace-nowrap flex-shrink-0 inline-flex items-center justify-center gap-1.5">
              <Copy className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{t('ui.copyCodeBtn')}</span>
            </div>
          </div>

          <div className="lg:hidden flex items-center justify-end flex-shrink-0 pl-1.5 sm:pl-2.5 border-l border-transparent">
            <div className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
        </div>

        {/* Error Banner */}
        {hasError && (
          <div className="px-4 py-1.5 bg-red-50 dark:bg-red-950/60 border-b border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-mono flex items-center justify-between flex-shrink-0 transition-all">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex-shrink-0">
                !
              </span>
              <span className="truncate font-semibold">{getErrorMessage()}</span>
            </div>
          </div>
        )}

        {/* CodeMirror Editor Area */}
        <div
          className={`flex-1 flex overflow-hidden relative bg-gray-50/20 dark:bg-gray-950/30 ${
            hasError ? 'border-red-500' : ''
          }`}
        >
          <Kv3CodeMirror
            value={code}
            onChange={updateCodeFromEditor}
            onCursorChange={(l, c) => setCursorPos({ line: l, col: c })}
            errorLine={firstError?.line}
          />
        </div>

        {/* Bottom Status Bar */}
        <div className="h-6 px-4 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] font-mono text-gray-400 bg-gray-50/30 dark:bg-gray-950/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span>{t('ui.tabIndentHint')}</span>
            <span>{t('ui.ctrlSpaceHint')}</span>
          </div>
          <div>{t('ui.cursorLnCol', { ln: cursorPos.line, col: cursorPos.col })}</div>
        </div>
      </section>

      {/* How To Use Modal */}
      <HowToUseModal isOpen={isHowToUseOpen} onClose={() => setIsHowToUseOpen(false)} />
    </>
  );
};
