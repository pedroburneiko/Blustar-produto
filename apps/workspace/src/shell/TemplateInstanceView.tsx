import type { CSSProperties } from "react";
import { Button } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";
import type { ComponentLayer, Layer, LayerOverride, TemplateMaster } from "@blustar/core";

/** Props efetivas de um slot = layer do master + override da instância. */
function effective(slot: Layer, ov?: LayerOverride): Layer {
  if (!ov) return slot;
  const merged: Layer = { ...slot };
  if (ov.visible !== undefined) merged.visible = ov.visible;
  if (ov.style) merged.style = { ...slot.style, ...ov.style };
  if (ov.text !== undefined && merged.type === "text") merged.text = ov.text;
  if (ov.font && (merged.type === "text" || merged.type === "button")) {
    merged.font = { ...merged.font, ...ov.font };
  }
  if (merged.type === "button") {
    if (ov.label !== undefined) merged.label = ov.label;
    if (ov.variant !== undefined) merged.variant = ov.variant;
  }
  if (ov.src !== undefined && (merged.type === "image" || merged.type === "video")) merged.src = ov.src;
  return merged;
}

function slotStyle(layer: Layer): CSSProperties {
  return { background: layer.style?.background, color: layer.style?.color };
}

/** Renderiza um slot do master (recursivo p/ grupos), já com override aplicado. */
function SlotView({ master, slotId, overrides }: { master: TemplateMaster; slotId: string; overrides?: Record<string, LayerOverride> }) {
  const raw = master.layers[slotId];
  if (!raw) return null;
  const layer = effective(raw, overrides?.[slotId]);
  if (!layer.visible) return null;

  switch (layer.type) {
    case "text":
      return (
        <div style={{ fontSize: layer.font?.size, fontWeight: layer.font?.weight, color: layer.style?.color ?? "var(--bs-text)" }}>
          {layer.text}
        </div>
      );
    case "button":
      return <Button variant={layer.variant as "primary" | "secondary" | "ghost"}>{layer.label}</Button>;
    case "shape": {
      const radius = layer.shape === "ellipse" ? "var(--bs-radius-full)" : "var(--bs-radius-md)";
      return <div style={{ width: "100%", minHeight: 40, borderRadius: radius, ...slotStyle(layer) }} />;
    }
    case "image":
      return layer.src ? (
        <img src={layer.src} alt={layer.name} style={{ width: "100%", borderRadius: "var(--bs-radius-md)" }} />
      ) : (
        <div style={{ minHeight: 60, display: "grid", placeItems: "center", border: "1px solid var(--bs-border)", borderRadius: "var(--bs-radius-md)", color: "var(--bs-text-subtle)", fontSize: 12 }}>FOTO</div>
      );
    case "group":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-3)", ...slotStyle(layer) }}>
          {raw.children.map((cid) => (
            <SlotView key={cid} master={master} slotId={cid} overrides={overrides} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

/**
 * Renderiza uma instância de componente: a subárvore do master (lida da store →
 * propagação automática) com os overrides da instância aplicados. Sem master no
 * registry, mostra um placeholder.
 */
export function TemplateInstanceView({ instance }: { instance: ComponentLayer }) {
  const master = useEditorStore((s) => s.document.templates.masters[instance.templateName]);
  if (!master) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", border: "1px solid var(--bs-border)", borderRadius: "var(--bs-radius-md)", background: "var(--bs-surface)", color: "var(--bs-text-subtle)", fontSize: 12, fontWeight: 600 }}>
        {`Componente · ${instance.templateName || instance.name}`}
      </div>
    );
  }
  return (
    <div style={{ width: "100%", height: "100%", padding: "var(--bs-space-4)", overflow: "hidden" }}>
      <SlotView master={master} slotId={master.rootId} overrides={instance.overrides} />
    </div>
  );
}
