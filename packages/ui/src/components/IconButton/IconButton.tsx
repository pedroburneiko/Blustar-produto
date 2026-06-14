import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type IconButtonSize = "sm" | "md" | "touch";
export type IconButtonVariant = "ghost" | "subtle";

export interface IconButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Rótulo acessível — obrigatório, já que o botão só tem ícone. */
  label: string;
  /** Ícone a renderizar. */
  icon: ReactNode;
  /** `touch` = 48px (alvo de toque mínimo para uso em campo). */
  size?: IconButtonSize;
  variant?: IconButtonVariant;
}

const base =
  "inline-flex items-center justify-center rounded-md transition-colors " +
  "duration-150 ease-out select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<IconButtonVariant, string> = {
  ghost: "bg-transparent text-muted hover:bg-surface-hover hover:text-ink",
  subtle: "bg-surface text-ink hover:bg-surface-hover",
};

const sizes: Record<IconButtonSize, string> = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  // Alvo de toque de 48px (uso em campo / mobile).
  touch: "h-12 w-12",
};

/**
 * Botão somente-ícone do Blustar Design System.
 * Exige `label` (aria-label) — acessível por padrão.
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    { label, icon, size = "md", variant = "ghost", className = "", type = "button", ...props },
    ref,
  ) => {
    const cls = [base, variants[variant], sizes[size], className].filter(Boolean).join(" ");
    return (
      <button ref={ref} type={type} className={cls} aria-label={label} title={label} {...props}>
        {icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";
