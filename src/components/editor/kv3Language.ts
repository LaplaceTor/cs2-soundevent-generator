import { StreamLanguage } from '@codemirror/language';

export const kv3Language = StreamLanguage.define({
  token(stream) {
    if (stream.eatSpace()) return null;

    // Header <!-- kv3 ... -->
    if (stream.match('<!--')) {
      stream.skipToEnd();
      return 'meta';
    }

    // Line comment
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Block comment
    if (stream.match('/*')) {
      while (!stream.match('*/', false)) {
        if (!stream.next()) break;
      }
      stream.match('*/');
      return 'comment';
    }

    // String
    if (stream.match(/^"([^"\\]|\\.)*"/)) {
      return 'string';
    }
    if (stream.match(/^'([^'\\]|\\.)*'/)) {
      return 'string';
    }

    // Numbers
    if (stream.match(/^[+-]?\d+(\.\d+)?/)) {
      return 'number';
    }

    // Boolean
    if (stream.match(/^true\b/) || stream.match(/^false\b/)) {
      return 'atom';
    }

    // Punctuation
    if (stream.match(/^[{}[\],=]/)) {
      return 'punctuation';
    }

    // Property Key / Identifier
    if (stream.match(/^[a-zA-Z0-9_.]+/)) {
      return 'variableName';
    }

    stream.next();
    return null;
  },
});
