import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { CURVE_PRESETS, generateCurveFromEndpoints } from '@/domain/curve/math';
import { useCurveCanvas } from '@/domain/curve/useCurveCanvas';
import { toast } from 'sonner';

interface CurveEditorControlProps {
  propKey: string;
  value: number[][];
  onChange: (pts: number[][]) => void;
}

export const CurveEditorControl: React.FC<CurveEditorControlProps> = ({
  propKey,
  value,
  onChange,
}) => {
  const { t } = useTranslation();
  const theme = useSoundEventStore((s) => s.theme);
  const [localPoints, setLocalPoints] = useState<number[][]>(() =>
    Array.isArray(value) && value.length > 0 ? value : CURVE_PRESETS.linear!
  );

  // Sync with value prop from outside (store preset change or import)
  useEffect(() => {
    if (Array.isArray(value) && value.length > 0) {
      setLocalPoints(value);
    }
  }, [value]);

  const handlePointsChange = useCallback(
    (pts: number[][]) => {
      setLocalPoints(pts);
      onChange(pts);
    },
    [onChange]
  );

  const handleLiveDrag = useCallback((pts: number[][]) => {
    setLocalPoints([...pts]);
  }, []);

  const canvasRef = useCurveCanvas({
    points: localPoints,
    onPointsChange: handlePointsChange,
    onLiveDrag: handleLiveDrag,
    isDark: theme === 'dark',
    fallbackText: t('ui.needAtLeastTwoPoints'),
  });

  const axisInfo = (t(`curveAxes.${propKey}`, { returnObjects: true }) as any) || {
    x: 'X',
    y: 'Y',
    descX: 'Input',
    descY: 'Output',
  };

  const handleApplyPreset = (presetKey: string) => {
    const updated = generateCurveFromEndpoints(presetKey, localPoints);
    setLocalPoints(updated);
    onChange(updated);
  };

  const handleCellChange = (pIdx: number, cIdx: number, val: number) => {
    const next = localPoints.map((row, i) => (i === pIdx ? [...row] : row));
    if (next[pIdx]) {
      next[pIdx]![cIdx] = val;
      if (cIdx === 0) {
        next.sort((a, b) => a[0]! - b[0]!);
      }
      setLocalPoints(next);
      onChange(next);
    }
  };

  const handleDeletePoint = (pIdx: number) => {
    if (localPoints.length <= 2) {
      toast.warning(t('ui.needAtLeastTwoPoints'));
      return;
    }
    const next = localPoints.filter((_, i) => i !== pIdx);
    setLocalPoints(next);
    onChange(next);
  };

  const handleAddPoint = () => {
    const last = localPoints[localPoints.length - 1] || [0, 0, 0, 0, 2, 3];
    const first = localPoints[0] || [0, 0, 0, 0, 2, 3];
    const span = Math.max(0.1, last[0]! - first[0]!);
    let step = 500;
    if (span <= 1.5) step = 0.2;
    else if (span <= 10) step = 1.0;
    else if (span <= 100) step = 10.0;

    const newX = span <= 1.5 ? Number((last[0]! + step).toFixed(2)) : Math.round(last[0]! + step);
    const next = [...localPoints, [newX, Number(last[1]!.toFixed(2)), 0, 0, 2, 3]].sort(
      (a, b) => a[0]! - b[0]!
    );
    setLocalPoints(next);
    onChange(next);
  };

  return (
    <div className="space-y-2 border border-gray-200 dark:border-gray-800 p-2.5 rounded">
      {/* Presets Toolbar */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          {t('curveEditor.title')}
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => handleApplyPreset('linear')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded cursor-pointer"
          >
            {t('curveEditor.presetLinear')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('smooth')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded cursor-pointer"
          >
            {t('curveEditor.presetSmooth')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('fade_in')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded cursor-pointer"
          >
            {t('curveEditor.presetFadeIn')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('fade_out')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded cursor-pointer"
          >
            {t('curveEditor.presetFadeOut')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('flat')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded cursor-pointer"
          >
            {t('curveEditor.presetFlat')}
          </button>
        </div>
      </div>

      {/* Canvas Wrap */}
      <div className="relative w-full h-36 border border-gray-200 dark:border-gray-800 rounded bg-white dark:bg-gray-950 overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block touch-none select-none" />
      </div>

      {/* Axis Indicator */}
      <div
        className="w-full text-[11px] font-mono text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2 py-0.5 select-none truncate"
        title={`${axisInfo.descX} | ${axisInfo.descY}`}
      >
        <span>
          <strong className="font-bold text-gray-900 dark:text-gray-100">X</strong> {axisInfo.x}
        </span>
        <span className="text-gray-300 dark:text-gray-700">|</span>
        <span>
          <strong className="font-bold text-gray-900 dark:text-gray-100">Y</strong> {axisInfo.y}
        </span>
      </div>

      {/* Table Container */}
      <div className="max-h-40 overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-gray-800 rounded">
        <table className="curve-table w-full table-fixed">
          <thead>
            <tr>
              <th style={{ width: '18%' }}>{t('curveEditor.tableX')}</th>
              <th style={{ width: '16%' }}>{t('curveEditor.tableY')}</th>
              <th style={{ width: '17%' }}>{t('curveEditor.tableSlopeLeft')}</th>
              <th style={{ width: '17%' }}>{t('curveEditor.tableSlopeRight')}</th>
              <th style={{ width: '13%' }}>{t('curveEditor.tableModeLeft')}</th>
              <th style={{ width: '13%' }}>{t('curveEditor.tableModeRight')}</th>
              <th style={{ width: '6%' }}></th>
            </tr>
          </thead>
          <tbody>
            {localPoints.map((pt, pIdx) => (
              <tr key={pIdx}>
                <td>
                  <input
                    type="number"
                    step="0.05"
                    value={pt[0]}
                    onChange={(e) => handleCellChange(pIdx, 0, parseFloat(e.target.value) || 0)}
                    className="curve-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.05"
                    value={pt[1]}
                    onChange={(e) => handleCellChange(pIdx, 1, parseFloat(e.target.value) || 0)}
                    className="curve-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.001"
                    value={pt[2]}
                    onChange={(e) => handleCellChange(pIdx, 2, parseFloat(e.target.value) || 0)}
                    className="curve-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.001"
                    value={pt[3]}
                    onChange={(e) => handleCellChange(pIdx, 3, parseFloat(e.target.value) || 0)}
                    className="curve-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="4"
                    value={pt[4]}
                    onChange={(e) => handleCellChange(pIdx, 4, parseInt(e.target.value, 10) || 0)}
                    className="curve-cell-input"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="4"
                    value={pt[5]}
                    onChange={(e) => handleCellChange(pIdx, 5, parseInt(e.target.value, 10) || 0)}
                    className="curve-cell-input"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => handleDeletePoint(pIdx)}
                    aria-label={`Delete point ${pIdx + 1}`}
                    className="px-1 text-gray-400 hover:text-red-500 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Point Button */}
      <button
        type="button"
        onClick={handleAddPoint}
        className="mt-1 px-2.5 py-1 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded text-[11px] font-medium transition-colors cursor-pointer"
      >
        {t('curveEditor.addPoint')}
      </button>
    </div>
  );
};
