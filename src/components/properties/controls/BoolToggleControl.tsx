import React from 'react';
import type { PropertyKind } from '@/domain/schema/specs';

interface BoolToggleControlProps {
  kind: PropertyKind;
  value: any;
  onChange: (val: any) => void;
}

export const BoolToggleControl: React.FC<BoolToggleControlProps> = ({
  kind,
  value,
  onChange,
}) => {
  let isTrue = false;
  if (kind === 'float_bool') {
    isTrue = value === 1 || value === 1.0 || value === '1.0' || value === true || value === 'true';
  } else if (kind === 'int_bool') {
    isTrue = value === 1 || value === '1' || value === true || value === 'true';
  } else {
    isTrue = value === true || value === 'true';
  }

  const handleSetTrue = () => {
    let emitted: any = true;
    if (kind === 'float_bool') emitted = 1.0;
    else if (kind === 'int_bool') emitted = 1;
    onChange(emitted);
  };

  const handleSetFalse = () => {
    let emitted: any = false;
    if (kind === 'float_bool') emitted = 0.0;
    else if (kind === 'int_bool') emitted = 0;
    onChange(emitted);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <div className="inline-flex p-0.5 border border-gray-200 dark:border-gray-800 rounded text-[11px] font-mono">
        <button
          type="button"
          onClick={handleSetTrue}
          aria-pressed={isTrue}
          className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
            isTrue
              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
              : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          true
        </button>
        <button
          type="button"
          onClick={handleSetFalse}
          aria-pressed={!isTrue}
          className={`px-2 py-0.5 rounded-sm transition-colors cursor-pointer ${
            !isTrue
              ? 'bg-black text-white dark:bg-white dark:text-black font-semibold'
              : 'text-gray-500 hover:text-black dark:hover:text-white'
          }`}
        >
          false
        </button>
      </div>
    </div>
  );
};
