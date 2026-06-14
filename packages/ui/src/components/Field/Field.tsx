import type { ReactNode } from "react";

export interface FieldProps {
  /** Rótulo do campo. */
  label?: ReactNode;
  /** id do controle, para associar o <label>. */
  htmlFor?: string;
  /** Texto de apoio abaixo do controle. */
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Linha de formulário do Blustar Design System: rótulo + controle (+ hint).
 * Base de organização dos campos do inspector.
 */
export function Field({ label, htmlFor, hint, children, className = "" }: FieldProps) {
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
