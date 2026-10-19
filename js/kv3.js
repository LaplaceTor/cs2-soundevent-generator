/**
 * KV3 Formatter and Serializer for CS2 SoundEvent
 * Strictly adheres to Valve Source 2 KeyValues3 specifications.
 */

import { SPECS } from "./schema.js";
import { I18N } from "./i18n.js";

export const KV3_HEADER = '<!-- kv3 encoding:text:version{e21c7f3c-8a33-41c5-9977-a76d3a32aa0d} format:generic:version{7412167c-06e9-4698-aff2-e63eb59037e7} -->';

/**
 * Format a single value to KV3 representation
 */
export function formatKv3Value(key, val, spec) {
  const kind = spec ? spec.kind : "unknown";

  if (kind === "string_bool") {
    // csgo_music string bools like loop_track = "true"
    return typeof val === "boolean" ? (val ? '"true"' : '"false"') : (val ? `"${val}"` : '"false"');
  }

  if (kind === "bool") {
    return Boolean(val) ? "true" : "false";
  }

  if (kind === "float") {
    const num = Number(val);
    if (isNaN(num)) return "0.0";
    let str = num.toString();
    if (!str.includes(".")) {
      str += ".0";
    }
    return str;
  }

  if (kind === "vector3") {
    if (Array.isArray(val)) {
      const formatted = val.map(n => {
        const num = Number(n) || 0;
        let s = num.toString();
        return s.includes(".") ? s : s + ".0";
      });
      return `[ ${formatted.join(", ")} ]`;
    }
    return `[ 0.0, 0.0, 0.0 ]`;
  }

  if (kind === "files" || key === "vsnd_files_track_01") {
    if (Array.isArray(val)) {
      const items = val.map(f => `\t\t\t"${normalizeVsndPath(f)}",`);
      if (items.length === 0) return "[ ]";
      return `[\n${items.join("\n")}\n\t\t]`;
    }
    if (typeof val === "string" && val.trim()) {
      return `[\n\t\t\t"${normalizeVsndPath(val)}",\n\t\t]`;
    }
    return "[ ]";
  }

  if (kind === "curve" || Array.isArray(val)) {
    if (Array.isArray(val) && val.length > 0 && Array.isArray(val[0])) {
      // 2D Curve array
      const rows = val.map(row => {
        const rowStr = row.map((n, idx) => {
          const num = Number(n) || 0;
          if (idx >= 4) {
            // modeLeft, modeRight are integers
            return num.toFixed(1);
          }
          let s = num.toString();
          return s.includes(".") ? s : s + ".0";
        }).join(", ");
        return `\t\t\t[ ${rowStr} ],`;
      });
      return `[\n${rows.join("\n")}\n\t\t]`;
    }
    if (Array.isArray(val)) {
      return `[ ${val.join(", ")} ]`;
    }
  }

  if (typeof val === "number") {
    let str = val.toString();
    return str.includes(".") ? str : str + ".0";
  }

  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }

  // String / text
  const cleanStr = String(val).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${cleanStr}"`;
}

/**
 * Normalizes any audio path to sounds/.../*.vsnd format
 */
