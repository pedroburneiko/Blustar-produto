import type { ComponentType, ReactNode } from "react";
import { CheckCircle, ErrorCircle, Warning } from "../Icon/Icon";
import type { IconProps } from "../Icon/Icon";

export type AlertVariant = "success" | "error" | "warning";

export interface AlertProps {
  /** Tipo do alerta. */
  variant?: AlertVariant;
  /** Mensagem do alerta. */
  children: ReactNode;
  /** Largura (px ou CSS). Padrão: 380 (tamanho do design). */
  width?: number | string;
  className?: string;
}

const styles: Record<
  AlertVariant,
  { bg: string; border: string; icon: string; Icon: ComponentType<IconProps> }
> = {
  success: {
    bg: "var(--bs-success-bg)",
    border: "var(--bs-success-border)",
    icon: "var(--bs-success)",
    Icon: CheckCircle,
  },
  error: {
    bg: "var(--bs-danger-bg)",
    border: "var(--bs-danger-border)",
    icon: "var(--bs-danger)",
    Icon: ErrorCircle,
  },
  warning: {
    bg: "var(--bs-alert-bg)",
    border: "var(--bs-alert-border)",
    icon: "var(--bs-alert)",
    Icon: Warning,
  },
};

/**
 * Alert — mensagem de feedback do Blustar Design System.
 * Variantes: "success" (verde), "error" (vermelho/danger), "warning" (laranja).
 */
export function Alert({ variant = "success", children, width = 380, className = "" }: AlertProps) {
  const s = styles[variant];
  const Icon = s.Icon;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`bs-alert ${className}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4.5,
        width,
        height: 63,
        padding: "0 22px 0 17px",
        borderRadius: 11.5,
        border: `1px solid ${s.border}`,
        background: s.bg,
        color: "var(--bs-text)",
        fontFamily: "var(--bs-font)",
        fontSize: 14,
        fontWeight: 400,
        boxSizing: "border-box",
      }}
    >
      <Icon size={24} color={s.icon} style={{ flexShrink: 0 }} />
      <span>{children}</span>
    </div>
  );
}

Alert.displayName = "Alert";
