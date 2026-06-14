import { useEditorStore } from "@blustar/core";

/**
 * M1 (interino) — prova a ligação do @blustar/core: lê o documento da store.
 * A moldura (rail / pages / canvas / inspector) é montada na etapa 3 do M1.
 */
export function App() {
  const document = useEditorStore((s) => s.document);
  const boards = document.boards.map((id) => document.entities.boards[id]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "var(--bs-bg)",
        color: "var(--bs-text)",
        fontFamily: "var(--bs-font)",
        padding: "var(--bs-space-7)",
      }}
    >
      <h1 style={{ color: "var(--bs-brand)", marginTop: 0 }}>{document.name}</h1>
      <p style={{ color: "var(--bs-text-muted)" }}>
        Store ligada. {boards.length} boards:
      </p>
      <ul style={{ color: "var(--bs-text-muted)" }}>
        {boards.map((b) => (
          <li key={b.id}>
            {b.name} — {b.pages.length} páginas
          </li>
        ))}
      </ul>
    </main>
  );
}
