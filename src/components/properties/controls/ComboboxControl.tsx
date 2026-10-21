import React from 'react';
import { useTranslation } from 'react-i18next';
import { type PropertySpec, MIXGROUPS, DSP_PRESETS } from '@/domain/schema/specs';

interface ComboboxControlProps {
  propKey: string;
  spec: PropertySpec;
  value: string;
  onChange: (val: string) => void;
}

export const ComboboxControl: React.FC<ComboboxControlProps> = ({
  propKey,
  spec,
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  let options = spec.options?.objects || [];
  if (propKey === 'mixgroup') options = MIXGROUPS;
  else if (propKey === 'dsp_preset') options = DSP_PRESETS;

  const isSelectOnly =
    spec.kind === 'select' ||
    propKey === 'vsnd_selection_type' ||
    propKey === 'dsp_preset' ||
    propKey === 'mixgroup';

  if (isSelectOnly) {
    return (
      <select
        value={value || (options[0] ?? '')}
        aria-label={propKey}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white cursor-pointer font-medium"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
        {value && !options.includes(value) && (
          <option value={value}>
            {value}
          </option>
        )}
      </select>
    );
  }

  return (
    <div className="flex gap-2">
      <select
        value={value || ''}
        aria-label={`${propKey} select`}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={value || ''}
        aria-label={`${propKey} custom input`}
        placeholder={t('ui.orFreeInput')}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded font-mono text-xs text-gray-900 dark:text-gray-100 outline-none focus:border-black dark:focus:border-white placeholder:text-gray-400"
      />
    </div>
  );
};
