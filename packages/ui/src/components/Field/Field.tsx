import type { ReactNode } from "react";

export interface FieldProps {
  /** Rótulo do campo. */
  label?: ReactNode;
  /** id do controle, para associar o <label>. */
  htmlFor?: string;
  /** Texto de apoio abaixo do controle. */
  hint?: ReactNode;
  /** Rótulo à esquerda e controle à direita (linha), em vez de empilhado. */
  inline?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Linha de formulário do Blustar Design System: rótulo + controle (+ hint).
 * Base de organização dos campos do inspector. `inline` põe rótulo à esquerda e
 * controle à direita (layout do painel Estilo Visual).
 */
export function Field({ label, htmlFor, hint, inline = false, children, className = "" }: FieldProps) {
  if (inline) {
    return (
      <div className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}>
        <div className="flex items-center gap-3">
          {label != null && (
            <label htmlFor={htmlFor} className="flex-1 min-w-0 text-base text-muted">
              {label}
            </label>
          )}
          <div className="shrink-0">{children}</div>
        </div>
        {hint != null && <span className="self-end text-xs text-subtle">{hint}</span>}
      </div>
    );
  }
  return (
    <div className={["flex flex-col gap-1.5", className].filter(Boolean).join(" ")}>
      {label != null && (
        <label
          htmlFor={htmlFor}
          className="text-xs font-semibold uppercase tracking-wide text-subtle"
        >
          {label}
        </label>
      )}
      {children}
      {hint != null && <span className="text-xs text-subtle">{hint}</span>}
    </div>
  );
}
