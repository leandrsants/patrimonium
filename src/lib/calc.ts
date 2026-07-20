/**
 * Camada CENTRAL de fórmulas de gestão do Patrimonium.
 *
 * Todas as métricas do app derivam daqui — nunca são recalculadas de formas
 * diferentes em páginas diferentes. Funções puras, sem dependência de I/O,
 * testáveis isoladamente (ver calc.test.ts). Imports apenas relativos para
 * permitir compilação standalone nos testes.
 *
 * Convenção: denominador zero -> null (a UI mostra "—"), nunca NaN/Infinity.
 */

export function ratio(numerador: number, denominador: number): number | null {
  if (!denominador || denominador === 0) return null;
  const r = numerador / denominador;
  return Number.isFinite(r) ? r : null;
}

export function pct(numerador: number, denominador: number): number | null {
  const r = ratio(numerador, denominador);
  return r === null ? null : r * 100;
}

// ------------------------------------------------------------------ AQUISIÇÃO
export function cac(investimentoAquisicao: number, clientesNovos: number): number | null {
  return ratio(investimentoAquisicao, clientesNovos);
}

export function custoPorVenda(investimentoAquisicao: number, numeroVendas: number): number | null {
  return ratio(investimentoAquisicao, numeroVendas);
}

export function ticketMedio(valorVendido: number, numeroVendas: number): number | null {
  return ratio(valorVendido, numeroVendas);
}

export function cpl(investimento: number, leads: number): number | null {
  return ratio(investimento, leads);
}

export function roas(receitaAtribuida: number, investimento: number): number | null {
  return ratio(receitaAtribuida, investimento);
}

export function margem(lucro: number, faturamento: number): number | null {
  return ratio(lucro, faturamento);
}

// --------------------------------------------------------- DIGITAL SMILE (SaaS)
export function custoPorReuniaoMarcada(investimento: number, reunioesMarcadas: number): number | null {
  return ratio(investimento, reunioesMarcadas);
}

export function custoPorReuniaoRealizada(investimento: number, reunioesRealizadas: number): number | null {
  return ratio(investimento, reunioesRealizadas);
}

export function custoPorNoShow(investimento: number, noShows: number): number | null {
  return ratio(investimento, noShows);
}

export function custoPorProposta(investimento: number, propostas: number): number | null {
  return ratio(investimento, propostas);
}

export function taxaComparecimento(reunioesRealizadas: number, reunioesMarcadas: number): number | null {
  return pct(reunioesRealizadas, reunioesMarcadas);
}

export function taxaNoShow(noShows: number, reunioesMarcadas: number): number | null {
  return pct(noShows, reunioesMarcadas);
}

export function taxaProposta(propostas: number, reunioesRealizadas: number): number | null {
  return pct(propostas, reunioesRealizadas);
}

export function taxaFechamento(vendas: number, propostas: number): number | null {
  return pct(vendas, propostas);
}

export function conversaoTotal(vendas: number, contatos: number): number | null {
  return pct(vendas, contatos);
}

/** MRR = soma das mensalidades vigentes de clientes ativos. */
export function mrr(mensalidadesAtivas: number[]): number {
  return mensalidadesAtivas.reduce((s, v) => s + v, 0);
}

/** Churn mensal = cancelamentos no período / clientes ativos no início. */
export function churn(cancelamentos: number, ativosInicio: number): number | null {
  return ratio(cancelamentos, ativosInicio);
}

/** Retenção = permaneceram / ativos no início. */
export function retencao(permaneceram: number, ativosInicio: number): number | null {
  return ratio(permaneceram, ativosInicio);
}

/** LTV realizado de um cliente = total recebido dele. */
export function ltvRealizado(recebidoDoCliente: number): number {
  return recebidoDoCliente;
}

export function ltvCac(ltvMedio: number, cacValor: number | null): number | null {
  if (cacValor === null) return null;
  return ratio(ltvMedio, cacValor);
}

/**
 * Payback (meses) = CAC / margem mensal média por cliente.
 * Só é confiável quando há margem mensal positiva registrada.
 */
export function payback(cacValor: number | null, margemMensalMediaCliente: number): number | null {
  if (cacValor === null || margemMensalMediaCliente <= 0) return null;
  return ratio(cacValor, margemMensalMediaCliente);
}

export function margemPorCliente(recebidoAtribuido: number, custosDiretos: number): number {
  return recebidoAtribuido - custosDiretos;
}

