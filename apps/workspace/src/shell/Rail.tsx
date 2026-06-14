import { NavItem, IconButton, Home, Guide, Grid4, Gear, Logout } from "@blustar/ui";
import type { ReactNode } from "react";
import { useEditorStore } from "@blustar/core";
import type { BoardKind } from "@blustar/core";

const boardIcon: Record<BoardKind, (p: { size?: number }) => ReactNode> = {
  home: Home,
  guide: Guide,
  "design-system": Grid4,
};

/**
 * Rail do app (esquerda) — workspace + navegação de boards + rodapé.
 * Espelha o #sidebar do SPEC. Lê os boards da store e troca o board ativo.
 */
export function Rail() {
  const boards = useEditorStore((s) => s.document.boards.map((id) => s.document.entities.boards[id]));
  const activeBoardId = useEditorStore((s) => s.ui.activeBoardId);

  function selectBoard(boardId: string) {
    const s = useEditorStore.getState();
    s.setActiveBoard(boardId);
    // Seleciona a primeira página do board ao trocar.
    const first = s.document.entities.boards[boardId]?.pages[0] ?? null;
    s.setActivePage(first);
  }

  return (
    <aside
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--bs-space-1)",
        padding: "var(--bs-space-3)",
        borderRight: "1px solid var(--bs-border)",
        background: "var(--bs-bg)",
      }}
    >
      <div
        style={{
          padding: "var(--bs-space-2) var(--bs-space-2)",
          marginBottom: "var(--bs-space-2)",
          fontWeight: 700,
          color: "var(--bs-text)",
          letterSpacing: "0.02em",
        }}
      >
        BluStar
      </div>

      {boards.map((b) => {
        const Ico = boardIcon[b.kind];
        return (
          <NavItem
            key={b.id}
            icon={<Ico size={18} />}
            active={b.id === activeBoardId}
            onClick={() => selectBoard(b.id)}
          >
            {b.name}
          </NavItem>
        );
      })}

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--bs-space-2)",
          paddingTop: "var(--bs-space-2)",
          borderTop: "1px solid var(--bs-border)",
        }}
      >
        <IconButton size="sm" label="Configurações" icon={<Gear size={18} />} />
        <div style={{ flex: 1 }} />
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            borderRadius: "var(--bs-radius-full)",
            background: "var(--bs-surface-2)",
            color: "var(--bs-text)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          PB
        </span>
        <IconButton size="sm" label="Sair" icon={<Logout size={18} />} />
      </div>
    </aside>
  );
}
