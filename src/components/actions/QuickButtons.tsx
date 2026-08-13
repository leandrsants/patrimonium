"use client";

import { useState, type ReactNode } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { ClienteForm } from "@/components/forms/ClienteForm";
import { LeadForm } from "@/components/forms/LeadForm";
import { VendaForm } from "@/components/forms/VendaForm";
import { CampanhaForm, AssinaturaForm } from "@/components/forms/SmallForms";
import { ContaForm, TransferenciaForm, CartaoForm, CompraCartaoForm, DespesaRecorrenteForm } from "@/components/forms/ContasCartoesForms";
import { ReceitaForm, DespesaForm } from "@/components/forms/ReceitaDespesaForms";
import type { FormOptions } from "@/components/forms/options";

function TriggerButton({ label, onClick, variant = "secondary" }: { label: string; onClick: () => void; variant?: "primary" | "secondary" }) {
  const cls =
    variant === "primary"
      ? "bg-ink text-canvas hover:bg-primary-hover"
      : "border border-line-strong bg-surface-raised text-ink-soft hover:bg-surface-hover hover:text-ink";
  return (
    <button onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-lg2 px-3.5 text-sm font-medium transition-colors ${cls}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      {label}
    </button>
  );
}

function DrawerHost({ label, title, variant, children }: { label: string; title: string; variant?: "primary" | "secondary"; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TriggerButton label={label} onClick={() => setOpen(true)} variant={variant} />
      <Drawer open={open} onClose={() => setOpen(false)} title={title}>
        {children(() => setOpen(false))}
      </Drawer>
    </>
  );
}

export function NovoClienteButton({ variant }: { variant?: "primary" | "secondary" }) {
  return (
    <DrawerHost label="Novo cliente" title="Novo cliente" variant={variant}>
      {(close) => <ClienteForm onDone={close} />}
    </DrawerHost>
  );
}

export function NovoLeadButton({ options, empresaId, variant }: { options: FormOptions; empresaId?: string; variant?: "primary" | "secondary" }) {
  return (
    <DrawerHost label="Novo lead" title="Novo lead" variant={variant}>
      {(close) => <LeadForm options={options} onDone={close} empresaId={empresaId} />}
    </DrawerHost>
  );
}

export function NovaVendaButton({ options, empresaId, variant }: { options: FormOptions; empresaId?: string; variant?: "primary" | "secondary" }) {
  return (
    <DrawerHost label="Nova venda" title="Nova venda" variant={variant ?? "primary"}>
      {(close) => <VendaForm options={options} onDone={close} empresaId={empresaId} />}
    </DrawerHost>
  );
}

export function NovaCampanhaButton({ options, empresaId, variant }: { options: FormOptions; empresaId?: string; variant?: "primary" | "secondary" }) {
  return (
    <DrawerHost label="Nova campanha" title="Nova campanha" variant={variant}>
      {(close) => <CampanhaForm options={options} onDone={close} empresaId={empresaId} />}
    </DrawerHost>
  );
}

export function NovaAssinaturaButton({ options, variant }: { options: FormOptions; variant?: "primary" | "secondary" }) {
  return (
    <DrawerHost label="Nova assinatura" title="Nova assinatura" variant={variant ?? "primary"}>
      {(close) => <AssinaturaForm options={options} onDone={close} />}
    </DrawerHost>
  );
}

export function NovaContaButton({ options }: { options: FormOptions }) {
  return (
    <DrawerHost label="Nova conta" title="Nova conta">
      {(close) => <ContaForm options={options} onDone={close} />}
    </DrawerHost>
  );
}

export function NovaTransferenciaButton({ options }: { options: FormOptions }) {
  return (
    <DrawerHost label="Transferência" title="Nova transferência">
      {(close) => <TransferenciaForm options={options} onDone={close} />}
    </DrawerHost>
  );
}

export function NovoCartaoButton() {
  return (
    <DrawerHost label="Novo cartão" title="Novo cartão">
      {(close) => <CartaoForm onDone={close} />}
    </DrawerHost>
  );
}

export function NovaCompraCartaoButton({ options, cartoes, variant }: { options: FormOptions; cartoes: { id: string; nome: string }[]; variant?: "primary" | "secondary" }) {
  return (
    <DrawerHost label="Registrar compra" title="Compra no cartão" variant={variant}>
      {(close) => <CompraCartaoForm options={options} cartoes={cartoes} onDone={close} />}
    </DrawerHost>
  );
}

export function NovaRecorrenciaButton({ options }: { options: FormOptions }) {
  return (
    <DrawerHost label="Nova recorrência" title="Despesa recorrente">
      {(close) => <DespesaRecorrenteForm options={options} onDone={close} />}
    </DrawerHost>
  );
}

export function NovaReceitaButton({ options, empresaId }: { options: FormOptions; empresaId?: string }) {
  return (
    <DrawerHost label="Receita" title="Nova receita">
      {(close) => <ReceitaForm options={options} onDone={close} empresaId={empresaId} />}
    </DrawerHost>
  );
}

export function NovaDespesaButton({ options, empresaId }: { options: FormOptions; empresaId?: string }) {
  return (
    <DrawerHost label="Despesa" title="Nova despesa">
      {(close) => <DespesaForm options={options} onDone={close} empresaId={empresaId} />}
    </DrawerHost>
  );
}
