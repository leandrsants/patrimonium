"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { THEME_STORAGE_KEY, type ResolvedTheme, type ThemePreference } from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolve(pref: ThemePreference): ResolvedTheme {
  return pref === "system" ? systemTheme() : pref;
}

function apply(theme: ResolvedTheme) {
  const r = document.documentElement;
  r.setAttribute("data-theme", theme);
  r.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Defaults iguais no servidor e no primeiro render do cliente (evita mismatch);
  // o valor real é lido do localStorage no efeito de mount.
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [resolved, setResolved] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    const stored = (localStorage.getItem(THEME_STORAGE_KEY) as ThemePreference | null) ?? "system";
    setPreferenceState(stored);
    setResolved(resolve(stored));
  }, []);

  // Em "sistema", acompanha mudanças do SO em tempo real.
  useEffect(() => {
    if (preference !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const t = systemTheme();
      setResolved(t);
      apply(t);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  const setPreference = useCallback((p: ThemePreference) => {
    localStorage.setItem(THEME_STORAGE_KEY, p);
    const t = resolve(p);
    const r = document.documentElement;
    r.classList.add("theme-transition");
    apply(t);
    setPreferenceState(p);
    setResolved(t);
    window.setTimeout(() => r.classList.remove("theme-transition"), 250);
  }, []);

  return <ThemeContext.Provider value={{ preference, resolved, setPreference }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme deve ser usado dentro de ThemeProvider");
  return ctx;
}
