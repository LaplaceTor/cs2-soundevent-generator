import type { Token } from './tokenizer';
import { tokenizeKv3 } from './tokenizer';
import type { Kv3Diagnostic, Kv3SoundEventDocument, Kv3Value, PropertyLocation } from './types';
import { SPECS } from '../schema/specs';

export function parseKv3SoundEventDocument(input: string): {
  document: Kv3SoundEventDocument | null;
  diagnostics: Kv3Diagnostic[];
} {
  if (!input || !input.trim()) {
    return {
      document: null,
      diagnostics: [{ code: 'EMPTY_DOCUMENT', line: 1, column: 1, stage: 'syntax' }],
    };
  }

  const { tokens, diagnostics } = tokenizeKv3(input);
  if (diagnostics.length > 0) {
    return { document: null, diagnostics };
  }

  let cur = 0;

  function peek(): Token | undefined {
    return tokens[cur];
  }

  function advance(): Token | undefined {
    const t = tokens[cur];
    cur++;
    return t;
  }

  // Skip leading header
  if (peek()?.type === 'HEADER') {
    advance();
  }

  // Expect eventName
  let eventName = 'SoundEvent_Custom.3D';
  const nameToken = peek();
  if (nameToken && (nameToken.type === 'IDENTIFIER' || nameToken.type === 'STRING')) {
    eventName = nameToken.value;
    advance();
  }

  // Expect '='
  if (peek()?.type === 'EQUALS') {
    advance();
  }

  // Expect '{'
  const lbrace = peek();
  if (!lbrace || lbrace.type !== 'LBRACE') {
    return {
      document: null,
      diagnostics: [
        {
          code: 'NO_EVENT_FOUND',
          line: lbrace ? lbrace.line : 1,
          column: lbrace ? lbrace.column : 1,
          stage: 'syntax',
        },
      ],
    };
  }
  advance(); // consume '{'

  const seenKeys = new Map<string, { line: number; column: number }>();
  const properties: Record<string, any> = {};
  const customProperties: Record<string, any> = {};
  const propertyLocations: Record<string, PropertyLocation> = {};

  function parseValue(currentKey?: string): Kv3Value | undefined {
    const t = peek();
    if (!t) return undefined;

    if (t.type === 'STRING') {
      // If immediately followed by '=', this is the key of the next assignment statement
      if (tokens[cur + 1]?.type === 'EQUALS') {
        return undefined;
      }
      advance();
      return t.value;
    }
    if (t.type === 'BOOLEAN') {
      advance();
      return t.value === 'true';
    }
    if (t.type === 'NUMBER') {
      advance();
      return Number(t.value);
    }
    if (t.type === 'IDENTIFIER') {
      // If immediately followed by '=', this is the key of the next assignment statement
      if (tokens[cur + 1]?.type === 'EQUALS') {
        return undefined;
      }
      // In KeyValues3, values cannot be bare/unquoted identifiers
      diagnostics.push({
        code: 'UNQUOTED_VALUE',
        line: t.line,
        column: t.column,
        params: { key: currentKey || t.value, actual: t.value },
        propertyKey: currentKey,
        stage: 'syntax',
      });
      advance();
      return undefined;
    }

    // Array [ ... ]
    if (t.type === 'LBRACKET') {
      const arrLine = t.line;
      const arrCol = t.column;
      advance(); // consume '['

      // Check leading comma
      if (peek()?.type === 'COMMA') {
        diagnostics.push({ code: 'LEADING_ARRAY_COMMA', line: peek()!.line, column: peek()!.column, stage: 'syntax' });
      }

      const elements: Kv3Value[] = [];
      let expectComma = false;

      while (peek() && peek()?.type !== 'RBRACKET') {
        if (peek()?.type === 'COMMA') {
          if (!expectComma) {
            diagnostics.push({ code: 'CONSECUTIVE_COMMAS', line: peek()!.line, column: peek()!.column, stage: 'syntax' });
          }
          advance();
          expectComma = false;
          continue;
        }

        const el = parseValue(currentKey);
        if (el !== undefined) {
          elements.push(el);
          expectComma = true;
        } else {
          break;
        }
      }

      const rbracket = peek();
      if (!rbracket || rbracket.type !== 'RBRACKET') {
        diagnostics.push({ code: 'UNCLOSED_BRACKET', line: arrLine, column: arrCol, stage: 'syntax' });
        return elements;
      }
      advance(); // consume ']'
      return elements;
    }

    return undefined;
  }

  // Parse inner properties
  while (peek() && peek()?.type !== 'RBRACE') {
    const keyToken = peek();
    if (!keyToken) break;

    if (keyToken.type === 'COMMA') {
      diagnostics.push({ code: 'COMMA_OUTSIDE_ARRAY', line: keyToken.line, column: keyToken.column, stage: 'syntax' });
      advance();
      continue;
    }

    if (keyToken.type === 'EQUALS') {
      diagnostics.push({ code: 'MISSING_KEY', line: keyToken.line, column: keyToken.column, stage: 'syntax' });
      advance();
      parseValue();
      continue;
    }

    if (keyToken.type !== 'IDENTIFIER' && keyToken.type !== 'STRING') {
      if (keyToken.type === 'RBRACKET') {
        diagnostics.push({ code: 'UNEXPECTED_CLOSING_BRACKET', line: keyToken.line, column: keyToken.column, stage: 'syntax' });
      } else {
        diagnostics.push({ code: 'INVALID_STATEMENT', line: keyToken.line, column: keyToken.column, stage: 'syntax' });
      }
      advance();
      continue;
    }

    const key = keyToken.value;
    advance();

    // Check duplicate key
    if (seenKeys.has(key)) {
      const prevLoc = seenKeys.get(key)!;
      diagnostics.push({
        code: 'DUPLICATE_KEY',
        line: keyToken.line,
        column: keyToken.column,
        params: { key, firstLine: prevLoc.line },
        propertyKey: key,
        stage: 'syntax',
      });
    } else {
      seenKeys.set(key, { line: keyToken.line, column: keyToken.column });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      diagnostics.push({ code: 'INVALID_KEY_NAME', line: keyToken.line, column: keyToken.column, params: { key }, stage: 'syntax' });
    }

    // Expect '='
    if (peek()?.type !== 'EQUALS') {
      diagnostics.push({ code: 'MISSING_VALUE', line: keyToken.line, column: keyToken.column, params: { key }, propertyKey: key, stage: 'syntax' });
      continue;
    }
    advance(); // consume '='

    const valToken = peek();
    const valLine = valToken ? valToken.line : keyToken.line;
    const valColumn = valToken ? valToken.column : keyToken.column;

    const prevDiagCount = diagnostics.length;
    const val = parseValue(key);
    if (val === undefined) {
      if (diagnostics.length === prevDiagCount) {
        diagnostics.push({ code: 'MISSING_VALUE', line: keyToken.line, column: keyToken.column, params: { key }, propertyKey: key, stage: 'syntax' });
      }
      continue;
    }

    // Record source location for property & value
    propertyLocations[key] = {
      line: keyToken.line,
      column: keyToken.column,
      valueLine: valLine,
      valueColumn: valColumn,
    };

    // Syntax parsing preserves the parsed value without premature normalization
    if (SPECS[key]) {
      properties[key] = val;
    } else {
      customProperties[key] = val;
    }
  }

  const closingBrace = peek();
  if (!closingBrace || closingBrace.type !== 'RBRACE') {
    diagnostics.push({ code: 'UNCLOSED_BRACE', line: lbrace.line, column: lbrace.column, stage: 'syntax' });
  } else {
    advance(); // consume '}'
  }

  // Check for any trailing tokens after the event block
  while (peek()) {
    const extra = advance()!;
    if (extra.type === 'RBRACE') {
      diagnostics.push({ code: 'UNEXPECTED_CLOSING_BRACE', line: extra.line, column: extra.column, stage: 'syntax' });
    } else if (extra.type === 'RBRACKET') {
      diagnostics.push({ code: 'UNEXPECTED_CLOSING_BRACKET', line: extra.line, column: extra.column, stage: 'syntax' });
    } else {
      diagnostics.push({ code: 'INVALID_STATEMENT', line: extra.line, column: extra.column, stage: 'syntax' });
    }
  }

  if (diagnostics.length > 0) {
    return { document: null, diagnostics };
  }

  return {
    document: {
      eventName,
      properties,
      customProperties,
      propertyLocations,
    },
    diagnostics: [],
  };
}
