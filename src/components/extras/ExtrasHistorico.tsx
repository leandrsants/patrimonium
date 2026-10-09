"use client";

import { useMemo, useState } from "react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { Select } from "@/components/ui/fields";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Lancamento } from "@/lib/types";

const STATUS_ACCENT: Record<string, "positive" | "warning" | "neutral"> = { recebido: "positive", previsto: "warning", cancelado: "neutral" };

/** Histórico de todas as receitas extras, com filtro por fonte. "Sem fonte" = extras avulsos (ex.: presentes). */
export function ExtrasHistorico({ lancamentos, fontes }: { lancamentos: Lancamento[]; fontes: { id: string; nome: string; cor: string }[] }) {
  const [filtro, setFiltro] = useState("");

  const linhas = useMemo(() => {
    const base = filtro === "" ? lancamentos : filtro === "sem" ? lancamentos.filter((l) => !l.fonte_extra_id) : lancamentos.filter((l) => l.fonte_extra_id === filtro);
    return [...base].sort((a, b) => (b.data_pagamento ?? b.data_vencimento ?? b.data_competencia).localeCompare(a.data_pagamento ?? a.data_vencimento ?? a.data_competencia));
  }, [lancamentos, filtro]);

  const totalRecebido = linhas.filter((l) => l.status === "recebido").reduce((s, l) => s + Number(l.valor), 0);

  if (lancamentos.length === 0) {
    return <EmptyState title="Nenhuma receita extra" description="Os recebimentos das fontes extras aparecem aqui." />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="w-56">
          <Select
            value={filtro}
            onChange={setFiltro}
            placeholder="Todas as fontes"
            options={[...fontes.map((f) => ({ value: f.id, label: f.nome })), { value: "sem", label: "Sem fonte (avulsos)" }]}
          />
        </div>
        <span className="text-sm tnum text-ink-soft">Recebido: <span className="font-semibold text-ink">{formatBRL(totalRecebido)}</span></span>
      </div>
      <div className="overflow-x-auto rounded-xl2 border border-line">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3 text-left font-semibold">Data</th>
              <th className="px-4 py-3 text-left font-semibold">Fonte</th>
              <th className="px-4 py-3 text-left font-semibold">Categoria</th>
              <th className="px-4 py-3 text-left font-semibold">Descrição</th>
              <th className="px-4 py-3 text-right font-semibold">Valor</th>
              <th className="px-4 py-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => (
              <tr key={l.id} className="border-b border-line/70 last:border-0">
                <td className="px-4 py-3 tnum text-ink-faint">{formatDateBR(l.data_pagamento ?? l.data_vencimento ?? l.data_competencia)}</td>
                <td className="px-4 py-3">
                  {l.fonte_extra ? (
                    <span className="inline-flex items-center gap-2 text-ink-soft">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.fonte_extra.cor }} />
                      {l.fonte_extra.nome}
                    </span>
                  ) : (
                    <span className="text-ink-dim">Sem fonte</span>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-faint">{l.categoria?.nome ?? "—"}</td>
                <td className="px-4 py-3 text-ink-faint">{l.observacao ?? "—"}</td>
                <td className="px-4 py-3 text-right tnum text-extra">{formatBRL(l.valor)}</td>
                <td className="px-4 py-3 text-right"><Badge accent={STATUS_ACCENT[l.status] ?? "neutral"}>{l.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
