import { useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { Button } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";
import type { Layer, LayerBox, LayerRect, LayerStyle } from "@blustar/core";
import { ResizeHandles } from "./ResizeHandles";
import { computeMoveSnap } from "./snapping";

const DRAG_THRESHOLD = 3; // px para distinguir clique de arraste

/** rects das outras layers absolutas da mesma página (alvos de snap). */
function siblingRects(layerId: string) {
  const s = useEditorStore.getState();
  const layer = s.document.entities.layers[layerId];
  const page = layer ? s.document.entities.pages[layer.pageId] : null;
  if (!page) return [];
  return page.roots
    .filter((id) => id !== layerId)
    .map((id) => s.document.entities.layers[id]?.rect)
    .filter((r): r is NonNullable<typeof r> => !!r);
}

/** Converte o box do modelo em estilo CSS. `grid` = container de grupo. */
function boxToStyle(box: LayerBox | undefined, grid: boolean): CSSProperties {
  if (!box) return {};
  const s: CSSProperties = {};
  if (box.width) s.width = box.width;
  if (box.height) s.height = box.height;
  if (box.padding) {
    const p = box.padding;
    s.padding = `${p.top ?? "0"} ${p.right ?? "0"} ${p.bottom ?? "0"} ${p.left ?? "0"}`;
  }
  if (grid) {
    s.display = "grid";
    s.gridTemplateColumns = `repeat(${box.cols ?? 1}, 1fr)`;
    if (box.gap) s.gap = `${box.gap.row ?? "0"} ${box.gap.col ?? "0"}`;
  }
  return s;
}

function styleToCss(style: LayerStyle | undefined): CSSProperties {
  if (!style) return {};
  const s: CSSProperties = {};
  if (style.background) s.background = style.background;
  if (style.color) s.color = style.color;
  return s;
}

/** Caixa rotulada para tipos sem asset/template real ainda (image/video/component). */
function Placeholder({ label, style }: { label: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 80,
        border: "1px solid var(--bs-border)",
        borderRadius: "var(--bs-radius-md)",
        background: "var(--bs-surface)",
        color: "var(--bs-text-subtle)",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: "0.06em",
        ...style,
      }}
    >
      {label}
    </div>
  );
}

/** Renderiza o conteúdo específico do tipo da layer (sem o wrapper externo). */
function LayerContent({ layer }: { layer: Layer }) {
  switch (layer.type) {
    case "text":
      return (
        <div
          style={{
            fontFamily: layer.font?.family,
            fontSize: layer.font?.size,
            fontWeight: layer.font?.weight,
            color: layer.style?.color ?? "var(--bs-text)",
          }}
        >
          {layer.text}
        </div>
      );

    case "button":
      return <Button variant={layer.variant as "primary" | "secondary" | "ghost"}>{layer.label}</Button>;

    case "shape": {
      const radius =
        layer.shape === "ellipse"
          ? "var(--bs-radius-full)"
          : layer.shape === "line"
            ? "var(--bs-radius-full)"
            : "var(--bs-radius-md)";
      return (
        <div
          style={{
            width: "100%",
            height: layer.shape === "line" ? 4 : "100%",
            minHeight: layer.shape === "line" ? 4 : 48,
            borderRadius: radius,
            ...styleToCss(layer.style),
          }}
        />
      );
    }

    case "image":
      return layer.src ? (
        <img src={layer.src} alt={layer.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--bs-radius-md)" }} />
      ) : (
        <Placeholder label="FOTO" style={{ height: "100%" }} />
      );

    case "video":
      return layer.src ? (
        <video src={layer.src} style={{ width: "100%", height: "100%", borderRadius: "var(--bs-radius-md)" }} />
      ) : (
        <Placeholder label="VIDEO" style={{ height: "100%" }} />
      );

    case "component":
      return <Placeholder label={`Componente · ${layer.templateName || layer.name}`} />;

    case "group":
      return (
        <div style={boxToStyle(layer.box, true)}>
          {layer.children.map((id) => (
            <LayerView key={id} layerId={id} />
          ))}
        </div>
      );

    default:
      return null;
  }
}

