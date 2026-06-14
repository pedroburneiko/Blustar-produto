import React from "react";
import ReactDOM from "react-dom/client";
// CSS do DS (tokens --bs-* + fonte Versos + estilos dos componentes), empacotado
// a partir da fonte única @blustar/tokens no build de lib do @blustar/ui.
import "@blustar/ui/styles.css";
import { resetEditor } from "@blustar/core";
import { App } from "./App";
import { sampleDocument } from "./sampleDocument";

// Semeia a store com o documento de exemplo antes de montar a UI (M1).
resetEditor(sampleDocument());

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
