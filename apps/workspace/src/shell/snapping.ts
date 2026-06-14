import type { LayerRect } from "@blustar/core";

/** Limiar de snap em px (SPEC: SMART_SNAP = 6 para centros/margens/layers). */
export const SNAP_THRESHOLD = 6;

export interface SnapResult {
  /** Geometria com snap aplicado (mesma do input se nada snapou). */
  rect: LayerRect;
  /** Linhas (em coords do frame) onde houve alinhamento — para render das guias. */
  guides: { x: number[]; y: number[] };
}

/** As 3 linhas de um rect num eixo: início, centro, fim. */
function linesX(r: LayerRect): number[] {
  return [r.x, r.x + r.w / 2, r.x + r.w];
}
function linesY(r: LayerRect): number[] {
  return [r.y, r.y + r.h / 2, r.y + r.h];
}

/** Melhor alinhamento num eixo: menor distância dentro do limiar. */
function bestOffset(
  moving: number[],
  targets: number[],
  threshold: number,
): { offset: number; guide: number } | null {
  let best: { offset: number; guide: number; dist: number } | null = null;
  for (const m of moving) {
    for (const t of targets) {
      const dist = Math.abs(m - t);
      if (dist <= threshold && (best === null || dist < best.dist)) {
        best = { offset: t - m, guide: t, dist };
      }
    }
  }
  return best ? { offset: best.offset, guide: best.guide } : null;
}

/**
 * Calcula snap de MOVE (drag): alinha bordas/centros do rect que está se movendo
 * às bordas/centros das outras layers. Move o rect inteiro pelo melhor offset de
 * cada eixo e reporta as linhas alinhadas (guias).
 */
export function computeMoveSnap(
  moving: LayerRect,
  others: LayerRect[],
  threshold = SNAP_THRESHOLD,
): SnapResult {
  const tx = others.flatMap(linesX);
  const ty = others.flatMap(linesY);
  const bx = bestOffset(linesX(moving), tx, threshold);
  const by = bestOffset(linesY(moving), ty, threshold);
  return {
    rect: {
      x: Math.round(moving.x + (bx?.offset ?? 0)),
      y: Math.round(moving.y + (by?.offset ?? 0)),
      w: moving.w,
      h: moving.h,
    },
    guides: { x: bx ? [bx.guide] : [], y: by ? [by.guide] : [] },
  };
}
