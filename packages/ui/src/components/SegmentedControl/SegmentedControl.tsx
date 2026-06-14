import type { ReactNode } from "react";

export interface SegmentOption {
  value: string;
  label: ReactNode;
}

export interface SegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Controle segmentado do Blustar Design System (escolha única entre poucas
 * opções, ex.: Dark/Light). role="radiogroup". Selecionado = superfície + ink.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  ...rest
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className={["inline-flex p-0.5 gap-0.5 rounded-md bg-surface border border-line", className]
        .filter(Boolean)
        .join(" ")}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={[
              "px-3 py-1 text-sm font-semibold rounded-[6px] transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              active ? "bg-surface-2 text-ink" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
