import { useState } from "react";
import { Chevron } from "../Icon/Icon";

export interface AccordionItemData {
  label: string;
  disabled?: boolean;
}

export interface AccordionProps {
  /** Título do cabeçalho (clicável). */
  title: string;
  /** Itens revelados quando aberto. */
  items: AccordionItemData[];
  /** Começa aberto? */
  defaultOpen?: boolean;
  /** Largura (px ou CSS). Padrão: 177 (tamanho do design). */
  width?: number | string;
  /** Disparado ao clicar num item. */
  onItemClick?: (label: string) => void;
  /** Alvos de toque de 48px no cabeçalho e itens (uso em campo). */
  touch?: boolean;
  className?: string;
}

/**
 * Accordion — cabeçalho expansível com lista de itens.
 * Cabeçalho em texto principal; itens em texto sutil. Usado em menus de navegação.
 */
export function Accordion({
  title,
  items,
  defaultOpen = false,
  width = 177,
  onItemClick,
  touch = false,
  className = "",
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const headerH = touch ? 48 : 36;
  const itemH = touch ? 48 : 30;

  return (
    <div
      className={`bs-accordion ${className}`}
      style={{ width, fontFamily: "var(--bs-font)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        style={{
          width: "100%",
          height: headerH,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: 0,
          border: "none",
          background: "transparent",
          color: "var(--bs-text)",
          fontFamily: "inherit",
          fontSize: 16,
          fontWeight: 400,
          cursor: "pointer",
          outline: "none",
          textAlign: "left",
          opacity: 1,
          transition: "opacity .15s ease",
        }}
      >
        <span>{title}</span>
        <Chevron
          size={18}
          color="var(--bs-text)"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s", flexShrink: 0 }}
        />
      </button>

      {open && (
        <ul style={{ listStyle: "none", margin: "18px 0 0", padding: 0 }}>
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                disabled={it.disabled}
                onClick={() => onItemClick?.(it.label)}
                onMouseEnter={(e) => { if (!it.disabled) e.currentTarget.style.color = "var(--bs-text)"; }}
                onMouseLeave={(e) => { if (!it.disabled) e.currentTarget.style.color = "var(--bs-text-subtle)"; }}
                style={{
                  width: "100%",
                  height: itemH,
                  display: "flex",
                  alignItems: "center",
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  color: "var(--bs-text-subtle)",
                  fontFamily: "inherit",
                  fontSize: 16,
                  fontWeight: 400,
                  cursor: it.disabled ? "not-allowed" : "pointer",
                  opacity: it.disabled ? 0.5 : 1,
                  outline: "none",
                  textAlign: "left",
                  transition: "color .15s ease",
                }}
              >
                {it.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

Accordion.displayName = "Accordion";
