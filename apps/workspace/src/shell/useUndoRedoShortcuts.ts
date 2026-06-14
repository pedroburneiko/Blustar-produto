import { useEffect } from "react";
import { undo, redo, useEditorStore } from "@blustar/core";

/** Foco em campo editável? Aí deixamos o atalho NATIVO do campo agir. */
function isEditable(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || node.isContentEditable;
}

/**
 * Atalhos do editor:
 *  - Cmd/Ctrl+Z / +Shift+Z → undo/redo
 *  - Cmd/Ctrl+D → duplicar layer selecionada
 *  - Delete/Backspace → excluir layer · Esc → limpar seleção
 *  - Setas → nudge 1px (Shift = 10px), apenas layers absolutas (pixel-exato)
 */
export function useEditorShortcuts(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditable(document.activeElement)) return;
      const s = useEditorStore.getState();
      const mod = e.metaKey || e.ctrlKey;
      const selId = s.selection.layerIds[0] ?? null;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selId) {
          const nid = s.duplicateLayer(selId);
          if (nid) s.selectLayers([nid]);
        }
        return;
      }
      if (!selId) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        s.removeLayer(selId);
        s.clearSelection();
        return;
      }
      if (e.key === "Escape") {
        s.clearSelection();
        return;
      }

      // nudge (só layers absolutas)
      const layer = s.document.entities.layers[selId];
      if (!layer?.rect) return;
      const step = e.shiftKey ? 10 : 1;
      const delta: Record<string, [number, number]> = {
        ArrowLeft: [-step, 0],
        ArrowRight: [step, 0],
        ArrowUp: [0, -step],
        ArrowDown: [0, step],
      };
      const d = delta[e.key];
      if (d) {
        e.preventDefault();
        s.nudgeLayer(selId, d[0], d[1]);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
