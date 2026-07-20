export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { Metric, Panel, PanelHeader, Badge, EmptyState } from "@/components/ui/primitives";
import { NovaContaButton, NovaTransferenciaButton } from "@/components/actions/QuickButtons";
import { formatBRL, formatDateBR } from "@/lib/format";
import { getContas, getContasSaldos, getLancamentos, getCartoes, getComprasCartao, getFormOptions } from "@/lib/data";

const TIPO_LABEL: Record<string, string> = { bancaria: "Bancária", especie: "Espécie", investimento: "Investimento", cripto: "Cripto" };

export default async function PatrimonioPage() {
  const [contas, saldos, lancamentos, cartoes, compras, options] = await Promise.all([
    getContas(), getContasSaldos(), getLancamentos(), getCartoes(), getComprasCartao(), getFormOptions(),
  ]);

  const saldoDe = (id: string) => saldos.find((s) => s.conta_id === id)?.saldo_calculado ?? 0;
  const ativos = saldos.reduce((s, c) => s + Number(c.saldo_calculado), 0);
  const faturasAbertas = lancamentos.filter((l) => l.compra_cartao_id && l.status === "previsto").reduce((s, l) => s + Number(l.valor), 0);
  const patrimonio = ativos - faturasAbertas;
  const cripto = contas.filter((c) => c.tipo === "cripto");

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Patrimônio" title="Patrimônio" subtitle="Ativos, passivos e patrimônio líquido" accent="neutral" actions={<div className="flex gap-2"><NovaTransferenciaButton options={options} /><NovaContaButton options={options} /></div>} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Metric label="Patrimônio líquido" value={formatBRL(patrimonio)} accent="positive" size="lg" hint="Ativos − passivos" />
        <Metric label="Ativos" value={formatBRL(ativos)} hint={`${contas.filter((c) => c.ativa).length} conta(s)`} />
        <Metric label="Passivos" value={formatBRL(faturasAbertas)} accent="negative" hint="Faturas de cartão em aberto" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <PanelHeader title="Ativos" description="Contas, investimentos e reservas" action={<NovaContaButton options={options} />} />
          {contas.length === 0 ? (
            <EmptyState title="Nenhuma conta" description="Cadastre contas bancárias, espécie, investimentos e a reserva em USDT. O patrimônio é calculado por saldos reais — nunca por faturamento histórico." cta={<NovaContaButton options={options} />} />
          ) : (
            <div className="divide-y divide-line">
              {contas.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-ink-soft">{c.nome}</p>
                    <p className="text-2xs text-ink-dim">{TIPO_LABEL[c.tipo]} · desde {formatDateBR(c.data_base)}</p>
                  </div>
                  <span className="tnum text-ink">{formatBRL(saldoDe(c.id))}</span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="space-y-4">
          <Panel>
            <PanelHeader title="Passivos" description="Cartões e obrigações" />
            {cartoes.length === 0 && faturasAbertas === 0 ? (
              <p className="text-sm text-ink-faint">Nenhum passivo registrado.</p>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-faint">Faturas de cartão em aberto</span>
                  <span className="tnum text-negative">{formatBRL(faturasAbertas)}</span>
                </div>
                <p className="text-2xs text-ink-dim">{compras.length} compra(s) parcelada(s) em {cartoes.length} cartão(ões).</p>
              </div>
            )}
          </Panel>

          <Panel>
            <PanelHeader title="Reserva Binance / USDT" />
            {cripto.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-faint">Nenhuma reserva cripto. Crie uma conta do tipo <span className="text-ink">Cripto</span> — por exemplo R$ 950 guardados em USDT (não US$ 950). Cotação é manual nesta versão.</p>
                <NovaContaButton options={options} />
              </div>
            ) : (
              cripto.map((c) => (
                <div key={c.id} className="rounded-xl2 border border-line bg-surface-input p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-ink">{c.nome}</span>
                    <Badge accent="extra">{c.moeda_ativo}</Badge>
                  </div>
                  <p className="mt-2 text-2xl font-semibold tnum text-ink">{formatBRL(saldoDe(c.id))}</p>
                  {c.quantidade_ativo ? <p className="mt-1 text-2xs text-ink-dim">{c.quantidade_ativo} {c.moeda_ativo}{c.cotacao_manual_brl ? ` · cotação manual R$ ${c.cotacao_manual_brl}` : ""}</p> : null}
                </div>
              ))
            )}
          </Panel>
        </div>
      </div>

      <p className="text-2xs text-ink-dim">Transferências entre contas movem saldo sem virar receita ou despesa e nunca contam duas vezes no patrimônio.</p>
    </div>
  );
}
