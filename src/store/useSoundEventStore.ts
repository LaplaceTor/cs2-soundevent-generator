import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce, enableMapSet } from 'immer';

enableMapSet();
import { DEFAULTS, SPECS, typeNeedsValue } from '../domain/schema/specs';
import { PRESETS } from '../domain/schema/presets';
import {
  TOGGLE_DEPENDENTS,
  CHILD_TO_PARENT_MAP,
  MIN_MAX_MAP,
  LINKED_PAIR_MAP,
} from '../domain/schema/dependencies';
import { serializeSoundEvent } from '../domain/kv3/serializer';
import { parseKv3SoundEventDocument } from '../domain/kv3/parser';
import type { Kv3Diagnostic } from '../domain/kv3/types';
import {
  SoundEventSharePayloadSchema,
  Kv3PrimitiveOrArraySchema,
} from '../domain/schema/validation';
import i18n, { loadLanguage } from '../i18n';

export type SyncOrigin = 'controls' | 'editor' | 'init' | 'preset';

interface SoundEventState {
  eventName: string;
  enabledProperties: Set<string>;
  propertyValues: Record<string, any>;
  customProperties: Record<string, any>;
  includeComments: boolean;
  lang: 'zh' | 'en';
  theme: 'dark' | 'light';

  // Editor states
  code: string;
  diagnostics: Kv3Diagnostic[];
  isEditorDrawerOpen: boolean;

  // Search & Filter
  searchQuery: string;
  filterActiveOnly: boolean;
  expandedGroups: Set<string>;

  // Sync origin tracking
  syncOrigin: SyncOrigin;

  // Actions
  setEventName: (name: string, origin?: SyncOrigin) => void;
  setPropertyEnabled: (key: string, enabled: boolean) => void;
  setPropertyValue: (key: string, val: any) => void;
  applyPreset: (presetId: string) => void;
  toggleGroupExpanded: (groupId: string) => void;
  expandAllGroups: (allGroupIds: string[]) => void;
  collapseAllGroups: () => void;
  setSearchQuery: (query: string) => void;
  setFilterActiveOnly: (activeOnly: boolean) => void;
  setIncludeComments: (include: boolean) => void;
  setLang: (lang: 'zh' | 'en') => void;
  setTheme: (theme: 'dark' | 'light') => void;
  setEditorDrawerOpen: (open: boolean) => void;

  // Code editor sync
  updateCodeFromEditor: (newCode: string) => void;
  formatCurrentCode: () => boolean;

  // URL Hash export / import
  exportShareHash: () => string;
  importShareHash: (hash: string) => boolean;
}

