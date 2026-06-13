/** Blustar — grid do projeto (layout grid do Figma). */

export const grid = {
  /** Número de colunas. */
  columns: 12,
  /** Tipo de grid. */
  type: "stretch" as const,
  /** Margem lateral (px). */
  margin: 160,
  /** Espaço entre colunas (px). */
  gutter: 30,
  /** Overlay de visualização das colunas (apenas QA). */
  overlay: {
    color: "var(--bs-grid-overlay)",
    opacity: 0.2,
  },
} as const;

export type GridConfig = typeof grid;
