import { ColorField, IconButton, Undo } from "@blustar/ui";
import { useEditorStore } from "@blustar/core";

/** Tokens de cor semânticos editáveis (valor default = tokens.css do DS). */
const COLOR_TOKENS: { var: string; label: string; def: string }[] = [
  { var: "--bs-brand", label: "Marca", def: "#3fcce3" },
  { var: "--bs-bg", label: "Fundo", def: "#000000" },
  { var: "--bs-surface", label: "Superfície", def: "#161b21" },
  { var: "--bs-text", label: "Texto", def: "#ffffff" },
  { var: "--bs-text-muted", label: "Texto suave", def: "#e5e5e5" },
  { var: "--bs-success", label: "Sucesso", def: "#70ff82" },
  { var: "--bs-alert", label: "Alerta", def: "#ff5d00" },
  { var: "--bs-danger", label: "Erro", def: "#ff9187" },
];

/**
 * Painel de cores do documento (aba Styles). Edita tokens --bs-* → store →
 * override aplicado no root (cascateia para o app). Undoable; reset por token.
 */
export function StylesPanel() {
  const vars = useEditorStore((s) => s.document.tokens.vars);

  return (
    <div style={{ padding: "var(--bs-space-4) var(--bs-space-3)", display: "flex", flexDirection: "column", gap: "var(--bs-space-4)" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--bs-text-subtle)" }}>
        Cores
      </div>
      {COLOR_TOKENS.map((t) => {
        const overridden = vars[t.var] != null;
        const value = vars[t.var] ?? t.def;
        return (
          <div key={t.var} style={{ display: "flex", alignItems: "center", gap: "var(--bs-space-2)" }}>
            <span style={{ flex: 1, fontSize: 13, color: "var(--bs-text-muted)" }}>{t.label}</span>
            <ColorField
              value={value}
              onChange={(hex) => useEditorStore.getState().setToken(t.var, hex)}
              aria-label={t.label}
            />
            <IconButton
              size="sm"
              label={`Restaurar ${t.label}`}
              icon={<Undo size={16} />}
              disabled={!overridden}
              onClick={() => useEditorStore.getState().removeToken(t.var)}
            />
          </div>
        );
      })}
    </div>
  );
}
