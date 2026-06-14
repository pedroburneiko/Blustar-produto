import { Toolbar, IconButton, Undo, Redo } from "@blustar/ui";
import { useEditorStore, useCanUndo, useCanRedo, undo, redo } from "@blustar/core";

/**
 * Topbar slim (sobre páginas/canvas/inspector) — nome do documento + undo/redo.
 * Os botões refletem canUndo/canRedo (reativos ao histórico).
 */
export function Topbar() {
  const name = useEditorStore((s) => s.document.name);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <Toolbar
      left={<strong style={{ color: "var(--bs-text)", fontSize: 14 }}>{name}</strong>}
      right={
        <>
          <IconButton size="sm" label="Desfazer (Cmd+Z)" icon={<Undo size={18} />} disabled={!canUndo} onClick={undo} />
          <IconButton size="sm" label="Refazer (Cmd+Shift+Z)" icon={<Redo size={18} />} disabled={!canRedo} onClick={redo} />
        </>
      }
    />
  );
}
