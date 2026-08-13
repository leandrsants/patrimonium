export const dynamic = "force-dynamic";

import { PageHeader } from "@/components/shell/PageHeader";
import { PeriodFilter } from "@/components/shell/PeriodFilter";
import { Tabs } from "@/components/ui/Tabs";
import { Metric, MiniMetric, Panel, PanelHeader, EmptyState } from "@/components/ui/primitives";
import { NovaAssinaturaButton } from "@/components/actions/QuickButtons";
import { InvestimentoQuick } from "@/components/comercial/InvestimentoQuick";
import { PipelineBoard } from "@/components/comercial/PipelineBoard";
import { MetodoBreakdownPanel } from "@/components/comercial/MetodoBreakdownPanel";
import { AssinaturasPanel } from "@/components/digital-smile/AssinaturasPanel";
import { CobrancasPanel } from "@/components/digital-smile/CobrancasPanel";
import { CampanhasTrafegoPanel } from "@/components/digital-smile/CampanhasTrafegoPanel";
import { OperacaoPanel } from "@/components/digital-smile/OperacaoPanel";
import { ProspeccaoAtivaPanel } from "@/components/digital-smile/ProspeccaoAtivaPanel";
import { LeadsACadastrar } from "@/components/digital-smile/LeadsACadastrar";
import { MotivosPerdaPanel, TempoMedioVendaPanel } from "@/components/digital-smile/ComercialPanels";
import { ProdutosMetricasPanel } from "@/components/vendas/ProdutosMetricasPanel";
import { formatBRL } from "@/lib/format";
import { resolvePeriod, inRange, quickRanges, inRangePair } from "@/lib/period";
import { computeEmpresaMetrics, buildProdutoBreakdown, buildAquisicaoPorMetodo, assinaturaVigente } from "@/lib/metrics";
import {
  funnelProspeccaoNumeros, somarProspeccao, custoPorReuniaoRealizada, custoPorNoShow, custoPorProposta,
  taxaResposta, taxaFechamento, conversaoTotal, payback as calcPayback, METODO_LABEL,
  churn as calcChurn, retencao as calcRetencao, ltvCac, ltvMedio, tempoMedio,
} from "@/lib/calc";
import { ESTAGIOS_SMILE, CANAL_META_CHAVE } from "@/lib/labels";
import {
  getEmpresas, getVendas, getParcelasSituacao, getAssinaturas, getLancamentos,
  getOportunidades, getReunioesByOportunidade, getCampanhas, getContas, getRegistrosProspeccao,
  getMetasProspeccao, getProdutos, getFormOptions, getPendenciasLead,
} from "@/lib/data";
import type { ParcelaSituacao, Reuniao, RegistroProspeccao } from "@/lib/types";

const METAS_LABEL: Record<string, string> = { acoes_instagram: "Instagram", acoes_whatsapp: "WhatsApp", acoes_ligacao: "Ligações" };

function prodBucket(regs: RegistroProspeccao[]): { abordagens: number; respostas: number; positivas: number; reunioes: number } {
  const s = somarProspeccao(regs);
  return { abordagens: s.novos_prospectados, respostas: s.respostas, positivas: s.respostas_positivas, reunioes: s.reunioes_marcadas };
}

