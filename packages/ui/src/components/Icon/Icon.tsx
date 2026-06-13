import type { CSSProperties } from "react";

export interface IconProps {
  /** Tamanho (largura e altura) em px. Padrão 24. */
  size?: number;
  /** Cor de preenchimento. Padrão: herda a cor do texto (currentColor). */
  color?: string;
  style?: CSSProperties;
  className?: string;
  /** Rótulo acessível. Se ausente, o ícone é decorativo. */
  title?: string;
}

function Svg({ size = 24, color = "currentColor", style, className, title, path }: IconProps & { path: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      style={style}
      className={className}
    >
      {title && <title>{title}</title>}
      <path d={path} fill={color} />
    </svg>
  );
}

/** Seta (Arrow Forward). */
export const ArrowForward = (p: IconProps) => (
  <Svg {...p} path="M12.875 8.34687L12.875 19L11.125 19L11.125 8.34687L6.225 13.2469L5 12L12 5L19 12L17.775 13.2469L12.875 8.34687Z" />
);

/** Check dentro de círculo. */
export const CheckCircle = (p: IconProps) => (
  <Svg {...p} path="M11.02 15.22L15.955 10.285L14.975 9.305L11.02 13.26L9.025 11.265L8.045 12.245L11.02 15.22ZM12 19C11.0317 19 10.1217 18.8162 9.27 18.4488C8.41833 18.0813 7.6775 17.5825 7.0475 16.9525C6.4175 16.3225 5.91875 15.5817 5.55125 14.73C5.18375 13.8783 5 12.9683 5 12C5 11.0317 5.18375 10.1217 5.55125 9.27C5.91875 8.41833 6.4175 7.6775 7.0475 7.0475C7.6775 6.4175 8.41833 5.91875 9.27 5.55125C10.1217 5.18375 11.0317 5 12 5C12.9683 5 13.8783 5.18375 14.73 5.55125C15.5817 5.91875 16.3225 6.4175 16.9525 7.0475C17.5825 7.6775 18.0813 8.41833 18.4488 9.27C18.8162 10.1217 19 11.0317 19 12C19 12.9683 18.8162 13.8783 18.4488 14.73C18.0813 15.5817 17.5825 16.3225 16.9525 16.9525C16.3225 17.5825 15.5817 18.0813 14.73 18.4488C13.8783 18.8162 12.9683 19 12 19ZM12 17.6C13.5633 17.6 14.8875 17.0575 15.9725 15.9725C17.0575 14.8875 17.6 13.5633 17.6 12C17.6 10.4367 17.0575 9.1125 15.9725 8.0275C14.8875 6.9425 13.5633 6.4 12 6.4C10.4367 6.4 9.1125 6.9425 8.0275 8.0275C6.9425 9.1125 6.4 10.4367 6.4 12C6.4 13.5633 6.9425 14.8875 8.0275 15.9725C9.1125 17.0575 10.4367 17.6 12 17.6Z" />
);

/** Chevron apontando para baixo. */
export const Chevron = (p: IconProps) => (
  <Svg {...p} path="M12 12.4297L15.8333 8.69995L17 9.83509L12 14.7L7 9.83509L8.16667 8.69995L12 12.4297Z" />
);

/** Copiar (content copy). */
export const Copy = (p: IconProps) => (
  <Svg {...p} path="M9.88235 16.2C9.52647 16.2 9.22181 16.0629 8.96838 15.7887C8.71495 15.5146 8.58824 15.185 8.58824 14.8V6.4C8.58824 6.015 8.71495 5.68542 8.96838 5.41125C9.22181 5.13708 9.52647 5 9.88235 5H15.7059C16.0618 5 16.3664 5.13708 16.6199 5.41125C16.8733 5.68542 17 6.015 17 6.4V14.8C17 15.185 16.8733 15.5146 16.6199 15.7887C16.3664 16.0629 16.0618 16.2 15.7059 16.2H9.88235ZM9.88235 14.8H15.7059V6.4H9.88235V14.8ZM7.29412 19C6.93824 19 6.63358 18.8629 6.38015 18.5887C6.12672 18.3146 6 17.985 6 17.6V7.8H7.29412V17.6H14.4118V19H7.29412Z" />
);

/** Erro — exclamação dentro de círculo. */
export const ErrorCircle = ({ size = 24, color = "currentColor", style, className, title }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    style={style}
    className={className}
  >
    {title && <title>{title}</title>}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 5h2v6h-2V7zm0 8h2v2h-2v-2z"
      fill={color}
    />
  </svg>
);

/** Aviso — exclamação dentro de triângulo. */
export const Warning = ({ size = 24, color = "currentColor", style, className, title }: IconProps) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    role={title ? "img" : undefined}
    aria-hidden={title ? undefined : true}
    aria-label={title}
    style={style}
    className={className}
  >
    {title && <title>{title}</title>}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 3L2 21h20L12 3zm-1 6h2v5h-2V9zm0 7h2v2h-2v-2z"
      fill={color}
    />
  </svg>
);
