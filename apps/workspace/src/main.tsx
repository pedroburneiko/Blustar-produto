import React from "react";
import ReactDOM from "react-dom/client";
// CSS do DS (tokens --bs-* + fonte Versos + estilos dos componentes), empacotado
// a partir da fonte única @blustar/tokens no build de lib do @blustar/ui.
import "@blustar/ui/styles.css";
import { undo, redo, useEditorStore } from "@blustar/core";
import { App } from "./App";
import { bootstrap } from "./persistence/bootstrap";

// Atalho de dev para inspecionar/testar a store no console. Sem efeito em produção.
if (import.meta.env.DEV) {
  Object.assign(window, { __editor: { store: useEditorStore, undo, redo } });
}

// Carrega o documento (Supabase se configurado; senão, exemplo em memória) antes
// de montar a UI.
bootstrap().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
