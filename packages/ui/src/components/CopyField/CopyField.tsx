import { useState } from "react";
import { Copy, CheckCircle } from "../Icon/Icon";

export interface CopyFieldProps {
  /** Texto exibido e copiado ao clicar. */
  value: string;
  /** Largura do campo (px ou CSS). Padrão: 649 (tamanho do design). */
  width?: number | string;
  /** Disparado após copiar com sucesso. */
  onCopy?: (value: string) => void;
  /** Alvo de toque de 48px no botão copiar (uso em campo). */
  touch?: boolean;
  className?: string;
}

/**
 * CopyField — campo de texto copiável do Blustar Design System.
 * Mostra um valor e um botão que copia para a área de transferência.
 */
export function CopyField({ value, width = 649, onCopy, touch = false, className = "" }: CopyFieldProps) {
  const hit = touch ? 48 : 24;
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.(value);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard indisponível — silencioso */
    }
  }

  return (
    <div
      className={`bs-copyfield ${className}`}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--bs-brand)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--bs-border-field)")}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width,
        height: 63,
        padding: "0 18px 0 22px",
        borderRadius: 11.5,
        border: "1px solid var(--bs-border-field)",
        background: "var(--bs-surface)",
        color: "var(--bs-text)",
        fontFamily: "var(--bs-font)",
        fontSize: 14,
        fontWeight: 400,
        boxSizing: "border-box",
        transition: "border-color .15s ease",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {value}
      </span>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Copiado" : "Copiar"}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        style={{
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: hit,
          height: hit,
          padding: 0,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          outline: "none",
          opacity: 1,
          transition: "opacity .12s ease",
        }}
      >
        {copied ? (
          <CheckCircle size={24} color="var(--bs-brand)" />
        ) : (
          <Copy size={24} color="var(--bs-brand)" />
        )}
      </button>
    </div>
  );
}

CopyField.displayName = "CopyField";
