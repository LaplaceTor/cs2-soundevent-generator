import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { produce, enableMapSet } from 'immer';

enableMapSet();
import { DEFAULTS, SPECS, typeNeedsValue } from '../domain/schema/specs';
import { PRESETS } from '../domain/schema/presets';
import {
  TOGGLE_DEPENDENTS,
  CHILD_TO_PARENT_MAP,
  MIN_MAX_MAP,
  LINKED_PAIR_MAP,
  isParentActive,
} from '../domain/schema/dependencies';
import { serializeSoundEvent } from '../domain/kv3/serializer';
import { parseKv3SoundEventDocument } from '../domain/kv3/parser';
import type { Kv3SoundEventDocument } from '../domain/kv3/types';
import {
  SoundEventSharePayloadSchema,
  Kv3PrimitiveOrArraySchema,
  validateSoundEventDocument,
  validateSingleProperty,
} from '../domain/schema/validation';
import i18n, { loadLanguage } from '../i18n';
import { useEditorStore, registerDocumentSyncHandler, type SyncOrigin } from './useEditorStore';

export interface SoundEventState {
  eventName: string;
  selectedPresetId: string;
  enabledProperties: Set<string>;
  propertyValues: Record<string, any>;
  customProperties: Record<string, any>;
  includeComments: boolean;
  lang: 'zh' | 'en';
  theme: 'dark' | 'light';

  // Actions
  setEventName: (name: string) => void;
  setPropertyEnabled: (key: string, enabled: boolean) => void;
  setPropertyValue: (key: string, val: any) => void;
  applyPreset: (presetId: string) => void;
  setIncludeComments: (include: boolean) => void;
  setLang: (lang: 'zh' | 'en') => void;
  setTheme: (theme: 'dark' | 'light') => void;

  // Syncing with editor & share
  syncFromValidatedDocument: (
    document: Kv3SoundEventDocument,
    normalizedProps?: Record<string, any>
  ) => void;
  formatCurrentCode: () => boolean;
  exportShareHash: () => string | null;
  importShareHash: (hash: string) => boolean;
}

// Helper to ensure parent property is properly activated when a child property is enabled
function activateParentProperty(parentKey: string, values: Record<string, any>) {
  const parentSpec = SPECS[parentKey];
  if (parentSpec) {
    if (parentSpec.kind === 'bool' || parentSpec.kind === 'string_bool') {
      if (!values[parentKey]) {
        values[parentKey] = true;
      }
    } else if (parentSpec.kind === 'float_bool') {
      if (!values[parentKey]) {
        values[parentKey] = 1.0;
      }
    } else if (parentSpec.kind === 'int_bool') {
      if (!values[parentKey]) {
        values[parentKey] = 1;
      }
    } else if (parentKey === 'vsnd_selection_type') {
      if (!values[parentKey] || values[parentKey] === 'random') {
        values[parentKey] = 'random_weighted';
      }
    }
  } else {
    if (!values[parentKey]) {
      values[parentKey] = true;
    }
  }
}

