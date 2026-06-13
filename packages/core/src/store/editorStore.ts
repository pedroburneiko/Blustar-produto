/**
 * editorStore — store central do editor (Zustand + Immer + zundo).
 *
 * Slices:
 *   - `document`  → estado historiável (undo/redo).
 *   - `selection` → efêmero (não entra no histórico).
 *   - `ui`        → efêmero (board ativo, etc.).
 *
 * O histórico (zundo/temporal) cobre só `document` via partialize + equality
 * (ver ./history). Use os helpers `undo()`/`redo()`/`clearHistory()`.
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';

import { createDocument, createPage } from '../model/factories.js';
import type { BrandDocument, Id, Layer, Page } from '../model/types.js';
import {
  HISTORY_COALESCE_MS,
  HISTORY_LIMIT,
  debounce,
  historyEquality,
  partializeForHistory,
} from './history.js';

export interface Selection {
  pageId: Id | null;
  layerIds: Id[];
}

export interface UiState {
  activeBoardId: Id | null;
}

export interface EditorState {
  // --- slices ---
  document: BrandDocument;
  selection: Selection;
  ui: UiState;

  // --- ações de documento (historiáveis) ---
  setDocument: (doc: BrandDocument) => void;
  addPage: (boardId: Id, name?: string, parentId?: Id | null) => Page;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: Id, patch: Partial<Layer>) => void;
  removeLayer: (id: Id) => void;
  setToken: (name: string, value: string) => void;
  removeToken: (name: string) => void;

  // --- ações efêmeras ---
  selectLayers: (ids: Id[]) => void;
  clearSelection: () => void;
  setActivePage: (pageId: Id | null) => void;
  setActiveBoard: (boardId: Id | null) => void;
}

function initialState(doc?: BrandDocument): Pick<EditorState, 'document' | 'selection' | 'ui'> {
  const document = doc ?? createDocument();
  return {
    document,
    selection: { pageId: null, layerIds: [] },
    ui: { activeBoardId: document.boards[0] ?? null },
  };
}

export const useEditorStore = create<EditorState>()(
  temporal(
    immer((set) => ({
      ...initialState(),

      // ----- documento -----
      setDocument: (doc) =>
        set((state) => {
          state.document = doc;
        }),

      addPage: (boardId, name = 'Nova página', parentId = null) => {
        const page: Page = createPage(boardId, name, parentId);
        set((state) => {
          state.document.entities.pages[page.id] = page;
          state.document.entities.boards[boardId]?.pages.push(page.id);
        });
        return page;
      },

      addLayer: (layer) =>
        set((state) => {
          state.document.entities.layers[layer.id] = layer;
          if (layer.parentId) {
            state.document.entities.layers[layer.parentId]?.children.push(layer.id);
          } else {
            state.document.entities.pages[layer.pageId]?.roots.push(layer.id);
          }
        }),

      updateLayer: (id, patch) =>
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (!layer) return;
          // patch nunca traz id/type; merge raso é suficiente para as props do modelo.
          Object.assign(layer, patch);
        }),

      removeLayer: (id) =>
        set((state) => {
          const layers = state.document.entities.layers;
          const target = layers[id];
          if (!target) return;

          // desliga do pai (parent.children ou page.roots)
          if (target.parentId) {
            const parent = layers[target.parentId];
            if (parent) parent.children = parent.children.filter((c) => c !== id);
          } else {
            const page = state.document.entities.pages[target.pageId];
            if (page) page.roots = page.roots.filter((r) => r !== id);
          }

          // remove a subárvore inteira
          const stack: Id[] = [id];
          while (stack.length) {
            const cur = stack.pop()!;
            const node = layers[cur];
            if (!node) continue;
            stack.push(...node.children);
            delete layers[cur];
          }
        }),

      setToken: (name, value) =>
        set((state) => {
          state.document.tokens.vars[name] = value;
        }),

      removeToken: (name) =>
        set((state) => {
          delete state.document.tokens.vars[name];
        }),

      // ----- efêmero (não historiável) -----
      selectLayers: (ids) =>
        set((state) => {
          state.selection.layerIds = ids;
        }),

      clearSelection: () =>
        set((state) => {
          state.selection.layerIds = [];
        }),

      setActivePage: (pageId) =>
        set((state) => {
          state.selection.pageId = pageId;
        }),

      setActiveBoard: (boardId) =>
        set((state) => {
          state.ui.activeBoardId = boardId;
        }),
    })),
    {
      limit: HISTORY_LIMIT,
      partialize: partializeForHistory,
      equality: historyEquality,
      // coalesce mutações rápidas num único passo de histórico (à la 600ms do SPEC)
      handleSet: (handleSet) =>
        debounce(
          handleSet as (...args: unknown[]) => void,
          HISTORY_COALESCE_MS,
        ) as typeof handleSet,
    },
  ),
);

/** Store temporal (zundo) — acesso ao histórico fora de componentes. */
export const editorTemporal = useEditorStore.temporal;

/** Desfaz o último passo de documento. */
export function undo(): void {
  editorTemporal.getState().undo();
}

/** Refaz o passo desfeito. */
export function redo(): void {
  editorTemporal.getState().redo();
}

/** Limpa o histórico (ex.: ao abrir/trocar de documento). */
export function clearHistory(): void {
  editorTemporal.getState().clear();
}

export function canUndo(): boolean {
  return editorTemporal.getState().pastStates.length > 0;
}

export function canRedo(): boolean {
  return editorTemporal.getState().futureStates.length > 0;
}

/** Reinicia a store para um documento novo/dado (limpa histórico e seleção). */
export function resetEditor(doc?: BrandDocument): void {
  useEditorStore.setState(initialState(doc));
  clearHistory();
}
