"use client";

import { Fragment, useState } from "react";
import { Panel, PanelHeader, Metric, Badge, EmptyState } from "@/components/ui/primitives";
import { PagamentoForm } from "@/components/forms/SmallForms";
import { SITUACAO_ACCENT, SITUACAO_LABEL } from "@/lib/labels";
import { formatBRL, formatDateBR, formatCompetencia } from "@/lib/format";

export type CobrancaRow = {
  id: string;
  clienteNome: string;
  servico: string;
  competencia: string | null;
  vencimento: string;
  valorDevido: number;
  recebido: number;
  saldo: number;
  situacao: "prevista" | "parcial" | "paga" | "cancelada" | "atrasada";
};

export function CobrancasPanel({ cobrancas, contaOpts }: { cobrancas: CobrancaRow[]; contaOpts: { value: string; label: string }[] }) {
  const [pagarId, setPagarId] = useState<string | null>(null);
  const [verPagas, setVerPagas] = useState(false);

  const pendentes = cobrancas.filter((c) => c.situacao !== "cancelada" && c.saldo > 0).sort((a, b) => a.vencimento.localeCompare(b.vencimento));
  const pagas = cobrancas.filter((c) => c.saldo <= 0 && c.recebido > 0);
  const totalReceber = pendentes.reduce((s, c) => s + c.saldo, 0);
  const totalVencido = pendentes.filter((c) => c.situacao === "atrasada").reduce((s, c) => s + c.saldo, 0);
  const recebidoTotal = cobrancas.reduce((s, c) => s + c.recebido, 0);

  const linhas = verPagas ? [...pendentes, ...pagas] : pendentes;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="A receber" value={formatBRL(totalReceber)} accent="warning" />
        <Metric label="Vencido" value={formatBRL(totalVencido)} accent={totalVencido > 0 ? "negative" : "neutral"} />
        <Metric label="Recebido (total)" value={formatBRL(recebidoTotal)} accent="positive" />
        <Metric label="Em aberto" value={String(pendentes.length)} />
      </div>

      <Panel>
        <div className="flex items-center justify-between">
          <PanelHeader title="Cobranças" description="Mensalidades de todos os contratos · registre o pagamento aqui" />
          {pagas.length > 0 ? (
            <button onClick={() => setVerPagas((v) => !v)} className="text-2xs font-medium text-ink-faint hover:text-ink-soft">
              {verPagas ? "Ocultar pagas" : `Ver pagas (${pagas.length})`}
            </button>
          ) : null}
        </div>

        {linhas.length === 0 ? (
          <EmptyState title="Nenhuma cobrança em aberto" description="Ao fechar um contrato, a 1ª mensalidade aparece aqui como 'a receber'. Cobranças futuras entram no vencimento de cada mês." />
        ) : (
          <div className="overflow-x-auto rounded-xl2 border border-line">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-line bg-white/[0.015] text-2xs uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-4 py-3 text-left font-semibold">Competência</th>
                  <th className="px-4 py-3 text-left font-semibold">Vencimento</th>
                  <th className="px-4 py-3 text-right font-semibold">Recebido / Devido</th>
                  <th className="px-4 py-3 text-right font-semibold">Situação</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="border-b border-line/70 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{c.clienteNome}</p>
                        <p className="text-2xs text-ink-dim">{c.servico}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-faint">{c.competencia ? formatCompetencia(c.competencia) : "—"}</td>
                      <td className="px-4 py-3 text-ink-faint">{formatDateBR(c.vencimento)}</td>
                      <td className="px-4 py-3 text-right tnum text-ink-soft">{formatBRL(c.recebido)} / {formatBRL(c.valorDevido)}</td>
                      <td className="px-4 py-3 text-right"><Badge accent={SITUACAO_ACCENT[c.situacao]}>{SITUACAO_LABEL[c.situacao]}</Badge></td>
                      <td className="px-4 py-3 text-right">
                        {c.saldo > 0 ? (
                          <button onClick={() => setPagarId(pagarId === c.id ? null : c.id)} className="text-2xs font-medium text-positive hover:underline">
                            {pagarId === c.id ? "Fechar" : "Registrar pagamento"}
                          </button>
                        ) : <span className="text-2xs text-ink-dim">quitada</span>}
                      </td>
                    </tr>
                    {pagarId === c.id ? (
                      <tr className="border-b border-line/70 bg-surface-input/40">
                        <td colSpan={6} className="px-4 py-4">
                          <PagamentoForm parcelaId={c.id} saldoPendente={c.saldo} contas={contaOpts} onDone={() => setPagarId(null)} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
