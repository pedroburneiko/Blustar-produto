import { Toolbar, IconButton, Button, Undo, Redo, Play, Share } from "@blustar/ui";
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
  const preview = useEditorStore((s) => s.ui.preview);
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  return (
    <Toolbar
      left={
        <span style={{ display: "flex", alignItems: "baseline", gap: 10, minWidth: 0 }}>
          <strong style={{ color: "var(--bs-text)", fontSize: 14 }}>{name}</strong>
          <span
            role="status"
            aria-live="polite"
            style={{ fontSize: 12, color: saveStatus === "error" ? "var(--bs-danger)" : "var(--bs-text-subtle)" }}
          >
            {saveStatus !== "idle" ? SAVE_LABEL[saveStatus] : ""}
          </span>
        </span>
      }
      right={
        <span style={{ display: "flex", alignItems: "center", gap: "var(--bs-space-2)" }}>
          <IconButton size="sm" label="Desfazer (Cmd+Z)" icon={<Undo size={18} />} disabled={!canUndo} onClick={undo} />
          <IconButton size="sm" label="Refazer (Cmd+Shift+Z)" icon={<Redo size={18} />} disabled={!canRedo} onClick={redo} />
          <span aria-hidden style={{ width: 1, alignSelf: "stretch", margin: "4px var(--bs-space-1)", background: "var(--bs-surface-2)" }} />
          <IconButton
            size="sm"
            label={preview ? "Sair do preview" : "Pré-visualizar (play)"}
            icon={<Play size={18} />}
            aria-pressed={preview}
            onClick={() => useEditorStore.getState().setPreview(!preview)}
          />
          {/* Compartilhar e Publicar: presentes; ação a definir (sem handler ainda). */}
          <IconButton size="sm" label="Compartilhar" icon={<Share size={18} />} disabled />
          <Button
            size="sm"
            variant="secondary"
            style={{ background: "var(--bs-text)", color: "var(--bs-bg)", border: "none" }}
            disabled
          >
            Publicar
          </Button>
        </span>
      }
    />
  );
}
