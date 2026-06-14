import { Panel, IconButton, Add, Check } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";

/**
 * Sidebar de páginas (esquerda) — espelha .guide-side do SPEC.
 * Lista as páginas do board ativo e permite selecionar / adicionar (sem
 * renderizar conteúdo — isso é M2).
 */
export function PagesSidebar() {
  const activeBoardId = useEditorStore((s) => s.ui.activeBoardId);
  const pages = useEditorStore((s) => {
    const board = activeBoardId ? s.document.entities.boards[activeBoardId] : null;
    return (board?.pages ?? []).map((id) => s.document.entities.pages[id]);
  });
  const activePageId = useEditorStore((s) => s.selection.pageId);

  function addPage() {
    if (!activeBoardId) return;
    const s = useEditorStore.getState();
    const page = s.addPage(activeBoardId, "Nova página");
    s.setActivePage(page.id);
  }

  return (
    <Panel
      title="Pages"
      actions={<IconButton size="sm" label="Nova página" icon={<Add size={16} />} onClick={addPage} />}
    >
      <ul style={{ listStyle: "none", margin: 0, padding: "var(--bs-space-2)" }}>
        {pages.map((p) => {
          const active = p.id === activePageId;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => useEditorStore.getState().setActivePage(p.id)}
                aria-current={active ? "page" : undefined}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--bs-space-2)",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 8px",
                  border: 0,
                  borderRadius: "var(--bs-radius-sm)",
                  cursor: "pointer",
                  background: active ? "var(--bs-surface-2)" : "transparent",
                  color: active ? "var(--bs-text)" : "var(--bs-text-muted)",
                  font: "inherit",
                  fontWeight: active ? 600 : 400,
                }}
              >
                <span style={{ width: 16, display: "inline-flex" }}>
                  {active && <Check size={16} color="var(--bs-brand)" />}
                </span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
