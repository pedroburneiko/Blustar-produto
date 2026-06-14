import { useEditorStore } from "@blustar/core";
import { LayerView } from "./LayerView";

/**
 * Área de canvas central — espelha .guide-content/.world-head do SPEC.
 * No M1 só mostra o cabeçalho da página ativa; NÃO renderiza camadas (M2).
 */
export function CanvasArea() {
  const activeBoardId = useEditorStore((s) => s.ui.activeBoardId);
  const board = useEditorStore((s) =>
    activeBoardId ? s.document.entities.boards[activeBoardId] : null,
  );
  const page = useEditorStore((s) => (s.selection.pageId ? s.document.entities.pages[s.selection.pageId] : null));

  return (
    <div
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

          {/* Camadas da página (somente leitura — M2) */}
          {page.roots.length > 0 ? (
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
