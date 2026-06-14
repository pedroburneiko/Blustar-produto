import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface NavItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Ícone à esquerda. */
  icon: ReactNode;
  /** Marca o item como ativo (página/board atual). */
  active?: boolean;
  /** Rótulo do item. */
  children: ReactNode;
}

/**
 * Item de navegação do rail (Blustar Design System).
 * Ícone + rótulo, com estado ativo. Usado no rail de boards do produto.
 */
export const NavItem = forwardRef<HTMLButtonElement, NavItemProps>(
  ({ icon, active = false, className = "", children, type = "button", ...props }, ref) => {
    const cls = [
      "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-left",
      "transition-colors duration-150 ease-out select-none",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
      active ? "bg-surface text-ink" : "text-muted hover:bg-surface-hover hover:text-ink",
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type={type}
        className={cls}
        aria-current={active ? "page" : undefined}
        {...props}
      >
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
          {icon}
        </span>
        <span className="min-w-0 flex-1 truncate">{children}</span>
      </button>
    );
  },
);

NavItem.displayName = "NavItem";
