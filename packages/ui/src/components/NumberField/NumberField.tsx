import type { ReactNode } from "react";

export interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Sufixo (ex.: "colunas", "px"). */
  suffix?: ReactNode;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

function clamp(n: number, min?: number, max?: number) {
  if (min != null && n < min) return min;
  if (max != null && n > max) return max;
  return n;
}

/**
 * Campo numérico do Blustar Design System: input + stepper (− / +), com
 * min/max/step e sufixo opcional. Controlado (value/onChange numérico).
 */
export function NumberField({
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  disabled = false,
  id,
  className = "",
  ...rest
}: NumberFieldProps) {
  const set = (n: number) => onChange(clamp(n, min, max));
  const stepBtn =
    "h-9 w-8 shrink-0 grid place-items-center text-ink text-base leading-none " +
    "hover:bg-surface-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors";

  return (
    <div
      className={[
        "flex items-center bg-surface border border-line rounded-md overflow-hidden",
        "focus-within:ring-2 focus-within:ring-focus",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className={stepBtn + " border-r border-line"}
        aria-label="Diminuir"
        disabled={disabled || (min != null && value <= min)}
        onClick={() => set(value - step)}
      >
        −
      </button>
      <input
        id={id}
        type="number"
        value={Number.isFinite(value) ? value : ""}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={rest["aria-label"]}
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          if (!Number.isNaN(n)) set(n);
        }}
        className="w-full min-w-0 bg-transparent text-ink text-sm text-center px-1 py-2 outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {suffix != null && <span className="px-2 text-xs text-subtle whitespace-nowrap">{suffix}</span>}
      <button
        type="button"
        className={stepBtn + " border-l border-line"}
        aria-label="Aumentar"
        disabled={disabled || (max != null && value >= max)}
        onClick={() => set(value + step)}
      >
        +
      </button>
    </div>
  );
}
