import { useEffect } from "react";
import { useEditorStore } from "@blustar/core";
import { Rail } from "./Rail";
import { PagesSidebar } from "./PagesSidebar";
import { CanvasArea } from "./CanvasArea";
import { Inspector } from "./Inspector";

/**
 * Moldura (shell) do produto — M1. Layout em 4 colunas:
 *   rail | sidebar de páginas | canvas | inspector
 * sobre o canvas preto. Fiel ao .guide-layout do SPEC (sem topbar).
 */
export function AppShell() {
  // Garante uma página ativa ao montar (primeira do board ativo).
  useEffect(() => {
    const s = useEditorStore.getState();
    if (s.selection.pageId) return;
    const boardId = s.ui.activeBoardId ?? s.document.boards[0] ?? null;
    const first = boardId ? s.document.entities.boards[boardId]?.pages[0] ?? null : null;
    if (boardId && s.ui.activeBoardId !== boardId) s.setActiveBoard(boardId);
    if (first) s.setActivePage(first);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        // canvas = minmax(0,1fr) para poder encolher (e o conteúdo quebrar);
        // laterais com faixa mín/máx para não espremerem em telas estreitas.
        gridTemplateColumns:
          "minmax(180px, 200px) minmax(210px, 240px) minmax(0, 1fr) minmax(280px, 320px)",
        height: "100vh",
        background: "var(--bs-bg)",
        color: "var(--bs-text)",
        fontFamily: "var(--bs-font)",
        overflow: "hidden",
      }}
    >
      <Rail />
      <PagesSidebar />
      <CanvasArea />
      <Inspector />
    </div>
  );
}
