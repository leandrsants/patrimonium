"use client";

import { useMemo, useState } from "react";
import { Badge, EmptyState } from "@/components/ui/primitives";
import { SegmentedControl } from "@/components/ui/Tabs";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { Lancamento } from "@/lib/types";

type FiltroEmpresa = "todos" | "vision" | "digital_smile" | "extra" | "pessoal";

const STATUS_ACCENT: Record<string, "positive" | "warning" | "neutral"> = {
  recebido: "positive",
  pago: "positive",
  previsto: "warning",
  cancelado: "neutral",
};

export function LancamentosTable({
  lancamentos,
  tipo,
  empresasMap,
  emptyLabel,
}: {
  lancamentos: Lancamento[];
  tipo: "entrada" | "saida";
  empresasMap: Record<string, { nome: string; slug: string }>;
  emptyLabel: string;
}) {
  const [filtro, setFiltro] = useState<FiltroEmpresa>("todos");

  const base = lancamentos.filter((l) => l.tipo === tipo);
  const filtradas = useMemo(() => {
    if (filtro === "todos") return base;
    if (filtro === "extra") return base.filter((l) => l.natureza === "receita_extra");
    if (filtro === "pessoal") return base.filter((l) => l.natureza === "despesa_pessoal");
    return base.filter((l) => l.empresa_id && empresasMap[l.empresa_id]?.slug === filtro);
  }, [base, filtro, empresasMap]);

  const total = filtradas.reduce((s, l) => s + Number(l.valor), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl
          value={filtro}
          onChange={(v) => setFiltro(v as FiltroEmpresa)}
          options={[
            { value: "todos", label: "Tudo" },
            { value: "vision", label: "Vision" },
            { value: "digital_smile", label: "Digital Smile" },
            ...(tipo === "entrada" ? [{ value: "extra", label: "Extra" }] : [{ value: "pessoal", label: "Pessoal" }]),
          ]}
        />
        <span className="text-sm tnum text-ink-soft">Total: <span className="font-semibold text-ink">{formatBRL(total)}</span></span>
      </div>

      {filtradas.length === 0 ? (
        <EmptyState title={emptyLabel} description="Use o botão Adicionar para registrar. Os lançamentos aparecerão aqui com filtro por empresa, extra e pessoal." />
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-line">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
                <th className="px-4 py-3 text-left font-semibold">Data</th>
                <th className="px-4 py-3 text-left font-semibold">Descrição</th>
                <th className="px-4 py-3 text-left font-semibold">Classificação</th>
                <th className="px-4 py-3 text-left font-semibold">Conta</th>
                <th className="px-4 py-3 text-right font-semibold">Valor</th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((l) => (
                <tr key={l.id} className="border-b border-line/70 last:border-0">
                  <td className="px-4 py-3 text-ink-faint">{formatDateBR(l.data_pagamento ?? l.data_competencia)}</td>
                  <td className="px-4 py-3 text-ink-soft">{l.observacao ?? l.categoria?.nome ?? l.cliente?.nome ?? "—"}{l.entra_no_cac ? <span className="ml-2 text-2xs text-vision">CAC</span> : null}</td>
                  <td className="px-4 py-3 text-ink-faint">{classif(l, empresasMap)}</td>
                  <td className="px-4 py-3 text-ink-faint">{l.conta?.nome ?? "—"}</td>
                  <td className={`px-4 py-3 text-right tnum ${tipo === "entrada" ? "text-positive" : "text-negative"}`}>{formatBRL(l.valor)}</td>
                  <td className="px-4 py-3 text-right"><Badge accent={STATUS_ACCENT[l.status]}>{l.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function classif(l: Lancamento, empresasMap: Record<string, { nome: string; slug: string }>): string {
  if (l.natureza === "receita_extra") return "Extra";
  if (l.natureza === "despesa_pessoal") return "Pessoal";
  if (l.empresa_id && empresasMap[l.empresa_id]) return empresasMap[l.empresa_id].nome;
  return "—";
}