// ------------------------------------------------------------------- FUNIL
export type FunnelStageInput = { key: string; label: string; valor: number };
export type FunnelStageOut = {
  key: string;
  label: string;
  valor: number;
  pctAnterior: number | null; // % em relação à etapa anterior
  pctTopo: number | null; // % em relação ao topo
};

/**
 * Recebe as etapas do topo para a base. Calcula % da etapa anterior e % do topo.
 * A primeira etapa é o topo (100%). Etapas com denominador zero -> null.
 */
export function buildFunnel(stages: FunnelStageInput[]): FunnelStageOut[] {
  const topo = stages[0]?.valor ?? 0;
  return stages.map((s, i) => {
    const anterior = i === 0 ? s.valor : stages[i - 1].valor;
    return {
      key: s.key,
      label: s.label,
      valor: s.valor,
      pctAnterior: i === 0 ? 100 : pct(s.valor, anterior),
      pctTopo: i === 0 ? 100 : pct(s.valor, topo),
    };
  });
}

// -------------------------------------------------- AGREGAÇÃO DE PROSPECÇÃO
export type ProspeccaoAgregada = {
  leads_encontrados: number;
  novos_prospectados: number;
  contatos_feitos: number;
  acoes_instagram: number;
  acoes_whatsapp: number;
  acoes_ligacao: number;
  acoes_outras: number;
  respostas: number;
  respostas_positivas: number;
  qualificados: number;
  orcamentos_enviados: number;
  reunioes_marcadas: number;
  reunioes_realizadas: number;
  no_shows: number;
  propostas_enviadas: number;
  contratos: number;
};

export const PROSPECCAO_ZERO: ProspeccaoAgregada = {
  leads_encontrados: 0, novos_prospectados: 0, contatos_feitos: 0,
  acoes_instagram: 0, acoes_whatsapp: 0, acoes_ligacao: 0, acoes_outras: 0,
  respostas: 0, respostas_positivas: 0, qualificados: 0,
  orcamentos_enviados: 0, reunioes_marcadas: 0, reunioes_realizadas: 0, no_shows: 0, propostas_enviadas: 0, contratos: 0,
};

export function somarProspeccao(registros: Partial<ProspeccaoAgregada>[]): ProspeccaoAgregada {
  const keys = Object.keys(PROSPECCAO_ZERO) as (keyof ProspeccaoAgregada)[];
  return registros.reduce<ProspeccaoAgregada>((acc, r) => {
    const next = { ...acc };
    for (const k of keys) next[k] = acc[k] + (r[k] ?? 0);
    return next;
  }, { ...PROSPECCAO_ZERO });
}

/** Ações comerciais totais (IG + WA + ligação + outras). != novos prospectados. */
export function acoesComerciais(p: ProspeccaoAgregada): number {
  return p.acoes_instagram + p.acoes_whatsapp + p.acoes_ligacao + p.acoes_outras;
}

export function taxaResposta(respostas: number, acoes: number): number | null {
  return pct(respostas, acoes);
}
export function taxaQualificacao(qualificados: number, respostas: number): number | null {
  return pct(qualificados, respostas);
}
export function taxaReuniao(reunioesMarcadas: number, qualificados: number): number | null {
  return pct(reunioesMarcadas, qualificados);
}

// ------------------------------------------------ UNIT ECONOMICS POR CLIENTE
/** Resultado do 1º mês: receita do 1º mês − CAC (uma única vez) − custos diretos do período. */
export function resultadoPrimeiroMes(receita1: number, cacAtribuido: number, custosDiretos1: number): number {
  return receita1 - cacAtribuido - custosDiretos1;
}
/** Resultado acumulado: total recebido − CAC (uma única vez) − custos diretos acumulados. */
export function resultadoAcumulado(recebidoTotal: number, cacAtribuido: number, custosDiretosAcum: number): number {
  return recebidoTotal - cacAtribuido - custosDiretosAcum;
}

export function ltvMedio(ltvs: number[]): number | null {
  if (ltvs.length === 0) return null;
  return ltvs.reduce((s, v) => s + v, 0) / ltvs.length;
}

export function inadimplenciaPct(valorVencidoNaoPago: number, totalVencido: number): number | null {
  return pct(valorVencidoNaoPago, totalVencido);
}

