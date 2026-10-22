import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { useEditorStore } from '@/store/useEditorStore';
import type { GroupId } from '@/domain/schema/specs';
import { PropertyRow } from './PropertyRow';

interface PropertyGroupAccordionProps {
  groupId: GroupId;
  groupIndex: number;
  propKeys: string[];
}

export const PropertyGroupAccordion = React.memo<PropertyGroupAccordionProps>(
  ({ groupId, groupIndex, propKeys }) => {
    const { t } = useTranslation();
    const isExpanded = useEditorStore((s) => s.expandedGroups.has(groupId));
    const toggleGroupExpanded = useEditorStore((s) => s.toggleGroupExpanded);
    const activeCount = useSoundEventStore((s) => {
      let count = 0;
      for (const k of propKeys) {
        if (s.enabledProperties.has(k)) count++;
      }
      return count;
    });

    const groupNumStr = String(groupIndex).padStart(2, '0');
    const groupTitle = t(`groups.${groupId}`) || groupId;

    return (
      <div className="border-b border-gray-200 dark:border-gray-800">
        {/* Group Header */}
        <h3 className="m-0 p-0 text-inherit font-normal">
          <button
            type="button"
            id={`accordion-header-${groupId}`}
            aria-expanded={isExpanded}
            aria-controls={`accordion-region-${groupId}`}
            onClick={() => toggleGroupExpanded(groupId)}
            className="w-full text-left px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40 select-none transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-black dark:focus-visible:ring-white bg-transparent border-0"
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={`text-[10px] font-mono text-gray-400 transition-transform inline-block ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              >
                ▶
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {groupNumStr}. {groupTitle}
              </span>
            </span>
            <span
              className={
                activeCount > 0
                  ? 'text-[10px] font-mono px-1.5 py-0.2 bg-black text-white dark:bg-white dark:text-black rounded-none'
                  : 'text-[10px] font-mono text-gray-400'
              }
            >
              {activeCount} / {propKeys.length}
            </span>
          </button>
        </h3>

        {/* Group Body */}
        {isExpanded && (
          <div
            id={`accordion-region-${groupId}`}
            role="region"
            aria-labelledby={`accordion-header-${groupId}`}
            className="divide-y divide-gray-100 dark:divide-gray-800/60 block"
          >
            {propKeys.map((k) => (
              <PropertyRow key={k} propKey={k} />
            ))}
          </div>
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.groupId !== nextProps.groupId) return false;
    if (prevProps.groupIndex !== nextProps.groupIndex) return false;
    if (prevProps.propKeys.length !== nextProps.propKeys.length) return false;
    for (let i = 0; i < prevProps.propKeys.length; i++) {
      if (prevProps.propKeys[i] !== nextProps.propKeys[i]) return false;
    }
    return true;
  }
);

PropertyGroupAccordion.displayName = 'PropertyGroupAccordion';
