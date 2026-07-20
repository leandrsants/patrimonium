export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { PeriodFilter } from "@/components/shell/PeriodFilter";
import { Tabs } from "@/components/ui/Tabs";
import { Metric, Panel, PanelHeader, EmptyState } from "@/components/ui/primitives";
import { NovaVendaButton, NovoClienteButton } from "@/components/actions/QuickButtons";
import { RegistrarProspeccaoButton } from "@/components/comercial/RegistrarProspeccaoButton";
import { InvestimentoQuick } from "@/components/comercial/InvestimentoQuick";
import { PipelineBoard } from "@/components/comercial/PipelineBoard";
import { FunnelChart } from "@/components/comercial/FunnelChart";
import { MetodoBreakdownPanel } from "@/components/comercial/MetodoBreakdownPanel";
import { TrafegoPagoPanel } from "@/components/comercial/TrafegoPagoPanel";
import { ClientesPanel } from "@/components/comercial/ClientesPanel";
import { VendasPanel } from "@/components/vendas/VendasPanel";
import { EntregasPanel } from "@/components/vendas/EntregasPanel";
import { ProdutosMetricasPanel } from "@/components/vendas/ProdutosMetricasPanel";
import { formatBRL } from "@/lib/format";
import { resolvePeriod } from "@/lib/period";
import { computeEmpresaMetrics, buildProdutoBreakdown, buildClienteRows, buildAquisicaoPorMetodo, somarRegistrosProspeccao } from "@/lib/metrics";
import { funnelVision } from "@/lib/calc";
import { ESTAGIOS_VISION } from "@/lib/labels";
import {
  getEmpresas, getProdutos, getVendas, getParcelasSituacao, getAssinaturas, getLancamentos,
  getOportunidades, getReunioesByOportunidade, getCampanhas, getRegistrosProspeccao, getFormOptions,
} from "@/lib/data";
import type { ParcelaSituacao, Reuniao } from "@/lib/types";

