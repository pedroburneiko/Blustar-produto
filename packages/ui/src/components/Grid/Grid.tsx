import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  grid as gridToken,
  gridByBreakpoint,
  breakpointForWidth,
} from "@blustar/tokens";

export interface GridProps {
  children?: ReactNode;
  /** Força o número de colunas, ignorando o breakpoint resolvido. */
  columns?: number;
  /** Força o espaço entre colunas (px), ignorando o breakpoint resolvido. */
  gutter?: number;
  /** Força a margem lateral (px), ignorando o breakpoint resolvido. */
  margin?: number;
  /** Mostra o overlay das colunas (#00BFFF 20%) para QA. */
  showOverlay?: boolean;
  style?: CSSProperties;
  className?: string;
}

/**
 * Mede a largura da CONTENT-BOX do elemento (a largura que o grid de fato
 * preenche). É a MESMA referência usada pelo chip "bp ativo" do painel — assim
 * o que a tela renderiza e o que o painel reporta nunca discordam numa fronteira.
 * Retorna `null` até a primeira medição.
 */
function useContentBoxWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      // contentBoxSize.inlineSize = largura da content-box (exclui padding/borda).
      const w = entry.contentBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
      setWidth(w);
    });
    observer.observe(el, { box: "content-box" });
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}

/**
 * Grid — container de colunas do Blustar (stretch), RESPONSIVO por breakpoint.
 *
 * Resolve o breakpoint pela largura da própria content-box (não da viewport) e
 * aplica `gridByBreakpoint[bp]`. As props `columns`/`gutter`/`margin` forçam um
 * valor específico, sobrepondo o breakpoint resolvido. Antes da primeira medição
 * usa o default desktop (token), evitando salto de layout.
 */
export function Grid({
  children,
  columns,
  gutter,
  margin,
  showOverlay = false,
  style,
  className = "",
}: GridProps) {
  const [ref, width] = useContentBoxWidth<HTMLDivElement>();
  const bp = width == null ? "desktop" : breakpointForWidth(width);
  const cfg = gridByBreakpoint[bp];

  const resolvedColumns = columns ?? cfg.columns;
  const resolvedGutter = gutter ?? cfg.gutter;
  const resolvedMargin = margin ?? cfg.margin;

  return (
    <div
      ref={ref}
      className={`bs-grid ${className}`}
      data-bp={bp}
      style={{
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${resolvedColumns}, 1fr)`,
        columnGap: resolvedGutter,
        paddingLeft: resolvedMargin,
        paddingRight: resolvedMargin,
        ...style,
      }}
    >
      {showOverlay && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: `0 ${resolvedMargin}px`,
            display: "grid",
            gridTemplateColumns: `repeat(${resolvedColumns}, 1fr)`,
            columnGap: resolvedGutter,
            pointerEvents: "none",
          }}
        >
          {Array.from({ length: resolvedColumns }).map((_, i) => (
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
