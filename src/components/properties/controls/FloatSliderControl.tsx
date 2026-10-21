import React from 'react';
import type { PropertySpec } from '@/domain/schema/specs';

interface FloatSliderControlProps {
  propKey: string;
  spec: PropertySpec;
  value: number;
  onChange: (val: number) => void;
}

export const FloatSliderControl: React.FC<FloatSliderControlProps> = ({
  propKey,
  spec,
  value,
  onChange,
}) => {
  const range = spec.options?.slider_range || [0, 10];
  const onlyPositive = spec.options?.only_positive || false;
  let minVal = range[0] ?? 0;
  let maxVal = range[1] ?? 10;
  let curNum = Number(value);
  if (isNaN(curNum)) curNum = 0;

  if (curNum < minVal) minVal = curNum;
  if (curNum > maxVal) maxVal = curNum;

  const span = maxVal - minVal;
  let step = '0.01';
  if (span > 200) step = '1';
  else if (span > 20) step = '0.1';
  else if (span <= 2) step = '0.01';

  return (
    <div className="flex items-center gap-3">
      <input
        type="range"
        className="minimal-slider flex-1"
        min={minVal}
        max={maxVal}
        step={step}
        value={curNum}
        aria-label={`${propKey} slider`}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      />
      <input
        type="number"
        className="w-20 px-2 py-0.5 font-mono text-xs bg-transparent border border-gray-200 dark:border-gray-800 rounded outline-none focus:border-black dark:focus:border-white text-right"
        value={curNum}
        step={step}
        min={onlyPositive ? '0' : undefined}
        aria-label={`${propKey} value`}
        onChange={(e) => {
          let num = parseFloat(e.target.value);
          if (isNaN(num)) return;
          if (onlyPositive && num < 0) num = 0;
          onChange(num);
        }}
      />
    </div>
  );
};
