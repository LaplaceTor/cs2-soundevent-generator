import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface VsndWeightsControlProps {
  value: number[];
  onChange: (val: number[]) => void;
}

export const VsndWeightsControl: React.FC<VsndWeightsControlProps> = ({
  value,
  onChange,
}) => {
  const { t } = useTranslation();

  // Ensure minimum 2 weight values
  const weights = useMemo(() => {
    if (!Array.isArray(value) || value.length < 2) {
      if (Array.isArray(value) && value.length === 1) {
        return [Number(value[0]) || 0.8, 0.2];
      }
      return [0.8, 0.2];
    }
    return value.map((v) => (typeof v === 'number' && !isNaN(v) ? v : Number(v) || 0));
  }, [value]);

  const totalWeight = useMemo(() => {
    return weights.reduce((sum, w) => sum + (Number(w) || 0), 0);
  }, [weights]);

  const handleWeightChange = (idx: number, newVal: number) => {
    const updated = [...weights];
    updated[idx] = Math.max(0, newVal);
    onChange(updated);
  };

  const handleAddWeight = () => {
    const lastWeight = weights[weights.length - 1] ?? 0.5;
    const updated = [...weights, lastWeight];
    onChange(updated);
  };

  const handleDeleteWeight = (idx: number) => {
    if (weights.length <= 2) {
      toast.warning(t('weightsEditor.minWarning'));
      return;
    }
    const updated = weights.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div className="space-y-2 border border-gray-200 dark:border-gray-800 p-2.5 rounded-sm">
      {/* Header Info */}
      <div className="flex items-center justify-between gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-mono uppercase tracking-wider">
        <span>{t('weightsEditor.title')}</span>
        <span>{weights.length} {t('weightsEditor.itemsCount')}</span>
      </div>

      {/* Table Container */}
      <div className="max-h-48 overflow-y-auto overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-sm">
        <table className="curve-table w-full min-w-[260px] table-fixed">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>{t('weightsEditor.slot')}</th>
              <th style={{ width: '38%' }}>{t('weightsEditor.weight')}</th>
              <th style={{ width: '25%' }}>{t('weightsEditor.ratio')}</th>
              <th style={{ width: '15%' }}>{t('weightsEditor.action')}</th>
            </tr>
          </thead>
          <tbody>
            {weights.map((w, idx) => {
              const ratio = totalWeight > 0 ? ((w / totalWeight) * 100).toFixed(1) : '0.0';
              return (
                <tr key={idx}>
                  <td className="font-mono text-gray-500 dark:text-gray-400 text-[11px]">
                    #{idx + 1}
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={w}
                      aria-label={`${t('weightsEditor.weight')} #${idx + 1}`}
                      onChange={(e) => handleWeightChange(idx, parseFloat(e.target.value) || 0)}
                      className="curve-cell-input font-mono"
                    />
                  </td>
                  <td className="font-mono text-gray-400 text-[10px]">
                    {ratio}%
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDeleteWeight(idx)}
                      className={`w-6 h-6 inline-flex items-center justify-center font-bold cursor-pointer transition-colors rounded-sm ${
                        weights.length <= 2
                          ? 'text-gray-300 dark:text-gray-700 hover:text-gray-400'
                          : 'text-gray-400 hover:text-red-500 active:scale-95'
                      }`}
                      title={weights.length <= 2 ? t('weightsEditor.minWarning') : t('weightsEditor.delete')}
                      aria-label={t('weightsEditor.delete')}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer: Add button + Total display */}
      <div className="flex items-center justify-between pt-0.5">
        <button
          type="button"
          onClick={handleAddWeight}
          className="px-3 py-1.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm text-[11px] font-medium transition-colors cursor-pointer active:scale-98"
        >
          {t('weightsEditor.addWeight')}
        </button>
        <span className="text-[10px] font-mono text-gray-400">
          {t('weightsEditor.total')}: {Number(totalWeight.toFixed(3))}
        </span>
      </div>
    </div>
  );
};
