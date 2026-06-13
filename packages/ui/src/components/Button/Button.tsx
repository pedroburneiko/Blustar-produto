import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "touch";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Estilo visual do botão. */
  variant?: ButtonVariant;
  /** Tamanho do botão. `touch` = 48px (alvo de toque mínimo para uso em campo). */
  size?: ButtonSize;
  /** Ocupa toda a largura do container. */
  fullWidth?: boolean;
  /** Mostra estado de carregamento e desabilita interação. */
  loading?: boolean;
  /** Ícone opcional à esquerda do texto. */
  leftIcon?: ReactNode;
  children?: ReactNode;
}

const base =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-md " +
  "transition-colors duration-150 ease-out select-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 " +
  "disabled:opacity-50 disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-on-brand hover:bg-brand-hover active:bg-brand-active",
  secondary:
    "bg-transparent text-neutral-400 border-2 border-neutral-400 hover:text-neutral-0 hover:border-neutral-0 active:opacity-80",
  ghost:
    "bg-transparent text-neutral-400 underline underline-offset-4 px-0 hover:text-neutral-0 active:opacity-70",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-[26px] px-3 text-xs",
  md: "h-[34px] px-5 text-sm",
  lg: "h-11 px-6 text-base",
  // Alvo de toque mínimo (48px) para uso em campo (mobile/motoboy).
  touch: "h-12 px-6 text-base",
};

/**
 * Botão base do Blustar Design System.
 * Suporta variantes, tamanhos, estado de loading e ícone.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      leftIcon,
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const cls = [
      base,
      variants[variant],
      sizes[size],
      fullWidth ? "w-full" : "",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={cls}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          leftIcon
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
