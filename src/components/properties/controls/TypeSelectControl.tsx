import React from 'react';
import { useTranslation } from 'react-i18next';
import { TYPE_OBJECTS, type SoundEventType } from '@/domain/schema/specs';

interface TypeSelectControlProps {
  value: string;
  onChange: (val: string) => void;
}

export const TypeSelectControl: React.FC<TypeSelectControlProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const curType = (value || TYPE_OBJECTS[0]) as SoundEventType;

  const typeDesc = t(`types.${curType}`, { returnObjects: true }) as any;

  return (
    <div className="w-full space-y-2">
      <select
        value={curType}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white cursor-pointer font-medium"
      >
        {TYPE_OBJECTS.map((tKey) => {
          const item = t(`types.${tKey}`, { returnObjects: true }) as any;
          return (
            <option key={tKey} value={tKey}>
              {tKey} — {item?.name || tKey}
            </option>
          );
        })}
      </select>

      {/* Usage Scenario Card */}
      <div className="p-2.5 rounded border border-gray-200/80 dark:border-gray-800/80 bg-gray-50/70 dark:bg-gray-900/40 text-[11px] leading-relaxed">
        <div className="flex items-start gap-1.5">
          <span className="inline-block px-1 py-0.2 text-[9px] font-semibold uppercase tracking-wider bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded whitespace-nowrap flex-shrink-0 mt-0.5">
            {t('ui.usageScenario')}
          </span>
          <span className="text-gray-600 dark:text-gray-300 font-sans">
            {typeDesc?.desc}
          </span>
        </div>
      </div>
    </div>
  );
};
