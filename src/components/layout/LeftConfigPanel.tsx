import React, { useMemo, useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { useEditorStore } from '@/store/useEditorStore';
import { GROUPS, SPECS, typeNeedsValue } from '@/domain/schema/specs';
import { PRESETS } from '@/domain/schema/presets';
import { PropertyGroupAccordion } from '@/components/properties/PropertyGroupAccordion';
import { RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export const LeftConfigPanel: React.FC = () => {
  const { t } = useTranslation();
  const applyPreset = useSoundEventStore((s) => s.applyPreset);
  const eventName = useSoundEventStore((s) => s.eventName);
  const setEventName = useSoundEventStore((s) => s.setEventName);
  const enabledProperties = useSoundEventStore((s) => s.enabledProperties);
  const curType = useSoundEventStore((s) => s.propertyValues.type);
  const lang = useSoundEventStore((s) => s.lang);
  const selectedPresetId = useSoundEventStore((s) => s.selectedPresetId);

  const searchQuery = useEditorStore((s) => s.searchQuery);
  const setSearchQuery = useEditorStore((s) => s.setSearchQuery);
  const filterActiveOnly = useEditorStore((s) => s.filterActiveOnly);
  const setFilterActiveOnly = useEditorStore((s) => s.setFilterActiveOnly);
  const expandAllGroups = useEditorStore((s) => s.expandAllGroups);
  const collapseAllGroups = useEditorStore((s) => s.collapseAllGroups);
  const [isScrolledDown, setIsScrolledDown] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight : 800
  );
  const fullHeaderRef = useRef<HTMLDivElement>(null);
  const [fullHeaderHeight, setFullHeaderHeight] = useState(310);
  const isScrolledDownRef = useRef(isScrolledDown);
  isScrolledDownRef.current = isScrolledDown;

  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const measureFullTabsRef = useRef<HTMLDivElement>(null);
  const [isTabsCompact, setIsTabsCompact] = useState(false);

  const checkTabsLayout = useCallback(() => {
    if (!tabsContainerRef.current) return;
    const containerWidth = tabsContainerRef.current.clientWidth;
    const fullRequiredWidth = measureFullTabsRef.current?.offsetWidth || (lang === 'zh' ? 180 : 250);
    setIsTabsCompact(containerWidth < fullRequiredWidth + 4);
  }, [lang]);

  useEffect(() => {
    checkTabsLayout();
    if (!tabsContainerRef.current) return;
    const ro = new ResizeObserver(() => {
      checkTabsLayout();
    });
    ro.observe(tabsContainerRef.current);
    return () => ro.disconnect();
  }, [checkTabsLayout]);

  useEffect(() => {
    const onResize = () => {
      setViewportHeight(window.innerHeight);
      if (fullHeaderRef.current && !isScrolledDownRef.current) {
        const h = fullHeaderRef.current.offsetHeight;
        if (h > 200) {
          setFullHeaderHeight(h);
        }
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Simplify into 3 rows if the top section takes more than 1/3 of the client viewport height and user scrolls down
  const exceedsOneThird = fullHeaderHeight > viewportHeight / 3;
  const isSimplified = exceedsOneThird && isScrolledDown;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop > 15) {
      setIsScrolledDown(true);
    } else if (scrollTop <= 5) {
      setIsScrolledDown(false);
    }
  }, []);

  // Forward wheel and touch swipe from pinned header to groupsContainer
  const touchStartYRef = useRef(0);
  const handleHeaderWheel = useCallback((e: React.WheelEvent) => {
    const el = document.getElementById('groupsContainer');
    if (el) {
      el.scrollTop += e.deltaY;
    }
  }, []);

  const handleHeaderTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches[0]) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  }, []);

  const handleHeaderTouchMove = useCallback((e: React.TouchEvent) => {
    const el = document.getElementById('groupsContainer');
    if (el && e.touches[0]) {
      const currentY = e.touches[0].clientY;
      const deltaY = touchStartYRef.current - currentY;
      touchStartYRef.current = currentY;
      el.scrollTop += deltaY;
    }
  }, []);

  // FLIP (First, Last, Invert, Play) transition animation between relaxed and compact layouts
  const lastRectsRef = useRef<Map<string, DOMRect>>(new Map());
  const flipRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerFlip = useCallback((key: string) => (el: HTMLElement | null) => {
    if (el) {
      flipRefs.current.set(key, el);
    } else {
      flipRefs.current.delete(key);
    }
  }, []);

  const prevSimplifiedRef = useRef(isSimplified);

  useLayoutEffect(() => {
    if (prevSimplifiedRef.current !== isSimplified) {
      prevSimplifiedRef.current = isSimplified;

      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      flipRefs.current.forEach((el, key) => {
        const prev = lastRectsRef.current.get(key);
        if (!prev) return;
        const current = el.getBoundingClientRect();
        const dx = prev.left - current.left;
        const dy = prev.top - current.top;

        if (!prefersReducedMotion && (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5)) {
          if (typeof el.getAnimations === 'function') {
            el.getAnimations().forEach((a) => a.cancel());
          }
          el.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: 'none' }
            ],
            {
              duration: 320,
              easing: 'cubic-bezier(0.2, 0, 0, 1)'
            }
          );
        }
      });

      const timer = setTimeout(() => {
        flipRefs.current.forEach((el, key) => {
          lastRectsRef.current.set(key, el.getBoundingClientRect());
        });
      }, 350);
      return () => clearTimeout(timer);
    } else {
      flipRefs.current.forEach((el, key) => {
        lastRectsRef.current.set(key, el.getBoundingClientRect());
      });
    }
  }, [isSimplified]);

  const handleReset = () => {
    const preset = PRESETS[selectedPresetId] || PRESETS.csgo_mega_basic;
    const targetId = preset?.id || 'csgo_mega_basic';
    applyPreset(targetId);
    const presetName = t((preset?.nameKey || 'presets.csgo_mega_basic') as any);
    toast.info(t('ui.resetSuccess', { preset: presetName }));
  };

  const handlePresetChange = (presetId: string) => {
    applyPreset(presetId);
  };

  const filteredGroups = useMemo(() => {
    const s = searchQuery.toLowerCase().trim();
    let visibleGroupIdx = 1;

    return GROUPS.map(([groupId]) => {
      const allPropsInGroup = Object.entries(SPECS)
        .filter(([_, spec]) => spec.group === groupId)
        .filter(([key]) => {
          if (key === 'value') {
            return typeNeedsValue(curType) || enabledProperties.has('value');
          }
          return true;
        })
        .map(([key]) => key);

      const matchingProps = allPropsInGroup.filter((k) => {
        if (filterActiveOnly && !enabledProperties.has(k)) return false;
        if (!s) return true;
        const label = String(t(`labels.${k}`) || '').toLowerCase();
        const desc = String(t(`tooltips.${k}`) || '').toLowerCase();
        return k.toLowerCase().includes(s) || label.includes(s) || desc.includes(s);
      });

      const activeCount = allPropsInGroup.filter((k) => enabledProperties.has(k)).length;
      if (filterActiveOnly && activeCount === 0) return null;
      if (s && matchingProps.length === 0) return null;

      const idx = visibleGroupIdx++;
      return {
        groupId,
        groupIndex: idx,
        propKeys: matchingProps,
      };
    }).filter(Boolean);
  }, [searchQuery, filterActiveOnly, enabledProperties, curType, t]);

  const handleExpandAll = () => {
    expandAllGroups(GROUPS.map(([id]) => id));
  };

  return (
    <section
      aria-label={t('ui.configuration')}
      className="w-full lg:w-[380px] lg:flex-shrink-0 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full bg-white dark:bg-[#0B0F17] overflow-hidden"
    >
      {/* Top Header Section with smooth morphing transition */}
      <div
        ref={fullHeaderRef}
        onWheel={handleHeaderWheel}
        onTouchStart={handleHeaderTouchStart}
        onTouchMove={handleHeaderTouchMove}
        className="flex-shrink-0 bg-white dark:bg-[#0B0F17] transition-all duration-300 ease-in-out border-b border-gray-200 dark:border-gray-800"
      >
        {/* Header Toolbar (Title) - smoothly rolls up in compact mode */}
        <div
          className={clsx(
            "px-4 border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30 transition-all duration-300 ease-in-out overflow-hidden",
            isSimplified
              ? "max-h-0 opacity-0 border-b-0 py-0"
              : "h-11 max-h-12 opacity-100 border-b py-0"
          )}
        >
          <div className="flex items-center gap-2">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 m-0">
              {t('ui.configuration')}
            </h2>
            <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">
              {t('ui.configSub')}
            </span>
          </div>
        </div>

        {/* Pinned Section: 3 logical rows in compact mode, expanded in relaxed mode */}
        <div
          className={clsx(
            "transition-all duration-300 ease-in-out",
            isSimplified ? "p-2.5 space-y-2 shadow-sm" : "p-3.5 space-y-3"
          )}
        >
          {/* Section 1 / Row 1: Preset + Reset + Event Identifier */}
          <div>
            {/* Preset Label (hidden in compact mode) */}
            <div
              className={clsx(
                "flex items-center justify-between transition-all duration-300 ease-in-out overflow-hidden",
                isSimplified ? "hidden" : "max-h-6 opacity-100 mb-1"
              )}
            >
              <label
                htmlFor="presetSelect"
                className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                {t('ui.presetLabel')}
              </label>
              <span className="text-[10px] font-mono text-gray-400">PRESET</span>
            </div>

            {/* Row 1 Controls: Preset Select + Reset Btn + Event Name Input */}
            <div
              className={clsx(
                "flex items-center gap-1.5 transition-all duration-300",
                isSimplified ? "flex-nowrap" : "flex-wrap"
              )}
            >
              <select
                id="presetSelect"
                ref={registerFlip('presetSelect')}
                value={selectedPresetId}
                onChange={(e) => handlePresetChange(e.target.value)}
                className={clsx(
                  "min-w-0 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-medium text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white cursor-pointer transition-all duration-300 truncate",
                  isSimplified ? "flex-1 px-2 py-1" : "flex-1 px-2.5 py-1.5"
                )}
                title={t('ui.presetLabel')}
                aria-label={t('ui.presetLabel')}
              >
                {Object.values(PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(p.nameKey as any)}
                  </option>
                ))}
              </select>

              <button
                ref={registerFlip('resetBtn')}
                type="button"
                onClick={handleReset}
                className={clsx(
                  "border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded font-medium text-xs text-gray-700 dark:text-gray-300 transition-all duration-300 flex-shrink-0 cursor-pointer inline-flex items-center justify-center",
                  isSimplified ? "p-1" : "py-1.5 px-2.5"
                )}
                title={t('ui.resetBtn')}
                aria-label={t('ui.resetBtn')}
              >
                <RotateCcw className="w-3.5 h-3.5 flex-shrink-0 text-gray-500 dark:text-gray-400" />
                <span
                  className={clsx(
                    "transition-all duration-300 overflow-hidden whitespace-nowrap inline-block",
                    isSimplified ? "max-w-0 opacity-0 ml-0" : "max-w-28 opacity-100 ml-1"
                  )}
                >
                  {t('ui.resetBtn')}
                </span>
              </button>

              {/* Event Identifier Label (hidden in compact mode so it never occupies width in flex-nowrap) */}
              <div
                className={clsx(
                  "w-full flex items-center justify-between transition-all duration-300 ease-in-out overflow-hidden",
                  isSimplified ? "hidden" : "max-h-6 opacity-100 mt-2.5 mb-1"
                )}
              >
                <label
                  htmlFor="eventNameInput"
                  className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer"
                >
                  {t('ui.eventIdentifier')}
                </label>
                <span className="text-[10px] font-mono text-gray-400">KV3</span>
              </div>

              {/* Event Name Input (glides between Line 2 in relaxed and Line 1 in compact) */}
              <input
                id="eventNameInput"
                ref={registerFlip('eventNameInput')}
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                className={clsx(
                  "min-w-0 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white transition-all duration-300 placeholder:text-gray-400 truncate",
                  isSimplified ? "basis-0 flex-1 px-2 py-1" : "basis-full w-full px-2.5 py-1.5"
                )}
                placeholder={t('ui.eventNamePlaceholder')}
                title={t('ui.eventNameLabel')}
                aria-label={t('ui.eventNameLabel')}
              />
            </div>
          </div>

          {/* Section 2 / Row 2: Search */}
          <div>
            {/* Search Label (hidden in compact mode) */}
            <div
              className={clsx(
                "flex items-center justify-between transition-all duration-300 ease-in-out overflow-hidden",
                isSimplified ? "hidden" : "max-h-6 opacity-100 mb-1"
              )}
            >
              <label
                htmlFor="searchInput"
                className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 cursor-pointer"
              >
                {t('ui.filterSearch')}
              </label>
            </div>

            <input
              id="searchInput"
              ref={registerFlip('searchInput')}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={clsx(
                "w-full bg-transparent border border-gray-200 dark:border-gray-800 rounded text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white transition-all duration-300 placeholder:text-gray-400",
                isSimplified ? "px-2.5 py-1" : "px-2.5 py-1.5"
              )}
              placeholder={t('ui.searchPlaceholder')}
              aria-label={t('ui.filterSearch')}
            />
          </div>

          {/* Section 3 / Row 3: Filter Tabs + Expand/Collapse */}
          <div
            className={clsx(
              "flex transition-all duration-300",
              isSimplified ? "items-center justify-between gap-2 flex-row" : "flex-col space-y-1.5"
            )}
          >
            <div
              ref={registerFlip('filterTabs')}
              className={clsx("transition-all duration-300", isSimplified ? "flex-1 min-w-0" : "w-full")}
            >
              {/* Filter Segmented Tabs */}
              <div
                ref={tabsContainerRef}
                role="tablist"
                aria-label={t('ui.filterSearch')}
                className="grid grid-cols-2 p-0.5 border border-gray-200 dark:border-gray-800 rounded text-[11px] font-medium text-center"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={!filterActiveOnly}
                  onClick={() => setFilterActiveOnly(false)}
                  className={clsx(
                    "rounded-sm transition-all cursor-pointer truncate px-1 whitespace-nowrap",
                    isSimplified ? "py-0.5" : "py-1",
                    !filterActiveOnly
                      ? "text-black dark:text-white font-semibold"
                      : "text-gray-500 hover:text-black dark:hover:text-white"
                  )}
                  title={t('ui.filterAll')}
                >
                  {isTabsCompact ? t('ui.filterAllShort') : t('ui.filterAll')}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={filterActiveOnly}
                  onClick={() => setFilterActiveOnly(true)}
                  className={clsx(
                    "rounded-sm transition-all cursor-pointer truncate px-1 whitespace-nowrap",
                    isSimplified ? "py-0.5" : "py-1",
                    filterActiveOnly
                      ? "text-black dark:text-white font-semibold"
                      : "text-gray-500 hover:text-black dark:hover:text-white"
                  )}
                  title={t('ui.filterActiveOnly')}
                >
                  {isTabsCompact ? t('ui.filterActiveOnlyShort') : t('ui.filterActiveOnly')}
                </button>
              </div>
            </div>

            {/* Expand / Collapse All */}
            <div
              ref={registerFlip('expandCollapse')}
              className={clsx(
                "flex items-center text-[11px] text-gray-500 transition-all duration-300",
                isSimplified ? "flex-shrink-0 gap-1" : "justify-end gap-1.5 pt-0.5"
              )}
            >
              <button
                type="button"
                onClick={handleExpandAll}
                className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title={t('ui.expandAll')}
              >
                {t('ui.expandAll')}
              </button>
              <span className="text-gray-300 dark:text-gray-700">/</span>
              <button
                type="button"
                onClick={collapseAllGroups}
                className="hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                title={t('ui.collapseAll')}
              >
                {t('ui.collapseAll')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 03. Scrollable Properties Groups - Only this area scrolls! */}
      <div
        id="groupsContainer"
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden divide-y divide-gray-200 dark:divide-gray-800 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
      >
        {filteredGroups.map((g: any) => (
          <PropertyGroupAccordion
            key={g.groupId}
            groupId={g.groupId}
            groupIndex={g.groupIndex}
            propKeys={g.propKeys}
          />
        ))}
      </div>

      {/* Off-screen measurement clone for filter tabs */}
      <div
        ref={measureFullTabsRef}
        aria-hidden="true"
        className="absolute left-[-9999px] top-[-9999px] invisible pointer-events-none flex items-center p-0.5 border text-[11px] font-medium whitespace-nowrap"
      >
        <span className="px-1">{t('ui.filterAll')}</span>
        <span className="px-1">{t('ui.filterActiveOnly')}</span>
      </div>
    </section>
  );
};
