import { useEditorStore } from "@blustar/core";

/**
 * Overlay de guias de alinhamento (chrome do editor). Lê as linhas em que houve
 * snap no gesto atual (ui.interaction.guides) e desenha linhas turquesa
 * tracejadas no frame do canvas. Some quando não há gesto.
 */
export function GuidesOverlay() {
  const guides = useEditorStore((s) => s.ui.interaction?.guides ?? null);
  if (!guides) return null;

  const line = {
    position: "absolute" as const,
    background: "transparent",
    pointerEvents: "none" as const,
    zIndex: 3,
  };

  return (
    <>
      {guides.x.map((x, i) => (
        <div
          key={`x${i}`}
          style={{
            ...line,
            left: x,
            top: 0,
            bottom: 0,
            width: 0,
            borderLeft: "1px dashed var(--bs-brand)",
          }}
        />
      ))}
      {guides.y.map((y, i) => (
        <div
          key={`y${i}`}
          style={{
            ...line,
            top: y,
            left: 0,
            right: 0,
            height: 0,
            borderTop: "1px dashed var(--bs-brand)",
          }}
        />
      ))}
    </>
  );
}
