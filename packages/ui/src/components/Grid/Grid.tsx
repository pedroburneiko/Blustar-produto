import type { CSSProperties, ReactNode } from "react";
import { grid as gridToken } from "@blustar/tokens";

export interface GridProps {
  children?: ReactNode;
  /** Número de colunas. Padrão 12. */
  columns?: number;
  /** Espaço entre colunas (px). Padrão 30. */
  gutter?: number;
  /** Margem lateral (px). Padrão 160. */
  margin?: number;
  /** Mostra o overlay das colunas (#00BFFF 20%) para QA. */
  showOverlay?: boolean;
  style?: CSSProperties;
  className?: string;
}

/**
 * Grid — container de 12 colunas do Blustar (stretch).
 * Margem lateral 160px, gutter 30px (valores do Figma).
 */
export function Grid({
  children,
  columns = gridToken.columns,
  gutter = gridToken.gutter,
  margin = gridToken.margin,
  showOverlay = false,
  style,
  className = "",
}: GridProps) {
  return (
    <div
      className={`bs-grid ${className}`}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        columnGap: gutter,
        paddingLeft: margin,
        paddingRight: margin,
        ...style,
      }}
    >
      {showOverlay && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: `0 ${margin}px`,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            columnGap: gutter,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              style={{
                background: gridToken.overlay.color,
                opacity: gridToken.overlay.opacity,
                height: "100%",
              }}
            />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

export interface ColProps {
  children?: ReactNode;
  /** Quantas colunas ocupa. Padrão 1. */
  span?: number;
  /** Coluna inicial (1-based). Opcional. */
  start?: number;
  style?: CSSProperties;
  className?: string;
}

/** Col — célula que ocupa N colunas dentro do Grid. */
export function Col({ children, span = 1, start, style, className = "" }: ColProps) {
  return (
    <div
      className={`bs-col ${className}`}
      style={{
        gridColumn: start ? `${start} / span ${span}` : `span ${span}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

Grid.displayName = "Grid";
Col.displayName = "Col";
