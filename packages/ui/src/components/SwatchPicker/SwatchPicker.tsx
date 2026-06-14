export interface Swatch {
  /** Valor aplicado (token CSS, ex.: "var(--bs-brand)" ou ""=padrão). */
  value: string;
  /** Rótulo acessível. */
  label: string;
  /** Cor exibida no swatch (default: o próprio value). */
  color?: string;
}

export interface SwatchPickerProps {
  swatches: Swatch[];
  value?: string;
  onChange: (value: string) => void;
  "aria-label"?: string;
  className?: string;
}

/**
 * Seletor de cor por paleta CURADA do Blustar Design System — só tokens, sem
 * hex arbitrário (regra de marca). role="radiogroup"; selecionado = anel de foco.
 */
export function SwatchPicker({ swatches, value, onChange, className = "", ...rest }: SwatchPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label={rest["aria-label"]}
      className={["flex flex-wrap gap-2", className].filter(Boolean).join(" ")}
    >
      {swatches.map((sw) => {
        const active = sw.value === value;
        const fill = sw.color ?? (sw.value || "transparent");
        return (
          <button
            key={sw.value || "default"}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={sw.label}
            title={sw.label}
            onClick={() => onChange(sw.value)}
            className={[
              "h-7 w-7 rounded-full border border-line transition-shadow",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              active ? "ring-2 ring-brand ring-offset-2 ring-offset-surface" : "",
            ].join(" ")}
            style={{ background: fill }}
          />
        );
      })}
    </div>
  );
}
