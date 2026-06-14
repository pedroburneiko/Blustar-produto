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
import type {
  BrandDocument,
  FontProps,
  Id,
  Interaction,
  Layer,
  LayerBox,
  LayerRect,
  LayerStyle,
  Page,
} from '../model/types.js';
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
  /** Gesto de manipulação direta em andamento (efêmero, fora do undo). */
  interaction: Interaction | null;
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
  /** Merge raso em layer.style (cria se ausente). */
  updateLayerStyle: (id: Id, patch: Partial<LayerStyle>) => void;
  /** Merge raso em layer.box (cria se ausente). */
  updateLayerBox: (id: Id, patch: Partial<LayerBox>) => void;
  /** Merge raso na fonte de uma layer de texto/botão (cria se ausente). */
  updateLayerFont: (id: Id, patch: Partial<FontProps>) => void;
  /** Commit de posição (1 entrada de histórico — chamar no fim do gesto). */
  moveLayer: (id: Id, pos: { x: number; y: number }) => void;
  /** Commit de geometria (1 entrada de histórico — chamar no fim do gesto). */
  resizeLayer: (id: Id, rect: LayerRect) => void;
  removeLayer: (id: Id) => void;
  setToken: (name: string, value: string) => void;
  removeToken: (name: string) => void;

  // --- ações efêmeras ---
  selectLayers: (ids: Id[]) => void;
  clearSelection: () => void;
  setActivePage: (pageId: Id | null) => void;
  setActiveBoard: (boardId: Id | null) => void;
  /** Inicia um gesto de drag/resize (preview efêmero, fora do undo). */
  beginInteraction: (interaction: Interaction) => void;
  /** Atualiza o preview (e guias) do gesto em andamento. */
  updateInteraction: (patch: Partial<Pick<Interaction, 'preview' | 'guides'>>) => void;
  /** Encerra o gesto (limpa o estado efêmero). */
  endInteraction: () => void;
}

function initialState(doc?: BrandDocument): Pick<EditorState, 'document' | 'selection' | 'ui'> {
  const document = doc ?? createDocument();
  return {
    document,
    selection: { pageId: null, layerIds: [] },
    ui: { activeBoardId: document.boards[0] ?? null, interaction: null },
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

      updateLayerStyle: (id, patch) =>
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (!layer) return;
          layer.style = { ...layer.style, ...patch };
        }),

      updateLayerBox: (id, patch) =>
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (!layer) return;
          layer.box = { ...layer.box, ...patch };
        }),

      updateLayerFont: (id, patch) =>
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (!layer || (layer.type !== 'text' && layer.type !== 'button')) return;
          layer.font = { ...layer.font, ...patch };
        }),

      moveLayer: (id, pos) =>
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (!layer || !layer.rect) return;
          layer.rect.x = pos.x;
          layer.rect.y = pos.y;
        }),

      resizeLayer: (id, rect) =>
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (!layer) return;
          layer.rect = { ...rect };
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

      // Gesto de manipulação direta — só toca o slice `ui` (efêmero): como o
      // `document` não muda, o histórico (zundo) não registra nada aqui.
      beginInteraction: (interaction) =>
        set((state) => {
          state.ui.interaction = interaction;
        }),

      updateInteraction: (patch) =>
        set((state) => {
          if (!state.ui.interaction) return;
          if (patch.preview) state.ui.interaction.preview = patch.preview;
          if (patch.guides) state.ui.interaction.guides = patch.guides;
        }),

      endInteraction: () =>
        set((state) => {
          state.ui.interaction = null;
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
