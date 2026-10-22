import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSoundEventStore } from '@/store/useSoundEventStore';
import { useEditorStore } from '@/store/useEditorStore';
import { SPECS, DEFAULTS } from '@/domain/schema/specs';
import { MIN_MAX_MAP, LINKED_PAIR_MAP, TOGGLE_DEPENDENTS, CHILD_TO_PARENT_MAP } from '@/domain/schema/dependencies';
import { FloatSliderControl } from './controls/FloatSliderControl';
import { BoolToggleControl } from './controls/BoolToggleControl';
import { TypeSelectControl } from './controls/TypeSelectControl';
import { ComboboxControl } from './controls/ComboboxControl';
import { VectorControl } from './controls/VectorControl';
import { ArrayInputControl } from './controls/ArrayInputControl';
import { CurveEditorControl } from './controls/CurveEditorControl';
import { VsndWeightsControl } from './controls/VsndWeightsControl';

interface PropertyRowProps {
  propKey: string;
}

export const PropertyRow: React.FC<PropertyRowProps> = React.memo(({ propKey }) => {
  const { t } = useTranslation();
  const spec = SPECS[propKey];
  const isEnabled = useSoundEventStore((s) => s.enabledProperties.has(propKey));
  const rawValue = useSoundEventStore((s) => s.propertyValues[propKey]);
  const fieldDiagnostic = useEditorStore((s) =>
    s.diagnostics.find((d) => d.propertyKey === propKey || d.params?.key === propKey)
  );
  const setPropertyEnabled = useSoundEventStore((s) => s.setPropertyEnabled);
  const setPropertyValue = useSoundEventStore((s) => s.setPropertyValue);

  if (!spec) return null;

  const fieldErrorMsg = fieldDiagnostic
    ? String(
        t(`errors.${fieldDiagnostic.code}` as any, {
          line: fieldDiagnostic.line,
          ...fieldDiagnostic.params,
        })
      )
    : null;

  const value =
    rawValue !== undefined
      ? rawValue
      : DEFAULTS[propKey] !== undefined
      ? DEFAULTS[propKey]
      : spec.kind === 'base' || spec.kind === 'string'
      ? ''
      : spec.kind === 'vsnd_weights'
      ? [0.8, 0.2]
      : 0;
  const pairInfo = MIN_MAX_MAP.get(propKey);
  const linkedPartner = LINKED_PAIR_MAP.get(propKey);
  const children = TOGGLE_DEPENDENTS[propKey];
  const parentKey = CHILD_TO_PARENT_MAP.get(propKey);

  const label = String(t(`labels.${propKey}`) || propKey);
  const desc = String(t(`tooltips.${propKey}`) || '');

  const handleToggle = (checked: boolean) => {
    setPropertyEnabled(propKey, checked);
  };

  const handleValueChange = (newVal: any) => {
    setPropertyValue(propKey, newVal);
  };

  const renderControl = () => {
    switch (spec.kind) {
      case 'float':
        return (
          <FloatSliderControl
            propKey={propKey}
            spec={spec}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'bool':
      case 'string_bool':
      case 'float_bool':
      case 'int_bool':
        return (
          <BoolToggleControl
            kind={spec.kind}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'type_select':
        return (
          <TypeSelectControl
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'select':
      case 'combobox':
        return (
          <ComboboxControl
            propKey={propKey}
            spec={spec}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'vsnd_weights':
        return (
          <VsndWeightsControl
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'vector2':
        return (
          <VectorControl
            dim={2}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'vector3':
        return (
          <VectorControl
            dim={3}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'array_string':
      case 'array_float':
        return (
          <ArrayInputControl
            kind={spec.kind}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'curve':
        return (
          <CurveEditorControl
            propKey={propKey}
            value={value}
            onChange={handleValueChange}
          />
        );
      case 'base':
      case 'string':
        return (
          <input
            type="text"
            value={value !== undefined ? String(value) : ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder={propKey === 'base' ? t('ui.basePlaceholder') : ''}
            className="w-full px-2.5 py-1.5 bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm font-mono text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white transition-colors placeholder:text-gray-400"
          />
        );
      case 'files':
        return (
          <input
            type="text"
            value={Array.isArray(value) ? value.join(', ') : String(value || '')}
            onChange={(e) => {
              const val = e.target.value;
              handleValueChange(val.includes(',') ? val.split(',').map((s) => s.trim()) : val);
            }}
            placeholder="sounds/..."
            className="w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm font-mono text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white placeholder:text-gray-400"
          />
        );
      default:
        return (
          <input
            type="text"
            value={value !== undefined ? value : ''}
            onChange={(e) => handleValueChange(e.target.value)}
            className="w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-800 rounded-sm font-mono text-xs text-gray-900 dark:text-gray-100 outline-hidden focus:border-black dark:focus:border-white placeholder:text-gray-400"
          />
        );
    }
  };

  return (
    <div
      className={`prop-row ${isEnabled ? 'enabled' : ''} ${
        fieldDiagnostic ? 'border-red-500/50 dark:border-red-500/50 bg-red-50/20 dark:bg-red-950/20' : ''
      }`}
    >
      {/* Top Header: Checkbox, Label, Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 flex-1 min-w-0">
          <input
            id={`prop-toggle-${propKey}`}
            type="checkbox"
            checked={isEnabled}
            onChange={(e) => handleToggle(e.target.checked)}
            className="custom-checkbox mt-0.5"
            aria-label={`${label} (${propKey})`}
          />
          <div className="flex-1 min-w-0 leading-tight">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <label
                htmlFor={`prop-toggle-${propKey}`}
                className="text-xs font-medium text-gray-900 dark:text-gray-100 cursor-pointer select-none"
              >
                {label}
              </label>
              <span className="text-[11px] font-mono text-gray-400 select-all">
                {propKey}
              </span>
              {fieldDiagnostic && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 select-none animate-pulse">
                  ⚠ ERROR
                </span>
              )}
              {pairInfo && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 select-none cursor-help"
                  title={t('badges.linked', { partner: pairInfo.partner })}
                >
                  ⇄ {pairInfo.role.toUpperCase()}
                </span>
              )}
              {linkedPartner && !pairInfo && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 select-none cursor-help"
                  title={t('badges.linked', { partner: linkedPartner })}
                >
                  ⇄ LINKED
                </span>
              )}
              {children && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 select-none cursor-help"
                  title={t('badges.parentToggle')}
                >
                  ↱ PARENT
                </span>
              )}
              {parentKey && (
                <span
                  className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 select-none cursor-help"
                  title={t('badges.childOf', { parent: parentKey })}
                >
                  ↳ SUB
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Description Tooltip */}
      {desc && desc !== `tooltips.${propKey}` && (
        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 pl-6 leading-normal">
          {desc}
        </div>
      )}

      {/* Control Input */}
      <div className="mt-2 pl-6">
        {renderControl()}
        {fieldErrorMsg && (
          <div className="mt-1.5 text-[11px] text-red-600 dark:text-red-400 font-mono flex items-start gap-1.5 break-words [overflow-wrap:anywhere] leading-snug">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1 animate-pulse" />
            <span>{fieldErrorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
});

PropertyRow.displayName = 'PropertyRow';
