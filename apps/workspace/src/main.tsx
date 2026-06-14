import React from "react";
import ReactDOM from "react-dom/client";
// CSS do DS (tokens --bs-* + fonte Versos + estilos dos componentes), empacotado
// a partir da fonte única @blustar/tokens no build de lib do @blustar/ui.
import "@blustar/ui/styles.css";
import { resetEditor, undo, redo, useEditorStore } from "@blustar/core";
import { App } from "./App";
import { sampleDocument } from "./sampleDocument";

// Semeia a store com o documento de exemplo antes de montar a UI (M1).
resetEditor(sampleDocument());

// Atalho de dev para inspecionar/testar a store no console (undo/redo chegam
// como atalho de teclado no M5). Sem efeito em produção.
if (import.meta.env.DEV) {
  Object.assign(window, { __editor: { store: useEditorStore, undo, redo } });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
