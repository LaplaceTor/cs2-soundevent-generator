import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { CURVE_PRESETS, generateCurveFromEndpoints, roundFloat } from '@/domain/curve/math';
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

  const handleCellChange = (pIdx: number, cIdx: number, val: string) => {
    const next = localPoints.map((row, i) => (i === pIdx ? [...row] : row));
    if (next[pIdx]) {
      const parsed = parseFloat(val);
      next[pIdx]![cIdx] = isNaN(parsed) ? (val as any) : parsed;
      setLocalPoints(next);
      if (!isNaN(parsed)) {
        onChange(next);
      }
    }
  };

  const handleCellBlur = (cIdx: number) => {
    let next = localPoints.map((row) =>
      row.map((cell) => {
        const num = typeof cell === 'number' ? cell : parseFloat(String(cell));
        return isNaN(num) ? 0 : num;
      })
    );
    if (cIdx === 0) {
      next = next.sort((a, b) => a[0]! - b[0]!);
    }
    setLocalPoints(next);
    onChange(next);
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

    const newX = roundFloat(last[0]! + step, 2);
    const newY = roundFloat(last[1]!, 2);
    const next = [...localPoints, [newX, newY, 0, 0, 2, 3]].sort(
      (a, b) => a[0]! - b[0]!
    );
    setLocalPoints(next);
    onChange(next);
  };

  return (
    <div className="space-y-2 border border-gray-200 dark:border-gray-800 p-2.5 rounded-sm">
      {/* Presets Toolbar */}
      <div className="flex items-center justify-between gap-1 flex-wrap">
        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
          {t('curveEditor.title')}
        </span>
        <div className="flex items-center gap-1 text-[10px]">
          <button
            type="button"
            onClick={() => handleApplyPreset('linear')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm cursor-pointer"
          >
            {t('curveEditor.presetLinear')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('smooth')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm cursor-pointer"
          >
            {t('curveEditor.presetSmooth')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('fade_in')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm cursor-pointer"
          >
            {t('curveEditor.presetFadeIn')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('fade_out')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm cursor-pointer"
          >
            {t('curveEditor.presetFadeOut')}
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('flat')}
            className="px-1.5 py-0.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm cursor-pointer"
          >
            {t('curveEditor.presetFlat')}
          </button>
        </div>
      </div>

      {/* Canvas Wrap */}
      <div className="relative w-full h-36 border border-gray-200 dark:border-gray-800 rounded-sm bg-white dark:bg-gray-950 overflow-hidden">
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
      <div className="max-h-40 overflow-y-auto overflow-x-hidden border border-gray-200 dark:border-gray-800 rounded-sm">
        <table className="curve-table w-full table-fixed">
          <thead>
            <tr>
              <th style={{ width: '16%' }} title={axisInfo.descX || 'X'}>{t('curveEditor.tableX')}</th>
              <th style={{ width: '15%' }} title={axisInfo.descY || 'Y'}>{t('curveEditor.tableY')}</th>
              <th style={{ width: '16%' }} title="Slope Left">{t('curveEditor.tableSlopeLeft')}</th>
              <th style={{ width: '16%' }} title="Slope Right">{t('curveEditor.tableSlopeRight')}</th>
              <th style={{ width: '14%' }} title="Mode Left">{t('curveEditor.tableModeLeft')}</th>
              <th style={{ width: '14%' }} title="Mode Right">{t('curveEditor.tableModeRight')}</th>
              <th style={{ width: '9%' }}></th>
            </tr>
          </thead>
          <tbody>
            {localPoints.map((pt, pIdx) => (
              <tr key={pIdx}>
                <td>
                  <input
                    type="number"
                    step="any"
                    value={pt[0]}
                    onChange={(e) => handleCellChange(pIdx, 0, e.target.value)}
                    onBlur={() => handleCellBlur(0)}
                    className="curve-cell-input"
                    aria-label={`Point ${pIdx + 1} X`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="any"
                    value={pt[1]}
                    onChange={(e) => handleCellChange(pIdx, 1, e.target.value)}
                    onBlur={() => handleCellBlur(1)}
                    className="curve-cell-input"
                    aria-label={`Point ${pIdx + 1} Y`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="any"
                    value={pt[2]}
                    onChange={(e) => handleCellChange(pIdx, 2, e.target.value)}
                    onBlur={() => handleCellBlur(2)}
                    className="curve-cell-input"
                    aria-label={`Point ${pIdx + 1} Slope Left`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="any"
                    value={pt[3]}
                    onChange={(e) => handleCellChange(pIdx, 3, e.target.value)}
                    onBlur={() => handleCellBlur(3)}
                    className="curve-cell-input"
                    aria-label={`Point ${pIdx + 1} Slope Right`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="4"
                    value={pt[4]}
                    onChange={(e) => handleCellChange(pIdx, 4, e.target.value)}
                    onBlur={() => handleCellBlur(4)}
                    className="curve-cell-input"
                    aria-label={`Point ${pIdx + 1} Mode Left`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="4"
                    value={pt[5]}
                    onChange={(e) => handleCellChange(pIdx, 5, e.target.value)}
                    onBlur={() => handleCellBlur(5)}
                    className="curve-cell-input"
                    aria-label={`Point ${pIdx + 1} Mode Right`}
                  />
                </td>
                <td className="p-0">
                  <button
                    type="button"
                    onClick={() => handleDeletePoint(pIdx)}
                    aria-label={`Delete point ${pIdx + 1}`}
                    title={t('curveEditor.delPoint')}
                    className="w-5 h-5 mx-auto flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 font-bold cursor-pointer rounded-sm transition-colors active:scale-95 text-xs"
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
        className="mt-1 px-3 py-1.5 border border-gray-200 dark:border-gray-800 hover:border-black dark:hover:border-white rounded-sm text-[11px] font-medium transition-colors cursor-pointer active:scale-98"
      >
        {t('curveEditor.addPoint')}
      </button>
    </div>
  );
};