// Helper: strictly enforce min/max pairs and dependencies
function normalizeDependencies(
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
      if (pVal === false || pVal === 'false' || pVal === 0) {
        for (const ck of children) {
          enabled.delete(ck);
          const cPair = MIN_MAX_MAP.get(ck);
          if (cPair) enabled.delete(cPair.partner);
          const cLinked = LINKED_PAIR_MAP.get(ck);
          if (cLinked) enabled.delete(cLinked);
        }
      }
    }
  }

  // 3. If any child is enabled, parent MUST be enabled & true
  for (const key of Array.from(enabled)) {
    const parentKey = CHILD_TO_PARENT_MAP.get(key);
    if (parentKey) {
      enabled.add(parentKey);
      values[parentKey] = true;
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

export const useSoundEventStore = create<SoundEventState>()(
  persist(
    (set, get) => ({
      eventName: 'Weapon_Custom.Single',
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
      propertyValues: { ...PRESETS.csgo_mega_basic!.properties },
      customProperties: {},
      includeComments: false,
      lang: 'zh',
      theme: 'dark',

      code: '',
      diagnostics: [],
      isEditorDrawerOpen: false,

      searchQuery: '',
      filterActiveOnly: false,
      expandedGroups: new Set(['general', 'playback', 'position']),

      syncOrigin: 'init',

      setEventName: (name, origin = 'controls') =>
        set(
          produce((state: SoundEventState) => {
            state.eventName = name;
            state.syncOrigin = origin;
            if (origin !== 'editor') {
              state.code = generateCode(
                state.eventName,
                state.enabledProperties,
                state.propertyValues,
                state.customProperties,
                state.includeComments
              );
            }
          })
        ),

      setPropertyEnabled: (key, enabled) =>
        set(
          produce((state: SoundEventState) => {
            state.syncOrigin = 'controls';
            if (enabled) {
              state.enabledProperties.add(key);
              if (!(key in state.propertyValues) || state.propertyValues[key] === undefined) {
                state.propertyValues[key] = DEFAULTS[key] !== undefined ? JSON.parse(JSON.stringify(DEFAULTS[key])) : 0;
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
                    state.propertyValues[ck] = DEFAULTS[ck] !== undefined ? JSON.parse(JSON.stringify(DEFAULTS[ck])) : 0;
                  }
                }
              }

              // Child property
              const parentKey = CHILD_TO_PARENT_MAP.get(key);
              if (parentKey) {
                state.enabledProperties.add(parentKey);
                state.propertyValues[parentKey] = true;
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
                  state.enabledProperties.delete(ck);
                  const childPair = MIN_MAX_MAP.get(ck);
                  if (childPair) state.enabledProperties.delete(childPair.partner);
                  const childLinked = LINKED_PAIR_MAP.get(ck);
                  if (childLinked) state.enabledProperties.delete(childLinked);
                }
              }

              // 2. Child removed: check if siblings remain
              const parentKey = CHILD_TO_PARENT_MAP.get(key);
              if (parentKey) {
                const siblings = TOGGLE_DEPENDENTS[parentKey] ?? [];
                const hasOther = siblings.some((k) => k !== key && state.enabledProperties.has(k));
                if (!hasOther) {
                  state.enabledProperties.delete(parentKey);
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
            }

            normalizeDependencies(state.enabledProperties, state.propertyValues);
            state.code = generateCode(
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
            state.syncOrigin = 'controls';
            state.propertyValues[key] = val;

            // Parent toggle turned true/false
            const children = TOGGLE_DEPENDENTS[key];
            if (children) {
              const isFalse = val === false || val === 'false' || val === 0;
              if (isFalse) {
                for (const ck of children) {
                  state.enabledProperties.delete(ck);
                  const childPair = MIN_MAX_MAP.get(ck);
                  if (childPair) state.enabledProperties.delete(childPair.partner);
                  const childLinked = LINKED_PAIR_MAP.get(ck);
                  if (childLinked) state.enabledProperties.delete(childLinked);
                }
              } else {
                for (const ck of children) {
                  state.enabledProperties.add(ck);
                  if (!(ck in state.propertyValues) || state.propertyValues[ck] === undefined) {
                    state.propertyValues[ck] = DEFAULTS[ck] !== undefined ? JSON.parse(JSON.stringify(DEFAULTS[ck])) : 0;
                  }
                }
              }
            }

            // Child editing ensures parent is true
            const parentKey = CHILD_TO_PARENT_MAP.get(key);
            if (parentKey) {
              state.enabledProperties.add(parentKey);
              state.propertyValues[parentKey] = true;
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
            state.code = generateCode(
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
            state.syncOrigin = 'preset';
            state.eventName = preset.eventName;
            state.enabledProperties.clear();
            state.propertyValues = {};
            state.customProperties = {};

            for (const [k, v] of Object.entries(preset.properties)) {
              state.enabledProperties.add(k);
              state.propertyValues[k] = JSON.parse(JSON.stringify(v));
            }

            normalizeDependencies(state.enabledProperties, state.propertyValues);
            state.diagnostics = [];
            state.code = generateCode(
              state.eventName,
              state.enabledProperties,
              state.propertyValues,
              state.customProperties,
              state.includeComments
            );
          })
        ),

      toggleGroupExpanded: (groupId) =>
        set(
          produce((state: SoundEventState) => {
            if (state.expandedGroups.has(groupId)) {
              state.expandedGroups.delete(groupId);
            } else {
              state.expandedGroups.add(groupId);
            }
          })
        ),

      expandAllGroups: (allGroupIds) =>
        set(
          produce((state: SoundEventState) => {
            state.expandedGroups = new Set(allGroupIds);
          })
        ),

      collapseAllGroups: () =>
        set(
          produce((state: SoundEventState) => {
            state.expandedGroups.clear();
          })
        ),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterActiveOnly: (activeOnly) => set({ filterActiveOnly: activeOnly }),

      setIncludeComments: (include) =>
        set(
          produce((state: SoundEventState) => {
            state.includeComments = include;
            state.syncOrigin = 'controls';
            state.code = generateCode(
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
                state.syncOrigin = 'controls';
                state.code = generateCode(
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

      setEditorDrawerOpen: (open) => set({ isEditorDrawerOpen: open }),

      updateCodeFromEditor: (newCode) =>
        set(
          produce((state: SoundEventState) => {
            state.code = newCode;
            state.syncOrigin = 'editor';

            const { document, diagnostics } = parseKv3SoundEventDocument(newCode);
            state.diagnostics = diagnostics;

            if (document) {
              state.eventName = document.eventName;
              state.customProperties = document.customProperties ?? {};

              state.enabledProperties.clear();
              for (const [k, v] of Object.entries(document.properties)) {
                if (SPECS[k]) {
                  state.enabledProperties.add(k);
                  state.propertyValues[k] = v;
                }
              }

              normalizeDependencies(state.enabledProperties, state.propertyValues);
            }
          })
        ),

      formatCurrentCode: () => {
        const { code, eventName, enabledProperties, propertyValues, customProperties, includeComments } = get();
        const { document, diagnostics } = parseKv3SoundEventDocument(code);
        if (!document || diagnostics.length > 0) {
          set({ diagnostics });
          return false;
        }

        const formatted = generateCode(
          eventName,
          enabledProperties,
          propertyValues,
          customProperties,
          includeComments
        );
        set({ code: formatted, diagnostics: [], syncOrigin: 'controls' });
        return true;
      },

      exportShareHash: () => {
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
              state.diagnostics = [];
              state.syncOrigin = 'controls';
              state.code = generateCode(
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
      partialize: (state) => ({
        eventName: state.eventName,
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

        const rawEventName = typeof persistedState.eventName === 'string' ? persistedState.eventName.trim() : '';
        const safeEventName = rawEventName && !/[\r\n\x00-\x1f]/.test(rawEventName)
          ? rawEventName.slice(0, 128)
          : currentState.eventName;
        const lang = persistedState.lang || currentState.lang;
        const theme = persistedState.theme || currentState.theme;
        const includeComments = Boolean(persistedState.includeComments);

        normalizeDependencies(enabled, values);
        const code = generateCode(safeEventName, enabled, values, custom, includeComments);

        if (lang === 'en') {
          loadLanguage('en').then(() => {
            const state = useSoundEventStore.getState();
            if (state.lang === 'en') {
              useSoundEventStore.setState({
                code: generateCode(
                  state.eventName,
                  state.enabledProperties,
                  state.propertyValues,
                  state.customProperties,
                  state.includeComments
                ),
              });
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
          enabledProperties: enabled,
          propertyValues: values,
          customProperties: custom,
          includeComments,
          lang,
          theme,
          code,
        };
      },
    }
  )
);
