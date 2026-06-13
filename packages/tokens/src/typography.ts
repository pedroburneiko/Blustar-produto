/** Blustar — tokens de tipografia. Fonte da marca: Versos. */

export const fontFamily = {
  sans: '"Versos", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
} as const;

export const fontWeight = {
  regular: 400,
  semibold: 600,
  bold: 700,
} as const;

/** Escala tipográfica (rem). */
export const fontSize = {
  xs: "0.75rem",   // 12
  sm: "0.875rem",  // 14
  base: "1rem",    // 16
  lg: "1.125rem",  // 18
  xl: "1.5rem",    // 24
  "2xl": "2rem",   // 32
  "3xl": "2.5rem", // 40
  "4xl": "3.5rem", // 56
} as const;

export const lineHeight = {
  tight: 1.1,
  snug: 1.25,
  normal: 1.5,
} as const;
