import { useEffect } from "react";
import { undo, redo } from "@blustar/core";

/** Foco em campo editável? Aí deixamos o undo NATIVO do campo agir (como o SPEC). */
function isEditable(el: EventTarget | null): boolean {
  const node = el as HTMLElement | null;
  if (!node) return false;
  const tag = node.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || node.isContentEditable;
}

/** Cmd/Ctrl+Z = undo · Cmd/Ctrl+Shift+Z = redo (do documento). */
export function useUndoRedoShortcuts(): void {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      if (isEditable(document.activeElement)) return; // undo do campo de texto
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
