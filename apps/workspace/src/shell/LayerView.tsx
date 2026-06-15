import { memo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { Button } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";
import type { ImageLayer, Layer, LayerBox, LayerRect, LayerStyle } from "@blustar/core";
import { ResizeHandles } from "./ResizeHandles";
import { TemplateInstanceView } from "./TemplateInstanceView";
import { MaskEditOverlay } from "./MaskEditOverlay";
import { cropBox } from "./maskGeom";
import { computeMoveSnap, siblingRects } from "./snapping";

const DRAG_THRESHOLD = 3; // px para distinguir clique de arraste

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

/**
 * Conteúdo de uma layer de imagem, com máscara (M6.E). `fill`/`fit` usam
 * object-fit (cover/contain). `crop` desenha a imagem em `natural * scale`
 * ancorada no offset salvo — precisa do tamanho natural (lido no onLoad).
 */
function ImageContent({ layer }: { layer: ImageLayer }) {
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  if (!layer.src) return <Placeholder label="FOTO" style={{ height: "100%" }} />;

  const fit = layer.mask?.fit ?? "fill";
  const wrap: CSSProperties = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    borderRadius: "var(--bs-radius-md)",
  };

  // crop só renderiza posicionado quando já sabemos o tamanho natural; senão
  // cai no cover (evita flash de imagem deslocada antes do load).
  if (fit === "crop" && layer.mask?.scale && nat) {
    const b = cropBox(nat, layer.mask.offsetX ?? 0, layer.mask.offsetY ?? 0, layer.mask.scale);
    return (
      <div style={wrap}>
        <img
          src={layer.src}
          alt={layer.name}
          draggable={false}
          style={{ position: "absolute", left: b.x, top: b.y, width: b.w, height: b.h, display: "block" }}
        />
      </div>
    );
  }

  return (
    <div style={wrap}>
      <img
        src={layer.src}
        alt={layer.name}
        draggable={false}
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth) setNat({ w: img.naturalWidth, h: img.naturalHeight });
        }}
        style={{ width: "100%", height: "100%", objectFit: fit === "fit" ? "contain" : "cover", display: "block" }}
      />
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
      return <ImageContent layer={layer} />;

    case "video":
      return layer.src ? (
        <video src={layer.src} style={{ width: "100%", height: "100%", borderRadius: "var(--bs-radius-md)" }} />
      ) : (
        <Placeholder label="VIDEO" style={{ height: "100%" }} />
      );

    case "component":
      return <TemplateInstanceView instance={layer} />;

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
function LayerViewImpl({ layerId }: LayerViewProps) {
  const layer = useEditorStore((s) => s.document.entities.layers[layerId]);
  const selected = useEditorStore((s) => s.selection.layerIds.includes(layerId));
  // Preview ao vivo do gesto em andamento nesta layer (efêmero, fora do undo).
  const livePreview = useEditorStore((s) =>
    s.ui.interaction?.layerId === layerId ? s.ui.interaction.preview : null,
  );
  const maskEditing = useEditorStore((s) => s.ui.maskEdit?.layerId === layerId);
  const [hover, setHover] = useState(false);
  const dragRef = useRef<{ px: number; py: number; rect: LayerRect; dragging: boolean } | null>(null);

  if (!layer || !layer.visible) return null;

  function select(e: MouseEvent) {
    e.stopPropagation(); // clique no filho seleciona o filho, não o grupo/canvas
    useEditorStore.getState().selectLayers([layerId]);
  }

  // Duplo-clique numa imagem entra no modo de edição de máscara (M6.E).
  function onDoubleClick(e: MouseEvent) {
    if (layer.type !== "image" || !layer.src) return;
    e.stopPropagation();
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const frame = layer.rect
      ? { w: layer.rect.w, h: layer.rect.h }
      : { w: el.clientWidth, h: el.clientHeight };
    useEditorStore.getState().selectLayers([layerId]);
    useEditorStore.getState().beginMaskEdit(layerId, frame);
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
    // M4.5: a posição faz snap às linhas das outras layers; guias mostram o alinhamento.
    useEditorStore.getState().updateInteraction({ preview: snap.rect, guides: snap.guides });
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

  const outline = maskEditing
    ? "1px solid transparent" // o overlay desenha o contorno tracejado do recorte
    : selected
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
    // O overlay de máscara (absolute inset:0) precisa de um ancestral posicionado.
    // Layers absolutas já são position:absolute; imagens em flow precisam disto.
    ...(maskEditing && !rect ? { position: "relative" as const } : {}),
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
      role="button"
      tabIndex={0}
      aria-label={`${layer.type}: ${layer.name}`}
      aria-pressed={selected}
      style={wrapperStyle}
      onClick={select}
      onDoubleClick={layer.type === "image" ? onDoubleClick : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          useEditorStore.getState().selectLayers([layer.id]);
        }
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onPointerDown={layer.rect && !maskEditing ? onPointerDown : undefined}
      onPointerMove={layer.rect && !maskEditing ? onPointerMove : undefined}
      onPointerUp={layer.rect && !maskEditing ? onPointerUp : undefined}
    >
      <LayerContent layer={layer} />
      {maskEditing && layer.type === "image" && <MaskEditOverlay layer={layer} />}
      {selected && layer.rect && !maskEditing && <ResizeHandles layerId={layer.id} />}
    </div>
  );
}

/**
 * Memoizado: como o único prop é `layerId` (string), evita re-render quando o
 * pai (CanvasArea) re-renderiza com o mesmo id. As atualizações por mudança de
 * dados continuam vindo das assinaturas da store (selectors).
 */
export const LayerView = memo(LayerViewImpl);