export interface LayerViewProps {
  layerId: string;
}

/**
 * Renderiza uma layer do documento (recursivo para grupos). Só-leitura no M2:
 * clique seleciona (estado efêmero, fora do undo); sem arrastar/editar (M4).
 * Visual fiel ao SPEC — selecionado: outline sólido (focus); hover: tracejado (marca).
 */
export function LayerView({ layerId }: LayerViewProps) {
  const layer = useEditorStore((s) => s.document.entities.layers[layerId]);
  const selected = useEditorStore((s) => s.selection.layerIds.includes(layerId));
  // Preview ao vivo do gesto em andamento nesta layer (efêmero, fora do undo).
  const livePreview = useEditorStore((s) =>
    s.ui.interaction?.layerId === layerId ? s.ui.interaction.preview : null,
  );
  const [hover, setHover] = useState(false);
  const dragRef = useRef<{ px: number; py: number; rect: LayerRect; dragging: boolean } | null>(null);

  if (!layer || !layer.visible) return null;

  function select(e: MouseEvent) {
    e.stopPropagation(); // clique no filho seleciona o filho, não o grupo/canvas
    useEditorStore.getState().selectLayers([layerId]);
  }

  // --- Drag (mover) — apenas layers absolutas (rect) ---
  function onPointerDown(e: PointerEvent) {
    if (!layer.rect || e.button !== 0) return;
    e.stopPropagation();
    dragRef.current = { px: e.clientX, py: e.clientY, rect: { ...layer.rect }, dragging: false };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* pointerId sintético/obsoleto */
    }
  }
  function onPointerMove(e: PointerEvent) {
    const st = dragRef.current;
    if (!st) return;
    const dx = e.clientX - st.px;
    const dy = e.clientY - st.py;
    if (!st.dragging) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return;
      st.dragging = true;
      useEditorStore.getState().selectLayers([layerId]);
      useEditorStore.getState().beginInteraction({ kind: "drag", layerId, preview: { ...st.rect } });
    }
    const candidate = { x: Math.round(st.rect.x + dx), y: Math.round(st.rect.y + dy), w: st.rect.w, h: st.rect.h };
    const snap = computeMoveSnap(candidate, siblingRects(layerId));
    // M4.4: guias visíveis no alinhamento; a posição ainda NÃO faz snap (M4.5).
    useEditorStore.getState().updateInteraction({ preview: candidate, guides: snap.guides });
  }
  function onPointerUp(e: PointerEvent) {
    const st = dragRef.current;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* id obsoleto */
    }
    if (!st?.dragging) return; // foi um clique, não um arraste
    const it = useEditorStore.getState().ui.interaction;
    if (it) useEditorStore.getState().moveLayer(layerId, { x: it.preview.x, y: it.preview.y });
    useEditorStore.getState().endInteraction(); // 1 gesto = 1 entrada de histórico
  }

  const outline = selected
    ? "2px solid var(--bs-focus-ring)"
    : hover
      ? "1px dashed var(--bs-brand)"
      : "1px solid transparent";

  // Layer absoluta (M4): posiciona via rect (ou preview ao vivo). Senão, flow (M2).
  const rect = livePreview ?? layer.rect;
  const absolute: CSSProperties = rect
    ? { position: "absolute", left: rect.x, top: rect.y, width: rect.w, height: rect.h }
    : layer.type === "group"
      ? {}
      : boxToStyle(layer.box, false);

  const wrapperStyle: CSSProperties = {
    ...absolute,
    outline,
    outlineOffset: 4,
    borderRadius: 2,
    cursor: layer.rect ? "grab" : "pointer",
    touchAction: layer.rect ? "none" : undefined,
  };

  return (
    <div
      data-layer-id={layer.id}
      data-selected={selected || undefined}
      style={wrapperStyle}
      onClick={select}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={layer.rect ? onPointerDown : undefined}
      onPointerMove={layer.rect ? onPointerMove : undefined}
      onPointerUp={layer.rect ? onPointerUp : undefined}
    >
      <LayerContent layer={layer} />
      {selected && layer.rect && <ResizeHandles layerId={layer.id} />}
    </div>
  );
}
