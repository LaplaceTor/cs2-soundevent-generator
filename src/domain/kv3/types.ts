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
  | 'NO_EVENT_FOUND'
  | 'DUPLICATE_KEY'
  | 'INVALID_PROPERTY_NUMBER'
  | 'VALUE_OUT_OF_RANGE'
  | 'INVALID_BOOLEAN'
  | 'INVALID_TYPE'
  | 'INVALID_VECTOR_DIMENSION'
  | 'INVALID_WEIGHTS_DIMENSION'
  | 'INVALID_CURVE_FORMAT'
  | 'UNSUPPORTED_PROPERTY_VALUE'
  | 'INVALID_MIN_MAX_PAIR'
  | 'CHILD_MISSING_PARENT'
  | 'MISSING_REQUIRED_PROPERTY';

export interface Kv3Diagnostic {
  code: Kv3DiagnosticCode;
  line: number;
  column: number;
  params?: Record<string, string | number>;
  propertyKey?: string;
  stage?: 'syntax' | 'validation';
}

export type Kv3Value =
  | string
  | number
  | boolean
  | Kv3Value[]
  | { [key: string]: Kv3Value };

export interface PropertyLocation {
  line: number;
  column: number;
  valueLine?: number;
  valueColumn?: number;
}

export interface Kv3SoundEventDocument {
  eventName: string;
  properties: Record<string, any>;
  customProperties?: Record<string, any>;
  propertyLocations?: Record<string, PropertyLocation>;
}