// Helper: strictly enforce min/max pairs and dependencies
export function normalizeDependencies(
  enabled: Set<string>,
  values: Record<string, any>
) {
  // 1. Min/Max Pairs (min <= max)
  for (const key of Array.from(enabled)) {
    const pair = MIN_MAX_MAP.get(key);
    if (pair) {
      enabled.add(pair.partner);
      if (!(pair.partner in values) || values[pair.partner] === undefined) {
        values[pair.partner] = DEFAULTS[pair.partner] ?? 0;
      }
      const minKey = pair.role === 'min' ? key : pair.partner;
      const maxKey = pair.role === 'max' ? key : pair.partner;
      const minVal = Number(values[minKey]);
      const maxVal = Number(values[maxKey]);
      if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        values[maxKey] = minVal;
      }
    }

    // Linked pairs (Enable partner too)
    const linked = LINKED_PAIR_MAP.get(key);
    if (linked) {
      enabled.add(linked);
      if (!(linked in values) || values[linked] === undefined) {
        values[linked] = DEFAULTS[linked] ?? 0;
      }
    }
  }

  // 2. Toggle dependencies
  for (const [parentKey, children] of Object.entries(TOGGLE_DEPENDENTS)) {
    if (enabled.has(parentKey)) {
      const pVal = values[parentKey];
      const isFalsy = !isParentActive(parentKey, pVal);
      if (isFalsy) {
        for (const ck of children) {
          const parents = CHILD_TO_PARENT_MAP.get(ck);
          const hasOtherActiveParent = parents?.some(
            (pk) => pk !== parentKey && enabled.has(pk) && isParentActive(pk, values[pk])
          );
          if (!hasOtherActiveParent) {
            enabled.delete(ck);
            const cPair = MIN_MAX_MAP.get(ck);
            if (cPair) enabled.delete(cPair.partner);
            const cLinked = LINKED_PAIR_MAP.get(ck);
            if (cLinked) enabled.delete(cLinked);
          }
        }
      }
    }
  }

  // 3. If any child is enabled, parent MUST be enabled & active
  for (const key of Array.from(enabled)) {
    const parentKeys = CHILD_TO_PARENT_MAP.get(key);
    if (parentKeys && parentKeys.length > 0) {
      const hasActiveParent = parentKeys.some(
        (pk) => enabled.has(pk) && isParentActive(pk, values[pk])
      );
      if (!hasActiveParent) {
        const primaryParent = parentKeys[0]!;
        enabled.add(primaryParent);
        activateParentProperty(primaryParent, values);
      }
    }
  }

  // 4. Defensive type normalization for enabled properties
  for (const key of Array.from(enabled)) {
    const spec = SPECS[key];
    if (spec) {
      if (spec.kind === 'bool' || spec.kind === 'string_bool') {
        if (typeof values[key] === 'string') {
          values[key] = values[key] === 'true' || values[key] === '1';
        }
      } else if (spec.kind === 'float_bool') {
        if (typeof values[key] === 'string') {
          values[key] = values[key] === 'true' || values[key] === '1' || values[key] === '1.0' ? 1.0 : 0.0;
        }
      } else if (spec.kind === 'int_bool') {
        if (typeof values[key] === 'string') {
          values[key] = values[key] === 'true' || values[key] === '1' ? 1 : 0;
        }
      }
    }
  }
}

function generateCode(
  eventName: string,
  enabled: Set<string>,
  values: Record<string, any>,
  custom: Record<string, any>,
  includeComments: boolean
): string {
  const activeProps: Record<string, any> = {};
  for (const key of enabled) {
    if (key in values) {
      activeProps[key] = values[key];
    }
  }

  return serializeSoundEvent(eventName, activeProps, {
    includeComments,
    customProperties: custom,
    commentLookup: (k) => {
      const t = String(i18n.t(`tooltips.${k}`));
      if (t && t !== `tooltips.${k}`) return t;
      const l = String(i18n.t(`labels.${k}`));
      if (l && l !== `labels.${k}`) return l;
      return undefined;
    },
  });
}

function syncCodeToEditor(
  eventName: string,
  enabled: Set<string>,
  values: Record<string, any>,
  custom: Record<string, any>,
  includeComments: boolean,
  origin: SyncOrigin = 'controls'
) {
  const code = generateCode(eventName, enabled, values, custom, includeComments);
  useEditorStore.getState().setCodeFromControls(code, origin);
  return code;
}

// Debounced and dirty-checked localStorage adapter
function createDebouncedStorage(delayMs = 800): StateStorage {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingKey: string | null = null;
  let pendingValue: string | null = null;
  let lastSavedValue: string | null = null;

  const flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (pendingKey && pendingValue !== null) {
      if (pendingValue !== lastSavedValue) {
        try {
          localStorage.setItem(pendingKey, pendingValue);
          lastSavedValue = pendingValue;
        } catch (e) {
          console.warn('Failed to save to localStorage:', e);
        }
      }
      pendingKey = null;
      pendingValue = null;
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
  }

  return {
    getItem: (name: string): string | null => {
      if (pendingKey === name && pendingValue !== null) {
        return pendingValue;
      }
      const val = localStorage.getItem(name);
      lastSavedValue = val;
      return val;
    },
    setItem: (name: string, value: string): void => {
      pendingKey = name;
      pendingValue = value;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(flush, delayMs);
    },
    removeItem: (name: string): void => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      pendingKey = null;
      pendingValue = null;
      lastSavedValue = null;
      localStorage.removeItem(name);
    },
  };
}

