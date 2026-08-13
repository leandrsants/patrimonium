"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "./ThemeProvider";
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon, ThemeIcon } from "./icons";
import type { ThemePreference } from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Claro", icon: <SunIcon /> },
  { value: "dark", label: "Escuro", icon: <MoonIcon /> },
  { value: "system", label: "Sistema", icon: <MonitorIcon /> },
];

/** Seletor rápido de tema — discreto (ícone) com menu de 3 opções. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Alternar tema"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-lg2 border border-line text-ink-faint transition-colors hover:bg-surface-hover hover:text-ink"
      >
        <ThemeIcon preference={preference} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl2 border border-line bg-surface-raised p-1 shadow-pop animate-scale-in">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => {
                setPreference(o.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg2 px-2.5 py-2 text-sm transition-colors ${
                preference === o.value ? "bg-surface-hover text-ink" : "text-ink-soft hover:bg-surface-hover hover:text-ink"
              }`}
            >
              <span className="text-ink-faint">{o.icon}</span>
              {o.label}
              {preference === o.value ? <span className="ml-auto text-vision">{<CheckIcon />}</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
