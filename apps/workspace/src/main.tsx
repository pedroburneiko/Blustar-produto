import React from "react";
import ReactDOM from "react-dom/client";
// CSS do DS (tokens --bs-* + fonte Versos + estilos dos componentes), empacotado
// a partir da fonte única @blustar/tokens no build de lib do @blustar/ui.
import "@blustar/ui/styles.css";
import { App } from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
