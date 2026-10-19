/**
 * Application State, LocalStorage Persistence & Shareable URL Hash Management
 */

import { DEFAULTS, SPECS, PRESETS } from "./schema.js";
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
      if (!(key in this.propertyValues)) {
        const defaultVal = DEFAULTS[key] !== undefined ? DEFAULTS[key] : (SPECS[key]?.kind === "bool" ? false : 0);
        this.propertyValues[key] = JSON.parse(JSON.stringify(defaultVal));
      }
    } else {
      this.enabledProperties.delete(key);
    }
    this.notify();
  }

  setPropertyValue(key, val) {
    this.propertyValues[key] = val;
    this.notify();
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
      if (data.values) this.propertyValues = data.values;
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
