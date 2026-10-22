import React from 'react';

interface ArrayInputControlProps {
  kind: 'array_string' | 'array_float';
  value: any[];
  onChange: (val: any[]) => void;
}

export const ArrayInputControl: React.FC<ArrayInputControlProps> = ({
  kind,
  value,
  onChange,
}) => {
  const isNum = kind === 'array_float';
  const textVal = Array.isArray(value) ? value.join(', ') : String(value || '');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (isNum) {
      onChange(parts.map(Number));
    } else {
      onChange(parts.map((p) => p.replace(/^["']|["']$/g, '')));
    }
  };

  return (
    <input
      type="text"
      value={textVal}
      onChange={handleChange}
      placeholder={isNum ? '0.0, 2.0, 4.0' : '"meta", "localplayeronly"'}
      aria-label={kind}
      className="w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm font-mono text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white placeholder:text-gray-400"
    />
  );
};