export function normalizeVsndPath(pathStr) {
  if (!pathStr) return "";
  let p = pathStr.trim().replace(/\\/g, "/");

  // strip leading quotes
  p = p.replace(/^["']+|["']+$/g, "");

  // Convert extension to .vsnd
  const dotIdx = p.lastIndexOf(".");
  if (dotIdx !== -1) {
    p = p.substring(0, dotIdx) + ".vsnd";
  } else {
    p += ".vsnd";
  }

  // If path doesn't start with sounds/, keep relative or prepend
  return p;
}

/**
 * Serialize state to full or snippet KV3
 */
export function serializeSoundEvent(eventName, properties, options = {}) {
  const {
    includeComments = false,
    lang = "zh",
    customProperties = []
  } = options;

  const validName = (eventName || "SoundEvent_Custom").trim() || "SoundEvent_Custom";
  const i18nTooltips = I18N[lang]?.tooltips || I18N.zh.tooltips;
  const i18nLabels = I18N[lang]?.labels || I18N.zh.labels;

  const lines = [];

  lines.push(`"${validName}" =`);
  lines.push(`{`);

  // Output standard properties
  for (const [key, val] of Object.entries(properties)) {
    const spec = SPECS[key];

    if (includeComments) {
      const commentDesc = i18nTooltips[key] || i18nLabels[key] || "";
      if (commentDesc) {
        lines.push(`\t// ${commentDesc}`);
      }
    }

    const formattedVal = formatKv3Value(key, val, spec);
    lines.push(`\t${key} = ${formattedVal}`);
  }

  // Output custom properties
  if (Array.isArray(customProperties) && customProperties.length > 0) {
    for (const item of customProperties) {
      if (!item.key || !item.key.trim()) continue;
      const k = item.key.trim();
      let v = item.value;

      // Smart parse scalar
      let formatted = `"${v}"`;
      if (v === "true" || v === "false") {
        formatted = v;
      } else if (!isNaN(Number(v)) && v.trim() !== "") {
        let s = Number(v).toString();
        formatted = s.includes(".") ? s : s + ".0";
      }

      if (includeComments && item.comment) {
        lines.push(`\t// ${item.comment}`);
      }
      lines.push(`\t${k} = ${formatted}`);
    }
  }

  lines.push("}");

  return lines.join("\n");
}

/**
 * Parses KV3 text into soundevent structure
 */
export function parseKv3SoundEvent(text) {
  if (!text || typeof text !== "string") return null;

  const clean = text.replace(/<!--[\s\S]*?-->/g, "").replace(/\/\/[^\n]*/g, "").trim();

  let eventName = "";
  const nameMatch = clean.match(/(?:^|\n)\s*["']?([A-Za-z0-9_.]+)["']?\s*=\s*\{/);
  if (nameMatch) {
    eventName = nameMatch[1];
  }

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  let body = clean;
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const innerFirstBrace = clean.indexOf("{", firstBrace + 1);
    const innerLastBrace = clean.lastIndexOf("}", lastBrace - 1);
    if (innerFirstBrace !== -1 && innerLastBrace !== -1 && innerLastBrace > innerFirstBrace) {
      body = clean.substring(innerFirstBrace + 1, innerLastBrace);
    } else {
      body = clean.substring(firstBrace + 1, lastBrace);
    }
  }

  const properties = {};
  const customProperties = [];

  let i = 0;
  while (i < body.length) {
    const eqIdx = body.indexOf("=", i);
    if (eqIdx === -1) break;

    const keyPart = body.substring(i, eqIdx).trim();
    const keyMatch = keyPart.match(/([a-zA-Z0-9_]+)$/);
    if (!keyMatch) {
      i = eqIdx + 1;
      continue;
    }
    const key = keyMatch[1];

    let valStart = eqIdx + 1;
    while (valStart < body.length && /\s/.test(body[valStart])) {
      valStart++;
    }
    if (valStart >= body.length) break;

    let valEnd = valStart;
    const startChar = body[valStart];
    let rawVal = "";

    if (startChar === '"' || startChar === "'") {
      valEnd = body.indexOf(startChar, valStart + 1);
      if (valEnd === -1) valEnd = body.length;
      else valEnd += 1;
      rawVal = body.substring(valStart, valEnd);
      i = valEnd;
    } else if (startChar === "[") {
      let depth = 1;
      valEnd = valStart + 1;
      while (valEnd < body.length && depth > 0) {
        if (body[valEnd] === "[") depth++;
        else if (body[valEnd] === "]") depth--;
        valEnd++;
      }
      rawVal = body.substring(valStart, valEnd);
      i = valEnd;
    } else {
      while (valEnd < body.length && !/[\s,\r\n}]/.test(body[valEnd])) {
        valEnd++;
      }
      rawVal = body.substring(valStart, valEnd);
      i = valEnd;
    }

    let parsedVal;
    rawVal = rawVal.trim();

    if (rawVal.startsWith("[") && rawVal.endsWith("]")) {
      const inner = rawVal.slice(1, -1).trim();
      if (inner.includes("[")) {
        const rows = [];
        const rowRegex = /\[([\s\S]*?)\]/g;
        let rMatch;
        while ((rMatch = rowRegex.exec(inner)) !== null) {
          const nums = rMatch[1].split(/[\s,]+/).filter(Boolean).map(Number);
          if (nums.length >= 2) rows.push(nums);
        }
        parsedVal = rows;
      } else {
        const strMatches = [...inner.matchAll(/["']([^"']*)["']/g)].map(m => m[1]);
        if (strMatches.length > 0) {
          parsedVal = strMatches;
        } else {
          parsedVal = inner.split(/[\s,]+/).filter(Boolean).map(Number);
        }
      }
    } else if (rawVal.startsWith('"') || rawVal.startsWith("'")) {
      parsedVal = rawVal.slice(1, -1);
    } else if (rawVal === "true") {
      parsedVal = true;
    } else if (rawVal === "false") {
      parsedVal = false;
    } else if (!isNaN(Number(rawVal)) && rawVal !== "") {
      parsedVal = Number(rawVal);
    } else {
      parsedVal = rawVal;
    }

    if (SPECS[key]) {
      properties[key] = parsedVal;
    } else {
      customProperties.push({ key, value: String(parsedVal) });
    }
  }

  return {
    eventName: eventName || "SoundEvent_Custom",
    properties,
    customProperties
  };
}

/**
 * Validate KV3 SoundEvent syntax and return error details
 * @param {string} text 
 * @returns {{ valid: boolean, error: string | null, line: number | null, data?: any }}
 */
export function validateKv3(text) {
  if (!text || !text.trim()) {
    return { valid: false, error: "代码不能为空 (KV3 code is empty)", line: 1 };
  }

  const lines = text.split("\n");
  let braceDepth = 0;
  let bracketDepth = 0;
  let lastOpenBraceLine = 1;
  let lastOpenBracketLine = 1;
  let hasEventHeader = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    const rawLine = lines[lineIdx];

    // Strip single line comment
    let line = rawLine;
    const commentIdx = line.indexOf("//");
    if (commentIdx !== -1) {
      line = line.substring(0, commentIdx);
    }
    line = line.trim();
    if (!line) continue;

    // KV3 header comment
    if (line.startsWith("<!--") || line.endsWith("-->")) continue;

    // Check quotes on this line
    let quoteChar = null;
    let inQuote = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"' || ch === "'") {
        if (c > 0 && line[c - 1] === "\\") continue;
        if (!inQuote) {
          inQuote = true;
          quoteChar = ch;
        } else if (ch === quoteChar) {
          inQuote = false;
          quoteChar = null;
        }
      }
    }
    if (inQuote) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 字符串引号未闭合 (Unclosed quote on line ${lineNum})`,
        line: lineNum
      };
    }

    // Scan braces & brackets outside quotes
    inQuote = false;
    quoteChar = null;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"' || ch === "'") {
        if (c > 0 && line[c - 1] === "\\") continue;
        if (!inQuote) { inQuote = true; quoteChar = ch; }
        else if (ch === quoteChar) { inQuote = false; quoteChar = null; }
      }
      if (!inQuote) {
        if (ch === "{") {
          braceDepth++;
          lastOpenBraceLine = lineNum;
        } else if (ch === "}") {
          braceDepth--;
          if (braceDepth < 0) {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 遇到多余的闭合大括号 '}' (Unexpected closing brace '}')`,
              line: lineNum
            };
          }
        } else if (ch === "[") {
          bracketDepth++;
          lastOpenBracketLine = lineNum;
        } else if (ch === "]") {
          bracketDepth--;
          if (bracketDepth < 0) {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 遇到多余的闭合方括号 ']' (Unexpected closing bracket ']')`,
              line: lineNum
            };
          }
        }
      }
    }

    // Key-Value syntax check inside event block
    if (braceDepth >= 1 && bracketDepth === 0) {
      if (line !== "{" && line !== "}" && !line.startsWith("{") && !line.endsWith("}")) {
        if (line.includes("=")) {
          const parts = line.split("=");
          const key = parts[0].trim().replace(/^["']|["']$/g, "");
          const val = parts.slice(1).join("=").trim();
          if (!key) {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 赋值等号前缺少属性键名 (Missing property key before '=')`,
              line: lineNum
            };
          }
          if (!val) {
            // Check if next non-empty line starts with '{' or '['
            let nextHasBracket = false;
            for (let n = lineIdx + 1; n < lines.length; n++) {
              const nLine = lines[n].trim();
              if (!nLine || nLine.startsWith("//")) continue;
              if (nLine.startsWith("{") || nLine.startsWith("[")) {
                nextHasBracket = true;
              }
              break;
            }
            if (!nextHasBracket) {
              return {
                valid: false,
                error: `第 ${lineNum} 行: 属性 "${key}" 缺少对应值 (Missing value for property "${key}")`,
                line: lineNum
              };
            }
          }
        } else if (!line.startsWith("[") && !line.endsWith("]")) {
          // If it's the event name line, e.g. "Event_Name" =
          if (!hasEventHeader && (line.includes("{") || line.endsWith("="))) {
            hasEventHeader = true;
          } else {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 语法格式错误，非有效赋值语句 (Invalid statement on line ${lineNum})`,
              line: lineNum
            };
          }
        }
      }
    }
  }

  if (braceDepth > 0) {
    return {
      valid: false,
      error: `第 ${lastOpenBraceLine} 行的大括号 '{' 缺少匹配的闭合括号 '}' (Unclosed brace '{' from line ${lastOpenBraceLine})`,
      line: lastOpenBraceLine
    };
  }

  if (bracketDepth > 0) {
    return {
      valid: false,
      error: `第 ${lastOpenBracketLine} 行的方括号 '[' 缺少匹配的闭合括号 ']' (Unclosed bracket '[' from line ${lastOpenBracketLine})`,
      line: lastOpenBracketLine
    };
  }

  const parsed = parseKv3SoundEvent(text);
  if (!parsed || (!parsed.eventName && Object.keys(parsed.properties).length === 0)) {
    return {
      valid: false,
      error: `未能检测到有效的 SoundEvent 事件块 (No valid SoundEvent definition found)`,
      line: 1
    };
  }

  return { valid: true, error: null, line: null, data: parsed };
}

/**
 * Format and re-indent KV3 text
 */
export function formatKv3Text(text, options = {}) {
  const result = validateKv3(text);
  if (!result.valid) {
    return { success: false, error: result.error, line: result.line };
  }
  const isSnippet = !text.includes("<!-- kv3");
  const formatted = serializeSoundEvent(result.data.eventName, result.data.properties, {
    isSnippet,
    customProperties: result.data.customProperties,
    ...options
  });
  return { success: true, code: formatted };
}

