import { z } from 'zod';
import { SPECS, typeNeedsValue } from './specs';
import {
  MIN_MAX_PAIRS,
  CHILD_TO_PARENT_MAP,
  isParentActive,
} from './dependencies';

export { isParentActive };
import type { Kv3Diagnostic, Kv3SoundEventDocument, PropertyLocation } from '../kv3/types';

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

export const SafeKeySchema = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9_]+$/, 'Property key can only contain alphanumeric characters and underscores')
  .refine((key) => !DANGEROUS_KEYS.has(key), {
    message: 'Illegal or dangerous prototype property key detected',
  });

export const SafeEventNameSchema = z
  .string()
  .trim()
  .min(1, 'Event name cannot be empty')
  .max(128, 'Event name cannot exceed 128 characters')
  .refine((name) => !/[\r\n\x00-\x1f]/.test(name), {
    message: 'Event name cannot contain line breaks or control characters',
  })
  .default('SoundEvent_Custom.3D');

export const Kv3PrimitiveOrArraySchema = z.union([
  z.string().max(1024),
  z.number().finite(),
  z.boolean(),
  z.array(
    z.union([
      z.string().max(512),
      z.number().finite(),
      z.array(z.number().finite()).max(8),
    ])
  ).max(128),
]);

export const SoundEventSharePayloadSchema = z.object({
  n: SafeEventNameSchema,
  p: z.record(SafeKeySchema, Kv3PrimitiveOrArraySchema).default({}),
});

export type SoundEventSharePayload = z.infer<typeof SoundEventSharePayloadSchema>;

export interface ValidationResult {
  isValid: boolean;
  diagnostics: Kv3Diagnostic[];
  fieldErrors: Record<string, string>;
  normalizedProperties?: Record<string, any>;
}

/**
 * Validate a single property against SPECS.
 */