/** Média e mediana de dias (tempo até a venda). Ignora nulos. */
export function tempoMedio(dias: number[]): { media: number | null; mediana: number | null } {
  const v = dias.filter((d) => Number.isFinite(d) && d >= 0).sort((a, b) => a - b);
  if (v.length === 0) return { media: null, mediana: null };
  const media = v.reduce((s, x) => s + x, 0) / v.length;
  const mid = Math.floor(v.length / 2);
  const mediana = v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
  return { media, mediana };
}

/** Funil Vision: encontrados → contatos → respostas → qualificados → orçamentos → vendas. */
export function funnelVision(p: ProspeccaoAgregada, vendas: number): FunnelStageOut[] {
  return buildFunnel([
    { key: "encontrados", label: "Leads encontrados", valor: p.leads_encontrados },
    { key: "contatos", label: "Contatos feitos", valor: p.contatos_feitos },
    { key: "respostas", label: "Respostas", valor: p.respostas },
    { key: "qualificados", label: "Qualificados", valor: p.qualificados },
    { key: "orcamentos", label: "Orçamentos", valor: p.orcamentos_enviados },
    { key: "vendas", label: "Vendas", valor: vendas },
  ]);
}

export function taxaInteresse(positivas: number, primeirasRespostas: number): number | null {
  return pct(positivas, primeirasRespostas);
}
export function taxaAgendamento(reunioesAgendadas: number, convites: number): number | null {
  return pct(reunioesAgendadas, convites);
}
export function acoesPorAbordado(acoes: number, abordados: number): number | null {
  return ratio(acoes, abordados);
}

export type ProspeccaoNumeros = {
  abordagens: number;          // manual — abordagens / mensagens enviadas
  respostas: number;           // manual — primeiras respostas
  positivas: number;           // manual — respostas positivas / interessados
  reunioes_agendadas: number;  // manual
  reunioes_realizadas: number; // manual
  no_shows: number;            // manual
  propostas: number;           // manual — propostas comerciais enviadas
  contratos: number;           // manual — contratos / vendas fechadas
};

export const PROSPECCAO_NUMEROS_ZERO: ProspeccaoNumeros = {
  abordagens: 0, respostas: 0, positivas: 0, reunioes_agendadas: 0,
  reunioes_realizadas: 0, no_shows: 0, propostas: 0, contratos: 0,
};

/**
 * Funil da Prospecção Ativa direto dos NÚMEROS agregados registrados.
 * 7 etapas: abordagens → respostas → positivas → reuniões agendadas →
 * realizadas → propostas → contratos. Sem dependência de leads individuais.
 */
export function funnelProspeccaoNumeros(c: ProspeccaoNumeros): FunnelStageOut[] {
  return buildFunnel([
    { key: "abordagens", label: "Abordagens / mensagens", valor: c.abordagens },
    { key: "respostas", label: "Primeiras respostas", valor: c.respostas },
    { key: "positivas", label: "Respostas positivas", valor: c.positivas },
    { key: "reunioes_agendadas", label: "Reuniões agendadas", valor: c.reunioes_agendadas },
    { key: "reunioes_realizadas", label: "Reuniões realizadas", valor: c.reunioes_realizadas },
    { key: "propostas", label: "Propostas comerciais", valor: c.propostas },
    { key: "contratos", label: "Contratos fechados", valor: c.contratos },
  ]);
}

/** Funil Digital Smile (legado — mantido para compat). */
export function funnelSmile(p: ProspeccaoAgregada, contratos: number): FunnelStageOut[] {
  return buildFunnel([
    { key: "encontrados", label: "Dentistas encontrados", valor: p.leads_encontrados },
    { key: "prospectados", label: "Prospectados", valor: p.novos_prospectados },
    { key: "respostas", label: "Respostas", valor: p.respostas },
    { key: "qualificados", label: "Qualificados", valor: p.qualificados },
    { key: "reunioes_marcadas", label: "Reuniões marcadas", valor: p.reunioes_marcadas },
    { key: "reunioes_realizadas", label: "Reuniões realizadas", valor: p.reunioes_realizadas },
    { key: "propostas", label: "Propostas", valor: p.propostas_enviadas },
    { key: "contratos", label: "Contratos fechados", valor: contratos },
  ]);
}

export const METODOS = [
  { value: "prospeccao_ativa", label: "Prospecção ativa" },
  { value: "trafego_pago", label: "Tráfego pago" },
  { value: "organico", label: "Orgânico" },
  { value: "indicacao", label: "Indicação" },
  { value: "outros", label: "Outros" },
] as const;

export const METODO_LABEL: Record<string, string> = Object.fromEntries(METODOS.map((m) => [m.value, m.label]));
