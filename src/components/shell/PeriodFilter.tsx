"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { formatRangeShort, type Period, type PeriodKind } from "@/lib/period";
import { DateRangePopover } from "./DateRangePopover";

/** Presets com início/fim calculados no servidor (resolvePeriod). */
const PRESETS: { value: PeriodKind; label: string }[] = [
  { value: "mes", label: "Mês" },
  { value: "trimestre", label: "Trimestre" },
  { value: "ano", label: "Ano" },
  { value: "meta", label: "Ciclo Meta" },
];

function tabClass(active: boolean): string {
  return `rounded px-3 py-1 text-xs font-medium transition-colors ${
    active ? "bg-surface-hover text-ink" : "text-ink-faint hover:text-ink-soft"
  }`;
}

export function PeriodFilter({ period }: { period: Period }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = period.kind;

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

  // Presets seguem a lógica atual: só trocam `periodo`. Limpam from/to para não
  // deixar parâmetros órfãos na URL (resolvePeriod os ignora fora de "custom").
  function setPreset(kind: PeriodKind) {
    const sp = new URLSearchParams(params.toString());
    sp.set("periodo", kind);
    sp.delete("from");
    sp.delete("to");
    setOpen(false);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function applyCustom(from: string, to: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("periodo", "custom");
    sp.set("from", from);
    sp.set("to", to);
    setOpen(false);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div ref={ref} className="relative inline-flex items-center gap-2">
      <div className="inline-flex gap-1 rounded-lg2 border border-line bg-surface p-1">
        {PRESETS.map((o) => (
          <button key={o.value} onClick={() => setPreset(o.value)} className={tabClass(current === o.value)}>
            {o.label}
          </button>
        ))}
        <button
          onClick={() => setOpen((v) => !v)}
          className={tabClass(current === "custom")}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          Personalizado
        </button>
      </div>

      {current === "custom" ? (
        <span className="hidden text-2xs tnum text-ink-faint sm:inline">{formatRangeShort(period.from, period.to)}</span>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2">
          <DateRangePopover
            initialFrom={period.from}
            initialTo={period.to}
            onApply={applyCustom}
            onCancel={() => setOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
