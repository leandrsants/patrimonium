"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui/Drawer";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { LeadForm } from "@/components/forms/LeadForm";
import { VendaForm } from "@/components/forms/VendaForm";
import { ReceitaForm, DespesaForm, InvestimentoForm } from "@/components/forms/ReceitaDespesaForms";
import type { FormOptions } from "@/components/forms/options";

type Action =
  | "menu"
  | "receita"
  | "despesa"
  | "cliente"
  | "lead"
  | "investimento"
  | "venda";

const MENU: { key: Action; label: string; desc: string; icon: string }[] = [
  { key: "venda", label: "Venda", desc: "Registrar venda e gerar parcelas", icon: "$" },
  { key: "receita", label: "Receita", desc: "Entrada empresarial ou extra", icon: "↓" },
  { key: "despesa", label: "Despesa", desc: "Saída empresarial ou pessoal", icon: "↑" },
  { key: "cliente", label: "Cliente", desc: "Novo contato global", icon: "◎" },
  { key: "lead", label: "Lead", desc: "Nova oportunidade comercial", icon: "◇" },
  { key: "investimento", label: "Investimento em anúncio", desc: "Aquisição (entra no CAC)", icon: "◈" },
];

export function GlobalAdd({ options }: { options: FormOptions }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<Action>("menu");
  const pathname = usePathname();

  // Contexto inteligente: preencher empresa pela área atual.
  const empresaId = pathname.startsWith("/vision")
    ? options.empresas.find((e) => e.slug === "vision")?.id
    : pathname.startsWith("/digital-smile")
      ? options.empresas.find((e) => e.slug === "digital_smile")?.id
      : undefined;

  function close() {
    setOpen(false);
    setTimeout(() => setAction("menu"), 200);
  }

  const titles: Record<Action, string> = {
    menu: "Adicionar",
    receita: "Nova receita",
    despesa: "Nova despesa",
    cliente: "Novo cliente",
    lead: "Novo lead",
    investimento: "Investimento em anúncio",
    venda: "Nova venda",
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg2 bg-ink px-3.5 text-sm font-medium text-canvas transition-colors hover:bg-primary-hover"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Adicionar
      </button>

      <Drawer open={open} onClose={close} title={titles[action]} description={action === "menu" ? "O que você quer registrar?" : undefined}>
        {action === "menu" ? (
          <div className="space-y-2">
            {MENU.map((m) => (
              <button
                key={m.key}
                onClick={() => setAction(m.key)}
                className="flex w-full items-center gap-3 rounded-lg2 border border-line bg-surface-input px-4 py-3 text-left transition-colors hover:border-line-strong hover:bg-surface-hover"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg2 bg-line-strong text-sm text-ink-soft">{m.icon}</span>
                <span>
                  <span className="block text-sm font-medium text-ink">{m.label}</span>
                  <span className="block text-2xs text-ink-faint">{m.desc}</span>
                </span>
              </button>
            ))}
          </div>
        ) : action === "receita" ? (
          <ReceitaForm options={options} onDone={close} empresaId={empresaId} />
        ) : action === "despesa" ? (
          <DespesaForm options={options} onDone={close} empresaId={empresaId} />
        ) : action === "cliente" ? (
          <ClienteForm onDone={close} />
        ) : action === "lead" ? (
          <LeadForm options={options} onDone={close} empresaId={empresaId} />
        ) : action === "investimento" ? (
          <InvestimentoForm options={options} onDone={close} empresaId={empresaId} />
        ) : action === "venda" ? (
          <VendaForm options={options} onDone={close} empresaId={empresaId} />
        ) : null}
      </Drawer>
    </>
  );
}
