/** Tela de carregamento durante o bootstrap (carga do documento). */
export function Loading() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bs-bg)",
        color: "var(--bs-text-subtle)",
        fontFamily: "var(--bs-font)",
      }}
    >
      Carregando…
    </div>
  );
}
