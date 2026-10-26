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

  const formatValue = (val: any[]) => {
    if (!Array.isArray(val)) return val !== undefined && val !== null ? String(val) : '';
    return val.join(', ');
  };

  const [isFocused, setIsFocused] = React.useState(false);
  const [draft, setDraft] = React.useState(() => formatValue(value));

  // Sync external changes when not focused
  React.useEffect(() => {
    if (!isFocused) {
      setDraft(formatValue(value));
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);

    if (raw.trim() === '') {
      onChange([]);
      return;
    }

    const parts = raw.split(/[\s,]+/).filter(Boolean);
    if (isNum) {
      const allValid = parts.every((p) => p.trim() !== '' && !isNaN(Number(p)));
      if (allValid && parts.length > 0) {
        onChange(parts.map(Number));
      }
    } else {
      onChange(parts.map((p) => p.replace(/^["']|["']$/g, '')));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (draft.trim() === '') {
      onChange([]);
      setDraft('');
      return;
    }

    const parts = draft.split(/[\s,]+/).filter(Boolean);
    if (isNum) {
      const validNumbers = parts.map(Number).filter((n) => !isNaN(n));
      onChange(validNumbers);
      setDraft(validNumbers.join(', '));
    } else {
      const cleaned = parts.map((p) => p.replace(/^["']|["']$/g, ''));
      onChange(cleaned);
      setDraft(cleaned.join(', '));
    }
  };

  return (
    <input
      type="text"
      value={draft}
      onFocus={() => setIsFocused(true)}
      onBlur={handleBlur}
      onChange={handleChange}
      placeholder={isNum ? '0.0, 2.0, 4.0' : '"meta", "localplayeronly"'}
      aria-label={kind}
      className="w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm font-mono text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white placeholder:text-gray-400"
    />
  );
};