export const useSoundEventStore = create<SoundEventState>()(
  persist(
    (set, get) => ({
      eventName: 'Weapon_Custom.Single',
      selectedPresetId: 'csgo_mega_basic',
      enabledProperties: new Set([
        'type',
        'volume',
        'pitch',
        'mixgroup',
        'reverb_wet',
        'occlusion_intensity',
        'distance_effect_mix',
        'use_distance_volume_mapping_curve',
        'distance_volume_mapping_curve',
        'vsnd_files_track_01',
      ]),
      propertyValues: structuredClone(PRESETS.csgo_mega_basic!.properties),
      customProperties: {},
      includeComments: false,
      lang: 'zh',
      theme: 'dark',

      setEventName: (name) =>
        set(
          produce((state: SoundEventState) => {
            state.eventName = name;
            syncCodeToEditor(
              state.eventName,
              state.enabledProperties,
              state.propertyValues,
              state.customProperties,
              state.includeComments
            );
          })
        ),

      setPropertyEnabled: (key, enabled) =>
        set(
          produce((state: SoundEventState) => {
            if (enabled) {
              state.enabledProperties.add(key);
              if (!(key in state.propertyValues) || state.propertyValues[key] === undefined) {
                state.propertyValues[key] =
                  DEFAULTS[key] !== undefined ? JSON.parse(JSON.stringify(DEFAULTS[key])) : 0;
              }
              if (key === 'base' && typeof state.propertyValues[key] !== 'string') {
                state.propertyValues[key] = '';
              }

              // Parent toggle
              const children = TOGGLE_DEPENDENTS[key];
              if (children) {
                state.propertyValues[key] = true;
                for (const ck of children) {
                  state.enabledProperties.add(ck);
                  if (!(ck in state.propertyValues) || state.propertyValues[ck] === undefined) {
                    state.propertyValues[ck] =
                      DEFAULTS[ck] !== undefined ? JSON.parse(JSON.stringify(DEFAULTS[ck])) : 0;
                  }
                }
              }

              // Child property
              const parentKeys = CHILD_TO_PARENT_MAP.get(key);
              if (parentKeys && parentKeys.length > 0) {
                const hasActiveParent = parentKeys.some(
                  (pk) => state.enabledProperties.has(pk) && isParentActive(pk, state.propertyValues[pk])
                );
                if (!hasActiveParent) {
                  const primaryParent = parentKeys[0]!;
                  state.enabledProperties.add(primaryParent);
                  activateParentProperty(primaryParent, state.propertyValues);
                }
              }

              // Min-Max pair
              const pair = MIN_MAX_MAP.get(key);
              if (pair) {
                state.enabledProperties.add(pair.partner);
                if (!(pair.partner in state.propertyValues) || state.propertyValues[pair.partner] === undefined) {
                  state.propertyValues[pair.partner] = DEFAULTS[pair.partner] ?? 0;
                }
                const minKey = pair.role === 'min' ? key : pair.partner;
                const maxKey = pair.role === 'max' ? key : pair.partner;
                const minVal = Number(state.propertyValues[minKey]);
                const maxVal = Number(state.propertyValues[maxKey]);
                if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
                  state.propertyValues[maxKey] = minVal;
                }
              }

              // Linked pair
              const linked = LINKED_PAIR_MAP.get(key);
              if (linked) {
                state.enabledProperties.add(linked);
                if (!(linked in state.propertyValues) || state.propertyValues[linked] === undefined) {
                  state.propertyValues[linked] = DEFAULTS[linked] ?? 0;
                }
              }
            } else {
              state.enabledProperties.delete(key);

              // 1. Parent toggle turned off: remove all children
              const children = TOGGLE_DEPENDENTS[key];
              if (children) {
                for (const ck of children) {
                  const parents = CHILD_TO_PARENT_MAP.get(ck);
                  const hasOtherActiveParent = parents?.some(
                    (pk) => pk !== key && state.enabledProperties.has(pk) && isParentActive(pk, state.propertyValues[pk])
                  );
                  if (!hasOtherActiveParent) {
                    state.enabledProperties.delete(ck);
                    const childPair = MIN_MAX_MAP.get(ck);
                    if (childPair) state.enabledProperties.delete(childPair.partner);
                    const childLinked = LINKED_PAIR_MAP.get(ck);
                    if (childLinked) state.enabledProperties.delete(childLinked);
                  }
                }
              }

              // 2. Child removed: check if siblings remain
              const parentKeys = CHILD_TO_PARENT_MAP.get(key);
              if (parentKeys) {
                for (const parentKey of parentKeys) {
                  if (state.enabledProperties.has(parentKey)) {
                    const siblings = TOGGLE_DEPENDENTS[parentKey] ?? [];
                    const hasOther = siblings.some((k) => k !== key && state.enabledProperties.has(k));
                    if (!hasOther) {
                      state.enabledProperties.delete(parentKey);
                    }
                  }
                }
              }

              // 3. Min-Max pair partner removal
              const pair = MIN_MAX_MAP.get(key);
              if (pair) {
                state.enabledProperties.delete(pair.partner);
              }

              // 4. Linked pair removal
              const linked = LINKED_PAIR_MAP.get(key);
              if (linked) {
                state.enabledProperties.delete(linked);
              }

              useEditorStore.getState().clearFieldValidationError(key);
            }

            normalizeDependencies(state.enabledProperties, state.propertyValues);
            syncCodeToEditor(
              state.eventName,
              state.enabledProperties,
              state.propertyValues,
              state.customProperties,
              state.includeComments
            );
          })
        ),

      setPropertyValue: (key, val) =>
        set(
          produce((state: SoundEventState) => {
            state.propertyValues[key] = val;

            const { isValid, diagnostic } = validateSingleProperty(key, val);
            if (!isValid && diagnostic) {
              useEditorStore.getState().setFieldValidationError(key, diagnostic);
              return;
            } else {
              useEditorStore.getState().clearFieldValidationError(key);
            }

            // Parent toggle turned true/false
            const children = TOGGLE_DEPENDENTS[key];
            if (children) {
              const isFalse = !isParentActive(key, val);
              if (isFalse) {
                for (const ck of children) {
                  const parents = CHILD_TO_PARENT_MAP.get(ck);
                  const hasOtherActiveParent = parents?.some(
                    (pk) => pk !== key && state.enabledProperties.has(pk) && isParentActive(pk, state.propertyValues[pk])
                  );
                  if (!hasOtherActiveParent) {
                    state.enabledProperties.delete(ck);
                    const childPair = MIN_MAX_MAP.get(ck);
                    if (childPair) state.enabledProperties.delete(childPair.partner);
                    const childLinked = LINKED_PAIR_MAP.get(ck);
                    if (childLinked) state.enabledProperties.delete(childLinked);
                  }
                }
              } else {
                for (const ck of children) {
                  state.enabledProperties.add(ck);
                  if (!(ck in state.propertyValues) || state.propertyValues[ck] === undefined) {
                    state.propertyValues[ck] =
                      DEFAULTS[ck] !== undefined ? JSON.parse(JSON.stringify(DEFAULTS[ck])) : 0;
                  }
                }
              }
            }

            // Child editing ensures parent is true
            const parentKeys = CHILD_TO_PARENT_MAP.get(key);
            if (parentKeys && parentKeys.length > 0) {
              const hasActiveParent = parentKeys.some(
                (pk) => state.enabledProperties.has(pk) && isParentActive(pk, state.propertyValues[pk])
              );
              if (!hasActiveParent) {
                const primaryParent = parentKeys[0]!;
                state.enabledProperties.add(primaryParent);
                activateParentProperty(primaryParent, state.propertyValues);
              }
            }

            // Min-Max constraint
            const pair = MIN_MAX_MAP.get(key);
            if (pair) {
              const numVal = Number(val);
              if (!isNaN(numVal)) {
                const partnerVal = Number(state.propertyValues[pair.partner]);
                if (!isNaN(partnerVal)) {
                  if (pair.role === 'min' && numVal > partnerVal) {
                    state.propertyValues[pair.partner] = numVal;
                  } else if (pair.role === 'max' && numVal < partnerVal) {
                    state.propertyValues[pair.partner] = numVal;
                  }
                }
              }
            }

            // Type needs value check
            if (key === 'type') {
              const needsVal = typeNeedsValue(val);
              if (needsVal && !state.enabledProperties.has('value')) {
                state.enabledProperties.add('value');
                state.propertyValues['value'] = DEFAULTS['value'] ?? 1.0;
              } else if (!needsVal && state.enabledProperties.has('value')) {
                state.enabledProperties.delete('value');
              }
            }

            normalizeDependencies(state.enabledProperties, state.propertyValues);
            syncCodeToEditor(
              state.eventName,
              state.enabledProperties,
              state.propertyValues,
              state.customProperties,
              state.includeComments
            );
          })
        ),

      applyPreset: (presetId) =>
        set(
          produce((state: SoundEventState) => {
            const preset = PRESETS[presetId];
            if (!preset) return;
            state.selectedPresetId = presetId;
            state.eventName = preset.eventName;
            state.enabledProperties.clear();
            state.propertyValues = {};
            state.customProperties = {};

            for (const [k, v] of Object.entries(preset.properties)) {
              state.enabledProperties.add(k);
              state.propertyValues[k] = JSON.parse(JSON.stringify(v));
            }

            normalizeDependencies(state.enabledProperties, state.propertyValues);
            syncCodeToEditor(
              state.eventName,
              state.enabledProperties,
              state.propertyValues,
              state.customProperties,
              state.includeComments
            );
          })
        ),

      setIncludeComments: (include) =>
        set(
          produce((state: SoundEventState) => {
            state.includeComments = include;
            syncCodeToEditor(
              state.eventName,
              state.enabledProperties,
              state.propertyValues,
              state.customProperties,
              state.includeComments
            );
          })
        ),

      setLang: (lang) => {
        set(
          produce((state: SoundEventState) => {
            state.lang = lang;
            if (typeof document !== 'undefined') {
              document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
            }
          })
        );
        loadLanguage(lang).then(() => {
          set(
            produce((state: SoundEventState) => {
              if (state.lang === lang) {
                syncCodeToEditor(
                  state.eventName,
                  state.enabledProperties,
                  state.propertyValues,
                  state.customProperties,
                  state.includeComments
                );
              }
            })
          );
        });
      },

      setTheme: (theme) => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        document.documentElement.style.colorScheme = theme;
        set({ theme });
      },

      syncFromValidatedDocument: (document, normalizedProps) => {
        const { eventName, enabledProperties, propertyValues, customProperties } = get();

        const newEventName = document.eventName;
        const newCustom = document.customProperties ?? {};
        const newEnabled = new Set<string>();
        const newValues: Record<string, any> = {};

        const sourceProps = normalizedProps ?? document.properties;
        for (const [k, v] of Object.entries(sourceProps)) {
          if (SPECS[k]) {
            newEnabled.add(k);
            newValues[k] = v;
          }
        }

        normalizeDependencies(newEnabled, newValues);

        // Structural Diffing: avoid set() and re-renders if configuration did not change
        const isEventNameSame = eventName === newEventName;
        const isEnabledSame =
          enabledProperties.size === newEnabled.size &&
          Array.from(newEnabled).every((k) => enabledProperties.has(k));
        const areValuesSame =
          isEnabledSame &&
          Array.from(newEnabled).every(
            (k) => JSON.stringify(propertyValues[k]) === JSON.stringify(newValues[k])
          );
        const areCustomSame =
          Object.keys(newCustom).length === Object.keys(customProperties).length &&
          Object.keys(newCustom).every(
            (k) => JSON.stringify(newCustom[k]) === JSON.stringify(customProperties[k])
          );

        if (isEventNameSame && isEnabledSame && areValuesSame && areCustomSame) {
          return;
        }

        set(
          produce((state: SoundEventState) => {
            state.eventName = newEventName;
            state.enabledProperties = newEnabled;
            state.propertyValues = newValues;
            state.customProperties = newCustom;
          })
        );
      },

      formatCurrentCode: () => {
        const editorCode = useEditorStore.getState().code;

        // Step 1: Syntax parsing
        const { document, diagnostics: syntaxDiagnostics } = parseKv3SoundEventDocument(editorCode);
        if (!document || syntaxDiagnostics.length > 0) {
          useEditorStore.getState().setDiagnostics(syntaxDiagnostics);
          return false;
        }

        // Step 2: Business validation
        const validation = validateSoundEventDocument(document);
        if (!validation.isValid) {
          useEditorStore.getState().setDiagnostics(validation.diagnostics, validation.fieldErrors);
          return false;
        }

        // Step 3: Serialization
        const { eventName, enabledProperties, propertyValues, customProperties, includeComments } = get();
        try {
          const formatted = generateCode(
            eventName,
            enabledProperties,
            propertyValues,
            customProperties,
            includeComments
          );
          useEditorStore.getState().setCodeFromControls(formatted);
          return true;
        } catch {
          return false;
        }
      },

      exportShareHash: () => {
        const editorCode = useEditorStore.getState().code;

        // Pre-validation: reject share hash generation if code has syntax or validation errors
        const { document, diagnostics: syntaxDiagnostics } = parseKv3SoundEventDocument(editorCode);
        if (!document || syntaxDiagnostics.length > 0) {
          useEditorStore.getState().setDiagnostics(syntaxDiagnostics);
          return null;
        }

        const validation = validateSoundEventDocument(document);
        if (!validation.isValid) {
          useEditorStore.getState().setDiagnostics(validation.diagnostics, validation.fieldErrors);
          return null;
        }

        const { eventName, enabledProperties, propertyValues, customProperties } = get();
        const activeProps: Record<string, any> = { ...customProperties };
        for (const k of enabledProperties) {
          if (k in propertyValues) {
            activeProps[k] = propertyValues[k];
          }
        }
        const payload = { n: eventName, p: activeProps };
        const json = JSON.stringify(payload);
        const bytes = new TextEncoder().encode(json);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) {
          bin += String.fromCharCode(bytes[i]!);
        }
        return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      },

      importShareHash: (hashStr) => {
        try {
          if (!hashStr) return false;
          let clean = hashStr.replace(/^#s=/, '').replace(/-/g, '+').replace(/_/g, '/');
          while (clean.length % 4) clean += '=';
          const bin = atob(clean);
          const bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) {
            bytes[i] = bin.charCodeAt(i);
          }
          const jsonStr = new TextDecoder().decode(bytes);
          const parsed = JSON.parse(jsonStr);
          const validated = SoundEventSharePayloadSchema.parse(parsed);

          set(
            produce((state: SoundEventState) => {
              state.eventName = validated.n;
              state.selectedPresetId = 'csgo_mega_basic';
              state.enabledProperties.clear();
              state.propertyValues = {};
              state.customProperties = {};

              const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
              for (const [k, v] of Object.entries(validated.p)) {
                if (DANGEROUS_KEYS.has(k)) continue;
                if (!/^[a-zA-Z0-9_]+$/.test(k)) continue;
                if (SPECS[k]) {
                  state.enabledProperties.add(k);
                  state.propertyValues[k] = v;
                } else {
                  state.customProperties[k] = v;
                }
              }

              normalizeDependencies(state.enabledProperties, state.propertyValues);
              syncCodeToEditor(
                state.eventName,
                state.enabledProperties,
                state.propertyValues,
                state.customProperties,
                state.includeComments
              );
            })
          );
          return true;
        } catch (e) {
          console.warn('Failed to import share hash:', e);
          return false;
        }
      },
    }),
    {
      name: 'cs2_soundevent_generator_store_v2',
      storage: createJSONStorage(() => createDebouncedStorage(800)),
      partialize: (state) => ({
        eventName: state.eventName,
        selectedPresetId: state.selectedPresetId,
        enabledProperties: Array.from(state.enabledProperties),
        propertyValues: state.propertyValues,
        customProperties: state.customProperties,
        includeComments: state.includeComments,
        lang: state.lang,
        theme: state.theme,
      }),
      merge: (persistedState: any, currentState: SoundEventState) => {
        if (!persistedState) return currentState;
        const enabled = new Set<string>(persistedState.enabledProperties || []);
        const rawValues = persistedState.propertyValues || {};
        const rawCustom = persistedState.customProperties || {};

        const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
        const values: Record<string, any> = {};
        for (const [k, v] of Object.entries(rawValues)) {
          if (DANGEROUS_KEYS.has(k)) continue;
          if (/^[a-zA-Z0-9_]+$/.test(k) && Kv3PrimitiveOrArraySchema.safeParse(v).success) {
            values[k] = v;
          }
        }

        const custom: Record<string, any> = {};
        for (const [k, v] of Object.entries(rawCustom)) {
          if (DANGEROUS_KEYS.has(k)) continue;
          if (/^[a-zA-Z0-9_]+$/.test(k) && Kv3PrimitiveOrArraySchema.safeParse(v).success) {
            custom[k] = v;
          }
        }

        const rawEventName =
          typeof persistedState.eventName === 'string' ? persistedState.eventName.trim() : '';
        const safeEventName =
          rawEventName && !/[\r\n\x00-\x1f]/.test(rawEventName)
            ? rawEventName.slice(0, 128)
            : currentState.eventName;
        const selectedPresetId =
          typeof persistedState.selectedPresetId === 'string' && PRESETS[persistedState.selectedPresetId]
            ? persistedState.selectedPresetId
            : currentState.selectedPresetId;
        const lang = persistedState.lang || currentState.lang;
        const theme = persistedState.theme || currentState.theme;
        const includeComments = Boolean(persistedState.includeComments);

        normalizeDependencies(enabled, values);
        const code = generateCode(safeEventName, enabled, values, custom, includeComments);
        useEditorStore.getState().setCodeFromControls(code, 'init');

        if (lang === 'en') {
          loadLanguage('en').then(() => {
            const state = useSoundEventStore.getState();
            if (state.lang === 'en') {
              syncCodeToEditor(
                state.eventName,
                state.enabledProperties,
                state.propertyValues,
                state.customProperties,
                state.includeComments
              );
            }
          });
        } else {
          i18n.changeLanguage('zh');
        }
        if (typeof document !== 'undefined') {
          document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
          document.documentElement.classList.toggle('dark', theme === 'dark');
          document.documentElement.style.colorScheme = theme;
        }

        return {
          ...currentState,
          eventName: safeEventName,
          selectedPresetId,
          enabledProperties: enabled,
          propertyValues: values,
          customProperties: custom,
          includeComments,
          lang,
          theme,
        };
      },
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate sound event store:', error);
        }
        if (!useEditorStore.getState().code) {
          const current = state || useSoundEventStore.getState();
          syncCodeToEditor(
            current.eventName,
            current.enabledProperties,
            current.propertyValues,
            current.customProperties,
            current.includeComments,
            'init'
          );
        }
      },
    }
  )
);

registerDocumentSyncHandler((doc, normProps) => {
  useSoundEventStore.getState().syncFromValidatedDocument(doc, normProps);
});

// Ensure initial code is populated in editor if empty (e.g. first load without localStorage)
if (!useEditorStore.getState().code) {
  const initialState = useSoundEventStore.getState();
  syncCodeToEditor(
    initialState.eventName,
    initialState.enabledProperties,
    initialState.propertyValues,
    initialState.customProperties,
    initialState.includeComments,
    'init'
  );
}
