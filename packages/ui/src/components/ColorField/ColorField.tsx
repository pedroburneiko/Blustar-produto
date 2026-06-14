import { useId } from "react";

export interface ColorFieldProps {
  /** Cor atual em hex (#rrggbb). */
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
  "aria-label"?: string;
  className?: string;
}

const HEX = /^#([0-9a-fA-F]{6})$/;

function normalize(v: string): string | null {
  let s = v.trim();
  if (!s.startsWith("#")) s = "#" + s;
  if (/^#([0-9a-fA-F]{3})$/.test(s)) {
    s = "#" + s.slice(1).split("").map((c) => c + c).join("");
  }
  return HEX.test(s) ? s.toLowerCase() : null;
}

/**
 * Editor de cor do Blustar Design System: swatch (input de cor nativo) + hex.
 * Para DEFINIR valores de cor (ex.: tokens do documento) — não para uso de token.
 */
export function ColorField({ value, onChange, disabled = false, className = "", ...rest }: ColorFieldProps) {
  const id = useId();
  const safe = HEX.test(value) ? value : "#000000";
  return (
    <div className={["flex items-center gap-2", className].filter(Boolean).join(" ")}>
      <input
        id={id}
        type="color"
        value={safe}
        disabled={disabled}
        aria-label={rest["aria-label"] ?? "Cor"}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-line bg-transparent p-0 disabled:opacity-50 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0.5"
      />
      <input
        key={value}
        type="text"
        defaultValue={value}
        disabled={disabled}
        aria-label={(rest["aria-label"] ?? "Cor") + " (hex)"}
        spellCheck={false}
        onBlur={(e) => {
          const n = normalize(e.target.value);
          if (n) onChange(n);
          else e.target.value = value;
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        }}
        className="w-24 bg-surface text-ink border border-line rounded-md px-2 py-1 text-sm uppercase outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:opacity-50"
      />
    </div>
  );
}
