/**
 * CS2 SoundEvent KV3 Code Autocompletion & Suggestions
 * Provides context-aware completions for properties, types, mixgroups, and presets.
 */

import { SPECS, MIXGROUPS, DSP_PRESETS, TYPE_OBJECTS, CURVE_PRESETS } from "./schema.js";
import { I18N } from "./i18n.js";

export class Kv3Autocomplete {
  constructor(textarea, popupEl, options = {}) {
    this.textarea = textarea;
    this.popup = popupEl;
    this.getLang = options.getLanguage || (() => "zh");
    this.onApply = options.onApply || (() => {});

    this.items = [];
    this.selectedIndex = 0;
    this.isOpen = false;
    this.activeContext = null;

    this.init();
  }

  init() {
    this.textarea.addEventListener("input", () => this.handleInput());
    this.textarea.addEventListener("keydown", (e) => this.handleKeyDown(e));
    this.textarea.addEventListener("blur", () => {
      // Delay closing to allow clicks on popup items
      setTimeout(() => this.close(), 150);
    });
    this.textarea.addEventListener("scroll", () => {
      if (this.isOpen) this.updatePosition();
    });
  }

  handleInput() {
    const context = this.detectContext();
    if (!context) {
      this.close();
      return;
    }

    const suggestions = this.getSuggestions(context);
    if (!suggestions || suggestions.length === 0) {
      this.close();
      return;
    }

    this.items = suggestions.slice(0, 8); // Top 8 suggestions
    this.selectedIndex = 0;
    this.activeContext = context;
    this.renderPopup();
    this.updatePosition();
    this.open();
  }

  handleKeyDown(e) {
    if (!this.isOpen) {
      // Trigger autocomplete on Ctrl+Space
      if (e.ctrlKey && e.code === "Space") {
        e.preventDefault();
        this.handleInput();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.items.length;
      this.updateSelection();
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % this.items.length;
      this.updateSelection();
      return;
    }

    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      this.applySelection();
      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();
      this.close();
      return;
    }
  }

