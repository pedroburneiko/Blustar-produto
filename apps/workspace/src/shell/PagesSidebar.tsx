import { useRef, useState, type PointerEvent } from "react";
import { Panel, IconButton, Menu, TextField, Button, Add, Check, More, type MenuEntry } from "@blustar/ui";
import { useEditorStore, useShallow } from "@blustar/core";

interface MenuState {
  pageId: string;
  x: number;
  y: number;
}

type DropPos = "before" | "after" | "inside";
interface DragState {
  id: string;
  overId: string | null;
  pos: DropPos;
}

/**
 * Sidebar de páginas — espelha .guide-side do SPEC.
 * Lista páginas e sub-páginas (1 nível) do board ativo; ações via ••• e
 * clique-direito (renomear/sub-página/duplicar/excluir). Rename inline.
 */
export function PagesSidebar() {
  const activeBoardId = useEditorStore((s) => s.ui.activeBoardId);
  // ordem de board.pages; cada item sabe se é sub-página (parentId) para indentar.
  const pages = useEditorStore(
    useShallow((s) => {
      const board = activeBoardId ? s.document.entities.boards[activeBoardId] : null;
      return (board?.pages ?? []).map((id) => s.document.entities.pages[id]).filter(Boolean);
    }),
  );
  const activePageId = useEditorStore((s) => s.selection.pageId);

  const [menu, setMenu] = useState<MenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const dragRef = useRef<{ id: string; startY: number; active: boolean; overId: string | null; pos: DropPos } | null>(null);

  function rowPointerDown(e: PointerEvent, id: string) {
    if ((e.target as HTMLElement).closest("button, input")) return; // ••• / rename
    dragRef.current = { id, startY: e.clientY, active: false, overId: null, pos: "after" };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {
      /* id sintético */
    }
  }
  function rowPointerMove(e: PointerEvent) {
    const st = dragRef.current;
    if (!st) return;
    if (!st.active) {
      if (Math.abs(e.clientY - st.startY) < 4) return;
      st.active = true;
    }
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest("[data-page-id]");
    const overId = el?.getAttribute("data-page-id") ?? null;
    if (!overId || overId === st.id) {
      st.overId = null;
      setDrag({ id: st.id, overId: null, pos: "after" });
      return;
    }
    const r = (el as HTMLElement).getBoundingClientRect();
    const rel = (e.clientY - r.top) / r.height;
    const isTop = !useEditorStore.getState().document.entities.pages[overId]?.parentId;
    const pos: DropPos = rel < 0.33 ? "before" : rel > 0.66 ? "after" : isTop ? "inside" : "after";
    st.overId = overId;
    st.pos = pos;
    setDrag({ id: st.id, overId, pos });
  }
  function rowPointerUp(e: PointerEvent) {
    const st = dragRef.current;
    dragRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* id sintético */
    }
    if (st?.active && st.overId) useEditorStore.getState().movePage(st.id, st.overId, st.pos);
    setDrag(null);
  }

  function addPage() {
    if (!activeBoardId) return;
    const s = useEditorStore.getState();
    const page = s.addPage(activeBoardId, "Nova página");
    s.setActivePage(page.id);
  }

  function openMenu(pageId: string, x: number, y: number) {
    setMenu({ pageId, x, y });
  }

  function menuItems(pageId: string): MenuEntry[] {
    const s = useEditorStore.getState();
    const page = s.document.entities.pages[pageId];
    const isTop = !page?.parentId;
    const items: MenuEntry[] = [
      { label: "Renomear", onSelect: () => setRenamingId(pageId) },
    ];
    if (isTop) items.push({ label: "Adicionar sub-página", onSelect: () => {
      const sub = s.addSubPage(pageId);
      if (sub) s.setActivePage(sub.id);
    } });
    items.push({ label: "Duplicar", onSelect: () => { const d = s.duplicatePage(pageId); if (d) s.setActivePage(d.id); } });
    items.push("separator");
    items.push({ label: "Excluir", danger: true, shortcut: "del", onSelect: () => s.removePage(pageId) });
    return items;
  }

  return (
    <Panel
      title="Pages"
      aria-label="Páginas"
      actions={<IconButton size="sm" label="Nova página" icon={<Add size={16} />} onClick={addPage} />}
    >
      {pages.length === 0 && (
        <div style={{ padding: "var(--bs-space-5) var(--bs-space-3)", textAlign: "center", color: "var(--bs-text-subtle)", fontSize: 13 }}>
          Nenhuma página ainda.
          <div style={{ marginTop: "var(--bs-space-3)" }}>
            <Button variant="secondary" size="sm" onClick={addPage}>
              Criar página
            </Button>
          </div>
        </div>
      )}
      <ul style={{ listStyle: "none", margin: 0, padding: "var(--bs-space-2)" }}>
        {pages.map((p) => {
          const active = p.id === activePageId;
          const isSub = !!p.parentId;
          return (
            <li key={p.id}>
              <div
                className="pg-row"
                data-page-id={p.id}
                role="button"
                tabIndex={0}
                aria-current={active ? "page" : undefined}
                aria-label={`Página ${p.name}`}
                onClick={() => useEditorStore.getState().setActivePage(p.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    useEditorStore.getState().setActivePage(p.id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  openMenu(p.id, e.clientX, e.clientY);
                }}
                onPointerDown={(e) => rowPointerDown(e, p.id)}
                onPointerMove={rowPointerMove}
                onPointerUp={rowPointerUp}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--bs-space-2)",
                  padding: "8px 8px",
                  paddingLeft: isSub ? 28 : 8,
                  borderRadius: "var(--bs-radius-sm)",
                  cursor: "grab",
                  touchAction: "none",
                  background:
                    drag?.overId === p.id && drag.pos === "inside"
                      ? "var(--bs-surface-hover)"
                      : active
                        ? "var(--bs-surface-2)"
                        : "transparent",
                  color: active ? "var(--bs-text)" : "var(--bs-text-muted)",
                  fontWeight: active ? 600 : 400,
                  boxShadow:
                    drag?.overId === p.id && drag.pos === "before"
                      ? "inset 0 2px 0 var(--bs-brand)"
                      : drag?.overId === p.id && drag.pos === "after"
                        ? "inset 0 -2px 0 var(--bs-brand)"
                        : drag?.overId === p.id && drag.pos === "inside"
                          ? "inset 0 0 0 1px var(--bs-brand)"
                          : undefined,
                }}
              >
                <span style={{ width: 16, display: "inline-flex", flex: "0 0 auto" }}>
                  {active && <Check size={16} color="var(--bs-brand)" />}
                </span>
                {renamingId === p.id ? (
                  <TextField
                    autoFocus
                    value={p.name}
                    onChange={(e) => useEditorStore.getState().renamePage(p.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => setRenamingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Escape") setRenamingId(null);
                    }}
                    aria-label="Renomear página"
                  />
                ) : (
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                )}
                <IconButton
                  size="sm"
                  label="Ações da página"
                  icon={<More size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                    openMenu(p.id, r.left, r.bottom + 4);
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      {menu && (
        <Menu
          open
          onClose={() => setMenu(null)}
          position={{ x: menu.x, y: menu.y }}
          items={menuItems(menu.pageId)}
          aria-label="Ações da página"
        />
      )}
    </Panel>
  );
}
