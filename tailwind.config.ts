import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Camadas de profundidade (dark wealth premium)
        canvas: "#0a0b0e",
        surface: {
          DEFAULT: "#101216",
          raised: "#15181e",
          hover: "#1a1e25",
          input: "#0d0f13",
        },
        line: {
          DEFAULT: "rgba(255,255,255,0.06)",
          strong: "rgba(255,255,255,0.11)",
        },
        ink: {
          DEFAULT: "#f3f4f6",
          soft: "rgba(243,244,246,0.62)",
          faint: "rgba(243,244,246,0.38)",
          dim: "rgba(243,244,246,0.22)",
        },
        vision: {
          DEFAULT: "#cda349",
          soft: "#e0c583",
          dim: "rgba(205,163,73,0.14)",
        },
        smile: {
          DEFAULT: "#3d8bfd",
          soft: "#7cb0ff",
          dim: "rgba(61,139,253,0.14)",
        },
        extra: {
          DEFAULT: "#9b7ad6",
          dim: "rgba(155,122,214,0.14)",
        },
        positive: { DEFAULT: "#3ecf8e", dim: "rgba(62,207,142,0.13)" },
        negative: { DEFAULT: "#f0616d", dim: "rgba(240,97,109,0.13)" },
        warning: { DEFAULT: "#e0a64d", dim: "rgba(224,166,77,0.13)" },
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
        panel: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 12px 30px -18px rgba(0,0,0,0.8)",
        drawer: "-24px 0 60px -20px rgba(0,0,0,0.7)",
        pop: "0 16px 40px -12px rgba(0,0,0,0.7)",
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
