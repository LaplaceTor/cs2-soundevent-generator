import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import type { GroupId } from '@/domain/schema/specs';
import { PropertyRow } from './PropertyRow';

interface PropertyGroupAccordionProps {
  groupId: GroupId;
  groupIndex: number;
  propKeys: string[];
}

export const PropertyGroupAccordion: React.FC<PropertyGroupAccordionProps> = ({
  groupId,
  groupIndex,
  propKeys,
}) => {
  const { t } = useTranslation();
  const isExpanded = useSoundEventStore((s) => s.expandedGroups.has(groupId));
  const toggleGroupExpanded = useSoundEventStore((s) => s.toggleGroupExpanded);
  const enabledSet = useSoundEventStore((s) => s.enabledProperties);

  const activeCount = propKeys.filter((k) => enabledSet.has(k)).length;
  const groupNumStr = String(groupIndex).padStart(2, '0');
  const groupTitle = t(`groups.${groupId}`) || groupId;

  return (
    <div className="border-b border-gray-200 dark:border-gray-800">
      {/* Group Header */}
      <div
        onClick={() => toggleGroupExpanded(groupId)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-gray-50/60 dark:hover:bg-gray-800/40 select-none transition-colors"
      >
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] font-mono text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            ▶
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            {groupNumStr}. {groupTitle}
          </span>
        </div>
        <span
          className={
            activeCount > 0
              ? 'text-[10px] font-mono px-1.5 py-0.2 bg-black text-white dark:bg-white dark:text-black rounded-none'
              : 'text-[10px] font-mono text-gray-400'
          }
        >
          {activeCount} / {propKeys.length}
        </span>
      </div>

      {/* Group Body */}
      {isExpanded && (
        <div className="divide-y divide-gray-100 dark:divide-gray-800/60 block">
          {propKeys.map((k) => (
            <PropertyRow key={k} propKey={k} />
          ))}
        </div>
      )}
    </div>
  );
};
