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

  if (kind === "vector2") {
    if (Array.isArray(val)) {
      const formatted = val.map(n => {
        const num = Number(n) || 0;
        let s = num.toString();
        return s.includes(".") ? s : s + ".0";
      });
      return `[ ${formatted.join(", ")} ]`;
    }
    return `[ 0.8, 0.2 ]`;
  }

  if (kind === "array_string") {
    if (Array.isArray(val)) {
      const items = val.map(s => `\t\t\t"${String(s).replace(/"/g, '\\"')}",`);
      if (items.length === 0) return "[ ]";
      return `[\n${items.join("\n")}\n\t\t]`;
    }
    return `[ "${String(val)}" ]`;
  }

  if (kind === "array_float") {
    if (Array.isArray(val)) {
      const formatted = val.map(n => {
        const num = Number(n) || 0;
        let s = num.toString();
        return s.includes(".") ? s : s + ".0";
      });
      if (formatted.length === 0) return "[ ]";
      return `[ ${formatted.join(", ")} ]`;
    }
    return "[ ]";
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
    lang = "zh"
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
    }
  }

  return {
    eventName: eventName || "SoundEvent_Custom",
    properties
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
  let inMultiLineComment = false;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const lineNum = lineIdx + 1;
    let rawLine = lines[lineIdx];

    // Handle multi-line block comments /* ... */
    if (inMultiLineComment) {
      const endCmt = rawLine.indexOf("*/");
      if (endCmt !== -1) {
        rawLine = rawLine.substring(endCmt + 2);
        inMultiLineComment = false;
      } else {
        continue;
      }
    }

    while (rawLine.includes("/*")) {
      const startCmt = rawLine.indexOf("/*");
      const endCmt = rawLine.indexOf("*/", startCmt + 2);
      if (endCmt !== -1) {
        rawLine = rawLine.substring(0, startCmt) + rawLine.substring(endCmt + 2);
      } else {
        rawLine = rawLine.substring(0, startCmt);
        inMultiLineComment = true;
        break;
      }
    }

    // Strip single line comment //
    const commentIdx = rawLine.indexOf("//");
    let line = commentIdx !== -1 ? rawLine.substring(0, commentIdx) : rawLine;
    line = line.trim();
    if (!line) continue;

    // KV3 encoding header line (e.g. <!-- kv3 ... -->)
    if (line.startsWith("<!--") || line.endsWith("-->")) continue;

    // Check quotes and extract unquoted content
    let quoteChar = null;
    let inQuote = false;
    let unquoted = "";

    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"' || ch === "'") {
        if (c > 0 && line[c - 1] === "\\") {
          // escaped quote
          continue;
        }
        if (!inQuote) {
          inQuote = true;
          quoteChar = ch;
        } else if (ch === quoteChar) {
          inQuote = false;
          quoteChar = null;
        }
        continue;
      }
      if (!inQuote) {
        unquoted += ch;
      }
    }

    if (inQuote) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 字符串引号未闭合 (Unclosed quote on line ${lineNum})`,
        line: lineNum
      };
    }

    // Check for stray semicolons (CS2 KV3 never uses ';')
    if (unquoted.includes(";")) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 遇到多余的分号 ';'，CS2 KV3 语法不使用分号 (Unexpected semicolon ';')`,
        line: lineNum
      };
    }

    // Check for consecutive dots '..' outside quotes
    if (/\.\./.test(unquoted)) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 遇到多余的点号 '..' (Unexpected consecutive dots '..')`,
        line: lineNum
      };
    }

    // Check for consecutive commas in arrays
    if (/,\s*,/.test(unquoted)) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 数组中存在多余的连续逗号 ',,' (Unexpected consecutive commas in array)`,
        line: lineNum
      };
    }

    // Check for leading comma right after opening bracket '[ ,'
    if (/\[\s*,/.test(unquoted)) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 数组起始处遇到多余的逗号 ',' (Unexpected leading comma after '[')`,
        line: lineNum
      };
    }

    // Check for multiple dots in numeric tokens (e.g. 1.0.0)
    if (/\b\d+(\.\d+){2,}\b/.test(unquoted)) {
      return {
        valid: false,
        error: `第 ${lineNum} 行: 数值格式错误，包含多个小数点 (Invalid number format with multiple decimal points)`,
        line: lineNum
      };
    }

    // Character-by-character scan on unquoted line
    for (let i = 0; i < unquoted.length; i++) {
      const ch = unquoted[i];

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
      } else if (ch === ",") {
        // Commas outside arrays are strictly forbidden in KV3!
        if (bracketDepth === 0) {
          return {
            valid: false,
            error: `第 ${lineNum} 行: 遇到多余的逗号 ','，对象属性间严禁使用逗号分隔 (Unexpected comma ',' outside array)`,
            line: lineNum
          };
        }
      } else if (ch === ".") {
        // Outside quotes, a dot MUST be a decimal point preceded by digit and followed by digit
        const prevChar = i > 0 ? unquoted[i - 1] : "";
        const nextChar = i < unquoted.length - 1 ? unquoted[i + 1] : "";
        const isPrevDigit = /\d/.test(prevChar);
        const isNextDigit = /\d/.test(nextChar);
        if (!isPrevDigit || !isNextDigit) {
          return {
            valid: false,
            error: `第 ${lineNum} 行: 遇到多余或孤立的点号 '.'，浮点数必须包含整数位与小数位 (Unexpected stray dot '.')`,
            line: lineNum
          };
        }
      }
    }

    // Statement / assignment check inside event block
    if (braceDepth >= 1 && bracketDepth === 0) {
      const trimmedLine = unquoted.trim();
      if (trimmedLine !== "{" && trimmedLine !== "}" && !trimmedLine.startsWith("{") && !trimmedLine.endsWith("}")) {
        if (trimmedLine.includes("=")) {
          const eqIdx = line.indexOf("=");
          const keyPart = line.substring(0, eqIdx).trim();
          const valPart = line.substring(eqIdx + 1).trim();

          const cleanKey = keyPart.replace(/^["']|["']$/g, "").trim();
          if (!cleanKey) {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 赋值等号前缺少属性键名 (Missing property key before '=')`,
              line: lineNum
            };
          }

          // Key cannot contain stray symbols
          if (!/^[a-zA-Z0-9_]+$/.test(cleanKey)) {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 属性键名 "${cleanKey}" 包含无效符号 (Invalid property key name "${cleanKey}")`,
              line: lineNum
            };
          }

          if (!valPart) {
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
                error: `第 ${lineNum} 行: 属性 "${cleanKey}" 缺少对应值 (Missing value for property "${cleanKey}")`,
                line: lineNum
              };
            }
          }
        } else if (!trimmedLine.startsWith("[") && !trimmedLine.endsWith("]")) {
          // If it's the event name line, e.g. "Event_Name" =
          if (!hasEventHeader && (line.includes("{") || line.endsWith("="))) {
            hasEventHeader = true;
          } else {
            return {
              valid: false,
              error: `第 ${lineNum} 行: 语法格式错误，非有效赋值语句或存在多余符号 (Invalid statement or unexpected symbol on line ${lineNum})`,
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
    ...options
  });
  return { success: true, code: formatted };
}

