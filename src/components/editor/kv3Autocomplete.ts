import {
  type CompletionContext,
  type CompletionResult,
  autocompletion,
} from '@codemirror/autocomplete';
import { SPECS } from '@/domain/schema/specs';
import { CURVE_PRESETS } from '@/domain/curve/math';
import i18n from '@/i18n';

function kv3Completions(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/[a-zA-Z0-9_.]*/);
  if (!word || (word.from === word.to && !context.explicit)) return null;

  const line = context.state.doc.lineAt(context.pos).text;
  const beforeCursor = line.slice(0, context.pos - context.state.doc.lineAt(context.pos).from);

  // If inside comment, skip
  if (beforeCursor.trim().startsWith('//') || beforeCursor.trim().startsWith('<!--')) {
    return null;
  }

  const eqIdx = beforeCursor.indexOf('=');

  // Value completion after '='
  if (eqIdx !== -1) {
    const keyPart = beforeCursor.slice(0, eqIdx).trim().replace(/^["']|["']$/g, '');
    const options: any[] = [];

    const spec = SPECS[keyPart];

    if (spec?.options?.objects) {
      const detail =
        keyPart === 'type'
          ? 'SoundEvent Type'
          : keyPart === 'mixgroup'
          ? 'Mixgroup'
          : keyPart === 'dsp_preset'
          ? 'DSP Preset'
          : keyPart === 'vsnd_selection_type'
          ? 'Selection Type'
          : keyPart;
      spec.options.objects.forEach((obj) => {
        options.push({
          label: `"${obj}"`,
          type: keyPart === 'type' ? 'type' : 'keyword',
          detail,
        });
      });
    } else if (spec?.kind === 'bool' || spec?.kind === 'string_bool') {
      options.push({ label: 'true', type: 'atom' }, { label: 'false', type: 'atom' });
    } else if (spec?.kind === 'float_bool') {
      options.push({ label: '1.0', type: 'number' }, { label: '0.0', type: 'number' });
    } else if (spec?.kind === 'int_bool') {
      options.push({ label: '1', type: 'number' }, { label: '0', type: 'number' });
    } else if (spec?.kind === 'curve') {
      Object.entries(CURVE_PRESETS).forEach(([pk, pts]) => {
        const formatted = pts.map((p) => `\t\t[ ${p.join(', ')} ],`).join('\n');
        options.push({
          label: `preset_${pk}`,
          detail: `Curve: ${pk}`,
          apply: `[\n${formatted}\n\t]`,
        });
      });
    }

    return {
      from: word.from,
      options,
    };
  }

  // Property key completion
  const propOptions = Object.keys(SPECS).map((key) => {
    const spec = SPECS[key]!;
    const label = String(i18n.t(`labels.${key}`) || key);
    let insertText = `${key} = `;
    if (spec.kind === 'float') insertText += '1.0';
    else if (spec.kind === 'bool' || spec.kind === 'string_bool') insertText += 'true';
    else if (spec.kind === 'files') insertText += '[\n\t\t"sounds/custom/new_sound.vsnd",\n\t]';
    else if (spec.kind === 'vector3') insertText += '[ 0.0, 0.0, 0.0 ]';
    else if (spec.kind === 'vsnd_weights') insertText += '[ 0.8, 0.2 ]';
    else if (spec.kind === 'select' && spec.options?.objects?.[0]) insertText += `"${spec.options.objects[0]}"`;
    else insertText += '""';

    return {
      label: key,
      type: 'property',
      detail: label,
      apply: insertText,
    };
  });

  return {
    from: word.from,
    options: propOptions,
  };
}

export const kv3AutocompleteExtension = autocompletion({
  override: [kv3Completions],
});
