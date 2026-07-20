"use client";

import { useState } from "react";
import { Badge, EmptyState, Metric } from "@/components/ui/primitives";
import { NovoCartaoButton, NovaCompraCartaoButton } from "@/components/actions/QuickButtons";
import { useFormSubmit } from "@/components/forms/FormShell";
import { pagarParcelaCartao } from "@/lib/actions";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { Cartao, CompraCartao, Lancamento } from "@/lib/types";

export function CartoesPanel({
  cartoes,
  compras,
  parcelasCartao,
  options,
}: {
  cartoes: Cartao[];
  compras: CompraCartao[];
  parcelasCartao: Lancamento[];
  options: FormOptions;
}) {
  const { run } = useFormSubmit();

  const faturaAtual = parcelasCartao.filter((l) => l.status === "previsto").reduce((s, l) => s + Number(l.valor), 0);
  const totalAberto = faturaAtual;

  if (cartoes.length === 0) {
    return (
      <EmptyState
        title="Nenhum cartão cadastrado"
        description="Cadastre um cartão e registre compras. Compras parceladas geram as parcelas futuras — pagar a fatura só muda o status, nunca duplica a despesa."
        cta={<NovoCartaoButton />}
      />
    );
  }

  const comprasPorCartao = (cartaoId: string) => compras.filter((c) => c.cartao_id === cartaoId);
  const parcelasPorCompra = (compraId: string) => parcelasCartao.filter((l) => l.compra_cartao_id === compraId).sort((a, b) => (a.numero_parcela_cartao ?? 0) - (b.numero_parcela_cartao ?? 0));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Metric label="Fatura em aberto" value={formatBRL(faturaAtual)} accent="negative" />
        <Metric label="Total parcelado em aberto" value={formatBRL(totalAberto)} />
        <Metric label="Cartões" value={String(cartoes.length)} />
      </div>

      <div className="flex justify-end gap-2">
        <NovoCartaoButton />
        <NovaCompraCartaoButton options={options} cartoes={cartoes.map((c) => ({ id: c.id, nome: c.nome }))} variant="primary" />
      </div>

      <div className="space-y-4">
        {cartoes.map((cartao) => (
          <div key={cartao.id} className="rounded-xl2 border border-line bg-surface p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-ink">{cartao.nome}</h4>
              <span className="text-2xs text-ink-dim">{cartao.dia_fechamento ? `fecha dia ${cartao.dia_fechamento}` : ""}{cartao.dia_vencimento ? ` · vence dia ${cartao.dia_vencimento}` : ""}</span>
            </div>
            {comprasPorCartao(cartao.id).length === 0 ? (
              <p className="text-xs text-ink-dim">Nenhuma compra registrada.</p>
            ) : (
              <div className="space-y-2">
                {comprasPorCartao(cartao.id).map((compra) => {
                  const ps = parcelasPorCompra(compra.id);
                  const pagas = ps.filter((p) => p.status === "pago").length;
                  return (
                    <details key={compra.id} className="rounded-lg2 border border-line">
                      <summary className="flex cursor-pointer items-center justify-between px-3 py-2.5 text-sm">
                        <span className="text-ink-soft">{compra.descricao ?? "Compra"}</span>
                        <span className="flex items-center gap-3 text-2xs text-ink-dim">
                          <span className="tnum">{formatBRL(compra.valor_total)}</span>
                          <Badge accent={pagas === ps.length ? "positive" : "warning"}>{pagas}/{ps.length} pagas</Badge>
                        </span>
                      </summary>
                      <div className="space-y-1.5 border-t border-line px-3 py-2.5">
                        {ps.map((p) => (
                          <div key={p.id} className="flex items-center justify-between text-xs">
                            <span className="text-ink-faint">Parcela {p.numero_parcela_cartao} · vence {formatDateBR(p.data_vencimento)}</span>
                            <span className="flex items-center gap-3">
                              <span className="tnum text-ink-soft">{formatBRL(p.valor)}</span>
                              {p.status === "pago" ? (
                                <Badge accent="positive">Paga</Badge>
                              ) : (
                                <button onClick={() => run(() => pagarParcelaCartao(p.id))} className="text-2xs font-medium text-positive hover:underline">Pagar</button>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
