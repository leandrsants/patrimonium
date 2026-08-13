export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { Tabs } from "@/components/ui/Tabs";
import { Metric, Panel, PanelHeader } from "@/components/ui/primitives";
import { NovaReceitaButton, NovaDespesaButton } from "@/components/actions/QuickButtons";
import { LancamentosTable } from "@/components/financeiro/LancamentosTable";
import { ContasPanel } from "@/components/financeiro/ContasPanel";
import { CartoesPanel } from "@/components/financeiro/CartoesPanel";
import { RecorrenciasPanel } from "@/components/financeiro/RecorrenciasPanel";
import { SplitBar } from "@/components/charts/BarChart";
import { formatBRL } from "@/lib/format";
import { resolvePeriod, inRange } from "@/lib/period";
import {
  getEmpresas, getLancamentos, getContas, getContasSaldos, getCartoes, getComprasCartao,
  getDespesasRecorrentes, getFormOptions, getParcelasSituacao,
} from "@/lib/data";

export default async function FinanceiroPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = resolvePeriod(sp);

  const [empresas, lancamentos, contas, saldos, cartoes, compras, recorrencias, options, parcelas] = await Promise.all([
    getEmpresas(), getLancamentos(), getContas(), getContasSaldos(), getCartoes(), getComprasCartao(),
    getDespesasRecorrentes(), getFormOptions(), getParcelasSituacao(),
  ]);

  const empresasMap = Object.fromEntries(empresas.map((e) => [e.id, { nome: e.nome, slug: e.slug }]));
  const parcelasCartao = lancamentos.filter((l) => l.compra_cartao_id);

  const entradasPeriodo = lancamentos.filter((l) => l.tipo === "entrada" && l.status === "recebido" && inRange(l.data_pagamento, period));
  const saidasPeriodo = lancamentos.filter((l) => l.tipo === "saida" && l.status === "pago" && inRange(l.data_pagamento ?? l.data_competencia, period));
  const totalEntradas = entradasPeriodo.reduce((s, l) => s + Number(l.valor), 0);
  const totalSaidas = saidasPeriodo.reduce((s, l) => s + Number(l.valor), 0);
  // A receber e vencido derivam das PARCELAS (vendas + assinaturas), fonte única
  // de recebíveis no app — o mesmo que Dashboard e Digital Smile usam.
  const aReceber = parcelas.filter((p) => p.situacao_calculada !== "cancelada" && p.saldo_pendente > 0).reduce((s, p) => s + Number(p.saldo_pendente), 0);
  const vencido = parcelas.filter((p) => p.situacao_calculada === "atrasada").reduce((s, p) => s + Number(p.saldo_pendente), 0);
  const patrimonio = saldos.reduce((s, c) => s + Number(c.saldo_calculado), 0) - parcelasCartao.filter((l) => l.status === "previsto").reduce((s, l) => s + Number(l.valor), 0);

  const somaPor = (slug: string) => saidasPeriodo.filter((l) => l.empresa_id && empresasMap[l.empresa_id]?.slug === slug).reduce((s, l) => s + Number(l.valor), 0);
  const composicao = [
    { label: "Vision", value: somaPor("vision"), color: "rgb(var(--vision))" },
    { label: "Digital Smile", value: somaPor("digital_smile"), color: "rgb(var(--smile))" },
    { label: "Pessoal", value: saidasPeriodo.filter((l) => l.natureza === "despesa_pessoal").reduce((s, l) => s + Number(l.valor), 0), color: "rgb(var(--extra))" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Central financeira"
        title="Financeiro"
        subtitle="Receitas, despesas, contas, cartões e recorrências"
        actions={<div className="flex gap-2"><NovaReceitaButton options={options} /><NovaDespesaButton options={options} /></div>}
      />

      <Tabs
        tabs={[
          {
            label: "Visão geral",
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Metric label="Patrimônio líquido" value={formatBRL(patrimonio)} accent="positive" size="lg" />
                  <Metric label="Entradas (período)" value={formatBRL(totalEntradas)} accent="positive" />
                  <Metric label="Saídas (período)" value={formatBRL(totalSaidas)} accent="negative" />
                  <Metric label="Resultado" value={formatBRL(totalEntradas - totalSaidas)} accent={totalEntradas - totalSaidas >= 0 ? "positive" : "negative"} />
                  <Metric label="A receber" value={formatBRL(aReceber)} accent="warning" />
                  <Metric label="Vencido" value={formatBRL(vencido)} />
                  <Metric label="Saldo em contas" value={formatBRL(saldos.reduce((s, c) => s + Number(c.saldo_calculado), 0))} />
                  <Metric label="Fatura de cartão" value={formatBRL(parcelasCartao.filter((l) => l.status === "previsto").reduce((s, l) => s + Number(l.valor), 0))} accent="negative" />
                </div>
                <Panel>
                  <PanelHeader title="Composição de despesas" description={`Saídas do período · ${period.label}`} />
                  <SplitBar parts={composicao} />
                </Panel>
              </div>
            ),
          },
          { label: "Receitas", content: <LancamentosTable lancamentos={lancamentos} tipo="entrada" empresasMap={empresasMap} emptyLabel="Nenhuma receita lançada" /> },
          { label: "Despesas", content: <LancamentosTable lancamentos={lancamentos} tipo="saida" empresasMap={empresasMap} emptyLabel="Nenhuma despesa lançada" /> },
          { label: "Contas", content: <ContasPanel contas={contas} saldos={saldos} options={options} /> },
          { label: "Cartões", content: <CartoesPanel cartoes={cartoes} compras={compras} parcelasCartao={parcelasCartao} options={options} /> },
          { label: "Recorrências", content: <RecorrenciasPanel recorrencias={recorrencias} options={options} empresasMap={empresasMap} /> },
        ]}
      />
    </div>
  );
}
