import { useEditorStore } from "@blustar/core";
import { LayerView } from "./LayerView";
import { GuidesOverlay } from "./GuidesOverlay";

/**
 * Área de canvas central — espelha .guide-content/.world-head do SPEC.
 * Renderiza as camadas da página ativa (só-leitura, M2). Clicar no vazio limpa
 * a seleção; clicar numa camada seleciona (ver LayerView).
 */
export function CanvasArea() {
  const activeBoardId = useEditorStore((s) => s.ui.activeBoardId);
  const board = useEditorStore((s) =>
    activeBoardId ? s.document.entities.boards[activeBoardId] : null,
  );
  const page = useEditorStore((s) => (s.selection.pageId ? s.document.entities.pages[s.selection.pageId] : null));
  // Página em modo "canvas livre" se alguma layer raiz é absoluta (tem rect).
  const isFree = useEditorStore((s) =>
    page ? page.roots.some((id) => s.document.entities.layers[id]?.rect) : false,
  );

  return (
    <div
      role="main"
      aria-label="Canvas"
      onClick={() => useEditorStore.getState().clearSelection()}
      style={{
        minHeight: 0,
        overflow: "auto",
        background: "var(--bs-bg)",
        padding: "var(--bs-space-7)",
      }}
    >
      {page ? (
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          {/* world-head */}
          <div style={{ marginBottom: "var(--bs-space-7)" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--bs-text-subtle)",
                marginBottom: "var(--bs-space-2)",
              }}
            >
              {board?.name}
            </div>
            <h1 style={{ margin: 0, fontSize: 40, color: "var(--bs-text)", overflowWrap: "break-word" }}>
              {page.name}
            </h1>
          </div>

          {/* Canvas livre (M4): frame absoluto com a origem das coordenadas */}
          {isFree ? (
            <div
              data-canvas-frame
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 900,
                height: 560,
                margin: "0 auto",
                border: "1px solid var(--bs-border)",
                borderRadius: "var(--bs-radius-lg)",
                overflow: "hidden",
              }}
            >
              {page.roots.map((id) => (
                <LayerView key={id} layerId={id} />
              ))}
              <GuidesOverlay />
            </div>
          ) : page.roots.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--bs-space-5)" }}>
              {page.roots.map((id) => (
                <LayerView key={id} layerId={id} />
              ))}
            </div>
          ) : (
            <div
              style={{
                border: "1px dashed var(--bs-border)",
                borderRadius: "var(--bs-radius-lg)",
                padding: "var(--bs-space-7)",
                textAlign: "center",
                color: "var(--bs-text-subtle)",
              }}
            >
              Página sem camadas.
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: "var(--bs-text-subtle)", textAlign: "center", marginTop: "20vh" }}>
          Selecione uma página.
        </div>
      )}
    </div>
  );
}
