"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { ProspeccaoForm } from "@/components/forms/ProspeccaoForm";
import type { LeadCandidate } from "@/components/digital-smile/CompletarLeadForm";
import type { FormOptions } from "@/components/forms/options";

export function RegistrarProspeccaoButton({ options, empresaId, variante, leadsExistentes = [] }: { options: FormOptions; empresaId: string; variante: "vision" | "smile"; leadsExistentes?: LeadCandidate[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex h-9 items-center gap-1.5 rounded-lg2 bg-ink px-3.5 text-sm font-medium text-canvas transition-colors hover:bg-primary-hover">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
        Registrar prospecção
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Registrar atividade de prospecção" description="Esforço comercial agregado do período">
        <ProspeccaoForm options={options} empresaId={empresaId} variante={variante} leadsExistentes={leadsExistentes} onDone={() => setOpen(false)} />
      </Drawer>
    </>
  );
}