export default async function DigitalSmilePage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const period = resolvePeriod(sp);
  const ranges = quickRanges();
  const empresas = await getEmpresas();
  const ds = empresas.find((e) => e.slug === "digital_smile");
  if (!ds) return <EmptyState title="Digital Smile não encontrada" description="Empresa não cadastrada no banco local." />;

  const [vendas, parcelas, assinaturas, lancamentos, oportunidades, campanhas, contas, registros, metasProsp, produtos, options, pendencias] = await Promise.all([
    getVendas(ds.id), getParcelasSituacao(), getAssinaturas(ds.id), getLancamentos(),
    getOportunidades(ds.id), getCampanhas(), getContas(), getRegistrosProspeccao(ds.id),
    getMetasProspeccao(ds.id), getProdutos(), getFormOptions(), getPendenciasLead(ds.id),
  ]);

  // Leads existentes (para dedupe ao completar pendências) + pendências de identificação.
  const leadsExistentes = oportunidades.map((o) => ({ id: o.id, nome: o.nome_contato ?? o.cliente?.nome ?? "", telefone: o.telefone_contato ?? o.cliente?.telefone ?? null, instagram: o.instagram }));
  const pendenciasView = pendencias.map((p) => ({ id: p.id, tipo_evento: p.tipo_evento, canal: p.canal, data_origem: p.data_origem }));

  const metrics = computeEmpresaMetrics(ds, { lancamentos, vendas, parcelas, assinaturas }, period);
  const breakdown = buildProdutoBreakdown(produtos, vendas, ds.id, period);
  const metodos = buildAquisicaoPorMetodo(ds.id, vendas, lancamentos, registros, period, assinaturas);
  const contaOpts = contas.map((c) => ({ value: c.id, label: c.nome }));
  const inv = metrics.investimento;

  const parcelasPorAssinatura: Record<string, ParcelaSituacao[]> = {};
  for (const p of parcelas) if (p.assinatura_id) (parcelasPorAssinatura[p.assinatura_id] ??= []).push(p);

  // Cobranças (mensalidades) de todos os contratos da DS, para gestão central.
  const cobrancas = assinaturas.flatMap((a) =>
    (parcelasPorAssinatura[a.id] ?? []).map((p) => ({
      id: p.id,
      clienteNome: a.cliente?.nome ?? "—",
      servico: a.produto?.nome ?? "—",
      competencia: p.competencia_referencia,
      vencimento: p.data_vencimento,
      valorDevido: Number(p.valor_devido),
      recebido: Number(p.recebido_liquido),
      saldo: Number(p.saldo_pendente),
      situacao: p.situacao_calculada,
    })),
  );

  const reunioesEntries = await Promise.all(oportunidades.map(async (o) => [o.id, await getReunioesByOportunidade(o.id)] as [string, Reuniao[]]));
  const reunioesPorOportunidade = Object.fromEntries(reunioesEntries);

  // ---------- PROSPECÇÃO ATIVA: números agregados (fonte única) ----------
  const regsPeriodo = registros.filter((r) => r.metodo_aquisicao === "prospeccao_ativa" && inRange(r.data, period));
  const aggPeriodo = somarProspeccao(regsPeriodo);
  const reunioesAgendadas = aggPeriodo.reunioes_marcadas;
  const reunioesRealizadas = aggPeriodo.reunioes_realizadas;
  const noShows = aggPeriodo.no_shows;
  const propostasProsp = aggPeriodo.propostas_enviadas;
  // Contratos NÃO são digitados — derivam das vendas/assinaturas reais cuja
  // origem é a prospecção ativa, fechadas no período (evita divergência).
  const contratosProsp = assinaturas.filter((a) => a.metodo_aquisicao === "prospeccao_ativa" && inRange(a.data_inicio, period)).length
    + vendas.filter((v) => v.metodo_aquisicao === "prospeccao_ativa" && inRange(v.data_venda, period)).length;

  const funnelProsp = funnelProspeccaoNumeros({
    abordagens: aggPeriodo.novos_prospectados, respostas: aggPeriodo.respostas, positivas: aggPeriodo.respostas_positivas,
    reunioes_agendadas: reunioesAgendadas, reunioes_realizadas: reunioesRealizadas, no_shows: noShows,
    propostas: propostasProsp, contratos: contratosProsp,
  });

  // metas do dia — realizado somado por canal (sem digitar o número duas vezes)
  const regsHoje = registros.filter((r) => r.metodo_aquisicao === "prospeccao_ativa" && inRangePair(r.data, ranges.hoje));
  const realHoje: Record<string, number> = {};
  for (const reg of regsHoje) {
    const chave = CANAL_META_CHAVE[reg.fonte ?? ""];
    if (chave) realHoje[chave] = (realHoje[chave] ?? 0) + reg.novos_prospectados;
  }
  const metasRows = metasProsp.map((m) => ({ chave: m.chave, label: METAS_LABEL[m.chave] ?? m.chave, meta: m.meta_diaria, realizado: realHoje[m.chave] ?? 0 }));

  // desempenho por canal (canal = 'fonte'): esforço MANUAL do registro +
  // contratos DERIVADOS dos contratos reais atribuídos àquele canal (nunca reg.contratos).
  type CanalAcc = { abordagens: number; respostas: number; positivas: number; agendadas: number; contratos: number };
  const canalMap = new Map<string, CanalAcc>();
  const canalEnsure = (k: string): CanalAcc => {
    let cur = canalMap.get(k);
    if (!cur) { cur = { abordagens: 0, respostas: 0, positivas: 0, agendadas: 0, contratos: 0 }; canalMap.set(k, cur); }
    return cur;
  };
  for (const reg of regsPeriodo) {
    const cur = canalEnsure(reg.fonte ?? "Sem canal");
    cur.abordagens += reg.novos_prospectados; cur.respostas += reg.respostas; cur.positivas += reg.respostas_positivas; cur.agendadas += reg.reunioes_marcadas;
  }
  // Contratos reais de prospecção ativa, atribuídos ao canal de origem ('fonte').
  const atribuiContrato = (fonte: string | null) => { canalEnsure(fonte && fonte.trim() ? fonte : "Não atribuído").contratos += 1; };
  for (const a of assinaturas) if (a.metodo_aquisicao === "prospeccao_ativa" && inRange(a.data_inicio, period)) atribuiContrato(a.fonte);
  for (const v of vendas) if (v.metodo_aquisicao === "prospeccao_ativa" && inRange(v.data_venda, period)) atribuiContrato(v.fonte);
  const canais = Array.from(canalMap.entries()).map(([canal, x]) => ({ canal, ...x })).sort((a, b) => (b.abordagens - a.abordagens) || (b.contratos - a.contratos));

  const historico = regsPeriodo.map((r) => ({
    id: r.id, data: r.data, canal: r.fonte,
    abordagens: r.novos_prospectados, respostas: r.respostas, positivas: r.respostas_positivas,
    agendadas: r.reunioes_marcadas, realizadas: r.reunioes_realizadas, noShows: r.no_shows,
    propostas: r.propostas_enviadas, observacao: r.observacao,
  }));

  // ---------- COMERCIAL: motivos de perda + tempo até venda ----------
  const perdidas = oportunidades.filter((o) => o.estagio === "perdido" && inRange(o.criado_em, period));
  const motivosMap = new Map<string, { q: number; v: number }>();
  for (const o of perdidas) {
    const key = o.motivo_perda ?? "Não informado";
    const cur = motivosMap.get(key) ?? { q: 0, v: 0 };
    motivosMap.set(key, { q: cur.q + 1, v: cur.v + Number(o.valor_potencial ?? 0) });
  }
  const motivos = Array.from(motivosMap.entries()).map(([motivo, x]) => ({ motivo, quantidade: x.q, valorPotencial: x.v })).sort((a, b) => b.quantidade - a.quantidade);
  const diasVenda = oportunidades.filter((o) => o.fechado_em).map((o) => Math.round((new Date(o.fechado_em!).getTime() - new Date(o.criado_em).getTime()) / 86400000));
  const tv = tempoMedio(diasVenda);

  // clientes / churn / LTV — tudo escopado às assinaturas da Digital Smile.
  const dsAssinaturaIds = new Set(assinaturas.map((a) => a.id));
  const dsAssinaturaCliente = new Map(assinaturas.map((a) => [a.id, a.cliente_id] as const));
  const custosDiretosPorCliente: Record<string, number> = {};
  for (const l of lancamentos) if (l.tipo === "saida" && l.cliente_id) custosDiretosPorCliente[l.cliente_id] = (custosDiretosPorCliente[l.cliente_id] ?? 0) + Number(l.valor);
  const cancelamentos = assinaturas.filter((a) => a.status === "cancelado").length;
  // Clientes ativos = contratos vigentes (inclui onboarding), consistente com MRR.
  const ativos = assinaturas.filter((a) => assinaturaVigente(a)).length;
  const churn = calcChurn(cancelamentos, ativos + cancelamentos);
  const retencao = calcRetencao(ativos, ativos + cancelamentos);
  // LTV realizado POR CLIENTE = total efetivamente recebido do cliente (soma de
  // todas as suas assinaturas). LTV médio = média entre clientes elegíveis (recebido > 0).
  const recebidoPorCliente = new Map<string, number>();
  for (const a of assinaturas) {
    if (!a.cliente_id) continue;
    const recebidoAss = (parcelasPorAssinatura[a.id] ?? []).reduce((s, p) => s + Number(p.recebido_liquido), 0);
    recebidoPorCliente.set(a.cliente_id, (recebidoPorCliente.get(a.cliente_id) ?? 0) + recebidoAss);
  }
  const ltvMed = ltvMedio(Array.from(recebidoPorCliente.values()).filter((v) => v > 0)) ?? 0;
  // Inadimplência = parcelas vencidas SOMENTE de assinaturas da DS (não vaza de outra empresa).
  const parcelasAtrasadasDs = parcelas.filter((p) => p.situacao_calculada === "atrasada" && p.assinatura_id && dsAssinaturaIds.has(p.assinatura_id));
  const inadimplencia = parcelasAtrasadasDs.reduce((s, p) => s + Number(p.saldo_pendente), 0);
  const mtTrafego = metodos.find((m) => m.metodo === "trafego_pago");
  const mtProsp = metodos.find((m) => m.metodo === "prospeccao_ativa");
  const cacTrafego = mtTrafego?.cac ?? null;
  const cacProsp = mtProsp?.cac ?? null;
  const cacProspSemCusto = (mtProsp?.investimento ?? 0) === 0;
  const cacTrafegoSemCusto = (mtTrafego?.investimento ?? 0) === 0;

  // ---------- RESUMO: fórmulas gerenciais corrigidas ----------
  // Margem sobre o realizado (coerente: lucro e recebido são ambos "caixa").
  const margem = metrics.recebido > 0 ? metrics.lucro / metrics.recebido : null;
  // Ticket médio mensal da carteira = MRR ÷ clientes ativos.
  const ticketCarteira = ativos > 0 ? metrics.mrr / ativos : null;
  // CAC geral: sem investimento não é R$0 — é "sem custo".
  const cacGeralValor = inv === 0 ? null : metrics.cac;
  const cacGeralLabel = inv === 0 ? "sem custo" : cacGeralValor === null ? "—" : formatBRL(cacGeralValor);
  // Inadimplência: valor vencido + nº de clientes + % do total em aberto.
  const clientesInadimplentes = new Set(
    parcelasAtrasadasDs.map((p) => dsAssinaturaCliente.get(p.assinatura_id!) ?? p.assinatura_id),
  ).size;
  const inadimplenciaPct = metrics.aReceber > 0 ? (inadimplencia / metrics.aReceber) * 100 : null;
  // Payback (meses) = CAC ÷ contribuição mensal por cliente (margem aplicada ao MRR/cliente).
  const contribMensalCliente = ativos > 0 && margem !== null && margem > 0 ? (metrics.mrr / ativos) * margem : 0;
  const paybackMeses = inv === 0 ? null : calcPayback(cacGeralValor, contribMensalCliente);
  const ltvCacValor = ltvCac(ltvMed, cacGeralValor);
  // Funil do período (prospecção ativa → contratos reais).
  const funil = { abordagens: aggPeriodo.novos_prospectados, respostas: aggPeriodo.respostas, positivas: aggPeriodo.respostas_positivas, reunioesRealizadas, propostas: propostasProsp, contratos: contratosProsp };
  const aquisicaoRows = metodos.filter((m) => m.clientesNovos > 0 || m.investimento > 0 || m.receita > 0);

  // campanhas de tráfego
  const campanhasRows = campanhas.filter((c) => c.empresa_id === ds.id).map((c) => {
    const investimento = lancamentos.filter((l) => l.campanha_id === c.id && l.entra_no_cac).reduce((s, l) => s + Number(l.valor), 0);
    const leadsCamp = oportunidades.filter((o) => o.campanha_id === c.id);
    const oppIds = new Set(leadsCamp.map((o) => o.id));
    const reunioesMarcadas = Object.entries(reunioesPorOportunidade).filter(([oid]) => oppIds.has(oid)).reduce((s, [, rs]) => s + rs.length, 0);
    const assinCamp = assinaturas.filter((a) => a.campanha_id === c.id);
    const clientes = new Set([...assinCamp.map((a) => a.cliente_id), ...vendas.filter((v) => v.campanha_id === c.id).map((v) => v.cliente_id)].filter(Boolean)).size;
    const contratos = assinCamp.length + vendas.filter((v) => v.campanha_id === c.id).length;
    const receita = assinCamp.reduce((s, a) => s + (parcelasPorAssinatura[a.id] ?? []).reduce((ss, p) => ss + Number(p.recebido_liquido), 0), 0);
    return { id: c.id, nome: c.nome, ativa: c.ativa, investimento, leads: leadsCamp.length, reunioesMarcadas, clientes, contratos, receita };
  });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Empresa · Agência" title="Digital Smile" subtitle="Gestão de tráfego para dentistas e clínicas" accent="smile" actions={<PeriodFilter period={period} />} />

      <Tabs
        tabs={[
          {
            label: "Resumo",
            content: (
              <div className="space-y-8">
                <div className="flex justify-end"><NovaAssinaturaButton options={options} /></div>

                {/* PERFORMANCE DO PERÍODO */}
                <section className="space-y-3">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Performance do período · {period.label}</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <Metric label="Recebido" value={formatBRL(metrics.recebido)} accent="positive" size="lg" hint="Entrou no caixa no período" />
                    <Metric label="Lucro" value={formatBRL(metrics.lucro)} accent={metrics.lucro >= 0 ? "positive" : "negative"} size="lg" hint="Recebido − despesas" />
                    <Metric label="Faturamento" value={formatBRL(metrics.faturamento)} accent="smile" hint="Vendas + mensalidades faturadas" />
                    <Metric label="Investimento" value={formatBRL(inv)} hint="Anúncios / aquisição" />
                    <Metric label="Novos clientes" value={String(metrics.clientesNovos)} />
                    <Metric label="CAC" value={cacGeralLabel} hint="Investimento ÷ novos clientes" />
                  </div>
                </section>

                {/* CARTEIRA ATUAL */}
                <section className="space-y-3">
                  <p className="text-2xs font-semibold uppercase tracking-wider text-ink-faint">Carteira atual</p>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                    <Metric label="MRR" value={formatBRL(metrics.mrr)} accent="smile" size="lg" hint="Mensalidades vigentes" />
                    <Metric label="Clientes ativos" value={String(ativos)} size="lg" hint="Contratos vigentes" />
                    <Metric label="Ticket médio mensal" value={ticketCarteira === null ? "—" : formatBRL(ticketCarteira)} hint="MRR ÷ clientes ativos" />
                    <Metric label="A receber" value={formatBRL(metrics.aReceber)} accent="warning" hint="Total em aberto (todos os meses)" />
                    <Metric label="Inadimplência" value={formatBRL(inadimplencia)} accent={inadimplencia > 0 ? "negative" : "neutral"} hint={inadimplencia > 0 ? `${clientesInadimplentes} cliente(s)${inadimplenciaPct !== null ? ` · ${inadimplenciaPct.toFixed(0)}% do aberto` : ""}` : "Nada vencido"} />
                    <Metric label="Retenção" value={retencao === null ? "—" : `${(retencao * 100).toFixed(0)}%`} hint={`Churn ${churn === null ? "—" : `${(churn * 100).toFixed(0)}%`} · ${cancelamentos} cancelado(s)`} />
                  </div>
                </section>

                {/* FUNIL DO PERÍODO */}
                <Panel>
                  <PanelHeader title="Funil do período" description="Prospecção ativa → contratos reais" />
                  <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                    <MiniMetric label="Abordagens" value={String(funil.abordagens)} />
                    <MiniMetric label="Respostas" value={String(funil.respostas)} />
                    <MiniMetric label="Qualificados" value={String(funil.positivas)} />
                    <MiniMetric label="Reuniões realiz." value={String(funil.reunioesRealizadas)} />
                    <MiniMetric label="Propostas" value={String(funil.propostas)} />
                    <MiniMetric label="Contratos" value={String(funil.contratos)} accent="positive" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-3 text-2xs text-ink-faint">
                    <span>Taxa de resposta: <span className="tnum text-ink-soft">{taxaResposta(funil.respostas, funil.abordagens) === null ? "—" : `${taxaResposta(funil.respostas, funil.abordagens)!.toFixed(0)}%`}</span></span>
                    <span>Fechamento: <span className="tnum text-ink-soft">{taxaFechamento(funil.contratos, funil.propostas) === null ? "—" : `${taxaFechamento(funil.contratos, funil.propostas)!.toFixed(0)}%`}</span></span>
                    <span>Conversão total: <span className="tnum text-ink-soft">{conversaoTotal(funil.contratos, funil.abordagens) === null ? "—" : `${conversaoTotal(funil.contratos, funil.abordagens)!.toFixed(1)}%`}</span></span>
                  </div>
                </Panel>

                {/* MÉTODO DE AQUISIÇÃO */}
                <Panel>
                  <PanelHeader title="Método de aquisição" description="Clientes, custo, CAC e receita por origem · no período" />
                  {aquisicaoRows.length === 0 ? (
                    <p className="text-sm text-ink-faint">Sem aquisição registrada no período.</p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl2 border border-line">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead><tr className="border-b border-line bg-surface-raised text-2xs uppercase tracking-wider text-ink-faint">
                          <th className="px-4 py-2.5 text-left font-semibold">Método</th><th className="px-4 py-2.5 text-right font-semibold">Clientes</th><th className="px-4 py-2.5 text-right font-semibold">Custo</th><th className="px-4 py-2.5 text-right font-semibold">CAC</th><th className="px-4 py-2.5 text-right font-semibold">Receita</th>
                        </tr></thead>
                        <tbody>{aquisicaoRows.map((m) => (
                          <tr key={m.metodo} className="border-b border-line/70 last:border-0">
                            <td className="px-4 py-2.5 text-ink-soft">{METODO_LABEL[m.metodo] ?? m.metodo}</td>
                            <td className="px-4 py-2.5 text-right tnum text-ink-soft">{m.clientesNovos}</td>
                            <td className="px-4 py-2.5 text-right tnum text-ink-faint">{m.investimento > 0 ? formatBRL(m.investimento) : "—"}</td>
                            <td className="px-4 py-2.5 text-right tnum text-ink-faint">{m.investimento === 0 ? "—" : m.cac === null ? "—" : formatBRL(m.cac)}</td>
                            <td className="px-4 py-2.5 text-right tnum text-positive">{formatBRL(m.receita)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  )}
                </Panel>

                {/* MÉTRICAS AVANÇADAS */}
                <details className="group rounded-xl2 border border-line bg-surface">
                  <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-ink-soft">Métricas avançadas <span className="text-ink-dim transition-transform group-open:rotate-180">▾</span></summary>
                  <div className="grid grid-cols-2 gap-4 border-t border-line px-5 py-4 sm:grid-cols-3 lg:grid-cols-4">
                    <MiniMetric label="CAC tráfego" value={cacTrafegoSemCusto ? "—" : cacTrafego === null ? "—" : formatBRL(cacTrafego)} />
                    <MiniMetric label="CAC prospecção" value={cacProspSemCusto ? "sem custo" : cacProsp === null ? "—" : formatBRL(cacProsp)} />
                    <MiniMetric label="Custo por venda" value={inv > 0 && metrics.vendas > 0 ? formatBRL(inv / metrics.vendas) : "—"} />
                    <MiniMetric label="Custo/reunião realizada" value={custoPorReuniaoRealizada(inv, reunioesRealizadas) === null ? "—" : formatBRL(custoPorReuniaoRealizada(inv, reunioesRealizadas)!)} />
                    <MiniMetric label="Custo/no-show" value={custoPorNoShow(inv, noShows) === null ? "—" : formatBRL(custoPorNoShow(inv, noShows)!)} />
                    <MiniMetric label="Custo/proposta" value={custoPorProposta(inv, propostasProsp) === null ? "—" : formatBRL(custoPorProposta(inv, propostasProsp)!)} />
                    <MiniMetric label="Margem" value={margem === null ? "—" : `${(margem * 100).toFixed(0)}%`} />
                    <MiniMetric label="LTV médio" value={ltvMed > 0 ? formatBRL(ltvMed) : "—"} />
                    <MiniMetric label="LTV:CAC" value={ltvCacValor === null ? "—" : `${ltvCacValor.toFixed(1)}x`} />
                    <MiniMetric label="Payback" value={paybackMeses === null ? "—" : `${paybackMeses.toFixed(1)} m`} />
                  </div>
                  <p className="border-t border-line px-5 py-3 text-2xs text-ink-dim">CAC/custos usam o investimento em aquisição do período. Sem custo financeiro → “—” (nunca R$ 0). LTV médio = média do total recebido por cliente. Payback = CAC ÷ contribuição mensal por cliente.</p>
                </details>
              </div>
            ),
          },
          {
            label: "Prospecção ativa",
            content: (
              <ProspeccaoAtivaPanel
                metasRows={metasRows}
                resultados={{ abordagens: aggPeriodo.novos_prospectados, respostas: aggPeriodo.respostas, positivas: aggPeriodo.respostas_positivas, reunioes_agendadas: reunioesAgendadas, reunioes_realizadas: reunioesRealizadas, no_shows: noShows, propostas: propostasProsp, contratos: contratosProsp }}
                funnel={funnelProsp}
                prod={{ hoje: prodBucket(registros.filter((r) => r.metodo_aquisicao === "prospeccao_ativa" && inRangePair(r.data, ranges.hoje))), semana: prodBucket(registros.filter((r) => r.metodo_aquisicao === "prospeccao_ativa" && inRangePair(r.data, ranges.semana))), mes: prodBucket(registros.filter((r) => r.metodo_aquisicao === "prospeccao_ativa" && inRangePair(r.data, ranges.mes))) }}
                canais={canais}
                historico={historico}
                options={options}
                empresaId={ds.id}
                leadsExistentes={leadsExistentes}
                pendencias={pendenciasView}
              />
            ),
          },
          {
            label: "Comercial",
            content: (
              <div className="space-y-6">
                <LeadsACadastrar pendencias={pendenciasView} options={options} empresaId={ds.id} leadsExistentes={leadsExistentes} />
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <MotivosPerdaPanel motivos={motivos} totalPerdidos={perdidas.length} />
                  <TempoMedioVendaPanel media={tv.media} mediana={tv.mediana} amostra={diasVenda.length} />
                </div>
                <Panel padded={false} className="p-5">
                  <PanelHeader title="Pipeline comercial" description="Todos os leads da empresa · filtre por método de origem" />
                  <PipelineBoard oportunidades={oportunidades} reunioesPorOportunidade={reunioesPorOportunidade} estagios={ESTAGIOS_SMILE} options={options} empresaId={ds.id} showMetodoFilter />
                </Panel>
              </div>
            ),
          },
          {
            label: "Tráfego pago",
            content: (
              <div className="space-y-6">
                <div className="flex flex-wrap justify-end gap-2"><InvestimentoQuick options={options} empresaId={ds.id} /></div>
                <Panel>
                  <PanelHeader title="Comparação por método de aquisição" description="Prospecção ativa × Tráfego pago × Orgânico × Indicação" />
                  <MetodoBreakdownPanel breakdown={metodos} />
                </Panel>
                <Panel>
                  <PanelHeader title="Campanhas de tráfego da Digital Smile" description="Aquisição paga de dentistas (não é o tráfego dos clientes)" />
                  <CampanhasTrafegoPanel campanhas={campanhasRows} options={options} empresaId={ds.id} />
                </Panel>
              </div>
            ),
          },
          {
            label: "Clientes e contratos",
            content: <AssinaturasPanel assinaturas={assinaturas} parcelasPorAssinatura={parcelasPorAssinatura} custosDiretosPorCliente={custosDiretosPorCliente} options={options} contaOpts={contaOpts} />,
          },
          { label: "Cobranças", content: <CobrancasPanel cobrancas={cobrancas} contaOpts={contaOpts} /> },
          { label: "Produtos", content: <ProdutosMetricasPanel breakdown={breakdown} produtos={produtos.filter((p) => p.empresa_id === ds.id)} /> },
          { label: "Operação", content: <OperacaoPanel assinaturas={assinaturas} /> },
        ]}
      />
    </div>
  );
}
