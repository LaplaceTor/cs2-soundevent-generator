import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToUseModal: React.FC<HowToUseModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      // Double rAF ensures DOM is mounted with initial closed styles before transitioning to open
      const frame1 = requestAnimationFrame(() => {
        const frame2 = requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return () => cancelAnimationFrame(frame2);
      });
      return () => cancelAnimationFrame(frame1);
    } else {
      setIsVisible(false);
      // Wait for exit transition to complete before unmounting from DOM
      const timer = setTimeout(() => {
        setIsRendered(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isRendered) return null;

  const concept = t('guideModal.concept', { returnObjects: true }) as any;
  const entities = t('guideModal.entities', { returnObjects: true }) as any[];
  const steps = t('guideModal.steps', { returnObjects: true }) as string[];

  const badgeColorClass = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300';
      case 'blue':
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300';
      case 'indigo':
        return 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300';
      case 'amber':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300';
      case 'purple':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300';
      case 'rose':
        return 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div
      className={clsx(
        "fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm transition-all duration-200 ease-out",
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div
        className={clsx(
          "relative w-full max-w-2xl max-h-[88vh] bg-white dark:bg-[#0E131F] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ease-out",
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2.5"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50/70 dark:bg-gray-900/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">💡</span>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">
              {t('guideModal.title')}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm font-semibold cursor-pointer"
            aria-label={t('guideModal.closeBtn')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden space-y-4 sm:space-y-5 text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-sans min-w-0 break-words [overflow-wrap:anywhere]">
          {/* Section 1: Core Concept */}
          <div className="p-3.5 rounded-lg border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 space-y-2 min-w-0 break-words [overflow-wrap:anywhere]">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
              <span>🎯</span> {concept.title}
            </h4>
            <p className="text-gray-700 dark:text-gray-300">{concept.p1}</p>
            <p className="text-gray-700 dark:text-gray-300">{concept.p2}</p>
          </div>

          {/* Section 2: Entity Selection */}
          <div className="space-y-2.5 min-w-0">
            <h4 className="font-bold text-gray-900 dark:text-gray-100 text-xs flex items-center gap-1.5">
              <span>🔊</span> {t('guideModal.entitiesTitle')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {Array.isArray(entities) &&
                entities.map((ent, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/40 space-y-1 min-w-0 break-words [overflow-wrap:anywhere]"
                  >
                    <div className="flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
                      <span className="font-mono font-bold text-gray-900 dark:text-gray-100 text-xs break-all">
                        {ent.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-semibold rounded whitespace-nowrap flex-shrink-0 ${badgeColorClass(
                          ent.badgeColor
                        )}`}
                      >
                        {ent.badge}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-[11px] break-words [overflow-wrap:anywhere]">
                      <strong>{t('guideModal.mechanismLabel')}</strong> {ent.mechanism}
                      <br />
                      <strong>{t('guideModal.scenarioLabel')}</strong> {ent.scenario}
                      <br />
                      <strong>{t('guideModal.ioLabel')}</strong> {ent.io}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Section 3: 4-Step Practical Implementation */}
          <div className="p-3.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-2 min-w-0 break-words [overflow-wrap:anywhere]">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
              <span>🚀</span> {t('guideModal.stepsTitle')}
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-700 dark:text-gray-300 text-[11px] break-words [overflow-wrap:anywhere]">
              {Array.isArray(steps) &&
                steps.map((st, sIdx) => (
                  <li key={sIdx} className="break-words [overflow-wrap:anywhere]">
                    <span className="break-words [overflow-wrap:anywhere]">{st}</span>
                  </li>
                ))}
            </ol>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end bg-gray-50/50 dark:bg-gray-900/30 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 bg-black text-white dark:bg-white dark:text-black rounded text-xs font-medium hover:opacity-90 transition-opacity cursor-pointer"
          >
            {t('guideModal.closeBtn')}
          </button>
        </div>
      </div>
    </div>
  );
};
