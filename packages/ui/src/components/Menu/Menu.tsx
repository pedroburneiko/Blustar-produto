import { useEffect, type ReactNode } from "react";

export interface MenuItem {
  label: ReactNode;
  onSelect: () => void;
  /** Dica de atalho à direita (ex.: "⌘D"). */
  shortcut?: ReactNode;
  /** Ação destrutiva (cor de perigo). */
  danger?: boolean;
  disabled?: boolean;
}

/** Cabeçalho de seção (não interativo) — agrupa itens no menu. */
export interface MenuHeader {
  header: ReactNode;
}

export type MenuEntry = MenuItem | MenuHeader | "separator";

export interface MenuProps {
  open: boolean;
  onClose: () => void;
  /** Canto superior-esquerdo do menu, em px de viewport. */
  position: { x: number; y: number };
  items: MenuEntry[];
  "aria-label"?: string;
}

/**
 * Menu popover do Blustar Design System. Controlado (open/onClose/position) para
 * servir tanto a um botão (•••) quanto a clique-direito. Fecha no Escape e no
 * clique fora. Itens com atalho, separador e variante "danger".
 */
export function Menu({ open, onClose, position, items, ...rest }: MenuProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* backdrop para capturar clique fora */}
      <div
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
        style={{ position: "fixed", inset: 0, zIndex: 1000 }}
      />
      <div
        role="menu"
        aria-label={rest["aria-label"]}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-md py-1 shadow-lg"
        style={{ position: "fixed", left: position.x, top: position.y, zIndex: 1001, minWidth: 180 }}
      >
        {items.map((item, i) =>
          item === "separator" ? (
            <div key={`sep${i}`} className="my-1 h-px bg-line" />
          ) : "header" in item ? (
            <div
              key={`hd${i}`}
              role="presentation"
              className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-subtle"
            >
              {item.header}
            </div>
          ) : (
            <button
              key={i}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={() => {
                item.onSelect();
                onClose();
              }}
              className={[
                "flex w-full items-center justify-between gap-6 px-3 py-1.5 text-left text-sm",
                "transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                item.danger
                  ? "text-danger hover:bg-surface-hover"
                  : "text-ink hover:bg-surface-hover",
              ].join(" ")}
            >
              <span>{item.label}</span>
              {item.shortcut != null && <span className="text-xs text-subtle">{item.shortcut}</span>}
            </button>
          ),
        )}
      </div>
    </>
  );
}
