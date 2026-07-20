"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/lib/actions";

export function ChecklistToggle({
  steps,
  values,
  onChange,
}: {
  steps: { key: string; label: string }[];
  values: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [local, setLocal] = useState<Record<string, boolean>>(values ?? {});
  const [pending, setPending] = useState<string | null>(null);

  const done = steps.filter((s) => local[s.key]).length;

  async function toggle(key: string) {
    const next = { ...local, [key]: !local[key] };
    setLocal(next);
    setPending(key);
    const res = await onChange(next);
    setPending(null);
    if (res.ok) router.refresh();
    else setLocal(local); // reverte
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xs text-ink-faint">{done} de {steps.length} concluídos</span>
        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full rounded-full bg-positive transition-all" style={{ width: `${(done / steps.length) * 100}%` }} />
        </div>
      </div>
      <div className="space-y-1.5">
        {steps.map((s) => (
          <button
            key={s.key}
            onClick={() => toggle(s.key)}
            disabled={pending === s.key}
            className="flex w-full items-center gap-3 rounded-lg2 border border-line px-3 py-2 text-left text-sm transition-colors hover:border-line-strong disabled:opacity-60"
          >
            <span className={`flex h-4 w-4 items-center justify-center rounded border ${local[s.key] ? "border-positive bg-positive text-canvas" : "border-line-strong"}`}>
              {local[s.key] ? (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </span>
            <span className={local[s.key] ? "text-ink-soft line-through" : "text-ink-soft"}>{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
