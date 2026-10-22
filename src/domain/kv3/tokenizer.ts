import type { Kv3Diagnostic } from './types';

export type TokenType =
  | 'IDENTIFIER'
  | 'STRING'
  | 'NUMBER'
  | 'BOOLEAN'
  | 'EQUALS'
  | 'LBRACE'
  | 'RBRACE'
  | 'LBRACKET'
  | 'RBRACKET'
  | 'COMMA'
  | 'HEADER';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

export function tokenizeKv3(input: string): { tokens: Token[]; diagnostics: Kv3Diagnostic[] } {
  const tokens: Token[] = [];
  const diagnostics: Kv3Diagnostic[] = [];

  let line = 1;
  let column = 1;
  let i = 0;

  while (i < input.length) {
    const ch = input[i];
    if (!ch) {
      i++;
      continue;
    }

    // Handle newlines
    if (ch === '\n') {
      line++;
      column = 1;
      i++;
      continue;
    }

    if (ch === '\r') {
      i++;
      continue;
    }

    // Whitespace
    if (/\s/.test(ch)) {
      column++;
      i++;
      continue;
    }

    // Header <!-- kv3 ... -->
    if (ch === '<' && input.startsWith('<!--', i)) {
      const endIdx = input.indexOf('-->', i);
      const tokenLine = line;
      const tokenCol = column;
      if (endIdx === -1) {
        tokens.push({ type: 'HEADER', value: input.substring(i), line: tokenLine, column: tokenCol });
        i = input.length;
      } else {
        const headerStr = input.substring(i, endIdx + 3);
        tokens.push({ type: 'HEADER', value: headerStr, line: tokenLine, column: tokenCol });
        const linesCount = headerStr.split('\n').length - 1;
        line += linesCount;
        i = endIdx + 3;
        column = 1;
      }
      continue;
    }

    // Single line comment //
    if (ch === '/' && input[i + 1] === '/') {
      const nextNl = input.indexOf('\n', i);
      if (nextNl === -1) {
        i = input.length;
      } else {
        i = nextNl; // will increment line on next iter
      }
      continue;
    }

    // Multi-line block comment /* ... */
    if (ch === '/' && input[i + 1] === '*') {
      const endCmt = input.indexOf('*/', i + 2);
      if (endCmt === -1) {
        i = input.length;
      } else {
        const cmtContent = input.substring(i, endCmt + 2);
        const linesCount = cmtContent.split('\n').length - 1;
        line += linesCount;
        i = endCmt + 2;
      }
      continue;
    }

    // Standalone slash (invalid syntax in KV3, must be handled so it does not cause an infinite loop)
    if (ch === '/') {
      diagnostics.push({
        code: 'INVALID_STATEMENT',
        line,
        column,
      });
      column++;
      i++;
      continue;
    }

    // Semicolon check
    if (ch === ';') {
      diagnostics.push({
        code: 'UNEXPECTED_SEMICOLON',
        line,
        column,
      });
      column++;
      i++;
      continue;
    }

    // Single character tokens
    if (ch === '=') {
      tokens.push({ type: 'EQUALS', value: '=', line, column });
      column++;
      i++;
      continue;
    }
    if (ch === '{') {
      tokens.push({ type: 'LBRACE', value: '{', line, column });
      column++;
      i++;
      continue;
    }
    if (ch === '}') {
      tokens.push({ type: 'RBRACE', value: '}', line, column });
      column++;
      i++;
      continue;
    }
    if (ch === '[') {
      tokens.push({ type: 'LBRACKET', value: '[', line, column });
      column++;
      i++;
      continue;
    }
    if (ch === ']') {
      tokens.push({ type: 'RBRACKET', value: ']', line, column });
      column++;
      i++;
      continue;
    }
    if (ch === ',') {
      tokens.push({ type: 'COMMA', value: ',', line, column });
      column++;
      i++;
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'") {
      const quoteChar = ch;
      const startLine = line;
      const startCol = column;
      let strVal = '';
      i++;
      column++;
      let closed = false;

      while (i < input.length) {
        const c = input[i];
        if (c === '\n' || c === '\r') {
          // KV3 soundevent strings cannot span across unescaped newlines.
          // Hitting a newline indicates an unclosed string on this line.
          break;
        }

        if (c === '\\' && i + 1 < input.length) {
          strVal += input[i + 1];
          i += 2;
          column += 2;
          continue;
        }

        if (c === quoteChar) {
          closed = true;
          i++;
          column++;
          break;
        }

        strVal += c;
        i++;
        column++;
      }

      if (!closed) {
        diagnostics.push({
          code: 'UNCLOSED_QUOTE',
          line: startLine,
          column: startCol,
        });
      }

      tokens.push({ type: 'STRING', value: strVal, line: startLine, column: startCol });
      continue;
    }

    // Numbers & Booleans & Identifiers
    const startLine = line;
    const startCol = column;
    let word = '';
    while (i < input.length) {
      const charAt = input[i];
      if (charAt && !/[\s=\/{}\[\],;"']/.test(charAt)) {
        word += charAt;
        i++;
        column++;
      } else {
        break;
      }
    }

    // Defensive check: if no character was consumed, advance by 1 to prevent infinite loops
    if (word === '') {
      diagnostics.push({
        code: 'INVALID_STATEMENT',
        line: startLine,
        column: startCol,
      });
      i++;
      column++;
      continue;
    }

    if (word === '.') {
      diagnostics.push({
        code: 'STRAY_DOT',
        line: startLine,
        column: startCol,
      });
      tokens.push({ type: 'IDENTIFIER', value: word, line: startLine, column: startCol });
      continue;
    }

    if (word === 'true' || word === 'false') {
      tokens.push({ type: 'BOOLEAN', value: word, line: startLine, column: startCol });
      continue;
    }

    // Check for strict number format (e.g. 100, -1.0, 1.25, 1e-4)
    if (/^[+-]?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(word)) {
      tokens.push({ type: 'NUMBER', value: word, line: startLine, column: startCol });
      continue;
    }

    // Check if invalid consecutive dots (e.g. 1.0.0 or ..)
    if (/\.\./.test(word)) {
      diagnostics.push({
        code: 'CONSECUTIVE_DOTS',
        line: startLine,
        column: startCol,
      });
    }

    // Malformed number check (starts with digit or sign, or trailing/leading dot: 12abc, 1., .5, --1)
    if (/^[+-]?\d/.test(word) || /^[+-]\.?\d/.test(word) || /^\d+\.$/.test(word) || /^\.\d+$/.test(word)) {
      diagnostics.push({
        code: 'INVALID_NUMBER',
        line: startLine,
        column: startCol,
      });
      tokens.push({ type: 'NUMBER', value: word, line: startLine, column: startCol });
      continue;
    }

    if (/\b\d+(\.\d+){2,}\b/.test(word)) {
      diagnostics.push({
        code: 'INVALID_NUMBER',
        line: startLine,
        column: startCol,
      });
    }

    tokens.push({ type: 'IDENTIFIER', value: word, line: startLine, column: startCol });
  }

  return { tokens, diagnostics };
}
