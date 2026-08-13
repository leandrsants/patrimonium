export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { PeriodFilter } from "@/components/shell/PeriodFilter";
import { Tabs } from "@/components/ui/Tabs";
import { Metric, MiniMetric, Panel, PanelHeader, EmptyState } from "@/components/ui/primitives";
import { NovaVendaButton, NovoClienteButton } from "@/components/actions/QuickButtons";
import { RegistrarProspeccaoButton } from "@/components/comercial/RegistrarProspeccaoButton";
import { InvestimentoQuick } from "@/components/comercial/InvestimentoQuick";
import { PipelineBoard } from "@/components/comercial/PipelineBoard";
import { FunnelChart } from "@/components/comercial/FunnelChart";
import { MetodoBreakdownPanel } from "@/components/comercial/MetodoBreakdownPanel";
import { TrafegoPagoPanel } from "@/components/comercial/TrafegoPagoPanel";
import { VendasPanel } from "@/components/vendas/VendasPanel";
import { EntregasPanel } from "@/components/vendas/EntregasPanel";
import { ProdutosMetricasPanel } from "@/components/vendas/ProdutosMetricasPanel";
import { PeriodLineChart } from "@/components/charts/LineChart";
import { AtencaoVision, MetaContribuicaoCard } from "@/components/vision/VisionInsights";
import { formatBRL } from "@/lib/format";
import { resolvePeriod, previousPeriod } from "@/lib/period";
import {
  computeEmpresaMetrics, buildProdutoBreakdown, buildAquisicaoPorMetodo, somarRegistrosProspeccao,
  buildVisionFaturamentoSerie, pctDelta, buildEmpresaAtencao, ltvPorMetodo,
} from "@/lib/metrics";
import { funnelVision } from "@/lib/calc";
import { ESTAGIOS_VISION } from "@/lib/labels";
import {
  getEmpresas, getProdutos, getVendas, getParcelasSituacao, getAssinaturas, getLancamentos,
  getOportunidades, getReunioesByOportunidade, getCampanhas, getRegistrosProspeccao, getFormOptions, getClientes, getMetaAtiva,
} from "@/lib/data";
import type { ParcelaSituacao, Reuniao } from "@/lib/types";

