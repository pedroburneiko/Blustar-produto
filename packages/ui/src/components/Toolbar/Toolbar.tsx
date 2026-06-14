import type { HTMLAttributes, ReactNode } from "react";

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  /** Conteúdo à esquerda (ex.: nome do documento). */
  left?: ReactNode;
  /** Conteúdo central (ex.: título/contexto). */
  center?: ReactNode;
  /** Conteúdo à direita (ex.: ações undo/redo). */
  right?: ReactNode;
  /** Se passado, ignora os slots e renderiza o conteúdo livre. */
  children?: ReactNode;
}

/**
 * Barra de ferramentas do Blustar Design System: superfície horizontal fina com
 * slots esquerda / centro / direita. Base da topbar do produto.
 */
export function Toolbar({ left, center, right, children, className = "", ...props }: ToolbarProps) {
  const cls = [
    "flex items-center h-12 shrink-0 px-3 gap-2 bg-surface border-b border-line",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (children) {
    return (
      <div className={cls} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div className={cls} {...props}>
      <div className="flex items-center gap-2 min-w-0">{left}</div>
      <div className="flex-1 min-w-0 truncate text-center text-sm text-muted">{center}</div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}
