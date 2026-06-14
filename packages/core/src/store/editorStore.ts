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

import { create, useStore } from 'zustand';
import { temporal } from 'zundo';
import { immer } from 'zustand/middleware/immer';

import { createDocument, createId, createPage } from '../model/factories.js';
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
  HISTORY_LIMIT,
  historyController,
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
  /** Renomeia uma página (coalescido no histórico, como texto). */
  renamePage: (id: Id, name: string) => void;
  /** Cria uma sub-página de `parentId` (um nível). */
  addSubPage: (parentId: Id, name?: string) => Page | null;
  /** Duplica a página (com suas layers e sub-páginas diretas). */
  duplicatePage: (id: Id) => Page | null;
  /** Remove a página, suas layers e sub-páginas; corrige a seleção. */
  removePage: (id: Id) => void;
  /** Reordena/aninha uma página em relação a um alvo (1 nível). */
  movePage: (id: Id, targetId: Id, position: 'before' | 'after' | 'inside') => void;
  addLayer: (layer: Layer) => void;
  updateLayer: (id: Id, patch: Partial<Layer>) => void;
  /** Edição de TEXTO livre (nome/conteúdo/label/src) — coalescida no histórico. */
  updateLayerText: (id: Id, patch: Partial<Layer>) => void;
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
  /** Duplica uma layer (com filhos); offset leve se absoluta. Retorna o novo id. */
  duplicateLayer: (id: Id) => Id | null;
  /** Move uma layer absoluta por (dx,dy); coalescido (burst de setas = 1 entrada). */
  nudgeLayer: (id: Id, dx: number, dy: number) => void;
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

/** Clona uma subárvore de layer (ids novos); retorna o id da nova raiz. */
function cloneLayerSubtree(doc: BrandDocument, srcId: Id): Id {
  const ids: Id[] = [];
  const collect = (id: Id) => {
    ids.push(id);
    doc.entities.layers[id]?.children.forEach(collect);
  };
  collect(srcId);
  const map = new Map<Id, Id>(ids.map((id) => [id, createId('layer')]));
  for (const oldId of ids) {
    const l = doc.entities.layers[oldId];
    const clone = JSON.parse(JSON.stringify(l)) as Layer;
    clone.id = map.get(oldId)!;
    clone.parentId = l.parentId && map.has(l.parentId) ? map.get(l.parentId)! : l.parentId;
    clone.children = l.children.map((c) => map.get(c)!).filter(Boolean);
    doc.entities.layers[clone.id] = clone;
  }
  return map.get(srcId)!;
}

/**
 * Clona uma página e suas layers (ids novos, mantendo a hierarquia de layers).
 * Insere a nova página em entities.pages e retorna seu id. NÃO mexe em board.pages.
 */
function clonePageWithLayers(doc: BrandDocument, srcId: Id, name: string, parentId: Id | null): Id {
  const src = doc.entities.pages[srcId];
  const page = createPage(src.boardId, name, parentId);
  page.locked = src.locked;

  // mapeia ids antigos → novos para as layers desta página
  const srcLayers = Object.values(doc.entities.layers).filter((l) => l.pageId === srcId);
  const idMap = new Map<Id, Id>();
  for (const l of srcLayers) idMap.set(l.id, createId('layer'));

  for (const l of srcLayers) {
    const clone = JSON.parse(JSON.stringify(l)) as Layer;
    clone.id = idMap.get(l.id)!;
    clone.pageId = page.id;
    clone.parentId = l.parentId ? (idMap.get(l.parentId) ?? null) : null;
    clone.children = l.children.map((c) => idMap.get(c)).filter((c): c is Id => !!c);
    doc.entities.layers[clone.id] = clone;
  }
  page.roots = src.roots.map((r) => idMap.get(r)).filter((r): r is Id => !!r);
  doc.entities.pages[page.id] = page;
  return page.id;
}

