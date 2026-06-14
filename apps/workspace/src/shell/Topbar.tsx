import { Toolbar, IconButton, Undo, Redo } from "@blustar/ui";
import { useEditorStore, useCanUndo, useCanRedo, undo, redo } from "@blustar/core";

const SAVE_LABEL: Record<string, string> = {
  saving: "Salvando…",
  saved: "Salvo",
  error: "Erro ao salvar",
};

/**
 * Topbar slim (sobre páginas/canvas/inspector) — nome do documento + status de
 * autosave + undo/redo. Botões refletem canUndo/canRedo (reativos ao histórico).
 */
export function Topbar() {
  const name = useEditorStore((s) => s.document.name);
  const saveStatus = useEditorStore((s) => s.ui.saveStatus);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <Toolbar
      left={
        <span style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <strong style={{ color: "var(--bs-text)", fontSize: 14 }}>{name}</strong>
          {saveStatus !== "idle" && (
            <span style={{ fontSize: 12, color: saveStatus === "error" ? "var(--bs-danger)" : "var(--bs-text-subtle)" }}>
              {SAVE_LABEL[saveStatus]}
            </span>
          )}
        </span>
      }
      right={
        <>
          <IconButton size="sm" label="Desfazer (Cmd+Z)" icon={<Undo size={18} />} disabled={!canUndo} onClick={undo} />
          <IconButton size="sm" label="Refazer (Cmd+Shift+Z)" icon={<Redo size={18} />} disabled={!canRedo} onClick={redo} />
        </>
      }
    />
  );
}
