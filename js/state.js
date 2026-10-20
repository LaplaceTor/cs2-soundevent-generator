/**
 * Application State, LocalStorage Persistence & Shareable URL Hash Management
 */

import { DEFAULTS, SPECS, PRESETS, MIN_MAX_MAP, TOGGLE_DEPENDENTS, CHILD_TO_PARENT_MAP } from "./schema.js";
import { parseKv3SoundEvent } from "./kv3.js";

const STORAGE_KEY = "h5t_cs2_soundevent_gen_state_v1";

export class SoundEventState {
  constructor() {
    this.eventName = "SoundEvent_Custom.3D";
    this.enabledProperties = new Set();
    this.propertyValues = {};
    this.includeComments = false;
    this.lang = "zh"; // 'zh' or 'en'
    this.theme = "dark"; // 'dark' or 'light'
    this.listeners = new Set();
  }

  get properties() {
    return this.propertyValues;
  }

  set properties(val) {
    this.propertyValues = val || {};
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.saveToStorage();
    for (const listener of this.listeners) {
      listener(this);
    }
  }

  applyPreset(presetId) {
    const preset = PRESETS[presetId];
    if (!preset) return;

    this.eventName = preset.eventName;
    this.enabledProperties.clear();
    this.propertyValues = {};

    for (const [key, val] of Object.entries(preset.properties)) {
      this.enabledProperties.add(key);
      this.propertyValues[key] = JSON.parse(JSON.stringify(val));
    }
    this.notify();
  }

  setPropertyEnabled(key, enabled) {
    if (enabled) {
      this.enabledProperties.add(key);
      const cur = this.propertyValues[key];
      if (!(key in this.propertyValues) || cur === undefined || (Array.isArray(cur) && cur.length === 0)) {
        const defaultVal = DEFAULTS[key] !== undefined ? DEFAULTS[key] : (SPECS[key]?.kind === "bool" ? false : 0);
        this.propertyValues[key] = JSON.parse(JSON.stringify(defaultVal));
      }

      // If key is a parent toggle, automatically enable all dependent children
      const children = TOGGLE_DEPENDENTS[key];
      if (children) {
        for (const childKey of children) {
          this.enabledProperties.add(childKey);
          const cCur = this.propertyValues[childKey];
          if (!(childKey in this.propertyValues) || cCur === undefined || (Array.isArray(cCur) && cCur.length === 0)) {
            const cDef = DEFAULTS[childKey] !== undefined ? DEFAULTS[childKey] : (SPECS[childKey]?.kind === "bool" ? false : 0);
            this.propertyValues[childKey] = JSON.parse(JSON.stringify(cDef));
          }
        }
      }

      // If key is a child property, automatically enable its parent toggle
      const parentKey = CHILD_TO_PARENT_MAP.get(key);
      if (parentKey) {
        this.enabledProperties.add(parentKey);
        const pCur = this.propertyValues[parentKey];
        if (!(parentKey in this.propertyValues) || pCur === undefined) {
          const pDef = DEFAULTS[parentKey] !== undefined ? DEFAULTS[parentKey] : true;
          this.propertyValues[parentKey] = JSON.parse(JSON.stringify(pDef));
        }
      }

      // Min-Max pair checkbox synchronization
      const pair = MIN_MAX_MAP.get(key);
      if (pair) {
        this.enabledProperties.add(pair.partner);
        const pCur = this.propertyValues[pair.partner];
        if (!(pair.partner in this.propertyValues) || pCur === undefined || (Array.isArray(pCur) && pCur.length === 0)) {
          const pDef = DEFAULTS[pair.partner] !== undefined ? DEFAULTS[pair.partner] : 0;
          this.propertyValues[pair.partner] = JSON.parse(JSON.stringify(pDef));
        }
        // Enforce min <= max on enablement
        const minKey = pair.role === "min" ? key : pair.partner;
        const maxKey = pair.role === "max" ? key : pair.partner;
        const minVal = Number(this.propertyValues[minKey]);
        const maxVal = Number(this.propertyValues[maxKey]);
        if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
          this.propertyValues[maxKey] = minVal;
        }
        // If partner is a child, ensure its parent toggle is enabled
        const partnerParentKey = CHILD_TO_PARENT_MAP.get(pair.partner);
        if (partnerParentKey) {
          this.enabledProperties.add(partnerParentKey);
          if (!(partnerParentKey in this.propertyValues) || this.propertyValues[partnerParentKey] === undefined) {
            const ppDef = DEFAULTS[partnerParentKey] !== undefined ? DEFAULTS[partnerParentKey] : true;
            this.propertyValues[partnerParentKey] = JSON.parse(JSON.stringify(ppDef));
          }
        }
      }
    } else {
      this.enabledProperties.delete(key);

      // 1. If key is a parent toggle, REMOVE all attached child properties
      const children = TOGGLE_DEPENDENTS[key];
      if (children) {
        for (const childKey of children) {
          this.enabledProperties.delete(childKey);
          const childPair = MIN_MAX_MAP.get(childKey);
          if (childPair) {
            this.enabledProperties.delete(childPair.partner);
          }
        }
      }

      // 2. If key is a child property, check if ALL children of that parent are now disabled
      const parentKey = CHILD_TO_PARENT_MAP.get(key);
      if (parentKey) {
        const siblingChildren = TOGGLE_DEPENDENTS[parentKey] || [];
        const hasOtherEnabledChild = siblingChildren.some(k => k !== key && this.enabledProperties.has(k));
        if (!hasOtherEnabledChild) {
          this.enabledProperties.delete(parentKey);
        }
      }

      // 3. Min-Max pair partner removal
      const pair = MIN_MAX_MAP.get(key);
      if (pair) {
        this.enabledProperties.delete(pair.partner);
        const partnerParentKey = CHILD_TO_PARENT_MAP.get(pair.partner);
        if (partnerParentKey) {
          const siblingChildren = TOGGLE_DEPENDENTS[partnerParentKey] || [];
          const hasOther = siblingChildren.some(k => this.enabledProperties.has(k));
          if (!hasOther) {
            this.enabledProperties.delete(partnerParentKey);
          }
        }
      }
    }

