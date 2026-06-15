import type { CSSProperties, ReactNode } from "react";
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

interface SlotCtx {
  master: TemplateMaster;
  overrides?: Record<string, LayerOverride>;
  instanceId: string;
  selectedSlot: string | null;
}

/** Envolve um slot folha: clique seleciona o slot (sub-seleção); realça se ativo. */
function Slot({ ctx, slotId, children }: { ctx: SlotCtx; slotId: string; children: ReactNode }) {
  const selected = ctx.selectedSlot === slotId;
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        useEditorStore.getState().selectSlot(ctx.instanceId, slotId);
      }}
      style={{
        outline: selected ? "1.5px solid var(--bs-focus-ring)" : "1px solid transparent",
        outlineOffset: 2,
        borderRadius: 2,
        cursor: "pointer",
      }}
    >
      {children}
    </div>
  );
}

/** Renderiza um slot do master (recursivo p/ grupos), já com override aplicado. */
function SlotView({ ctx, slotId }: { ctx: SlotCtx; slotId: string }) {
  const raw = ctx.master.layers[slotId];
  if (!raw) return null;
  const layer = effective(raw, ctx.overrides?.[slotId]);
  if (!layer.visible) return null;

  switch (layer.type) {
    case "text":
      return (
        <Slot ctx={ctx} slotId={slotId}>
          <div style={{ fontSize: layer.font?.size, fontWeight: layer.font?.weight, color: layer.style?.color ?? "var(--bs-text)" }}>
            {layer.text}
          </div>
        </Slot>
      );
    case "button":
      return (
        <Slot ctx={ctx} slotId={slotId}>
          <Button variant={layer.variant as "primary" | "secondary" | "ghost"}>{layer.label}</Button>
        </Slot>
      );
    case "shape": {
      const radius = layer.shape === "ellipse" ? "var(--bs-radius-full)" : "var(--bs-radius-md)";
      // Mídia/forma respeita a altura definida no master (box.height); senão, base.
      const h = raw.box?.height;
      return (
        <Slot ctx={ctx} slotId={slotId}>
          <div style={{ width: "100%", height: h, minHeight: h ? undefined : 40, borderRadius: radius, ...slotStyle(layer) }} />
        </Slot>
      );
    }
    case "image":
      return (
        <Slot ctx={ctx} slotId={slotId}>
          {layer.src ? (
            <img src={layer.src} alt={layer.name} style={{ width: "100%", borderRadius: "var(--bs-radius-md)" }} />
          ) : (
            <div style={{ minHeight: 60, display: "grid", placeItems: "center", border: "1px solid var(--bs-border)", borderRadius: "var(--bs-radius-md)", color: "var(--bs-text-subtle)", fontSize: 12 }}>FOTO</div>
          )}
        </Slot>
      );
    case "group":
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-3)", ...slotStyle(layer) }}>
          {raw.children.map((cid) => (
            <SlotView key={cid} ctx={ctx} slotId={cid} />
          ))}
        </div>
      );
    default:
      return null;
  }
}

/**
 * Renderiza uma instância de componente: a subárvore do master (lida da store →
 * propagação automática) com os overrides da instância. Clicar num slot faz
 * sub-seleção (edita o override só desta instância). Sem master → placeholder.
 */
export function TemplateInstanceView({ instance }: { instance: ComponentLayer }) {
  const master = useEditorStore((s) => s.document.templates.masters[instance.templateName]);
  const selectedSlot = useEditorStore((s) =>
    s.selection.slot?.instanceId === instance.id ? s.selection.slot.slotKey : null,
  );
  if (!master) {
    return (
      <div style={{ display: "grid", placeItems: "center", height: "100%", border: "1px solid var(--bs-border)", borderRadius: "var(--bs-radius-md)", background: "var(--bs-surface)", color: "var(--bs-text-subtle)", fontSize: 12, fontWeight: 600 }}>
        {`Componente · ${instance.templateName || instance.name}`}
      </div>
    );
  }
  const ctx: SlotCtx = { master, overrides: instance.overrides, instanceId: instance.id, selectedSlot };
  return (
    <div style={{ width: "100%", height: "100%", padding: "var(--bs-space-4)", overflow: "hidden" }}>
      <SlotView ctx={ctx} slotId={master.rootId} />
    </div>
  );
}
