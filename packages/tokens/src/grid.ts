/** Blustar — grid do projeto (layout grid do Figma), responsivo por breakpoint.
 *
 * Mantido em sincronia com os tokens CSS em src/tokens.css (--bs-bp-*, --bs-grid-*).
 * As larguras são da largura do ARTBOARD (não da viewport): a seleção do breakpoint
 * ativo é feita em JS pela largura do artboard, não por media query de CSS.
 *
 * Mobile é o caso primário — usuário final é motoboy, no celular, em movimento.
 */

/** Larguras de corte dos breakpoints (px), mobile-first. */
export const breakpoints = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/** Config de grid de um breakpoint. */
export interface GridBreakpointConfig {
  /** Número de colunas. */
  columns: number;
  /** Tipo de grid. */
  type: "stretch";
  /** Margem lateral (px). */
  margin: number;
  /** Espaço entre colunas (px). */
  gutter: number;
}

/** Config de grid por breakpoint (fonte da verdade; espelha os tokens CSS). */
export const gridByBreakpoint = {
  mobile: { columns: 4, type: "stretch", margin: 16, gutter: 16 },
  tablet: { columns: 8, type: "stretch", margin: 32, gutter: 24 },
  desktop: { columns: 12, type: "stretch", margin: 60, gutter: 30 },
} as const satisfies Record<Breakpoint, GridBreakpointConfig>;

/** Overlay de visualização das colunas (apenas QA). */
const overlay = {
  color: "var(--bs-grid-overlay)",
  opacity: 0.2,
} as const;

/**
 * grid — alias retrocompatível do breakpoint desktop (+ overlay).
 * Consumidores antigos (ex. <Grid> do DS) continuam funcionando.
 */
export const grid = {
  ...gridByBreakpoint.desktop,
  overlay,
} as const;

export type GridConfig = typeof grid;

/** Resolve o breakpoint ativo a partir da largura (px) do artboard. */
export function breakpointForWidth(width: number): Breakpoint {
  if (width >= breakpoints.desktop) return "desktop";
  if (width >= breakpoints.tablet) return "tablet";
  return "mobile";
}
