import { useRef, type CSSProperties, type PointerEvent } from "react";
import { useEditorStore } from "@blustar/core";
import type { LayerRect, ResizeDir } from "@blustar/core";

const MIN = 16; // tamanho mínimo (px)

const DIRS: ResizeDir[] = ["nw", "ne", "sw", "se", "n", "s", "e", "w"];

const POS: Record<ResizeDir, CSSProperties> = {
  nw: { top: 0, left: 0 },
  ne: { top: 0, left: "100%" },
  sw: { top: "100%", left: 0 },
  se: { top: "100%", left: "100%" },
  n: { top: 0, left: "50%" },
  s: { top: "100%", left: "50%" },
  w: { top: "50%", left: 0 },
  e: { top: "50%", left: "100%" },
};

const CURSOR: Record<ResizeDir, string> = {
  nw: "nwse-resize",
  se: "nwse-resize",
  ne: "nesw-resize",
  sw: "nesw-resize",
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
};

function computeRect(dir: ResizeDir, start: LayerRect, dx: number, dy: number, shift: boolean): LayerRect {
  let { x, y, w, h } = start;
  if (dir.includes("e")) w = Math.max(MIN, start.w + dx);
  if (dir.includes("s")) h = Math.max(MIN, start.h + dy);
  if (dir.includes("w")) {
    w = Math.max(MIN, start.w - dx);
    x = start.x + (start.w - w);
  }
  if (dir.includes("n")) {
    h = Math.max(MIN, start.h - dy);
    y = start.y + (start.h - h);
  }
  // Aspect-lock nos cantos com Shift (fiel ao SPEC).
  if (dir.length === 2 && shift) {
    const ratioW = w / start.w;
    const ratioH = h / start.h;
    const k = Math.abs(ratioW - 1) > Math.abs(ratioH - 1) ? ratioW : ratioH;
    w = Math.max(MIN, start.w * k);
    h = Math.max(MIN, start.h * k);
    if (dir.includes("w")) x = start.x + (start.w - w);
    if (dir.includes("n")) y = start.y + (start.h - h);
  }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}

/** Alças de resize (8) sobre a layer selecionada. Chrome do editor. */
export function ResizeHandles({ layerId }: { layerId: string }) {
  const ref = useRef<{ dir: ResizeDir; px: number; py: number; start: LayerRect } | null>(null);

  function onDown(e: PointerEvent, dir: ResizeDir) {
    e.stopPropagation(); // não inicia o drag da layer
    const layer = useEditorStore.getState().document.entities.layers[layerId];
    if (!layer?.rect) return;
    ref.current = { dir, px: e.clientX, py: e.clientY, start: { ...layer.rect } };
    useEditorStore.getState().beginInteraction({ kind: "resize", layerId, handle: dir, preview: { ...layer.rect } });
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* id sintético */
    }
  }
  function onMove(e: PointerEvent) {
    const st = ref.current;
    if (!st) return;
    const next = computeRect(st.dir, st.start, e.clientX - st.px, e.clientY - st.py, e.shiftKey);
    useEditorStore.getState().updateInteraction({ preview: next });
  }
  function onUp(e: PointerEvent) {
    const st = ref.current;
    ref.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* id sintético */
    }
    if (!st) return;
    const it = useEditorStore.getState().ui.interaction;
    if (it) useEditorStore.getState().resizeLayer(layerId, it.preview); // 1 gesto = 1 entrada
    useEditorStore.getState().endInteraction();
  }

  return (
    <>
      {DIRS.map((dir) => (
        <div
          key={dir}
          onPointerDown={(e) => onDown(e, dir)}
          onPointerMove={onMove}
          onPointerUp={onUp}
          style={{
            position: "absolute",
            ...POS[dir],
            width: 10,
            height: 10,
            transform: "translate(-50%, -50%)",
            background: "var(--bs-text)",
            border: "1.5px solid var(--bs-focus-ring)",
            borderRadius: 2,
            cursor: CURSOR[dir],
            touchAction: "none",
            zIndex: 2,
          }}
        />
      ))}
    </>
  );
}
