import React from 'react';

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

  const handleChange = (idx: number, numVal: number) => {
    const updated = [...vec];
    updated[idx] = numVal;
    onChange(updated);
  };

  return (
    <div className={`grid gap-2 ${dim === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
      {axes.map((axis, idx) => (
        <div
          key={idx}
          className="flex items-center gap-1.5 px-2 py-1 border border-gray-200 dark:border-gray-800 rounded"
        >
          <span className="text-[10px] font-mono text-gray-400">{axis}</span>
          <input
            type="number"
            step={dim === 3 ? '1' : '0.05'}
            value={vec[idx] ?? 0}
            aria-label={axis}
            onChange={(e) => handleChange(idx, parseFloat(e.target.value) || 0)}
            className="w-full font-mono text-xs bg-transparent outline-none text-right"
          />
        </div>
      ))}
    </div>
  );
};
