/**
 * Configuração do histórico (undo/redo) do editor.
 *
 * Espelha o comportamento do SPEC (protótipo): snapshot do estado, com exclusão
 * de estado transiente e coalescing de mutações próximas. Aqui, porém:
 *   - o histórico cobre só o slice `document` (partialize) — selection/ui ficam
 *     de fora, como os TRANSIENT_CLASSES/ATTRS do SPEC (linhas 15290-15305);
 *   - snapshots compartilham memória via Immer (baratos);
 *   - `equality` evita registrar entradas quando o documento não mudou
 *     (mudanças só de seleção/ui não geram histórico).
 */

import type { BrandDocument } from '../model/types.js';

/** Subconjunto do estado que entra no histórico. */
export interface TrackedState {
  document: BrandDocument;
}

/** Limite de passos de histórico (SPEC usa max 20; ampliamos um pouco). */
export const HISTORY_LIMIT = 50;

/** Janela de coalescing de mutações rápidas, em ms (SPEC: 600ms). */
export const HISTORY_COALESCE_MS = 500;

// ---------------------------------------------------------------------------
// Controlador de histórico (M5): separa captura estrutural (imediata) de
// contínua/texto (debounced), com flush antes de undo/redo.
// ---------------------------------------------------------------------------

export type HistoryMode = 'immediate' | 'text';

export interface HistoryController {
  /** Passar ao zundo como options.handleSet. */
  handleSet: (handleSet: (...args: unknown[]) => void) => (...args: unknown[]) => void;
  /** Modo da PRÓXIMA mutação (chamar síncrono, logo antes do set). */
  setMode: (mode: HistoryMode) => void;
  /** Empurra imediatamente qualquer registro de texto pendente. */
  flush: () => void;
}

/**
 * Cria um controlador de histórico.
 * - `immediate` (estrutural): faz flush do pendente e registra na hora →
 *   1 entrada por ação, sem colisão com undo logo em seguida.
 * - `text` (contínuo): captura o estado PRÉ-burst (args da 1ª mutação) e faz
 *   debounce, empurrando UMA entrada no fim → undo reverte o burst inteiro.
 */
export function createHistoryController(coalesceMs = HISTORY_COALESCE_MS): HistoryController {
  let mode: HistoryMode = 'immediate';
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pendingArgs: unknown[] | null = null;
  let realHandle: ((...args: unknown[]) => void) | null = null;

  function flush(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (pendingArgs && realHandle) {
      const args = pendingArgs;
      pendingArgs = null;
      realHandle(...args);
    }
  }

  return {
    setMode(m) {
      mode = m;
    },
    flush,
    handleSet(handleSet) {
      realHandle = handleSet;
      return (...args) => {
        if (mode === 'immediate') {
          flush(); // commita um burst de texto pendente como entrada própria
          handleSet(...args); // registra esta mudança estrutural agora
          return;
        }
        // texto: guarda o estado pré-burst (1ª chamada) e faz debounce
        if (!pendingArgs) pendingArgs = args;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          timer = null;
          const a = pendingArgs;
          pendingArgs = null;
          if (a && realHandle) realHandle(...a);
        }, coalesceMs);
      };
    },
  };
}

/** Controlador singleton usado pela store do editor. */
export const historyController = createHistoryController();

/** Só o documento é historiável. */
export function partializeForHistory<S extends TrackedState>(state: S): TrackedState {
  return { document: state.document };
}

/**
 * Igualdade para o histórico: como as mutações de documento passam pelo Immer
 * (nova referência só quando o documento muda de fato), comparar a referência
 * de `document` é suficiente — e impede que seleção/ui criem passos de undo.
 */
export function historyEquality(a: TrackedState, b: TrackedState): boolean {
  return a.document === b.document;
}

/** Debounce simples para coalescer registros de histórico (sem dependências). */
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  wait: number,
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
}
