import { useState } from "react";
import { Panel, Tabs } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";
import { LayerInspector } from "./LayerInspector";
import { StylesPanel } from "./StylesPanel";

/**
 * Inspector (direita) — espelha .guide-right do SPEC.
 * Com uma camada selecionada, vira o editor de propriedades dela (edições vão
 * para a store e ENTRAM no undo). Sem seleção, mostra o placeholder Styles/Page.
 */
export function Inspector() {
  const selectedId = useEditorStore((s) => s.selection.layerIds[0] ?? null);

  if (selectedId) {
    return (
      <Panel>
        <LayerInspector layerId={selectedId} />
      </Panel>
    );
  }

  return <EmptyInspector />;
}

function EmptyInspector() {
  const [tab, setTab] = useState("styles");
  return (
    <Panel>
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
      {tab === "styles" ? (
        <StylesPanel />
      ) : (
        <div style={{ padding: "var(--bs-space-5) var(--bs-space-3)", color: "var(--bs-text-subtle)", fontSize: 13 }}>
          Selecione uma camada para editar suas propriedades.
        </div>
      )}
    </Panel>
  );
}
