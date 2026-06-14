import { useEffect, type CSSProperties } from "react";
import { useEditorStore } from "@blustar/core";
import { Rail } from "./Rail";
import { PagesSidebar } from "./PagesSidebar";
import { CanvasArea } from "./CanvasArea";
import { Inspector } from "./Inspector";
import { Topbar } from "./Topbar";
import { useEditorShortcuts } from "./useUndoRedoShortcuts";

/**
 * Moldura (shell) do produto. Rail de altura cheia à esquerda; à direita, uma
 * topbar slim (M5) sobre o grid páginas | canvas | inspector.
 */
export function AppShell() {
  useEditorShortcuts(); // undo/redo, duplicar, excluir, nudge, esc

  // Garante uma página ativa ao montar (primeira do board ativo).
  useEffect(() => {
    const s = useEditorStore.getState();
    if (s.selection.pageId) return;
    const boardId = s.ui.activeBoardId ?? s.document.boards[0] ?? null;
    const first = boardId ? s.document.entities.boards[boardId]?.pages[0] ?? null : null;
    if (boardId && s.ui.activeBoardId !== boardId) s.setActiveBoard(boardId);
    if (first) s.setActivePage(first);
  }, []);

  // Overrides de tokens do documento (M6.B): aplicados no root → cascateiam
  // para todo o app (canvas + chrome), como o rootStyle do SPEC.
  const tokenVars = useEditorStore((s) => s.document.tokens.vars);

  return (
    <div
      style={{
        ...(tokenVars as CSSProperties),
        display: "grid",
        gridTemplateColumns: "minmax(180px, 200px) minmax(0, 1fr)",
        height: "100vh",
        background: "var(--bs-bg)",
        color: "var(--bs-text)",
        fontFamily: "var(--bs-font)",
        overflow: "hidden",
      }}
    >
      <Rail />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, minHeight: 0 }}>
        <Topbar />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(210px, 240px) minmax(0, 1fr) minmax(280px, 320px)",
            flex: 1,
            minHeight: 0,
          }}
        >
          <PagesSidebar />
          <CanvasArea />
          <Inspector />
        </div>
      </div>
    </div>
  );
}
