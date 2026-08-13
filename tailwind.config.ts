import type { Config } from "tailwindcss";

/**
 * Todas as cores estruturais e de marca são tokens semânticos apontando para
 * variáveis CSS (canais "R G B"), definidas por tema em globals.css. O formato
 * `rgb(var(--x) / <alpha-value>)` preserva os modificadores de opacidade do
 * Tailwind (ex.: border-line/70, bg-warning/[0.04]) nos dois temas.
 */
const withVar = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: withVar("canvas"),
        surface: {
          DEFAULT: withVar("surface"),
          raised: withVar("surface-raised"),
          hover: withVar("surface-hover"),
          input: withVar("surface-input"),
        },
        line: {
          DEFAULT: withVar("line"),
          strong: withVar("line-strong"),
        },
        ink: {
          DEFAULT: withVar("ink"),
          soft: withVar("ink-soft"),
          faint: withVar("ink-faint"),
          dim: withVar("ink-dim"),
        },
        vision: {
          DEFAULT: withVar("vision"),
          soft: withVar("vision-soft"),
          dim: withVar("vision-dim"),
        },
        smile: {
          DEFAULT: withVar("smile"),
          soft: withVar("smile-soft"),
          dim: withVar("smile-dim"),
        },
        extra: {
          DEFAULT: withVar("extra"),
          dim: withVar("extra-dim"),
        },
        positive: { DEFAULT: withVar("positive"), dim: withVar("positive-dim") },
        negative: { DEFAULT: withVar("negative"), dim: withVar("negative-dim") },
        warning: { DEFAULT: withVar("warning"), dim: withVar("warning-dim") },
        // Fundo escuro fixo (nos dois temas) para texto sobre preenchimentos de marca.
        "on-accent": withVar("on-accent"),
        // Hover do botão primário e overlay de modais — tematizados.
        "primary-hover": withVar("primary-hover"),
        overlay: withVar("overlay"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      borderRadius: {
        lg2: "0.625rem",
        xl2: "0.875rem",
      },
      boxShadow: {
        panel: "var(--shadow-panel)",
        drawer: "var(--shadow-drawer)",
        pop: "var(--shadow-pop)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.18s ease-out",
        "slide-in": "slide-in 0.24s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.16s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
