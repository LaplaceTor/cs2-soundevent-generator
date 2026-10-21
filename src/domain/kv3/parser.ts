import type { Token } from './tokenizer';
import { tokenizeKv3 } from './tokenizer';
import type { Kv3Diagnostic, Kv3SoundEventDocument, Kv3Value } from './types';
import { SPECS } from '../schema/specs';

export function parseKv3SoundEventDocument(input: string): {
  document: Kv3SoundEventDocument | null;
  diagnostics: Kv3Diagnostic[];
} {
  if (!input || !input.trim()) {
    return {
      document: null,
      diagnostics: [{ code: 'EMPTY_DOCUMENT', line: 1, column: 1 }],
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
        },
      ],
    };
  }
  advance(); // consume '{'

  const properties: Record<string, any> = {};
  const customProperties: Record<string, any> = {};

  function parseValue(): Kv3Value | undefined {
    const t = peek();
    if (!t) return undefined;

    if (t.type === 'STRING') {
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
      advance();
      return t.value;
    }

    // Array [ ... ]
    if (t.type === 'LBRACKET') {
      const arrLine = t.line;
      const arrCol = t.column;
      advance(); // consume '['

      // Check leading comma
      if (peek()?.type === 'COMMA') {
        diagnostics.push({ code: 'LEADING_ARRAY_COMMA', line: peek()!.line, column: peek()!.column });
      }

      const elements: Kv3Value[] = [];
      let expectComma = false;

      while (peek() && peek()?.type !== 'RBRACKET') {
        if (peek()?.type === 'COMMA') {
          if (!expectComma) {
            diagnostics.push({ code: 'CONSECUTIVE_COMMAS', line: peek()!.line, column: peek()!.column });
          }
          advance();
          expectComma = false;
          continue;
        }

        const el = parseValue();
        if (el !== undefined) {
          elements.push(el);
          expectComma = true;
        } else {
          break;
        }
      }

      const rbracket = peek();
      if (!rbracket || rbracket.type !== 'RBRACKET') {
        diagnostics.push({ code: 'UNCLOSED_BRACKET', line: arrLine, column: arrCol });
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
      diagnostics.push({ code: 'COMMA_OUTSIDE_ARRAY', line: keyToken.line, column: keyToken.column });
      advance();
      continue;
    }

    if (keyToken.type !== 'IDENTIFIER' && keyToken.type !== 'STRING') {
      diagnostics.push({ code: 'INVALID_STATEMENT', line: keyToken.line, column: keyToken.column });
      advance();
      continue;
    }

    const key = keyToken.value;
    advance();

    // Expect '='
    if (peek()?.type !== 'EQUALS') {
      diagnostics.push({ code: 'MISSING_VALUE', line: keyToken.line, column: keyToken.column, params: { key } });
      continue;
    }
    advance(); // consume '='

    const val = parseValue();
    if (val === undefined) {
      diagnostics.push({ code: 'MISSING_VALUE', line: keyToken.line, column: keyToken.column, params: { key } });
      continue;
    }

    // Spec normalization
    const spec = SPECS[key];
    if (spec) {
      if (spec.kind === 'float_bool' || spec.kind === 'int_bool') {
        properties[key] = typeof val === 'number' ? val > 0 : Boolean(val);
      } else if (spec.kind === 'string_bool') {
        properties[key] = String(val) === 'true';
      } else {
        properties[key] = val;
      }
    } else {
      // Unknown/Custom property preserved intact!
      customProperties[key] = val;
    }
  }

  const closingBrace = peek();
  if (!closingBrace || closingBrace.type !== 'RBRACE') {
    diagnostics.push({ code: 'UNCLOSED_BRACE', line: lbrace.line, column: lbrace.column });
  } else {
    advance(); // consume '}'
  }

  if (diagnostics.length > 0) {
    return { document: null, diagnostics };
  }

  return {
    document: {
      eventName,
      properties,
      customProperties,
    },
    diagnostics: [],
  };
}