export const useEditorStore = create<EditorState>()(
  temporal(
    immer((set, get) => ({
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

      renamePage: (id, name) => {
        historyController.setMode('text'); // burst de digitação = 1 entrada
        set((state) => {
          const page = state.document.entities.pages[id];
          if (page) page.name = name;
        });
        historyController.setMode('immediate');
      },

      addSubPage: (parentId, name = 'Nova sub-página') => {
        const parent = get().document.entities.pages[parentId];
        if (!parent || parent.parentId) return null; // só 1 nível
        const page = createPage(parent.boardId, name, parentId);
        set((state) => {
          const board = state.document.entities.boards[parent.boardId];
          state.document.entities.pages[page.id] = page;
          // insere após o parent e suas sub-páginas existentes
          const siblings = board.pages.filter((pid) => state.document.entities.pages[pid]?.parentId === parentId);
          const anchor = siblings.length ? siblings[siblings.length - 1] : parentId;
          board.pages.splice(board.pages.indexOf(anchor) + 1, 0, page.id);
        });
        return page;
      },

      duplicatePage: (id) => {
        const src = get().document.entities.pages[id];
        if (!src) return null;
        let newId: Id | null = null;
        set((state) => {
          const doc = state.document;
          const board = doc.entities.boards[src.boardId];
          newId = clonePageWithLayers(doc, id, `${src.name} cópia`, src.parentId);
          // sub-páginas diretas (um nível)
          const childIds = board.pages.filter((pid) => doc.entities.pages[pid]?.parentId === id);
          const clonedChildren = childIds.map((cid) =>
            clonePageWithLayers(doc, cid, doc.entities.pages[cid].name, newId),
          );
          // insere a cópia (e filhas) após o bloco original
          const lastOriginal = childIds.length ? childIds[childIds.length - 1] : id;
          board.pages.splice(board.pages.indexOf(lastOriginal) + 1, 0, newId!, ...clonedChildren);
        });
        return newId ? get().document.entities.pages[newId] : null;
      },

      removePage: (id) =>
        set((state) => {
          const doc = state.document;
          const page = doc.entities.pages[id];
          if (!page) return;
          const board = doc.entities.boards[page.boardId];
          const toRemove = [id, ...board.pages.filter((pid) => doc.entities.pages[pid]?.parentId === id)];
          for (const pid of toRemove) {
            for (const lid of Object.keys(doc.entities.layers)) {
              if (doc.entities.layers[lid].pageId === pid) delete doc.entities.layers[lid];
            }
            delete doc.entities.pages[pid];
          }
          board.pages = board.pages.filter((pid) => !toRemove.includes(pid));
          // corrige a seleção se a página ativa foi removida
          if (state.selection.pageId && toRemove.includes(state.selection.pageId)) {
            state.selection.pageId = board.pages[0] ?? null;
            state.selection.layerIds = [];
          }
        }),

      movePage: (id, targetId, position) =>
        set((state) => {
          const doc = state.document;
          const pages = doc.entities.pages;
          const dragged = pages[id];
          const target = pages[targetId];
          if (!dragged || !target || id === targetId) return;
          const board = doc.entities.boards[dragged.boardId];

          // o bloco da página arrastada inclui suas sub-páginas (movem juntas)
          const children = board.pages.filter((p) => pages[p]?.parentId === id);
          const block = [id, ...children];
          if (block.includes(targetId)) return; // não soltar dentro de si mesma

          let pos = position;
          // 'inside' só em página de topo; se a arrastada tem subs, não aninha (1 nível)
          if (pos === 'inside' && (target.parentId || children.length)) pos = 'after';

          const newParent = pos === 'inside' ? targetId : (target.parentId ?? null);
          pages[id].parentId = newParent;

          const arr = board.pages.filter((p) => !block.includes(p));
          const lastChildOf = (pid: Id) => {
            const subs = arr.filter((p) => pages[p]?.parentId === pid);
            return subs.length ? subs[subs.length - 1] : pid;
          };
          let idx: number;
          if (pos === 'before') idx = arr.indexOf(targetId);
          else if (pos === 'inside') idx = arr.indexOf(lastChildOf(targetId)) + 1;
          else idx = arr.indexOf(target.parentId ? targetId : lastChildOf(targetId)) + 1;

          arr.splice(idx, 0, ...block);
          board.pages = arr;
        }),

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

      updateLayerText: (id, patch) => {
        // Modo texto: o burst de digitação vira UMA entrada de histórico.
        historyController.setMode('text');
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (layer) Object.assign(layer, patch);
        });
        historyController.setMode('immediate');
      },

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

      duplicateLayer: (id) => {
        const src = get().document.entities.layers[id];
        if (!src) return null;
        let newId: Id | null = null;
        set((state) => {
          const doc = state.document;
          newId = cloneLayerSubtree(doc, id);
          const clone = doc.entities.layers[newId];
          if (clone.rect) {
            clone.rect.x += 16;
            clone.rect.y += 16;
          }
          if (src.parentId) {
            const parent = doc.entities.layers[src.parentId];
            parent?.children.splice(parent.children.indexOf(id) + 1, 0, newId);
          } else {
            const page = doc.entities.pages[src.pageId];
            page?.roots.splice(page.roots.indexOf(id) + 1, 0, newId);
          }
        });
        return newId;
      },

      nudgeLayer: (id, dx, dy) => {
        historyController.setMode('text'); // burst de setas = 1 entrada
        set((state) => {
          const layer = state.document.entities.layers[id];
          if (layer?.rect) {
            layer.rect.x += dx;
            layer.rect.y += dy;
          }
        });
        historyController.setMode('immediate');
      },

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
      // estrutural = imediato; texto = debounced (ver historyController, M5)
      handleSet: (handleSet) =>
        historyController.handleSet(handleSet as (...args: unknown[]) => void) as typeof handleSet,
    },
  ),
);

/** Store temporal (zundo) — acesso ao histórico fora de componentes. */
export const editorTemporal = useEditorStore.temporal;

/** Desfaz o último passo de documento. Faz flush do registro pendente antes. */
export function undo(): void {
  historyController.flush(); // commita burst de texto pendente antes de desfazer
  editorTemporal.getState().undo();
}

/** Refaz o passo desfeito. Faz flush do registro pendente antes. */
export function redo(): void {
  historyController.flush();
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

/** Hook reativo: há passos para desfazer? (re-renderiza ao mudar o histórico). */
export function useCanUndo(): boolean {
  return useStore(editorTemporal, (s) => s.pastStates.length > 0);
}

/** Hook reativo: há passos para refazer? */
export function useCanRedo(): boolean {
  return useStore(editorTemporal, (s) => s.futureStates.length > 0);
}

/** Reinicia a store para um documento novo/dado (limpa histórico e seleção). */
export function resetEditor(doc?: BrandDocument): void {
  useEditorStore.setState(initialState(doc));
  clearHistory();
}
