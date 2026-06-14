import { useEditorStore } from "@blustar/core";
import type { LayerRect, ResizeDir } from "@blustar/core";

/** rects das outras layers absolutas da mesma página (alvos de snap). */
export function siblingRects(layerId: string): LayerRect[] {
  const s = useEditorStore.getState();
  const layer = s.document.entities.layers[layerId];
  const page = layer ? s.document.entities.pages[layer.pageId] : null;
  if (!page) return [];
  return page.roots
    .filter((id) => id !== layerId)
    .map((id) => s.document.entities.layers[id]?.rect)
    .filter((r): r is LayerRect => !!r);
}

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

const MIN = 16;

/**
 * Snap de RESIZE: alinha apenas as bordas ativas (conforme a alça) às bordas/
 * centros das outras layers, ajustando w/h (e x/y para as alças w/n).
 */
export function computeResizeSnap(
  rect: LayerRect,
  dir: ResizeDir,
  others: LayerRect[],
  threshold = SNAP_THRESHOLD,
): SnapResult {
  const tx = others.flatMap(linesX);
  const ty = others.flatMap(linesY);
  let { x, y, w, h } = rect;
  const gx: number[] = [];
  const gy: number[] = [];

  if (dir.includes("e")) {
    const b = bestOffset([x + w], tx, threshold);
    if (b) { w = Math.max(MIN, w + b.offset); gx.push(b.guide); }
  }
  if (dir.includes("w")) {
    const b = bestOffset([x], tx, threshold);
    if (b) { x += b.offset; w = Math.max(MIN, w - b.offset); gx.push(b.guide); }
  }
  if (dir.includes("s")) {
    const b = bestOffset([y + h], ty, threshold);
    if (b) { h = Math.max(MIN, h + b.offset); gy.push(b.guide); }
  }
  if (dir.includes("n")) {
    const b = bestOffset([y], ty, threshold);
    if (b) { y += b.offset; h = Math.max(MIN, h - b.offset); gy.push(b.guide); }
  }
  return {
    rect: { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) },
    guides: { x: gx, y: gy },
  };
}
