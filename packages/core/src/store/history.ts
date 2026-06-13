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

/**
 * NOTA (M5): hoje TODO registro é debounced. O SPEC gravava mudanças estruturais
 * de imediato (`recordHistoryNow`) e só debouncing edição de texto. No M5,
 * separar mutações estruturais (imediatas) de texto (debounced) — e fazer
 * undo/redo dar flush no registro pendente — para evitar colisão de um undo
 * disparado <500ms após uma mutação.
 */

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
