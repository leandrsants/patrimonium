"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { InvestimentoForm } from "@/components/forms/ReceitaDespesaForms";
import type { FormOptions } from "@/components/forms/options";

export function InvestimentoQuick({ options, empresaId }: { options: FormOptions; empresaId?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg2 bg-ink px-3.5 text-sm font-medium text-canvas transition-colors hover:bg-white"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Investimento
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Investimento em anúncio">
        <InvestimentoForm options={options} onDone={() => setOpen(false)} empresaId={empresaId} />
      </Drawer>
    </>
  );
}
