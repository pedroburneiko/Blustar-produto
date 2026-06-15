import { useCallback, useRef } from "react";
import { useEditorStore, DEFAULT_ARTBOARD_WIDTH } from "@blustar/core";
import { LayerView } from "./LayerView";
import { GuidesOverlay } from "./GuidesOverlay";
import { InsertTemplateButton } from "./InsertTemplateButton";

/**
 * Callback ref que mede a largura da content-box do artboard e a publica em
 * ui.artboardWidth (efêmero, fora do undo). É a MESMA referência que o grid usa
 * para resolver o breakpoint no render e que o painel mostra no chip "bp ativo"
 * — render e painel nunca discordam numa fronteira.
 *
 * Callback ref (não useEffect) para anexar o observer QUANDO o nó monta: o
 * artboard só renderiza quando há página ativa, então um effect com deps [] na
 * 1ª render veria `null` e nunca religaria. Limpa para `null` ao desmontar.
 */
function useArtboardWidthRef<T extends HTMLElement>() {
  const observerRef = useRef<ResizeObserver | null>(null);
  return useCallback((el: T | null) => {
    observerRef.current?.disconnect();
    observerRef.current = null;
    const set = useEditorStore.getState().setArtboardWidth;
    if (!el) {
      set(null);
      return;
    }
    // Medição imediata no attach (não depende do 1º callback do observer).
    set(el.clientWidth);
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      set(entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width);
    });
    observer.observe(el, { box: "content-box" });
    observerRef.current = observer;
  }, []);
}

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
  const artboardRef = useArtboardWidthRef<HTMLDivElement>();

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
        // Largura do artboard = propriedade da página (frame de largura fixa).
        // Define a largura de referência do grid responsivo; rola na horizontal
        // (overflow:auto do pai) quando maior que a viewport do canvas.
        <div ref={artboardRef} style={{ width: page.artboardWidth ?? DEFAULT_ARTBOARD_WIDTH, margin: "0 auto" }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--bs-space-4)" }}>
              <h1 style={{ margin: 0, fontSize: 40, color: "var(--bs-text)", overflowWrap: "break-word" }}>
                {page.name}
              </h1>
              {isFree && <InsertTemplateButton pageId={page.id} />}
            </div>
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