  detectContext() {
    const pos = this.textarea.selectionStart;
    const text = this.textarea.value;
    const before = text.substring(0, pos);
    const lineStart = before.lastIndexOf("\n") + 1;
    const currentLine = before.substring(lineStart);

    // If inside a comment, skip
    if (currentLine.trim().startsWith("//") || currentLine.trim().startsWith("<!--")) {
      return null;
    }

    // Check if line contains '='
    const eqIdx = currentLine.indexOf("=");
    if (eqIdx !== -1) {
      const keyPart = currentLine.substring(0, eqIdx).trim().replace(/^["']|["']$/g, "");
      const valPart = currentLine.substring(eqIdx + 1).trimStart();
      const replaceStart = lineStart + eqIdx + 1 + (currentLine.substring(eqIdx + 1).length - valPart.length);
      return {
        mode: "value",
        key: keyPart,
        query: valPart.replace(/^["']/, "").toLowerCase(),
        rawQuery: valPart,
        startPos: replaceStart,
        endPos: pos
      };
    }

    // Property key completion before '='
    const trimmed = currentLine.trimStart();
    const leadingWhitespaceLen = currentLine.length - trimmed.length;
    const query = trimmed.toLowerCase();

    // If typing closing brace or empty line, skip
    if (query === "}" || query === "{" || query === "") {
      return null;
    }

    return {
      mode: "property",
      query: query,
      startPos: lineStart + leadingWhitespaceLen,
      endPos: pos
    };
  }

  getSuggestions(ctx) {
    const lang = this.getLang();
    const t = I18N[lang] || I18N.zh;

    if (ctx.mode === "property") {
      const q = ctx.query;
      const allKeys = Object.keys(SPECS);
      const matches = allKeys.filter(k => k.toLowerCase().includes(q));

      matches.sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(q);
        const bStarts = b.toLowerCase().startsWith(q);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });

      return matches.map(key => {
        const spec = SPECS[key];
        const kind = spec.kind;
        const label = t.labels?.[key] || key;
        let insertText = `${key} = `;
        let cursorOffset = 0;

        if (kind === "float") {
          const def = spec.options?.default ?? 1.0;
          insertText += `${def.toFixed(1)}`;
        } else if (kind === "bool") {
          insertText += "true";
        } else if (kind === "string_bool") {
          insertText += '"true"';
        } else if (kind === "string") {
          insertText += '""';
          cursorOffset = -1; // inside quotes
        } else if (kind === "files") {
          insertText += '[\n\t\t"sounds/custom/new_sound.vsnd",\n\t]';
        } else if (kind === "vector3") {
          insertText += '[ 0.0, 0.0, 0.0 ]';
        } else if (kind === "curve") {
          insertText += '[\n\t\t[ 0.0, 1.0, 0.0, 0.0, 2.0, 3.0 ],\n\t\t[ 1000.0, 0.0, -0.001, -0.001, 1.0, 1.0 ],\n\t]';
        } else {
          insertText += '""';
          cursorOffset = -1;
        }

        return {
          type: "prop",
          kind: kind,
          label: key,
          desc: label,
          insertText,
          cursorOffset
        };
      });
    }

    if (ctx.mode === "value") {
      const key = ctx.key;
      const q = ctx.query;

      if (key === "type") {
        return TYPE_OBJECTS
          .filter(t => (typeof t === "object" ? t.name : String(t)).toLowerCase().includes(q))
          .map(t => {
            const name = typeof t === "object" ? t.name : String(t);
            const desc = typeof t === "object" ? t.desc : "SoundEvent Type";
            return {
              type: "val",
              kind: "type",
              label: `"${name}"`,
              desc: desc,
              insertText: `"${name}"`
            };
          });
      }

      if (key === "mixgroup") {
        return MIXGROUPS
          .filter(m => String(m).toLowerCase().includes(q))
          .map(m => ({
            type: "val",
            kind: "mixgroup",
            label: `"${m}"`,
            desc: "Audio Submix Group",
            insertText: `"${m}"`
          }));
      }

      if (key === "dsp_preset") {
        return DSP_PRESETS
          .filter(d => (typeof d === "object" ? d.name : String(d)).toLowerCase().includes(q))
          .map(d => {
            const name = typeof d === "object" ? d.name : String(d);
            const desc = typeof d === "object" ? d.desc : "DSP Preset";
            return {
              type: "val",
              kind: "dsp",
              label: `"${name}"`,
              desc: desc,
              insertText: `"${name}"`
            };
          });
      }

      const spec = SPECS[key];
      if (spec?.kind === "bool") {
        return [
          { type: "val", kind: "bool", label: "true", desc: "Boolean True", insertText: "true" },
          { type: "val", kind: "bool", label: "false", desc: "Boolean False", insertText: "false" }
        ].filter(b => b.label.includes(q));
      }

      if (spec?.kind === "string_bool") {
        return [
          { type: "val", kind: "string_bool", label: '"true"', desc: "String Boolean", insertText: '"true"' },
          { type: "val", kind: "string_bool", label: '"false"', desc: "String Boolean", insertText: '"false"' }
        ].filter(b => b.label.includes(q));
      }

      if (spec?.kind === "float_bool") {
        return [
          { type: "val", kind: "bool", label: "1.0", desc: "Float Boolean True (1.0)", insertText: "1.0" },
          { type: "val", kind: "bool", label: "0.0", desc: "Float Boolean False (0.0)", insertText: "0.0" }
        ].filter(b => b.label.includes(q));
      }

      if (spec?.kind === "int_bool") {
        return [
          { type: "val", kind: "bool", label: "1", desc: "Integer Boolean True (1)", insertText: "1" },
          { type: "val", kind: "bool", label: "0", desc: "Integer Boolean False (0)", insertText: "0" }
        ].filter(b => b.label.includes(q));
      }

      if (spec?.kind === "curve") {
        return Object.keys(CURVE_PRESETS).map(pk => {
          const pts = CURVE_PRESETS[pk];
          const lines = pts.map(p => `\t\t[ ${p.join(", ")} ],`).join("\n");
          return {
            type: "val",
            kind: "curve",
            label: `Preset: ${pk}`,
            desc: "Preset Curve Points",
            insertText: `[\n${lines}\n\t]`
          };
        });
      }
    }

    return [];
  }

  renderPopup() {
    this.popup.innerHTML = "";
    this.items.forEach((item, idx) => {
      const el = document.createElement("div");
      el.className = `autocomplete-item px-3 py-1.5 flex items-center justify-between cursor-pointer text-xs font-mono select-none ${
        idx === this.selectedIndex ? "selected" : ""
      }`;
      el.innerHTML = `
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-[9px] uppercase font-bold px-1 py-0.5 rounded ${
            item.type === "prop" 
              ? "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400" 
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
          }">${item.kind || item.type}</span>
          <span class="font-medium truncate text-gray-900 dark:text-gray-100">${item.label}</span>
        </div>
        <span class="text-[11px] text-gray-400 truncate max-w-[140px] font-sans ml-2">${item.desc}</span>
      `;
      el.addEventListener("mousedown", (e) => {
        e.preventDefault();
        this.selectedIndex = idx;
        this.applySelection();
      });
      this.popup.appendChild(el);
    });
  }

  updateSelection() {
    const children = this.popup.querySelectorAll(".autocomplete-item");
    children.forEach((child, idx) => {
      if (idx === this.selectedIndex) {
        child.classList.add("selected");
        child.scrollIntoView({ block: "nearest" });
      } else {
        child.classList.remove("selected");
      }
    });
  }

  applySelection() {
    if (!this.isOpen || !this.items[this.selectedIndex] || !this.activeContext) return;

    const item = this.items[this.selectedIndex];
    const ctx = this.activeContext;
    const text = this.textarea.value;

    const before = text.substring(0, ctx.startPos);
    const after = text.substring(ctx.endPos);

    this.textarea.value = before + item.insertText + after;

    const newCursorPos = ctx.startPos + item.insertText.length + (item.cursorOffset || 0);
    this.textarea.selectionStart = newCursorPos;
    this.textarea.selectionEnd = newCursorPos;

    this.close();
    this.onApply(this.textarea.value);
  }

  updatePosition() {
    const pos = this.textarea.selectionStart;
    const text = this.textarea.value.substring(0, pos);
    const lines = text.split("\n");
    const lineIndex = lines.length - 1;
    const colIndex = lines[lineIndex].length;

    const cs = window.getComputedStyle(this.textarea);
    const lineHeight = parseFloat(cs.lineHeight) || 20;
    const fontSize = parseFloat(cs.fontSize) || 12;
    const charWidth = fontSize * 0.605;

    const padTop = parseFloat(cs.paddingTop) || 16;
    const padLeft = parseFloat(cs.paddingLeft) || 16;

    const popupW = this.popup.offsetWidth || 320;
    const popupH = this.popup.offsetHeight || 200;

    const top = padTop + (lineIndex + 1) * lineHeight - this.textarea.scrollTop;
    const maxLeft = Math.max(padLeft, this.textarea.clientWidth - popupW - 16);
    const left = Math.min(
      Math.max(padLeft + colIndex * charWidth - this.textarea.scrollLeft, padLeft),
      maxLeft
    );

    let finalTop = Math.max(top, 36);
    if (finalTop + popupH > this.textarea.clientHeight && top - popupH - lineHeight > 0) {
      finalTop = top - popupH - lineHeight;
    }

    this.popup.style.top = `${finalTop}px`;
    this.popup.style.left = `${Math.max(left, 16)}px`;
  }

  open() {
    this.isOpen = true;
    this.popup.classList.remove("hidden");
  }

  close() {
    this.isOpen = false;
    this.popup.classList.add("hidden");
    this.activeContext = null;
  }
}
