import type { ReactNode } from "react";

export interface TabItem {
  value: string;
  label: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  /** Valor da aba ativa (controlado). */
  value: string;
  onValueChange: (value: string) => void;
  /** Rótulo acessível do conjunto de abas. */
  "aria-label"?: string;
  className?: string;
}

/**
 * Abas controladas do Blustar Design System.
 * Aba ativa marcada por sublinhado na cor de marca; navegável por teclado.
 */
export function Tabs({ items, value, onValueChange, className = "", ...rest }: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={rest["aria-label"]}
      className={["flex items-center gap-1 border-b border-line", className].filter(Boolean).join(" ")}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={[
              "relative -mb-px px-3 py-2 text-sm font-semibold transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-t-sm",
              active
                ? "text-ink border-b-2 border-brand"
                : "text-subtle border-b-2 border-transparent hover:text-ink",
            ].join(" ")}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
