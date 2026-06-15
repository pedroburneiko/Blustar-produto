import type { ReactNode } from "react";

export interface BadgeProps {
  children: ReactNode;
  /** Tom visual: `brand` (turquesa, ink navy) ou `neutral` (surface + texto suave). */
  variant?: "brand" | "neutral";
  /** Glyph/ícone à esquerda do rótulo. */
  leftIcon?: ReactNode;
  className?: string;
  "aria-label"?: string;
}

/**
 * Chip compacto de rótulo/identidade (ex.: "◇ Card" numa instância de componente,
 * contador, status). Só tokens semânticos. Não é interativo.
 */
export function Badge({ children, variant = "neutral", leftIcon, className = "", ...rest }: BadgeProps) {
  const tone =
    variant === "brand"
      ? "bg-brand text-on-brand"
      : "bg-surface-2 text-subtle border border-line";
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5",
        "text-[11px] font-semibold uppercase leading-none tracking-wider whitespace-nowrap",
        tone,
        className,
      ].join(" ")}
      {...rest}
    >
      {leftIcon != null && <span aria-hidden>{leftIcon}</span>}
      {children}
    </span>
  );
}
