/** @type {import('tailwindcss').Config} */
/*
 * As cores apontam para os tokens CSS de src/styles/globals.css (fonte única).
 * Não declare hex aqui — só referencie var(--bs-*).
 */
export default {
  content: ["./src/**/*.{ts,tsx}", "./.storybook/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Marca / ação
        brand: {
          DEFAULT: "var(--bs-brand)",
          hover: "var(--bs-brand-hover)",
          active: "var(--bs-brand-active)",
        },
        "on-brand": "var(--bs-on-brand)",
        focus: "var(--bs-focus-ring)",

        // Superfícies / texto / bordas
        bg: "var(--bs-bg)",
        surface: {
          DEFAULT: "var(--bs-surface)",
          hover: "var(--bs-surface-hover)",
          2: "var(--bs-surface-2)",
        },
        ink: "var(--bs-text)",
        muted: "var(--bs-text-muted)",
        subtle: "var(--bs-text-subtle)",
        line: "var(--bs-border)",

        // Status
        success: "var(--bs-success)",
        alert: "var(--bs-alert)",
        danger: "var(--bs-danger)",

        // Escala de cinza OFICIAL (gray-*)
        gray: {
          15: "var(--bs-gray-15)",
          30: "var(--bs-gray-30)",
          45: "var(--bs-gray-45)",
          60: "var(--bs-gray-60)",
          90: "var(--bs-gray-90)",
          120: "var(--bs-gray-120)",
          150: "var(--bs-gray-150)",
          180: "var(--bs-gray-180)",
        },
        white: "var(--bs-white)",

        // Aliases neutral-* (compat com classes existentes → escala gray oficial)
        neutral: {
          0: "var(--bs-white)",
          50: "var(--bs-gray-15)",
          200: "var(--bs-gray-30)",
          300: "var(--bs-gray-45)",
          400: "var(--bs-gray-60)",
          500: "var(--bs-gray-90)",
          700: "var(--bs-gray-120)",
          800: "var(--bs-gray-150)",
          900: "var(--bs-gray-180)",
        },
      },
      fontFamily: {
        sans: ["Versos", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "var(--bs-radius-sm)",
        md: "var(--bs-radius-md)",
        lg: "var(--bs-radius-lg)",
      },
      ringColor: {
        focus: "var(--bs-focus-ring)",
      },
      transitionTimingFunction: {
        brand: "var(--bs-ease)",
      },
    },
  },
  plugins: [],
};
