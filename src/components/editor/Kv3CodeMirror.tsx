import React, { useEffect, useRef, useCallback } from 'react';
import { EditorState, StateEffect, StateField, Compartment } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  gutter,
  GutterMarker,
} from '@codemirror/view';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { kv3Language } from './kv3Language';
import { kv3AutocompleteExtension } from './kv3Autocomplete';
import { useSoundEventStore } from '@/store/useSoundEventStore';

interface Kv3CodeMirrorProps {
  value: string;
  onChange: (val: string) => void;
  onCursorChange?: (line: number, col: number) => void;
  errorLine?: number | null;
}

export const setErrorLineEffect = StateEffect.define<number | null>();

class ErrorMarker extends GutterMarker {
  toDOM() {
    const el = document.createElement('div');
    el.className = 'gutter-error-line';
    return el;
  }
}

const errorLineState = StateField.define<number | null>({
  create() {
    return null;
  },
  update(val, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setErrorLineEffect)) {
        return effect.value;
      }
    }
    return val;
  },
});

const errorGutterExtension = gutter({
  class: 'cm-error-gutter',
  lineMarker(view, line) {
    const errLine = view.state.field(errorLineState);
    const lineNum = view.state.doc.lineAt(line.from).number;
    if (lineNum === errLine) {
      return new ErrorMarker();
    }
    return null;
  },
});

function createMinimalistTheme(theme: 'dark' | 'light') {
  return EditorView.theme({
    '&': {
      height: '100%',
      fontSize: '12px',
      fontFamily: 'JetBrains Mono, monospace',
      backgroundColor: 'transparent',
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily: 'inherit',
      lineHeight: '20px',
    },
    '.cm-content': {
      padding: '16px',
      caretColor: theme === 'dark' ? '#F9FAFB' : '#111827',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: theme === 'dark' ? '#F9FAFB' : '#111827',
    },
    '.cm-gutters': {
      backgroundColor: theme === 'dark' ? 'rgba(11, 15, 23, 0.4)' : 'rgba(249, 250, 251, 0.6)',
      color: theme === 'dark' ? '#6B7280' : '#9CA3AF',
      borderRight: theme === 'dark' ? '1px solid rgba(31, 41, 55, 0.6)' : '1px solid #F3F4F6',
      width: '48px',
      userSelect: 'none',
      transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      paddingRight: '8px',
      textAlign: 'right',
    },
    '.gutter-error-line': {
      backgroundColor: '#EF4444 !important',
      color: '#FFFFFF !important',
      fontWeight: 'bold',
      borderRadius: '2px',
    },
  });
}

export const Kv3CodeMirror: React.FC<Kv3CodeMirrorProps> = ({
  value,
  onChange,
  onCursorChange,
  errorLine,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const themeCompartment = useRef(new Compartment());
  const theme = useSoundEventStore((s) => s.theme);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pendingValueRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flushPendingChange = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (pendingValueRef.current !== null) {
      const pending = pendingValueRef.current;
      pendingValueRef.current = null;
      onChangeRef.current(pending);
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const newCode = update.state.doc.toString();
        pendingValueRef.current = newCode;
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
          debounceTimerRef.current = null;
          if (pendingValueRef.current !== null) {
            const pending = pendingValueRef.current;
            pendingValueRef.current = null;
            onChangeRef.current(pending);
          }
        }, 120);
      }
      if (update.selectionSet || update.docChanged) {
        const pos = update.state.selection.main.head;
        const line = update.state.doc.lineAt(pos);
        if (onCursorChange) {
          onCursorChange(line.number, pos - line.from + 1);
        }
      }
    });

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        EditorView.lineWrapping,
        kv3Language,
        kv3AutocompleteExtension,
        errorLineState,
        errorGutterExtension,
        updateListener,
        EditorView.domEventHandlers({
          blur: () => {
            flushPendingChange();
          },
        }),
        keymap.of([...defaultKeymap, indentWithTab]),
        themeCompartment.current.of(createMinimalistTheme(theme)),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      flushPendingChange();
      view.destroy();
    };
  }, [flushPendingChange]);

  // Sync theme changes dynamically
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: themeCompartment.current.reconfigure(createMinimalistTheme(theme)),
    });
  }, [theme]);

  // Sync external value changes to CodeMirror (with cursor position preservation)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      pendingValueRef.current = null;

      const selection = view.state.selection;
      const newLength = value.length;
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
        selection: {
          anchor: Math.min(selection.main.anchor, newLength),
          head: Math.min(selection.main.head, newLength),
        },
      });
    }
  }, [value]);

  // Sync error line highlighting
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: setErrorLineEffect.of(errorLine ?? null),
    });
  }, [errorLine]);

  return <div ref={containerRef} className="w-full h-full overflow-hidden" />;
};