    this.notify();
  }

  setPropertyValue(key, val) {
    this.propertyValues[key] = val;

    // Enforce min <= max constraint if key is part of a min/max pair
    const pair = MIN_MAX_MAP.get(key);
    if (pair) {
      const numVal = Number(val);
      if (!isNaN(numVal)) {
        const partnerVal = Number(this.propertyValues[pair.partner]);
        if (!isNaN(partnerVal)) {
          if (pair.role === "min" && numVal > partnerVal) {
            this.propertyValues[pair.partner] = numVal;
          } else if (pair.role === "max" && numVal < partnerVal) {
            this.propertyValues[pair.partner] = numVal;
          }
        }
      }
    }

    this.notify();
  }

  _enforceMinMaxPairConsistency() {
    for (const key of Array.from(this.enabledProperties)) {
      const pair = MIN_MAX_MAP.get(key);
      if (pair) {
        this.enabledProperties.add(pair.partner);
        const pCur = this.propertyValues[pair.partner];
        if (!(pair.partner in this.propertyValues) || pCur === undefined || (Array.isArray(pCur) && pCur.length === 0)) {
          const pDef = DEFAULTS[pair.partner] !== undefined ? DEFAULTS[pair.partner] : 0;
          this.propertyValues[pair.partner] = JSON.parse(JSON.stringify(pDef));
        }
        const minKey = pair.role === "min" ? key : pair.partner;
        const maxKey = pair.role === "max" ? key : pair.partner;
        const minVal = Number(this.propertyValues[minKey]);
        const maxVal = Number(this.propertyValues[maxKey]);
        if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
          this.propertyValues[maxKey] = minVal;
        }
      }
    }
  }

  _enforceToggleDependenciesConsistency() {
    for (const key of Array.from(this.enabledProperties)) {
      const parentKey = CHILD_TO_PARENT_MAP.get(key);
      if (parentKey && !this.enabledProperties.has(parentKey)) {
        this.enabledProperties.add(parentKey);
        const pCur = this.propertyValues[parentKey];
        if (!(parentKey in this.propertyValues) || pCur === undefined) {
          const pDef = DEFAULTS[parentKey] !== undefined ? DEFAULTS[parentKey] : true;
          this.propertyValues[parentKey] = JSON.parse(JSON.stringify(pDef));
        }
      }
    }
  }

  getActiveProperties() {
    const result = {};
    for (const key of this.enabledProperties) {
      if (key in this.propertyValues) {
        result[key] = this.propertyValues[key];
      }
    }
    return result;
  }

  importFromKv3(kv3Text) {
    const parsed = parseKv3SoundEvent(kv3Text);
    if (!parsed) return false;

    if (parsed.eventName) {
      this.eventName = parsed.eventName;
    }
    this.enabledProperties.clear();
    for (const [k, v] of Object.entries(parsed.properties)) {
      this.enabledProperties.add(k);
      this.propertyValues[k] = v;
    }
    this._enforceMinMaxPairConsistency();
    this._enforceToggleDependenciesConsistency();
    this.notify();
    return true;
  }

  // --- Serialization / URL Share ---

  exportSharePayload() {
    const payload = {
      n: this.eventName,
      p: this.getActiveProperties()
    };
    const jsonStr = JSON.stringify(payload);
    const bytes = new TextEncoder().encode(jsonStr);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  importSharePayload(hashStr) {
    try {
      if (!hashStr) return false;
      let clean = hashStr.replace(/^#s=/, "").replace(/-/g, "+").replace(/_/g, "/");
      while (clean.length % 4) clean += "=";
      const binary = atob(clean);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const jsonStr = new TextDecoder().decode(bytes);
      const data = JSON.parse(jsonStr);

      if (data.n) this.eventName = data.n;
      this.enabledProperties.clear();
      this.propertyValues = {};
      if (data.p) {
        for (const [k, v] of Object.entries(data.p)) {
          this.enabledProperties.add(k);
          this.propertyValues[k] = v;
        }
      }
      this._enforceMinMaxPairConsistency();
      this._enforceToggleDependenciesConsistency();
      this._enforceToggleDependenciesConsistency();
      this.notify();
      return true;
    } catch (e) {
      console.warn("Failed to parse share hash:", e);
      return false;
    }
  }

  saveToStorage() {
    try {
      const data = {
        eventName: this.eventName,
        enabled: Array.from(this.enabledProperties),
        values: this.propertyValues,
        includeComments: this.includeComments,
        lang: this.lang,
        theme: this.theme
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Ignore quota errors
    }
  }

  loadFromStorage() {
    try {
      // First check URL hash
      if (window.location.hash.startsWith("#s=")) {
        if (this.importSharePayload(window.location.hash)) {
          return true;
        }
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.applyPreset("generic_3d");
        return false;
      }
      const data = JSON.parse(raw);
      if (data.eventName) this.eventName = data.eventName;
      if (Array.isArray(data.enabled)) {
        this.enabledProperties = new Set(data.enabled);
      }
      if (data.values) {
        this.propertyValues = data.values;
        if (Array.isArray(this.propertyValues["vsnd_files_track_01"]) && this.propertyValues["vsnd_files_track_01"].length === 0) {
          this.propertyValues["vsnd_files_track_01"] = "sounds/custom/new_sound.vsnd";
        }
      }
      this._enforceMinMaxPairConsistency();
      this._enforceToggleDependenciesConsistency();
      if (typeof data.includeComments === "boolean") this.includeComments = data.includeComments;
      if (data.lang) this.lang = data.lang;
      if (data.theme) this.theme = data.theme;
      return true;
    } catch (e) {
      console.warn("Failed to load local state:", e);
      this.applyPreset("generic_3d");
      return false;
    }
  }
}
