import { Button } from "@blustar/ui";

/**
 * Fase 0 — placeholder do produto. Sem features migradas.
 * Serve só para provar a fundação: o app consome @blustar/ui e os tokens
 * (canvas preto, turquesa de marca, fonte Versos) renderizam de ponta a ponta.
 */
export function App() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "var(--bs-space-6)",
        background: "var(--bs-bg)",
        color: "var(--bs-text)",
        fontFamily: "var(--bs-font)",
        textAlign: "center",
        padding: "var(--bs-space-6)",
      }}
    >
      <h1 style={{ margin: 0, color: "var(--bs-brand)" }}>BluStar Workspace</h1>
      <p style={{ margin: 0, color: "var(--bs-text-muted)" }}>
        Fase 0 — fundação do monorepo. Consumindo <code>@blustar/ui</code>.
      </p>
      <Button variant="primary" size="touch">
        Componente do DS
      </Button>
    </main>
  );
}
