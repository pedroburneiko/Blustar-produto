import type { ReactNode } from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Rótulo opcional à esquerda do switch. */
  label?: ReactNode;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

/**
 * Switch booleano do Blustar Design System (role="switch").
 * Ligado = cor de marca. Acessível por teclado.
 */
export function Toggle({ checked, onChange, label, disabled = false, id, className = "", ...rest }: ToggleProps) {
  const sw = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={rest["aria-label"]}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? "bg-brand" : "bg-surface-2",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-150",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );

  if (label == null) return <div className={className}>{sw}</div>;

  return (
    <label className={["flex items-center justify-between gap-3 cursor-pointer", className].filter(Boolean).join(" ")}>
      <span className="text-sm text-ink select-none">{label}</span>
      {sw}
    </label>
  );
}
