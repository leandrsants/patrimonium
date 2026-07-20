"use client";

import { Metric, EmptyState, Badge } from "@/components/ui/primitives";
import { NovaContaButton, NovaTransferenciaButton } from "@/components/actions/QuickButtons";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { Conta, ContaSaldo } from "@/lib/types";

const TIPO_LABEL: Record<string, string> = {
  bancaria: "Bancária",
  especie: "Espécie",
  investimento: "Investimento",
  cripto: "Cripto",
};

export function ContasPanel({ contas, saldos, options }: { contas: Conta[]; saldos: ContaSaldo[]; options: FormOptions }) {
  const saldoDe = (id: string) => saldos.find((s) => s.conta_id === id)?.saldo_calculado ?? 0;
  const total = saldos.reduce((s, c) => s + Number(c.saldo_calculado), 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric label="Saldo total em contas" value={formatBRL(total)} accent="positive" size="lg" />
        <Metric label="Contas ativas" value={String(contas.filter((c) => c.ativa).length)} />
        <Metric label="Reservas cripto" value={String(contas.filter((c) => c.tipo === "cripto").length)} />
      </div>

      <div className="flex justify-end gap-2">
        <NovaTransferenciaButton options={options} />
        <NovaContaButton options={options} />
      </div>

      {contas.length === 0 ? (
        <EmptyState title="Nenhuma conta cadastrada" description="Cadastre contas bancárias, espécie, investimentos e a reserva em USDT. Toda conta tem saldo inicial e data-base." cta={<NovaContaButton options={options} />} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {contas.map((c) => (
            <div key={c.id} className="rounded-xl2 border border-line bg-surface p-5">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{c.nome}</p>
                  <p className="text-2xs text-ink-dim">{TIPO_LABEL[c.tipo]} · {c.moeda_ativo}</p>
                </div>
                <Badge accent={c.tipo === "cripto" ? "extra" : "neutral"}>{TIPO_LABEL[c.tipo]}</Badge>
              </div>
              <p className="text-2xl font-semibold tnum text-ink">{formatBRL(saldoDe(c.id))}</p>
              <div className="mt-3 space-y-1 text-2xs text-ink-dim">
                <p>Saldo inicial: <span className="tnum">{formatBRL(c.saldo_inicial)}</span> · desde {formatDateBR(c.data_base)}</p>
                {c.tipo === "cripto" && c.quantidade_ativo ? <p>{c.quantidade_ativo} {c.moeda_ativo}{c.cotacao_manual_brl ? ` · cotação R$ ${c.cotacao_manual_brl}` : ""}</p> : null}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-2xs text-ink-dim">Transferências entre contas movem saldo sem virar receita ou despesa, e nunca contam duas vezes no patrimônio.</p>
    </div>
  );
}
