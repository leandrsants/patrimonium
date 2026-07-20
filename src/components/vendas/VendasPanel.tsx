"use client";

import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, EmptyState, KeyValue } from "@/components/ui/primitives";
import { PagamentoForm } from "@/components/forms/SmallForms";
import { NovaVendaButton } from "@/components/actions/QuickButtons";
import { useFormSubmit } from "@/components/forms/FormShell";
import { atualizarStatusEntrega } from "@/lib/actions";
import { ENTREGA_LABEL, ENTREGA_STEPS, SITUACAO_ACCENT, SITUACAO_LABEL } from "@/lib/labels";
import { formatBRL, formatDateBR } from "@/lib/format";
import type { FormOptions } from "@/components/forms/options";
import type { ParcelaSituacao, Venda } from "@/lib/types";

export function VendasPanel({
  vendas,
  parcelasPorVenda,
  options,
  empresaId,
  showEntrega = true,
}: {
  vendas: Venda[];
  parcelasPorVenda: Record<string, ParcelaSituacao[]>;
  options: FormOptions;
  empresaId: string;
  showEntrega?: boolean;
}) {
  const [selected, setSelected] = useState<Venda | null>(null);
  const contaOpts = options.contas.map((c) => ({ value: c.id, label: c.nome }));

  function totals(vendaId: string) {
    const ps = parcelasPorVenda[vendaId] ?? [];
    const recebido = ps.reduce((s, p) => s + Number(p.recebido_liquido), 0);
    const pendente = ps.reduce((s, p) => s + Number(p.saldo_pendente), 0);
    const atrasada = ps.some((p) => p.situacao_calculada === "atrasada");
    return { recebido, pendente, atrasada };
  }

  if (vendas.length === 0) {
    return (
      <EmptyState
        title="Nenhuma venda registrada"
        description="Registre uma venda — as parcelas são geradas automaticamente conforme a condição de pagamento do produto."
        cta={<NovaVendaButton options={options} empresaId={empresaId} />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NovaVendaButton options={options} empresaId={empresaId} />
      </div>
      <div className="overflow-hidden rounded-xl2 border border-line">
        {vendas.map((v) => {
          const t = totals(v.id);
          return (
            <button key={v.id} onClick={() => setSelected(v)} className="flex w-full items-center justify-between gap-4 border-b border-line/70 px-4 py-3 text-left transition-colors last:border-0 hover:bg-white/[0.02]">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">{v.cliente?.nome ?? "Sem cliente"}</p>
                <p className="truncate text-2xs text-ink-dim">{v.produto?.nome} · {formatDateBR(v.data_venda)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <div className="hidden text-right sm:block">
                  <p className="text-2xs text-ink-dim">Recebido / Vendido</p>
                  <p className="text-xs tnum text-ink-soft">{formatBRL(t.recebido, { compact: true })} / {formatBRL(v.valor_final, { compact: true })}</p>
                </div>
                {t.atrasada ? <Badge accent="negative">Atrasada</Badge> : t.pendente > 0 ? <Badge accent="warning">Pendente</Badge> : <Badge accent="positive">Quitada</Badge>}
              </div>
            </button>
          );
        })}
      </div>

      <VendaDrawer venda={selected} onClose={() => setSelected(null)} parcelas={selected ? parcelasPorVenda[selected.id] ?? [] : []} contaOpts={contaOpts} showEntrega={showEntrega} />
    </div>
  );
}

function VendaDrawer({
  venda,
  onClose,
  parcelas,
  contaOpts,
  showEntrega,
}: {
  venda: Venda | null;
  onClose: () => void;
  parcelas: ParcelaSituacao[];
  contaOpts: { value: string; label: string }[];
  showEntrega: boolean;
}) {
  const { run } = useFormSubmit();
  const [pagarId, setPagarId] = useState<string | null>(null);

  if (!venda) return null;
  const recebido = parcelas.reduce((s, p) => s + Number(p.recebido_liquido), 0);
  const pendente = parcelas.reduce((s, p) => s + Number(p.saldo_pendente), 0);

  return (
    <Drawer open={!!venda} onClose={onClose} title={venda.cliente?.nome ?? "Venda"} description={venda.produto?.nome ?? undefined}>
      <div className="space-y-6">
        <div className="rounded-xl2 border border-line bg-surface-input p-4">
          <KeyValue label="Valor vendido" value={<span className="tnum">{formatBRL(venda.valor_final)}</span>} />
          <KeyValue label="Recebido" value={<span className="tnum text-positive">{formatBRL(recebido)}</span>} />
          <KeyValue label="Pendente" value={<span className="tnum text-warning">{formatBRL(pendente)}</span>} />
          <KeyValue label="Data" value={formatDateBR(venda.data_venda)} />
          {venda.desconto_valor > 0 ? <KeyValue label="Desconto" value={formatBRL(venda.desconto_valor)} /> : null}
        </div>

        {showEntrega ? (
          <div>
            <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Status de entrega</h4>
            <div className="flex flex-wrap gap-2">
              {ENTREGA_STEPS.map((s) => (
                <button
                  key={s}
                  onClick={() => run(() => atualizarStatusEntrega(venda.id, s))}
                  className={`rounded-full px-3 py-1 text-2xs font-medium transition-colors ${
                    venda.status_entrega === s ? "bg-ink text-canvas" : "border border-line text-ink-faint hover:border-line-strong hover:text-ink-soft"
                  }`}
                >
                  {ENTREGA_LABEL[s]}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <h4 className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Parcelas</h4>
          <div className="space-y-2">
            {parcelas.map((p) => (
              <div key={p.id} className="rounded-lg2 border border-line px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-ink">{p.descricao ?? `Parcela ${p.numero}`}</p>
                    <p className="text-2xs text-ink-dim">Vence {formatDateBR(p.data_vencimento)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs tnum text-ink-soft">{formatBRL(p.recebido_liquido)} / {formatBRL(p.valor_devido)}</span>
                    <Badge accent={SITUACAO_ACCENT[p.situacao_calculada]}>{SITUACAO_LABEL[p.situacao_calculada]}</Badge>
                  </div>
                </div>
                {p.saldo_pendente > 0 && p.situacao_calculada !== "cancelada" ? (
                  pagarId === p.id ? (
                    <div className="mt-3 border-t border-line pt-3">
                      <PagamentoForm parcelaId={p.id} saldoPendente={Number(p.saldo_pendente)} contas={contaOpts} onDone={() => setPagarId(null)} />
                    </div>
                  ) : (
                    <button onClick={() => setPagarId(p.id)} className="mt-2 text-2xs font-medium text-positive hover:underline">
                      + Registrar pagamento
                    </button>
                  )
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}