export default async function VisionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const empresas = await getEmpresas();
  const vision = empresas.find((e) => e.slug === "vision");
  if (!vision) return <EmptyState title="Vision não encontrada" description="Empresa não cadastrada no banco local." />;

  const [produtos, vendas, parcelas, assinaturas, lancamentos, oportunidades, campanhas, registros, options] = await Promise.all([
    getProdutos(), getVendas(vision.id), getParcelasSituacao(), getAssinaturas(vision.id), getLancamentos(),
    getOportunidades(vision.id), getCampanhas(), getRegistrosProspeccao(vision.id), getFormOptions(),
  ]);

  const metrics = computeEmpresaMetrics(vision, { lancamentos, vendas, parcelas, assinaturas }, period);
  const breakdown = buildProdutoBreakdown(produtos, vendas, vision.id, period);
  const clienteRows = buildClienteRows(vision.id, vendas, parcelas, assinaturas);
  const metodos = buildAquisicaoPorMetodo(vision.id, vendas, lancamentos, registros, period);
  const prospAgg = somarRegistrosProspeccao(registros, vision.id, period);
  const vendasNoPeriodo = vendas.filter((v) => v.data_venda >= period.from && v.data_venda <= period.to).length;
  const funnel = funnelVision(prospAgg, vendasNoPeriodo);

  const custoPorVenda = metrics.vendas > 0 ? metrics.investimento / metrics.vendas : null;
  const cacTrafego = metodos.find((m) => m.metodo === "trafego_pago")?.cac ?? null;
  const cacProsp = metodos.find((m) => m.metodo === "prospeccao_ativa")?.cac ?? null;

  const parcelasPorVenda: Record<string, ParcelaSituacao[]> = {};
  for (const p of parcelas) if (p.venda_id) (parcelasPorVenda[p.venda_id] ??= []).push(p);

  const reunioesEntries = await Promise.all(oportunidades.map(async (o) => [o.id, await getReunioesByOportunidade(o.id)] as [string, Reuniao[]]));
  const reunioesPorOportunidade = Object.fromEntries(reunioesEntries);

  const campanhasRows = campanhas.filter((c) => c.empresa_id === vision.id).map((c) => ({
    ...c,
    investimento: lancamentos.filter((l) => l.campanha_id === c.id && l.entra_no_cac).reduce((s, l) => s + Number(l.valor), 0),
    clientesConquistados: 0, receitaAtribuida: 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Empresa" title="Vision" subtitle="Fotos e vídeos com IA, combos e sites" accent="vision" actions={<PeriodFilter current={period.kind} />} />

      <Tabs
        tabs={[
          {
            label: "Resumo",
            content: (
              <div className="space-y-6">
                <div className="flex justify-end gap-2"><NovoClienteButton /><NovaVendaButton options={options} empresaId={vision.id} /></div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Metric label="Faturamento" value={formatBRL(metrics.faturamento)} accent="vision" />
                  <Metric label="Recebido" value={formatBRL(metrics.recebido)} accent="positive" />
                  <Metric label="A receber" value={formatBRL(metrics.aReceber)} accent="warning" />
                  <Metric label="Lucro" value={formatBRL(metrics.lucro)} accent={metrics.lucro >= 0 ? "positive" : "negative"} />
                  <Metric label="Vendas" value={String(metrics.vendas)} />
                  <Metric label="Ticket médio" value={metrics.ticketMedio === null ? "—" : formatBRL(metrics.ticketMedio)} />
                  <Metric label="Clientes novos" value={String(metrics.clientesNovos)} />
                  <Metric label="Investimento" value={formatBRL(metrics.investimento)} accent="vision" />
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <Metric label="CAC geral" value={metrics.cac === null ? "—" : formatBRL(metrics.cac)} />
                  <Metric label="CAC tráfego" value={cacTrafego === null ? "—" : formatBRL(cacTrafego)} />
                  <Metric label="CAC prospecção" value={cacProsp === null ? (metodos.find((m) => m.metodo === "prospeccao_ativa")?.investimento === 0 ? "sem custo" : "—") : formatBRL(cacProsp)} />
                  <Metric label="Custo por venda" value={custoPorVenda === null ? "—" : formatBRL(custoPorVenda)} />
                </div>
                <Panel>
                  <PanelHeader title="Faturamento por produto" description={`Período: ${period.label}`} />
                  <div className="divide-y divide-line">
                    {breakdown.length === 0 ? <p className="py-2 text-sm text-ink-faint">Nenhum produto ativo.</p> :
                      breakdown.map((b) => (
                        <div key={b.nome} className="flex items-center justify-between py-3 text-sm">
                          <span className="text-ink-soft">{b.nome}</span>
                          <span className="tnum text-ink-faint">{b.vendas} venda(s) · {formatBRL(b.valor)}</span>
                        </div>
                      ))}
                  </div>
                </Panel>
              </div>
            ),
          },
          {
            label: "Comercial",
            content: (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-end gap-2"><RegistrarProspeccaoButton options={options} empresaId={vision.id} variante="vision" /></div>
                <Panel>
                  <PanelHeader title="Funil de prospecção" description={`Esforço agregado + vendas reais · ${period.label}`} />
                  <FunnelChart stages={funnel} />
                </Panel>
                <PipelineBoard oportunidades={oportunidades} reunioesPorOportunidade={reunioesPorOportunidade} estagios={ESTAGIOS_VISION} options={options} empresaId={vision.id} />
              </div>
            ),
          },
          {
            label: "Aquisição",
            content: (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-end gap-2"><InvestimentoQuick options={options} empresaId={vision.id} /><RegistrarProspeccaoButton options={options} empresaId={vision.id} variante="vision" /></div>
                <Panel>
                  <PanelHeader title="Comparação por método de aquisição" description="Prospecção ativa × Tráfego pago × Orgânico × Indicação" />
                  <MetodoBreakdownPanel breakdown={metodos} />
                </Panel>
                <TrafegoPagoPanel campanhas={campanhasRows} investimentoTotal={metrics.investimento} clientesNovos={metrics.clientesNovos} cac={metrics.cac} options={options} empresaId={vision.id} variante="vision" />
              </div>
            ),
          },
          {
            label: "Clientes e vendas",
            content: (
              <div className="space-y-8">
                <ClientesPanel rows={clienteRows} />
                <div>
                  <h3 className="mb-3 text-2xs font-semibold uppercase tracking-wide text-ink-faint">Vendas · parcelas · pagamentos</h3>
                  <VendasPanel vendas={vendas} parcelasPorVenda={parcelasPorVenda} options={options} empresaId={vision.id} />
                </div>
              </div>
            ),
          },
          { label: "Produtos", content: <ProdutosMetricasPanel breakdown={breakdown} produtos={produtos.filter((p) => p.empresa_id === vision.id)} /> },
          { label: "Entregas", content: <EntregasPanel vendas={vendas} /> },
        ]}
      />
    </div>
  );
}
