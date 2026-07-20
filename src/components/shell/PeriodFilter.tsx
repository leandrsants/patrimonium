"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { PeriodKind } from "@/lib/period";

const OPTIONS: { value: PeriodKind; label: string }[] = [
  { value: "mes", label: "Mês" },
  { value: "trimestre", label: "Trimestre" },
  { value: "ano", label: "Ano" },
  { value: "meta", label: "Ciclo Meta" },
];

export function PeriodFilter({ current }: { current: PeriodKind }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function setPeriod(kind: PeriodKind) {
    const sp = new URLSearchParams(params.toString());
    sp.set("periodo", kind);
    router.push(`${pathname}?${sp.toString()}`);
  }

  return (
    <div className="inline-flex gap-1 rounded-lg2 border border-line bg-surface p-1">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          onClick={() => setPeriod(o.value)}
          className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
            current === o.value ? "bg-surface-hover text-ink" : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
