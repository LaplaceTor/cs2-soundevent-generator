export type Kv3DiagnosticCode =
  | 'EMPTY_DOCUMENT'
  | 'UNCLOSED_QUOTE'
  | 'UNEXPECTED_SEMICOLON'
  | 'CONSECUTIVE_DOTS'
  | 'CONSECUTIVE_COMMAS'
  | 'LEADING_ARRAY_COMMA'
  | 'INVALID_NUMBER'
  | 'UNEXPECTED_CLOSING_BRACE'
  | 'UNEXPECTED_CLOSING_BRACKET'
  | 'COMMA_OUTSIDE_ARRAY'
  | 'STRAY_DOT'
  | 'MISSING_KEY'
  | 'INVALID_KEY_NAME'
  | 'MISSING_VALUE'
  | 'INVALID_STATEMENT'
  | 'UNCLOSED_BRACE'
  | 'UNCLOSED_BRACKET'
  | 'NO_EVENT_FOUND';

export interface Kv3Diagnostic {
  code: Kv3DiagnosticCode;
  line: number;
  column: number;
  params?: Record<string, string | number>;
}

export type Kv3Value =
  | string
  | number
  | boolean
  | Kv3Value[]
  | { [key: string]: Kv3Value };

export interface Kv3SoundEventDocument {
  eventName: string;
  properties: Record<string, any>;
  customProperties?: Record<string, any>;
}
