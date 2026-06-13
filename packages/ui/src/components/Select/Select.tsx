import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { Chevron } from "../Icon/Icon";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps {
  /** Lista de opções. */
  options: SelectOption[];
  /** Valor selecionado (modo controlado). */
  value?: string;
  /** Valor inicial (modo não controlado). */
  defaultValue?: string;
  /** Texto exibido quando nada está selecionado. */
  placeholder?: string;
  /** Desabilita o componente inteiro. */
  disabled?: boolean;
  /** Tamanho. `touch` = 48px (alvo de toque mínimo para uso em campo). */
  size?: "md" | "touch";
  /** Rótulo acessível. */
  "aria-label"?: string;
  /** Disparado quando uma opção é escolhida. */
  onChange?: (value: string) => void;
  className?: string;
}

/**
 * Select (dropdown) do Blustar Design System.
 * Acessível (role=listbox), com navegação por teclado,
 * destaque no item em foco e fechamento ao clicar fora.
 */
export function Select({
  options,
  value,
  defaultValue,
  placeholder = "Selecione",
  disabled = false,
  size = "md",
  onChange,
  className = "",
  ...aria
}: SelectProps) {
  const triggerH = size === "touch" ? 48 : 34;
  const optionH = size === "touch" ? 48 : 35;
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? "");
  const selected = isControlled ? value : internal;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedOption = options.find((o) => o.value === selected);

  function commit(option: SelectOption) {
    if (option.disabled) return;
    if (!isControlled) setInternal(option.value);
    onChange?.(option.value);
    setOpen(false);
  }

  function toggle() {
    if (disabled) return;
    setOpen((o) => {
      const next = !o;
      if (next) {
        const i = options.findIndex((o) => o.value === selected);
        setActiveIndex(i >= 0 ? i : 0);
      }
      return next;
    });
  }

  function moveActive(delta: number) {
    setActiveIndex((i) => {
      let next = i;
      for (let step = 0; step < options.length; step++) {
        next = (next + delta + options.length) % options.length;
        if (!options[next]?.disabled) return next;
      }
      return i;
    });
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) toggle();
        else moveActive(1);
        break;
      case "ArrowUp":
        e.preventDefault();
        if (!open) toggle();
        else moveActive(-1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && options[activeIndex]) commit(options[activeIndex]);
        else toggle();
        break;
      case "Escape":
        setOpen(false);
        break;
      case "Home":
        if (open) { e.preventDefault(); setActiveIndex(0); }
        break;
      case "End":
        if (open) { e.preventDefault(); setActiveIndex(options.length - 1); }
        break;
    }
  }

  // Fecha ao clicar fora.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`bs-select ${className}`}
      style={{ position: "relative", width: 223, fontFamily: "var(--bs-font)" }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={toggle}
        onKeyDown={onKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={aria["aria-label"]}
        style={{
          width: "100%",
          height: triggerH,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          padding: "0 12px 0 16px",
          borderRadius: 11.5,
          border: "1px solid var(--bs-border)",
          background: "var(--bs-surface)",
          color: "var(--bs-text-muted)",
          fontSize: 12,
          fontWeight: 400,
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          outline: "none",
          transition: "border-color .15s ease, background .15s ease",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "var(--bs-brand)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "var(--bs-border)")}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bs-surface-hover)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bs-surface)")}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <Chevron
          size={18}
          color="var(--bs-brand)"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .18s", flexShrink: 0 }}
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          tabIndex={-1}
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            width: "100%",
            margin: 0,
            padding: 2.5,
            listStyle: "none",
            background: "var(--bs-surface)",
            border: "1px solid var(--bs-border)",
            borderRadius: 11.5,
            boxShadow: "0 8px 24px rgba(0,0,0,.4)",
            zIndex: 20,
            maxHeight: 240,
            overflowY: "auto",
          }}
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === selected;
            const isActive = i === activeIndex;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                aria-disabled={opt.disabled || undefined}
                onMouseEnter={() => !opt.disabled && setActiveIndex(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(opt)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  height: optionH,
                  padding: "0 14px 0 16px",
                  borderRadius: 12,
                  color: opt.disabled ? "var(--bs-text-disabled)" : "var(--bs-text-muted)",
                  fontSize: 12,
                  fontWeight: 400,
                  cursor: opt.disabled ? "not-allowed" : "pointer",
                  background: isActive && !opt.disabled ? "var(--bs-surface-2)" : "transparent",
                  transition: "background .12s",
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M11.7 3.7L5.5 9.9 2.3 6.7" stroke="var(--bs-brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

Select.displayName = "Select";
