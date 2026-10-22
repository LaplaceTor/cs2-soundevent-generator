import { create } from 'zustand';
import { produce } from 'immer';
import type { Kv3Diagnostic, Kv3SoundEventDocument } from '../domain/kv3/types';
import { parseKv3SoundEventDocument } from '../domain/kv3/parser';
import { validateSoundEventDocument } from '../domain/schema/validation';

export type SyncOrigin = 'controls' | 'editor' | 'init' | 'preset';

export type DocumentSyncHandler = (
  document: Kv3SoundEventDocument,
  normalizedProps?: Record<string, any>
) => void;

let documentSyncHandler: DocumentSyncHandler | null = null;

export function registerDocumentSyncHandler(handler: DocumentSyncHandler) {
  documentSyncHandler = handler;
}

export interface EditorState {
  code: string;
  diagnostics: Kv3Diagnostic[];
  fieldErrors: Record<string, string>;
  isEditorDrawerOpen: boolean;

  // Search & Filter & UI navigation
  searchQuery: string;
  filterActiveOnly: boolean;
  expandedGroups: Set<string>;

  // Sync origin tracking
  syncOrigin: SyncOrigin;

  // Actions
  setCode: (code: string, origin?: SyncOrigin) => void;
  setCodeFromControls: (code: string, origin?: SyncOrigin) => void;
  setDiagnostics: (diagnostics: Kv3Diagnostic[], fieldErrors?: Record<string, string>) => void;
  setFieldValidationError: (key: string, diagnostic: Kv3Diagnostic) => void;
  clearFieldValidationError: (key: string) => void;
  setEditorDrawerOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setFilterActiveOnly: (activeOnly: boolean) => void;
  toggleGroupExpanded: (groupId: string) => void;
  expandAllGroups: (allGroupIds: string[]) => void;
  collapseAllGroups: () => void;

  // Deferred parser & validator
  updateCodeFromEditor: (newCode: string) => void;
}

let pendingParseId: number | ReturnType<typeof setTimeout> | null = null;

function cancelPendingParse() {
  if (pendingParseId !== null) {
    if (typeof cancelIdleCallback !== 'undefined' && typeof pendingParseId === 'number') {
      cancelIdleCallback(pendingParseId);
    } else {
      clearTimeout(pendingParseId as any);
    }
    pendingParseId = null;
  }
}

export const useEditorStore = create<EditorState>()((set) => ({
  code: '',
  diagnostics: [],
  fieldErrors: {},
  isEditorDrawerOpen: false,

  searchQuery: '',
  filterActiveOnly: false,
  expandedGroups: new Set(['general', 'playback', 'position']),

  syncOrigin: 'init',

  setCode: (code, origin = 'editor') =>
    set({ code, syncOrigin: origin }),

  setCodeFromControls: (code, origin = 'controls') => {
    cancelPendingParse();
    set({
      code,
      diagnostics: [],
      fieldErrors: {},
      syncOrigin: origin,
    });
  },

  setDiagnostics: (diagnostics, fieldErrors = {}) => {
    if (diagnostics.length > 0 && Object.keys(fieldErrors).length === 0) {
      for (const d of diagnostics) {
        if (d.propertyKey) {
          fieldErrors[d.propertyKey] = d.code;
        }
      }
    }
    set({ diagnostics, fieldErrors });
  },

  setFieldValidationError: (key, diagnostic) =>
    set(
      produce((state: EditorState) => {
        state.fieldErrors[key] = diagnostic.code;
        state.diagnostics = [diagnostic];
      })
    ),

  clearFieldValidationError: (key) =>
    set(
      produce((state: EditorState) => {
        delete state.fieldErrors[key];
        if (Object.keys(state.fieldErrors).length === 0) {
          state.diagnostics = [];
        }
      })
    ),

  setEditorDrawerOpen: (open) => set({ isEditorDrawerOpen: open }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setFilterActiveOnly: (activeOnly) => set({ filterActiveOnly: activeOnly }),

  toggleGroupExpanded: (groupId) =>
    set(
      produce((state: EditorState) => {
        if (state.expandedGroups.has(groupId)) {
          state.expandedGroups.delete(groupId);
        } else {
          state.expandedGroups.add(groupId);
        }
      })
    ),

  expandAllGroups: (allGroupIds) =>
    set(
      produce((state: EditorState) => {
        state.expandedGroups = new Set(allGroupIds);
      })
    ),

  collapseAllGroups: () =>
    set(
      produce((state: EditorState) => {
        state.expandedGroups.clear();
      })
    ),

  updateCodeFromEditor: (newCode: string) => {
    // 1. Immediately update draft code and flag origin
    set({ code: newCode, syncOrigin: 'editor' });

    // 2. Schedule parsing and validation in an idle callback (or low-priority microtask)
    cancelPendingParse();

    const executeParseAndSync = () => {
      pendingParseId = null;

      // Step 1: KV3 Syntax parsing
      const { document, diagnostics: syntaxDiagnostics } = parseKv3SoundEventDocument(newCode);
      if (syntaxDiagnostics.length > 0 || !document) {
        const errors: Record<string, string> = {};
        for (const d of syntaxDiagnostics) {
          if (d.propertyKey) {
            errors[d.propertyKey] = d.code;
          }
        }
        set({ diagnostics: syntaxDiagnostics, fieldErrors: errors });
        return;
      }

      // Step 2: Business validation against SPECS & Dependencies
      const validation = validateSoundEventDocument(document);
      if (!validation.isValid) {
        set({
          diagnostics: validation.diagnostics,
          fieldErrors: validation.fieldErrors,
        });
        return;
      }

      // Step 3: Validation passed - clear editor errors and synchronize to soundevent store
      set({ diagnostics: [], fieldErrors: {} });

      if (documentSyncHandler) {
        documentSyncHandler(document, validation.normalizedProperties);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      pendingParseId = requestIdleCallback(executeParseAndSync, { timeout: 250 });
    } else {
      pendingParseId = setTimeout(executeParseAndSync, 120);
    }
  },
}));
