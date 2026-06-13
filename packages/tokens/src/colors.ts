/**
 * Blustar — tokens de cor (API JS).
 * Fonte da verdade dos VALORES: src/styles/globals.css (var --bs-*).
 * Sistema dark-canvas. Primária = Azul Turquesa #3FCCE3. Azul Céu = só focus.
 */

export const palette = {
  // Secundária / azuis
  azul: {
    nuvem: "#DFFCFF",
    aberto: "#BFFAFF",
    horizonte: "#A6D9DE",
    turquesa: "#3FCCE3", // primária
    ceu: "#3259FF", // focus ring
    profundo: "#061833",
    noturno: "#04001E",
  },
  asfalto: "#000000",
  branco: "#FFFFFF",
  // Rampa funcional do primário (hover/active)
  turquesaHover: "#0FC4D5",
  turquesaActive: "#0DB3C2",

  // Neutros — escala de cinza oficial
  gray: {
    15: "#F7F7F7",
    30: "#E5E5E5",
    45: "#C7C7C7",
    60: "#8F8F8F",
    90: "#707070",
    120: "#363636",
    150: "#191919",
    180: "#000000",
  },

  // Status / terciária
  green: { "01": "#70FF82", "02": "#16331A" },
  orange: { "01": "#FFB282", "02": "#8D3100", "03": "#FF5D00" },
  yellow: { "01": "#FFE88B", "02": "#725400" },
  red: { "01": "#FF9187", "02": "#560907" },
} as const;

/** Tokens semânticos — use estes, não os primitivos. */
export const colors = {
  brand: palette.azul.turquesa,
  brandHover: palette.turquesaHover,
  brandActive: palette.turquesaActive,
  onBrand: palette.azul.noturno, // ink escuro sobre turquesa clara (contraste)
  /** Azul Céu de foco. NUNCA usar como cor de ação. */
  focusRing: palette.azul.ceu,

  bg: palette.asfalto, // canvas = preto #000000 (asfalto / gray-180)
  surface: "#161B21",
  surfaceHover: "#1C232C",
  surfaceRaised: "#242C36",

  text: palette.branco,
  textMuted: palette.gray[30],
  textSubtle: palette.gray[90],
  textDisabled: palette.gray[60],

  border: "#242C36",
  borderField: "#305B9B",

  success: palette.green["01"],
  successBg: palette.green["02"],
  danger: palette.red["01"],
  dangerBg: palette.red["02"],
  warning: palette.orange["03"],
  warningBg: palette.orange["02"],
} as const;

export type Palette = typeof palette;
export type Colors = typeof colors;
