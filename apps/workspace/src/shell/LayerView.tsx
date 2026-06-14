import { useState, type CSSProperties, type MouseEvent } from "react";
import { Button } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";
import type { Layer, LayerBox, LayerStyle } from "@blustar/core";

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
  const [hover, setHover] = useState(false);

  if (!layer || !layer.visible) return null;

  function select(e: MouseEvent) {
    e.stopPropagation(); // clique no filho seleciona o filho, não o grupo/canvas
    useEditorStore.getState().selectLayers([layerId]);
  }

  const outline = selected
    ? "2px solid var(--bs-focus-ring)"
    : hover
      ? "1px dashed var(--bs-brand)"
      : "1px solid transparent";

  // Layer absoluta (M4): posiciona via rect. Senão, flow com box (M2).
  const absolute: CSSProperties = layer.rect
    ? { position: "absolute", left: layer.rect.x, top: layer.rect.y, width: layer.rect.w, height: layer.rect.h }
    : layer.type === "group"
      ? {}
      : boxToStyle(layer.box, false);

  const wrapperStyle: CSSProperties = {
    ...absolute,
    outline,
    outlineOffset: 4,
    borderRadius: 2,
    cursor: "pointer",
  };

  return (
    <div
      data-layer-id={layer.id}
      data-selected={selected || undefined}
      style={wrapperStyle}
      onClick={select}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <LayerContent layer={layer} />
    </div>
  );
}