export default async function VisionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const empresas = await getEmpresas();
  const vision = empresas.find((e) => e.slug === "vision");
  if (!vision) return <EmptyState title="Vision não encontrada" description="Empresa não cadastrada no banco local." />;

  const [produtos, vendas, parcelas, assinaturas, lancamentos, oportunidades, campanhas, registros, options, clientes, meta] = await Promise.all([
    getProdutos(), getVendas(vision.id), getParcelasSituacao(), getAssinaturas(vision.id), getLancamentos(),
    getOportunidades(vision.id), getCampanhas(), getRegistrosProspeccao(vision.id), getFormOptions(), getClientes(), getMetaAtiva(),
  ]);

  const metrics = computeEmpresaMetrics(vision, { lancamentos, vendas, parcelas, assinaturas }, period);
  const breakdown = buildProdutoBreakdown(produtos, vendas, vision.id, period);
  const metodos = buildAquisicaoPorMetodo(vision.id, vendas, lancamentos, registros, period);
  const prospAgg = somarRegistrosProspeccao(registros, vision.id, period);
  // Vendas do período (a lista de Vendas respeita o filtro; métricas já filtram internamente).
  const vendasPeriodo = vendas.filter((v) => v.data_venda >= period.from && v.data_venda <= period.to);
  const funnel = funnelVision(prospAgg, vendasPeriodo.length);

  // CAC único = investimento ÷ clientes novos (custo por cliente). Prospecção
  // ativa é custo zero por definição — já reflete no CAC geral, então não há
  // "CAC de tráfego" nem "custo por venda" separados.
  // ROAS = faturamento atribuído ÷ investimento.
  const roas = metrics.investimento > 0 ? metrics.faturamento / metrics.investimento : null;

  // Taxa de recompra (histórica, sobre TODAS as vendas ativas da Vision): % de
  // clientes DISTINTOS que compraram 2+ vezes. Conta clientes, nunca vendas —
  // agrupa por cliente_id; vendas sem cliente não entram (não há recompra a medir).
  const comprasPorCliente = new Map<string, number>();
  for (const v of vendas) if (v.cliente_id) comprasPorCliente.set(v.cliente_id, (comprasPorCliente.get(v.cliente_id) ?? 0) + 1);
  const clientesComCompra = comprasPorCliente.size;
  const clientesRecorrentes = [...comprasPorCliente.values()].filter((qtd) => qtd >= 2).length;
  const taxaRecompra = clientesComCompra > 0 ? (clientesRecorrentes / clientesComCompra) * 100 : null;

  // LTV histórico (todo o histórico, não varia com o filtro): faturamento total
  // de vendas ativas vinculadas a clientes REAIS ÷ clientes distintos. Exclui
  // clientes de teste/legado (tipo_registro ≠ "normal") e vendas sem cliente_id.
  const clientesReais = new Set(clientes.filter((c) => c.tipo_registro === "normal").map((c) => c.id));
  const faturamentoPorCliente = new Map<string, number>();
  for (const v of vendas) {
    if (!v.cliente_id || !clientesReais.has(v.cliente_id)) continue;
    faturamentoPorCliente.set(v.cliente_id, (faturamentoPorCliente.get(v.cliente_id) ?? 0) + Number(v.valor_final));
  }
  const ltvHistorico = faturamentoPorCliente.size > 0
    ? [...faturamentoPorCliente.values()].reduce((s, x) => s + x, 0) / faturamentoPorCliente.size
    : null;

  // Série do gráfico de Faturamento (atual + período anterior), pelo período global.
  const serie = buildVisionFaturamentoSerie(vendas, parcelas, assinaturas, vision.id, period);
  // Produtividade da prospecção ativa (prospecção tem custo ~0; o que importa é a conversão).
  const vendasProsp = vendasPeriodo.filter((v) => v.metodo_aquisicao === "prospeccao_ativa").length;
  const abordagensProsp = prospAgg.novos_prospectados;
  const taxaFechamentoProsp = abordagensProsp > 0 ? (vendasProsp / abordagensProsp) * 100 : null;
  const mensagensPorVenda = vendasProsp > 0 ? abordagensProsp / vendasProsp : null;

  const parcelasPorVenda: Record<string, ParcelaSituacao[]> = {};
  for (const p of parcelas) if (p.venda_id) (parcelasPorVenda[p.venda_id] ??= []).push(p);

  const reunioesEntries = await Promise.all(oportunidades.map(async (o) => [o.id, await getReunioesByOportunidade(o.id)] as [string, Reuniao[]]));
  const reunioesPorOportunidade = Object.fromEntries(reunioesEntries);

  const campanhasRows = campanhas.filter((c) => c.empresa_id === vision.id).map((c) => ({
    ...c,
    investimento: lancamentos.filter((l) => l.campanha_id === c.id && l.entra_no_cac).reduce((s, l) => s + Number(l.valor), 0),
    clientesConquistados: 0, receitaAtribuida: 0,
  }));

  // ---------- Novos insights ----------
  const hoje = new Date().toISOString().slice(0, 10);
  const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

  // Comparação com o período anterior equivalente (mesma lógica dos cards do Dashboard).
  const metricsPrev = computeEmpresaMetrics(vision, { lancamentos, vendas, parcelas, assinaturas }, previousPeriod(period));

  // Pendências e LTV por canal.
  const atencao = buildEmpresaAtencao(vendas, parcelas, oportunidades, hoje);
  const ltvMet = ltvPorMetodo(vendas, clientes);

  // Projeção do período (só quando o período está em curso).
  const diasTotaisPeriodo = daysBetween(period.from, period.to) + 1;
  const dentroPeriodo = period.from <= hoje && hoje <= period.to;
  const diasDecorridos = dentroPeriodo ? daysBetween(period.from, hoje) + 1 : diasTotaisPeriodo;
  const projecao = dentroPeriodo && diasDecorridos > 0 && diasDecorridos < diasTotaisPeriodo ? (metrics.faturamento / diasDecorridos) * diasTotaisPeriodo : null;

  // Contribuição da Vision para a meta (recebido dentro do ciclo).
  const metaContribuicao = meta
    ? lancamentos
        .filter((l) => l.tipo === "entrada" && l.natureza === "receita_empresarial" && l.empresa_id === vision.id && l.status === "recebido" && l.data_pagamento && l.data_pagamento >= meta.data_inicio && l.data_pagamento <= meta.data_fim)
        .reduce((s, l) => s + Number(l.valor), 0)
    : 0;
  const metaDiasRestantes = meta ? Math.max(0, daysBetween(hoje, meta.data_fim)) : 0;
  const metaDiasDecorridos = meta ? Math.max(1, daysBetween(meta.data_inicio, hoje > meta.data_fim ? meta.data_fim : hoje) + 1) : 1;
  const metaMediaDia = metaContribuicao / metaDiasDecorridos;

  // Contador de vendas ainda no produto placeholder do legado (período).
  const legadoProduto = produtos.find((p) => p.empresa_id === vision.id && p.nome === "Venda avulsa — legado");
  const legadoVendas = legadoProduto ? vendasPeriodo.filter((v) => v.produto_id === legadoProduto.id) : [];
  const legado = { count: legadoVendas.length, valor: legadoVendas.reduce((s, v) => s + Number(v.valor_final), 0) };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Empresa" title="Vision" subtitle="Fotos e vídeos com IA, combos e sites" accent="vision" actions={<PeriodFilter period={period} />} />

      <Tabs
        tabs={[
          {
            label: "Resumo",
            content: (
              <div className="space-y-6">
                <AtencaoVision items={atencao} />
                <div className="flex justify-end gap-2"><NovoClienteButton /><NovaVendaButton options={options} empresaId={vision.id} /></div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Metric label="Faturamento" value={formatBRL(metrics.faturamento)} accent="vision" trend={{ pct: pctDelta(metrics.faturamento, metricsPrev.faturamento) }} hint={projecao === null ? undefined : `Projeção do período: ${formatBRL(projecao)}`} />
                  <Metric label="Recebido" value={formatBRL(metrics.recebido)} accent="positive" trend={{ pct: pctDelta(metrics.recebido, metricsPrev.recebido) }} />
                  <Metric label="A receber" value={formatBRL(metrics.aReceber)} accent="warning" />
                  <Metric label="Lucro" value={formatBRL(metrics.lucro)} accent={metrics.lucro >= 0 ? "positive" : "negative"} />
                  <Metric label="Vendas" value={String(metrics.vendas)} trend={{ pct: pctDelta(metrics.vendas, metricsPrev.vendas) }} />
                  <Metric label="Ticket médio" value={metrics.ticketMedio === null ? "—" : formatBRL(metrics.ticketMedio)} />
                  <Metric label="Clientes novos" value={String(metrics.clientesNovos)} trend={{ pct: pctDelta(metrics.clientesNovos, metricsPrev.clientesNovos) }} />
                  <Metric label="Investimento" value={formatBRL(metrics.investimento)} accent="vision" />
                </div>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Metric label="CAC" value={metrics.cac === null ? "—" : formatBRL(metrics.cac)} hint="Investimento ÷ clientes novos" />
                  <Metric label="ROAS" value={roas === null ? "—" : `${roas.toFixed(1)}x`} accent="positive" hint="Faturamento ÷ investimento" />
                  <Metric label="Taxa de recompra" value={taxaRecompra === null ? "—" : `${taxaRecompra.toFixed(0)}%`} hint="Clientes com 2+ compras · histórico" />
                  <Metric label="LTV histórico" value={ltvHistorico === null ? "—" : formatBRL(ltvHistorico)} hint="Faturado ÷ clientes · histórico" />
                </div>
                {meta ? <MetaContribuicaoCard nome={meta.nome} contribuicao={metaContribuicao} alvo={Number(meta.valor_alvo)} diasRestantes={metaDiasRestantes} mediaDia={metaMediaDia} /> : null}
                <Panel>
                  <PanelHeader title="Evolução no período" description={`Faturamento e recebido · ${period.label}`} />
                  <PeriodLineChart serie={serie} />
                </Panel>
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
                <Panel>
                  <PanelHeader title="Produtividade da prospecção" description="Prospecção tem custo ~0 — o que importa é a conversão das mensagens" />
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <MiniMetric label="Abordagens/mensagens" value={String(abordagensProsp)} />
                    <MiniMetric label="Vendas por prospecção" value={String(vendasProsp)} accent="positive" />
                    <MiniMetric label="Taxa de fechamento" value={taxaFechamentoProsp === null ? "—" : `${taxaFechamentoProsp.toFixed(0)}%`} />
                    <MiniMetric label="Mensagens por venda" value={mensagensPorVenda === null ? "—" : mensagensPorVenda.toFixed(0)} />
                  </div>
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
                  <MetodoBreakdownPanel breakdown={metodos} ltvPorMetodo={ltvMet} />
                </Panel>
                <TrafegoPagoPanel campanhas={campanhasRows} investimentoTotal={metrics.investimento} clientesNovos={metrics.clientesNovos} cac={metrics.cac} receita={metrics.faturamento} options={options} empresaId={vision.id} variante="vision" />
              </div>
            ),
          },
          {
            label: "Vendas",
            content: <VendasPanel vendas={vendasPeriodo} parcelasPorVenda={parcelasPorVenda} options={options} empresaId={vision.id} />,
          },
          { label: "Produtos", content: <ProdutosMetricasPanel breakdown={breakdown} produtos={produtos.filter((p) => p.empresa_id === vision.id)} legado={legado} /> },
          { label: "Entregas", content: <EntregasPanel vendas={vendas} /> },
        ]}
      />
    </div>
  );
}
