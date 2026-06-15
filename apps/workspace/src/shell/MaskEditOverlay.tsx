import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useEditorStore, type ImageLayer } from "@blustar/core";
import { coverBox, cropBox, commitMaskEdit } from "./maskGeom";

const HANDLES = ["nw", "n", "ne", "e", "se", "s", "sw", "w"] as const;
type Dir = (typeof HANDLES)[number];

const MIN = 8; // px mínimos da imagem

/**
 * Edição de máscara estilo Figma (M6.E). O frame fica parado como recorte
 * (contorno tracejado ciano); a imagem vira um overlay arrastável/escalável que
 * pode extravasar o frame. Pan (arrastar corpo), resize (alças, mantém proporção;
 * Shift libera), zoom (roda do mouse ancorado no cursor). Enter/clique-fora
 * commita 1 entrada de undo; ESC descarta.
 */
export function MaskEditOverlay({ layer }: { layer: ImageLayer }) {
  const mask = useEditorStore((s) => s.ui.maskEdit);
  const rootRef = useRef<HTMLDivElement>(null);

  // Carrega o tamanho natural e calcula a caixa inicial (crop salvo ou cover).
  // Roda sempre que entramos na edição com a caixa ainda indefinida — inclusive
  // ao re-entrar (beginMaskEdit zera a caixa) sem que `layer` mude.
  const needInit = !!mask && mask.layerId === layer.id && mask.box == null;
  useEffect(() => {
    if (!needInit || !layer.src) return;
    let cancelled = false;
    const im = new Image();
    im.onload = () => {
      if (cancelled) return;
      const st = useEditorStore.getState();
      const me = st.ui.maskEdit;
      if (!me || me.layerId !== layer.id) return;
      const nat = { w: im.naturalWidth || me.frame.w, h: im.naturalHeight || me.frame.h };
      st.setMaskNat(nat);
      const m = layer.mask;
      const box =
        m?.fit === "crop" && m.scale
          ? cropBox(nat, m.offsetX ?? 0, m.offsetY ?? 0, m.scale)
          : coverBox(me.frame, nat);
      st.setMaskBox(box);
    };
    im.src = layer.src;
    return () => {
      cancelled = true;
    };
  }, [needInit, layer.id, layer.src, layer.mask]);

  // Teclado: Enter commita, ESC descarta.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        commitMaskEdit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        useEditorStore.getState().endMaskEdit();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.id]);

  // Clique no canvas, fora do overlay → commita. Cliques na inspector/topbar
  // (fora do canvas) NÃO saem da edição — assim os controles de máscara seguem
  // operando o crop ao vivo.
  useEffect(() => {
    function onDown(e: globalThis.PointerEvent) {
      const t = e.target as Element | null;
      if (rootRef.current?.contains(t as Node)) return; // dentro do overlay
      if (t?.closest?.('[role="main"][aria-label="Canvas"]')) commitMaskEdit();
    }
    window.addEventListener("pointerdown", onDown, true);
    return () => window.removeEventListener("pointerdown", onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer.id]);

  if (!mask || mask.layerId !== layer.id) return null;
  const box = mask.box;

  // --- Pan (arrastar corpo da imagem) ---
  function startPan(e: ReactPointerEvent) {
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const start = box;
    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture?.(e.pointerId);
    } catch {
      /* id sintético */
    }
    function onMove(ev: globalThis.PointerEvent) {
      useEditorStore.getState().setMaskBox({
        ...start,
        x: start.x + (ev.clientX - sx),
        y: start.y + (ev.clientY - sy),
      });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // --- Resize (alças, mantém proporção por padrão; Shift libera) ---
  function startResize(e: ReactPointerEvent, dir: Dir) {
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sy = e.clientY;
    const start = box;
    function onMove(ev: globalThis.PointerEvent) {
      const dx = ev.clientX - sx;
      const dy = ev.clientY - sy;
      let w = start.w;
      let h = start.h;
      let x = start.x;
      let y = start.y;
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
      if (!ev.shiftKey) {
        // Proporção travada: escolhe o eixo de maior variação como condutor.
        const rW = w / start.w;
        const rH = h / start.h;
        const k = Math.abs(rW - 1) > Math.abs(rH - 1) ? rW : rH;
        const nw = Math.max(MIN, start.w * k);
        const nh = Math.max(MIN, start.h * k);
        if (dir.includes("w")) x = start.x + (start.w - nw);
        else if (!dir.includes("e")) x = start.x + (start.w - nw) / 2;
        if (dir.includes("n")) y = start.y + (start.h - nh);
        else if (!dir.includes("s")) y = start.y + (start.h - nh) / 2;
        w = nw;
        h = nh;
      }
      useEditorStore.getState().setMaskBox({ x, y, w, h });
    }
    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }

  // --- Zoom (roda do mouse, ancorado no cursor) ---
  function onWheel(e: React.WheelEvent) {
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    const nw = Math.max(MIN, box.w * factor);
    const nh = Math.max(MIN, box.h * factor);
    const fr = (rootRef.current as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - fr.left;
    const cy = e.clientY - fr.top;
    useEditorStore.getState().setMaskBox({
      w: nw,
      h: nh,
      x: cx - (cx - box.x) * (nw / box.w),
      y: cy - (cy - box.y) * (nh / box.h),
    });
  }

  return (
    <div
      ref={rootRef}
      onWheel={onWheel}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 8,
        outline: "1.5px dashed var(--bs-brand)",
        cursor: "default",
        // o frame recorta; o overlay deixa a imagem extravasar
        overflow: "visible",
      }}
    >
      {box && (
        <div
          onPointerDown={startPan}
          style={{
            position: "absolute",
            left: box.x,
            top: box.y,
            width: box.w,
            height: box.h,
            cursor: "grab",
            outline: "2px solid var(--bs-focus-ring)",
            userSelect: "none",
            touchAction: "none",
          }}
        >
          <img
            src={layer.src}
            alt=""
            draggable={false}
            style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }}
          />
          {HANDLES.map((dir) => (
            <span
              key={dir}
              onPointerDown={(e) => startResize(e, dir)}
              style={handleStyle(dir)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SIZE = 9;
function handleStyle(dir: Dir): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    background: "var(--bs-text)",
    border: "1.5px solid var(--bs-focus-ring)",
    borderRadius: 2,
    boxSizing: "border-box",
    zIndex: 9,
  };
  const off = -SIZE / 2;
  const mid = `calc(50% - ${SIZE / 2}px)`;
  if (dir.includes("n")) base.top = off;
  if (dir.includes("s")) base.bottom = off;
  if (dir.includes("w")) base.left = off;
  if (dir.includes("e")) base.right = off;
  if (dir === "n" || dir === "s") base.left = mid;
  if (dir === "e" || dir === "w") base.top = mid;
  const cursorMap: Record<Dir, string> = {
    nw: "nwse-resize",
    se: "nwse-resize",
    ne: "nesw-resize",
    sw: "nesw-resize",
    n: "ns-resize",
    s: "ns-resize",
    e: "ew-resize",
    w: "ew-resize",
  };
  base.cursor = cursorMap[dir];
  return base;
}
