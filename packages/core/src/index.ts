// @blustar/core — modelo de dados + store + base de undo do produto BluStar.
// Núcleo agnóstico de UI: consumido por apps/workspace a partir do M1.

export * from './model/types.js';
export * from './model/factories.js';
export * from './model/grid.js';
export * from './store/history.js';
export * from './store/editorStore.js';
export * from './persistence/store.js';

// Reexport utilitário do zustand para consumidores selecionarem com shallow-equal
// (evita re-render quando o resultado mapeado é shallow-igual).
export { useShallow } from 'zustand/react/shallow';
