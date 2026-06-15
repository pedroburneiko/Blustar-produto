import { useState } from "react";
import { Panel, Tabs, Field, NumberField, SegmentedControl } from "@blustar/ui";
import { useEditorStore, DEFAULT_ARTBOARD_WIDTH } from "@blustar/core";
import { LayerInspector } from "./LayerInspector";
import { SlotOverrideEditor } from "./SlotOverrideEditor";
import { StylesPanel } from "./StylesPanel";

/** Presets de largura do artboard, alinhados às fronteiras de breakpoint. */
const ARTBOARD_PRESETS = [
  { value: "mobile", label: "Mobile", width: 390 },
  { value: "tablet", label: "Tablet", width: 768 },
  { value: "desktop", label: "Desktop", width: 1280 },
];

/**
 * Inspector (direita) — espelha .guide-right do SPEC.
 * Com uma camada selecionada, vira o editor de propriedades dela (edições vão
 * para a store e ENTRAM no undo). Sem seleção, mostra o placeholder Styles/Page.
 */
export function Inspector({ floating = false }: { floating?: boolean } = {}) {
  const selectedId = useEditorStore((s) => s.selection.layerIds[0] ?? null);
  const slot = useEditorStore((s) => s.selection.slot);
  // No preview, o painel flutua como um card (cantos arredondados + sombra).
  const panelClass = floating ? "rounded-xl shadow-2xl" : "";

  if (slot) {
    return (
      <Panel aria-label="Inspector" className={panelClass}>
        <SlotOverrideEditor instanceId={slot.instanceId} slotKey={slot.slotKey} />
      </Panel>
    );
  }

  if (selectedId) {
    return (
      <Panel aria-label="Inspector" className={panelClass}>
        <LayerInspector layerId={selectedId} />
      </Panel>
    );
  }

  return <EmptyInspector className={panelClass} />;
}

function EmptyInspector({ className = "" }: { className?: string }) {
  const [tab, setTab] = useState("styles");
  return (
    <Panel aria-label="Inspector" className={className}>
      <div style={{ padding: "var(--bs-space-3) var(--bs-space-3) 0" }}>
        <Tabs
          items={[
            { value: "styles", label: "Styles" },
            { value: "page", label: "Page" },
          ]}
          value={tab}
          onValueChange={setTab}
          aria-label="Inspector"
        />
      </div>
      {tab === "styles" ? <StylesPanel /> : <PagePanel />}
    </Panel>
  );
}

/**
 * Propriedades da página ativa. Por ora: largura do artboard (a superfície de
 * design) — define a largura de referência do grid responsivo. Presets caem
 * exatamente num breakpoint; o campo custom aceita qualquer px.
 */
function PagePanel() {
  const pageId = useEditorStore((s) => s.selection.pageId);
  const width = useEditorStore((s) =>
    pageId ? s.document.entities.pages[pageId]?.artboardWidth : undefined,
  );
  if (!pageId) {
    return (
      <div style={{ padding: "var(--bs-space-5) var(--bs-space-3)", color: "var(--bs-text-subtle)", fontSize: 13 }}>
        Selecione uma página.
      </div>
    );
  }
  const w = width ?? DEFAULT_ARTBOARD_WIDTH;
  const setW = (next: number) => useEditorStore.getState().setPageArtboardWidth(pageId, next);
  const preset = ARTBOARD_PRESETS.find((p) => p.width === w)?.value ?? "custom";

  return (
    <div style={{ padding: "var(--bs-space-4) var(--bs-space-3)", display: "flex", flexDirection: "column", gap: "var(--bs-space-3)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--bs-text-subtle)" }}>
        Artboard
      </div>
      <Field label="Largura" hint={preset === "custom" ? "custom" : "preset"}>
        <SegmentedControl
          options={ARTBOARD_PRESETS.map((p) => ({ value: p.value, label: p.label }))}
          value={preset}
          onChange={(v) => setW(ARTBOARD_PRESETS.find((p) => p.value === v)!.width)}
          touch
          aria-label="Largura do artboard"
        />
      </Field>
      <Field label="Custom">
        <NumberField value={w} onChange={setW} min={240} max={3840} suffix="px" aria-label="Largura do artboard (px)" />
      </Field>
    </div>
  );
}
