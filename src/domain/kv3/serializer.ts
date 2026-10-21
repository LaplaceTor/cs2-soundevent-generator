import { SPECS, type PropertySpec } from '../schema/specs';

export const KV3_HEADER =
  '<!-- kv3 encoding:text:version{e21c7f3c-8a33-41c5-9977-a76d3a32aa0d} format:generic:version{7412167c-06e9-4698-aff2-e63eb59037e7} -->';

export function normalizeVsndPath(pathStr: string): string {
  if (!pathStr) return '';
  let p = pathStr.trim().replace(/\\/g, '/');
  p = p.replace(/^["']+|["']+$/g, '');
  p = p.replace(/"/g, '').replace(/[\r\n]/g, '');
  const dotIdx = p.lastIndexOf('.');
  if (dotIdx !== -1) {
    p = p.substring(0, dotIdx) + '.vsnd';
  } else {
    p += '.vsnd';
  }
  return p;
}

export function escapeKv3String(str: any): string {
  return String(str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '')
    .replace(/\n/g, '\\n');
}

export function formatKv3Value(key: string, val: any, spec?: PropertySpec): string {
  const kind = spec?.kind ?? 'unknown';

  if (kind === 'base' || kind === 'string' || key === 'base') {
    return `"${escapeKv3String(val)}"`;
  }

  if (kind === 'string_bool') {
    return typeof val === 'boolean' ? (val ? '"true"' : '"false"') : val ? `"${val}"` : '"false"';
  }

  if (kind === 'float_bool') {
    const isTrue = val === true || val === 1 || val === 1.0 || val === '1.0' || val === '1' || val === 'true';
    return isTrue ? '1.0' : '0.0';
  }

  if (kind === 'int_bool') {
    const isTrue = val === true || val === 1 || val === 1.0 || val === '1' || val === 'true';
    return isTrue ? '1' : '0';
  }

  if (kind === 'bool') {
    return Boolean(val) ? 'true' : 'false';
  }

  if (kind === 'float') {
    const num = Number(val);
    if (isNaN(num)) return '0.0';
    let str = num.toString();
    if (!str.includes('.')) str += '.0';
    return str;
  }

  if (kind === 'vector3') {
    if (Array.isArray(val)) {
      const formatted = val.map((n) => {
        const num = Number(n) || 0;
        const s = num.toString();
        return s.includes('.') ? s : s + '.0';
      });
      return `[ ${formatted.join(', ')} ]`;
    }
    return `[ 0.0, 0.0, 0.0 ]`;
  }

  if (kind === 'vector2' || kind === 'vsnd_weights') {
    if (Array.isArray(val)) {
      const formatted = val.map((n) => {
        const num = Number(n) || 0;
        const s = num.toString();
        return s.includes('.') ? s : s + '.0';
      });
      return `[ ${formatted.join(', ')} ]`;
    }
    return `[ 0.8, 0.2 ]`;
  }

  if (kind === 'array_string') {
    if (Array.isArray(val)) {
      const items = val.map((s) => `\t\t\t"${escapeKv3String(s)}",`);
      if (items.length === 0) return '[ ]';
      return `[\n${items.join('\n')}\n\t\t]`;
    }
    return `[ "${escapeKv3String(val)}" ]`;
  }

  if (kind === 'array_float') {
    if (Array.isArray(val)) {
      const formatted = val.map((n) => {
        const num = Number(n) || 0;
        const s = num.toString();
        return s.includes('.') ? s : s + '.0';
      });
      if (formatted.length === 0) return '[ ]';
      return `[ ${formatted.join(', ')} ]`;
    }
    return '[ ]';
  }

  if (kind === 'files' || key === 'vsnd_files_track_01') {
    if (Array.isArray(val)) {
      const items = val.map((f) => `\t\t\t"${normalizeVsndPath(f)}",`);
      if (items.length === 0) return '[ ]';
      return `[\n${items.join('\n')}\n\t\t]`;
    }
    if (typeof val === 'string' && val.trim()) {
      return `[\n\t\t\t"${normalizeVsndPath(val)}",\n\t\t]`;
    }
    return '[ ]';
  }

  if (kind === 'curve' || Array.isArray(val)) {
    if (Array.isArray(val) && val.length > 0 && Array.isArray(val[0])) {
      const rows = val.map((row) => {
        const rowStr = row
          .map((n: any, idx: number) => {
            const num = Number(n) || 0;
            if (idx >= 4) return num.toFixed(1);
            const s = num.toString();
            return s.includes('.') ? s : s + '.0';
          })
          .join(', ');
        return `\t\t\t[ ${rowStr} ],`;
      });
      return `[\n${rows.join('\n')}\n\t\t]`;
    }
    if (Array.isArray(val)) {
      return `[ ${val.join(', ')} ]`;
    }
  }

  if (typeof val === 'number') {
    const str = val.toString();
    return str.includes('.') ? str : str + '.0';
  }

  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }

  // String
  return `"${escapeKv3String(val)}"`;
}

export interface SerializeOptions {
  includeComments?: boolean;
  commentLookup?: (key: string) => string | undefined;
  customProperties?: Record<string, any>;
}

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export function serializeSoundEvent(
  eventName: string,
  properties: Record<string, any>,
  options: SerializeOptions = {}
): string {
  const { includeComments = false, commentLookup, customProperties = {} } = options;
  const rawName = (eventName || 'SoundEvent_Custom').trim() || 'SoundEvent_Custom';
  const validName = rawName.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/[\r\n]/g, '');

  const lines: string[] = [];
  lines.push(`"${validName}" =`);
  lines.push(`{`);

  // Combine standard and preserved custom properties
  const allProps: Record<string, any> = { ...properties, ...customProperties };

  for (const [key, val] of Object.entries(allProps)) {
    if (DANGEROUS_KEYS.has(key)) continue;
    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '');
    if (!safeKey) continue;

    const spec = SPECS[safeKey];

    if (includeComments && commentLookup) {
      const commentDesc = commentLookup(safeKey);
      if (commentDesc) {
        // Strip line breaks to prevent comment breaking out into code injection
        const safeComment = commentDesc.replace(/[\r\n]+/g, ' ');
        lines.push(`\t// ${safeComment}`);
      }
    }

    const formattedVal = formatKv3Value(safeKey, val, spec);
    lines.push(`\t${safeKey} = ${formattedVal}`);
  }

  lines.push('}');
  return lines.join('\n');
}
