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
  let curNum = Number(value);
  if (isNaN(curNum)) curNum = 0;

  const [localVal, setLocalVal] = React.useState<number>(curNum);
  const rafRef = React.useRef<number | null>(null);
  const latestValRef = React.useRef<number>(curNum);

  // Sync external changes (presets, code editor edits, undo, linked partner constraints)
  React.useEffect(() => {
    if (rafRef.current === null) {
      setLocalVal(curNum);
      latestValRef.current = curNum;
    }
  }, [curNum]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = parseFloat(e.target.value) || 0;
    setLocalVal(nextVal);
    latestValRef.current = nextVal;

    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        React.startTransition(() => {
          onChange(latestValRef.current);
        });
      });
    }
  };

  const handlePointerUp = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      onChange(latestValRef.current);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let num = parseFloat(e.target.value);
    if (isNaN(num)) return;
    if (onlyPositive && num < 0) num = 0;
    setLocalVal(num);
    latestValRef.current = num;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onChange(num);
  };

  let minVal = range[0] ?? 0;
  let maxVal = range[1] ?? 10;
  const displayNum = localVal;
  if (displayNum < minVal) minVal = displayNum;
  if (displayNum > maxVal) maxVal = displayNum;

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
        value={displayNum}
        aria-label={`${propKey} slider`}
        onChange={handleSliderChange}
        onPointerUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
      />
      <input
        type="number"
        className="w-20 px-2 py-0.5 font-mono text-xs bg-transparent border border-gray-200 dark:border-gray-800 rounded outline-none focus:border-black dark:focus:border-white text-right"
        value={displayNum}
        step={step}
        min={onlyPositive ? '0' : undefined}
        aria-label={`${propKey} value`}
        onChange={handleNumberChange}
      />
    </div>
  );
};
