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
  const disableSentinel = spec.options?.disable_sentinel;
  const hasDisableBtn = disableSentinel !== undefined;

  let curNum = Number(value);
  if (isNaN(curNum)) curNum = 0;

  const [localVal, setLocalVal] = React.useState<number>(curNum);
  const [isInputFocused, setIsInputFocused] = React.useState(false);
  const [draftString, setDraftString] = React.useState<string>(() => String(curNum));
  const rafRef = React.useRef<number | null>(null);
  const latestValRef = React.useRef<number>(curNum);

  // Sync external changes (presets, code editor edits, undo, linked partner constraints)
  React.useEffect(() => {
    if (rafRef.current === null) {
      setLocalVal(curNum);
      latestValRef.current = curNum;
      if (!isInputFocused) {
        setDraftString(String(curNum));
      }
    }
  }, [curNum, isInputFocused]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let nextVal = parseFloat(e.target.value) || 0;
    if (hasDisableBtn && nextVal < 0) nextVal = 0;
    setLocalVal(nextVal);
    setDraftString(String(nextVal));
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
    const raw = e.target.value;
    setDraftString(raw);

    const trimmed = raw.trim();
    if (
      trimmed === '' ||
      trimmed === '-' ||
      trimmed === '+' ||
      trimmed === '.' ||
      trimmed === '-.' ||
      trimmed === '+.'
    ) {
      return;
    }

    let num = parseFloat(trimmed);
    if (isNaN(num)) return;

    if (onlyPositive && num < 0) num = 0;
    if (hasDisableBtn && num < 0 && num !== disableSentinel) {
      num = disableSentinel;
    }

    setLocalVal(num);
    latestValRef.current = num;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onChange(num);
  };

  const handleNumberBlur = () => {
    setIsInputFocused(false);
    const trimmed = draftString.trim();
    if (
      trimmed === '' ||
      trimmed === '-' ||
      trimmed === '+' ||
      trimmed === '.' ||
      trimmed === '-.' ||
      trimmed === '+.'
    ) {
      const fallback = 0;
      setLocalVal(fallback);
      setDraftString(String(fallback));
      latestValRef.current = fallback;
      onChange(fallback);
      return;
    }

    let num = parseFloat(trimmed);
    if (isNaN(num)) {
      setDraftString(String(localVal));
      return;
    }

    if (onlyPositive && num < 0) num = 0;
    if (hasDisableBtn && num < 0 && num !== disableSentinel) {
      num = disableSentinel;
    }

    setLocalVal(num);
    setDraftString(String(num));
    latestValRef.current = num;
    onChange(num);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const numStep = parseFloat(step) || 0.01;
      const current = parseFloat(draftString) || 0;
      let next = e.key === 'ArrowUp' ? current + numStep : current - numStep;
      if (onlyPositive && next < 0) next = 0;
      if (hasDisableBtn && next < 0 && next !== disableSentinel) {
        next = disableSentinel;
      }
      const precision = step.includes('.') ? (step.split('.')[1]?.length ?? 0) : 0;
      next = parseFloat(next.toFixed(precision));
      setLocalVal(next);
      setDraftString(String(next));
      latestValRef.current = next;
      onChange(next);
    }
  };

  const handleToggleDisable = () => {
    if (!hasDisableBtn) return;
    const isCurrentlyDisabled = localVal === disableSentinel;
    const nextVal = isCurrentlyDisabled ? 0 : disableSentinel;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setLocalVal(nextVal);
    setDraftString(String(nextVal));
    latestValRef.current = nextVal;
    onChange(nextVal);
  };

  const isSentinelDisabled = hasDisableBtn && localVal === disableSentinel;

  let minVal = range[0] ?? 0;
  let maxVal = range[1] ?? 10;
  const displayNum = localVal;
  if (!hasDisableBtn && displayNum < minVal) minVal = displayNum;
  if (displayNum > maxVal) maxVal = displayNum;

  const sliderPos = isSentinelDisabled ? minVal : Math.max(minVal, displayNum);

  const span = maxVal - minVal;
  let step = '0.01';
  if (span > 200) step = '1';
  else if (span > 20) step = '0.1';
  else if (span <= 2) step = '0.01';

  return (
    <div className="flex items-center gap-2.5">
      {hasDisableBtn && (
        <button
          type="button"
          onClick={handleToggleDisable}
          aria-pressed={isSentinelDisabled}
          title={
            isSentinelDisabled
              ? `Disabled (${disableSentinel}). Click to set to 0`
              : `Click to disable (${disableSentinel})`
          }
          className={`px-1.5 py-0.5 border rounded-sm font-mono text-[10px] font-semibold tracking-wider transition-colors shrink-0 cursor-pointer ${
            isSentinelDisabled
              ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white'
              : 'border-gray-200 dark:border-gray-800 text-gray-500 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white'
          }`}
        >
          DISABLE
        </button>
      )}
      <input
        type="range"
        className={`minimal-slider flex-1 ${isSentinelDisabled ? 'opacity-40' : ''}`}
        min={minVal}
        max={maxVal}
        step={step}
        value={sliderPos}
        aria-label={`${propKey} slider`}
        onChange={handleSliderChange}
        onPointerUp={handlePointerUp}
        onTouchEnd={handlePointerUp}
      />
      <input
        type="text"
        inputMode="decimal"
        className="w-20 px-2 py-0.5 font-mono text-xs bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm outline-hidden focus:border-black dark:focus:border-white text-right"
        value={draftString}
        aria-label={`${propKey} value`}
        onFocus={() => setIsInputFocused(true)}
        onBlur={handleNumberBlur}
        onChange={handleNumberChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};
