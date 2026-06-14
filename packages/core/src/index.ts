// @blustar/core — modelo de dados + store + base de undo do produto BluStar.
// Núcleo agnóstico de UI: consumido por apps/workspace a partir do M1.

export * from './model/types.js';
export * from './model/factories.js';
export * from './store/history.js';
export * from './store/editorStore.js';
export * from './persistence/store.js';
