/**
 * Resolução da config de grid de um container, por breakpoint.
 *
 * Regra (aprovada): override do documento se existir, senão default do token.
 * Usa `??` (nullish) — um 0 explícito no override é respeitado, não engolido.
 * Reusado pelo render (LayerView) e pelo painel (placeholders/valores).
 */
import { gridByBreakpoint, type Breakpoint, type GridBreakpointConfig } from '@blustar/tokens';
import type { LayerBox } from './types.js';

// Re-export para consumidores do core (apps/workspace) não dependerem do pacote
// de tokens diretamente só para tipar o breakpoint.
export { breakpointForWidth } from '@blustar/tokens';
export type { Breakpoint, GridBreakpointConfig } from '@blustar/tokens';

/** Config de grid efetiva de um container num dado breakpoint. */
export function resolveGrid(box: LayerBox | undefined, bp: Breakpoint): GridBreakpointConfig {
  const def = gridByBreakpoint[bp];
  const ov = box?.grid?.[bp];
  return {
    // box.cols (legado) cobre só columns; margin/gutter sempre caem no token.
    columns: ov?.columns ?? box?.cols ?? def.columns,
    // TODO: incluir `type` aqui quando houver outro tipo além de "stretch".
    type: def.type,
    margin: ov?.margin ?? def.margin,
    gutter: ov?.gutter ?? def.gutter,
  };
}