export function validateSingleProperty(
  key: string,
  val: any,
  loc?: PropertyLocation
): { isValid: boolean; diagnostic?: Kv3Diagnostic } {
  const line = loc?.valueLine ?? loc?.line ?? 1;
  const column = loc?.valueColumn ?? loc?.column ?? 1;

  if (DANGEROUS_KEYS.has(key) || !/^[a-zA-Z0-9_]+$/.test(key)) {
    return {
      isValid: false,
      diagnostic: {
        code: 'INVALID_KEY_NAME',
        line,
        column,
        params: { key },
        propertyKey: key,
        stage: 'validation',
      },
    };
  }

  const spec = SPECS[key];
  if (!spec) {
    // Custom/unrecognized property: ensure not function or dangerous object
    if (typeof val === 'function' || typeof val === 'symbol') {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'serializable value', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  const kind = spec.kind;

  // 1. Float property (Strictly finite number, no strings)
  if (kind === 'float') {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_PROPERTY_NUMBER',
          line,
          column,
          params: { key, actual: String(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }

    if (spec.options?.only_positive && val < 0) {
      return {
        isValid: false,
        diagnostic: {
          code: 'VALUE_OUT_OF_RANGE',
          line,
          column,
          params: { key, range: '>= 0', actual: val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }

    if (spec.options?.disable_sentinel !== undefined && val < 0 && val !== spec.options.disable_sentinel) {
      return {
        isValid: false,
        diagnostic: {
          code: 'VALUE_OUT_OF_RANGE',
          line,
          column,
          params: { key, range: `>= 0 or ${spec.options.disable_sentinel}`, actual: val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }

    return { isValid: true };
  }

  // 2. Bool and String Bool (Strict boolean only, no strings)
  if (kind === 'bool' || kind === 'string_bool') {
    if (typeof val !== 'boolean') {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_BOOLEAN',
          line,
          column,
          params: { key, actual: String(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 3. Float Bool (Strictly 1.0 / 0.0 or boolean, no strings)
  if (kind === 'float_bool') {
    const isFloatBool =
      val === 1.0 ||
      val === 0.0 ||
      val === 1 ||
      val === 0 ||
      typeof val === 'boolean';
    if (!isFloatBool) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_BOOLEAN',
          line,
          column,
          params: { key, actual: String(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 4. Int Bool (Strictly integer 1 or 0 or boolean, no strings or fractional floats)
  if (kind === 'int_bool') {
    const isIntBool =
      (typeof val === 'number' && Number.isInteger(val) && (val === 1 || val === 0)) ||
      typeof val === 'boolean';
    if (!isIntBool) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_BOOLEAN',
          line,
          column,
          params: { key, actual: String(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 5. Vector2
  if (kind === 'vector2') {
    if (!Array.isArray(val) || val.length !== 2) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_VECTOR_DIMENSION',
          line,
          column,
          params: { key, expected: 2, actual: Array.isArray(val) ? val.length : typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    const allNums = val.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n));
    if (!allNums) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_PROPERTY_NUMBER',
          line,
          column,
          params: { key, actual: JSON.stringify(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 6. Vector3
  if (kind === 'vector3') {
    if (!Array.isArray(val) || val.length !== 3) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_VECTOR_DIMENSION',
          line,
          column,
          params: { key, expected: 3, actual: Array.isArray(val) ? val.length : typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    const allNums = val.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n));
    if (!allNums) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_PROPERTY_NUMBER',
          line,
          column,
          params: { key, actual: JSON.stringify(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 7. Vsnd Weights
  if (kind === 'vsnd_weights') {
    if (!Array.isArray(val) || val.length < 2) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_WEIGHTS_DIMENSION',
          line,
          column,
          params: { key, actual: Array.isArray(val) ? val.length : typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    const allValid = val.every(
      (n) => typeof n === 'number' && !isNaN(n) && isFinite(n) && n >= 0
    );
    if (!allValid) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_PROPERTY_NUMBER',
          line,
          column,
          params: { key, actual: JSON.stringify(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 8. Curve
  if (kind === 'curve') {
    if (!Array.isArray(val) || val.length < 2) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_CURVE_FORMAT',
          line,
          column,
          params: { key, actual: Array.isArray(val) ? `${val.length} points` : typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    const allRowsValid = val.every(
      (row) =>
        Array.isArray(row) &&
        row.length >= 2 &&
        row.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n))
    );
    if (!allRowsValid) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_CURVE_FORMAT',
          line,
          column,
          params: { key, actual: 'invalid control points' },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 9. Array String
  if (kind === 'array_string') {
    if (!Array.isArray(val) && typeof val !== 'string') {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'string or string array', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    if (Array.isArray(val) && !val.every((s) => typeof s === 'string')) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'array of strings', actual: 'contains non-string elements' },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 10. Array Float
  if (kind === 'array_float') {
    if (!Array.isArray(val)) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'array of numbers', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    if (!val.every((n) => typeof n === 'number' && !isNaN(n) && isFinite(n))) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_PROPERTY_NUMBER',
          line,
          column,
          params: { key, actual: JSON.stringify(val) },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 11. Files
  if (kind === 'files') {
    if (typeof val !== 'string' && !Array.isArray(val)) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'string or array of strings', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    if (Array.isArray(val) && !val.every((s) => typeof s === 'string')) {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'array of file paths', actual: 'contains non-string elements' },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 12. String / Base
  if (kind === 'string' || kind === 'base') {
    if (typeof val !== 'string') {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'string', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 13. Type Select
  if (kind === 'type_select') {
    if (typeof val !== 'string') {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'string', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    const isAllowed = (spec.options?.objects && spec.options.objects.includes(val)) || typeNeedsValue(val);
    if (!isAllowed) {
      return {
        isValid: false,
        diagnostic: {
          code: 'UNSUPPORTED_PROPERTY_VALUE',
          line,
          column,
          params: {
            key,
            actual: val,
            allowed: spec.options?.objects ? spec.options.objects.slice(0, 4).join(', ') + '...' : 'standard sound event types',
          },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  // 14. Select
  if (kind === 'select') {
    if (typeof val !== 'string') {
      return {
        isValid: false,
        diagnostic: {
          code: 'INVALID_TYPE',
          line,
          column,
          params: { key, expected: 'string', actual: typeof val },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    if (spec.options?.objects && !spec.options.objects.includes(val)) {
      return {
        isValid: false,
        diagnostic: {
          code: 'UNSUPPORTED_PROPERTY_VALUE',
          line,
          column,
          params: { key, actual: val, allowed: spec.options.objects.join(', ') },
          propertyKey: key,
          stage: 'validation',
        },
      };
    }
    return { isValid: true };
  }

  return { isValid: true };
}

/**
 * Validates properties and dependencies.
 */
export function validateSoundEventProperties(
  properties: Record<string, any>,
  locations: Record<string, PropertyLocation> = {}
): ValidationResult {
  const diagnostics: Kv3Diagnostic[] = [];
  const fieldErrors: Record<string, string> = {};
  const normalizedProperties: Record<string, any> = {};

  // 1. Validate each individual property
  for (const [key, val] of Object.entries(properties)) {
    const loc = locations[key];
    const { isValid, diagnostic } = validateSingleProperty(key, val, loc);
    if (!isValid && diagnostic) {
      diagnostics.push(diagnostic);
      fieldErrors[key] = diagnostic.code;
    } else {
      // Normalize values if valid
      const spec = SPECS[key];
      if (spec) {
        if (spec.kind === 'float_bool') {
          const isTrue =
            typeof val === 'number'
              ? val > 0
              : val === true || val === '1' || val === '1.0' || val === 'true';
          normalizedProperties[key] = isTrue ? 1.0 : 0.0;
        } else if (spec.kind === 'int_bool') {
          const isTrue =
            typeof val === 'number'
              ? val > 0
              : val === true || val === '1' || val === '1.0' || val === 'true';
          normalizedProperties[key] = isTrue ? 1 : 0;
        } else if (spec.kind === 'bool' || spec.kind === 'string_bool') {
          normalizedProperties[key] =
            typeof val === 'string' ? val === 'true' || val === '1' : Boolean(val);
        } else if (spec.kind === 'float') {
          normalizedProperties[key] = Number(val);
        } else {
          normalizedProperties[key] = val;
        }
      } else {
        normalizedProperties[key] = val;
      }
    }
  }

  // 2. Validate Min/Max Pairs (min <= max)
  for (const [minKey, maxKey] of MIN_MAX_PAIRS) {
    if (minKey in properties && maxKey in properties) {
      const minVal = Number(properties[minKey]);
      const maxVal = Number(properties[maxKey]);
      if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        const loc = locations[minKey] ?? { line: 1, column: 1 };
        const diag: Kv3Diagnostic = {
          code: 'INVALID_MIN_MAX_PAIR',
          line: loc.line,
          column: loc.column,
          params: { minKey, maxKey, minVal, maxVal },
          propertyKey: minKey,
          stage: 'validation',
        };
        diagnostics.push(diag);
        fieldErrors[minKey] = diag.code;
      }
    }
  }

  // 3. Validate Toggle Dependencies (Child requires at least one Parent to be active)
  for (const [childKey, parentKeys] of CHILD_TO_PARENT_MAP.entries()) {
    if (childKey in properties) {
      const hasActiveParent = parentKeys.some((parentKey) =>
        isParentActive(parentKey, properties[parentKey])
      );
      if (!hasActiveParent && parentKeys.length > 0) {
        const primaryParent = parentKeys[0]!;
        const loc = locations[childKey] ?? { line: 1, column: 1 };
        const diag: Kv3Diagnostic = {
          code: 'CHILD_MISSING_PARENT',
          line: loc.line,
          column: loc.column,
          params: { child: childKey, parent: primaryParent },
          propertyKey: childKey,
          stage: 'validation',
        };
        diagnostics.push(diag);
        fieldErrors[childKey] = diag.code;
      }
    }
  }

  // 4. Validate typeNeedsValue
  if ('type' in properties) {
    const typeVal = properties['type'];
    if (typeNeedsValue(typeVal)) {
      if (!('value' in properties) || properties['value'] === undefined || properties['value'] === null) {
        const loc = locations['type'] ?? { line: 1, column: 1 };
        const diag: Kv3Diagnostic = {
          code: 'MISSING_REQUIRED_PROPERTY',
          line: loc.line,
          column: loc.column,
          params: { key: 'value', type: String(typeVal) },
          propertyKey: 'value',
          stage: 'validation',
        };
        diagnostics.push(diag);
        fieldErrors['value'] = diag.code;
      }
    }
  }

  return {
    isValid: diagnostics.length === 0,
    diagnostics,
    fieldErrors,
    normalizedProperties: diagnostics.length === 0 ? normalizedProperties : undefined,
  };
}

/**
 * Validates a parsed KV3 SoundEvent Document.
 */
export function validateSoundEventDocument(doc: Kv3SoundEventDocument): ValidationResult {
  const allProps = { ...doc.properties, ...(doc.customProperties ?? {}) };
  return validateSoundEventProperties(allProps, doc.propertyLocations ?? {});
}
