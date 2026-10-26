import React from 'react';

interface VectorAxisInputProps {
  axis: string;
  step: string;
  value: number;
  onChange: (val: number) => void;
}

const VectorAxisInput: React.FC<VectorAxisInputProps> = ({
  axis,
  step,
  value,
  onChange,
}) => {
  const [isFocused, setIsFocused] = React.useState(false);
  const [draft, setDraft] = React.useState(() => String(value ?? 0));

  React.useEffect(() => {
    if (!isFocused) {
      setDraft(String(value ?? 0));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);

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

    const num = parseFloat(trimmed);
    if (!isNaN(num) && isFinite(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    const trimmed = draft.trim();
    if (
      trimmed === '' ||
      trimmed === '-' ||
      trimmed === '+' ||
      trimmed === '.' ||
      trimmed === '-.' ||
      trimmed === '+.'
    ) {
      onChange(0);
      setDraft('0');
      return;
    }

    const num = parseFloat(trimmed);
    if (isNaN(num)) {
      setDraft(String(value ?? 0));
      return;
    }

    onChange(num);
    setDraft(String(num));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const numStep = parseFloat(step) || 1;
      const current = parseFloat(draft) || 0;
      const next = e.key === 'ArrowUp' ? current + numStep : current - numStep;
      const precision = step.includes('.') ? (step.split('.')[1]?.length ?? 0) : 0;
      const rounded = parseFloat(next.toFixed(precision));
      setDraft(String(rounded));
      onChange(rounded);
    }
  };

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 border border-gray-200 dark:border-gray-800 rounded-sm">
      <span className="text-[10px] font-mono text-gray-400">{axis}</span>
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        aria-label={axis}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full font-mono text-xs bg-transparent outline-hidden text-right"
      />
    </div>
  );
};

interface VectorControlProps {
  dim: 2 | 3;
  value: number[];
  onChange: (val: number[]) => void;
}

export const VectorControl: React.FC<VectorControlProps> = ({
  dim,
  value,
  onChange,
}) => {
  const vec = Array.isArray(value) ? [...value] : dim === 3 ? [0, 0, 0] : [0.8, 0.2];
  const axes = dim === 3 ? ['X', 'Y', 'Z'] : ['#1', '#2'];
  const step = dim === 3 ? '1' : '0.05';

  const handleAxisChange = (idx: number, numVal: number) => {
    const updated = [...vec];
    while (updated.length < dim) {
      updated.push(0);
    }
    updated[idx] = numVal;
    onChange(updated);
  };

  return (
    <div className={`grid gap-2 ${dim === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {axes.map((axis, idx) => (
        <VectorAxisInput
          key={idx}
          axis={axis}
          step={step}
          value={vec[idx] ?? 0}
          onChange={(val) => handleAxisChange(idx, val)}
        />
      ))}
    </div>
  );
};
