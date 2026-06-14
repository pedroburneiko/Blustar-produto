import type { HTMLAttributes, ReactNode } from "react";

export interface PanelProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  /** Título do cabeçalho (opcional). */
  title?: ReactNode;
  /** Ações à direita do cabeçalho (ex.: IconButton). */
  actions?: ReactNode;
  children?: ReactNode;
}

/**
 * Superfície de painel lateral do Blustar Design System.
 * Usada como sidebar de páginas e inspector. Cabeçalho opcional (título + ações)
 * e corpo rolável. Fundo `surface` sobre o canvas preto.
 */
export function Panel({ title, actions, className = "", children, ...props }: PanelProps) {
  const hasHeader = title != null || actions != null;
  return (
    <div
      className={[
        "flex h-full min-h-0 flex-col bg-surface border border-line",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {hasHeader && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-line">
          <span className="text-xs font-semibold uppercase tracking-wide text-subtle">
            {title}
          </span>
          {actions && <span className="flex items-center gap-1">{actions}</span>}
        </div>
      )}
      <div className="min-h-0 flex-1 overflow-auto">{children}</div>
    </div>
  );
}
