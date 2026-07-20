"use client";

import { Badge, EmptyState, Metric } from "@/components/ui/primitives";
import { useFormSubmit } from "@/components/forms/FormShell";
import { atualizarStatusEntrega } from "@/lib/actions";
import { ENTREGA_LABEL, ENTREGA_STEPS } from "@/lib/labels";
import { formatDateBR } from "@/lib/format";
import type { Venda } from "@/lib/types";

const EM_ABERTO = ["aguardando_pagamento", "aguardando_material", "em_producao", "aguardando_aprovacao"];

export function EntregasPanel({ vendas }: { vendas: Venda[] }) {
  const { run } = useFormSubmit();
  const abertas = vendas.filter((v) => v.status_entrega && v.status_entrega !== "entregue" && v.status_entrega !== "finalizado");

  const porStatus = (s: string) => abertas.filter((v) => v.status_entrega === s);

  if (abertas.length === 0) {
    return <EmptyState title="Nenhuma entrega em aberto" description="Vendas com entrega pendente aparecerão aqui, agrupadas por etapa: aguardando material, em produção, aguardando aprovação." />;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="Aguardando material" value={String(porStatus("aguardando_material").length)} accent="warning" />
        <Metric label="Em produção" value={String(porStatus("em_producao").length)} accent="smile" />
        <Metric label="Aguardando aprovação" value={String(porStatus("aguardando_aprovacao").length)} accent="vision" />
        <Metric label="Aguardando pagamento" value={String(porStatus("aguardando_pagamento").length)} accent="negative" />
      </div>

      {EM_ABERTO.map((status) => {
        const itens = porStatus(status);
        if (itens.length === 0) return null;
        return (
          <div key={status}>
            <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">{ENTREGA_LABEL[status]}</h4>
            <div className="overflow-hidden rounded-xl2 border border-line">
              {itens.map((v) => (
                <div key={v.id} className="flex items-center justify-between gap-4 border-b border-line/70 px-4 py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{v.cliente?.nome ?? "Sem cliente"}</p>
                    <p className="truncate text-2xs text-ink-dim">{v.produto?.nome} · desde {formatDateBR(v.data_venda)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge accent="neutral">{ENTREGA_LABEL[status]}</Badge>
                    <select
                      value={status}
                      onChange={(e) => run(() => atualizarStatusEntrega(v.id, e.target.value))}
                      className="rounded-lg2 border border-line bg-surface-input px-2 py-1 text-2xs text-ink-soft outline-none"
                    >
                      {ENTREGA_STEPS.map((s) => (
                        <option key={s} value={s}>{ENTREGA_LABEL[s]}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
