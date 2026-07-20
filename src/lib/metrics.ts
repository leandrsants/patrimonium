import type {
  Assinatura,
  CompraCartao,
  ContaSaldo,
  Empresa,
  Lancamento,
  ParcelaSituacao,
  RegistroProspeccao,
  Venda,
} from "@/lib/types";
import { inRange, type Period } from "@/lib/period";
import { safeRatio } from "@/lib/format";
import { cac as calcCac, custoPorVenda as calcCPV, ticketMedio as calcTicket, ratio, somarProspeccao, type ProspeccaoAgregada } from "@/lib/calc";

export type EmpresaMetrics = {
  faturamento: number;
  recebido: number;
  aReceber: number;
  investimento: number;
  despesas: number;
  lucro: number;
  vendas: number;
  ticketMedio: number | null;
  clientesNovos: number;
  cac: number | null;
  mrr: number;
  clientesAtivos: number;
};

export type DashboardMetrics = {
  faturamentoNegocios: number;
  totalRecebido: number;
  investimentoAquisicao: number;
  lucroNegocios: number;
  despesasNegocios: number;
  despesasPessoais: number;
  aReceber: number;
  inadimplencia: number;
  patrimonioLiquido: number;
  receitasExtras: number;
  vision: EmpresaMetrics;
  digitalSmile: EmpresaMetrics;
};

/** Recebido empresarial de uma empresa no período (dinheiro que entrou). */
function recebidoEmpresa(lancs: Lancamento[], empresaId: string, period: Period): number {
  return lancs
    .filter(
      (l) =>
        l.tipo === "entrada" &&
        l.natureza === "receita_empresarial" &&
        l.empresa_id === empresaId &&
        l.status === "recebido" &&
        inRange(l.data_pagamento, period),
    )
    .reduce((s, l) => s + Number(l.valor), 0);
}

function despesasEmpresa(lancs: Lancamento[], empresaId: string, period: Period): number {
  return lancs
    .filter(
      (l) =>
        l.tipo === "saida" &&
        l.natureza === "despesa_empresarial" &&
        l.empresa_id === empresaId &&
        (l.status === "pago") &&
        inRange(l.data_pagamento ?? l.data_competencia, period),
    )
    .reduce((s, l) => s + Number(l.valor), 0);
}

function investimentoEmpresa(lancs: Lancamento[], empresaId: string, period: Period): number {
  return lancs
    .filter(
      (l) =>
        l.entra_no_cac &&
        l.empresa_id === empresaId &&
        (l.status === "pago") &&
        inRange(l.data_pagamento ?? l.data_competencia, period),
    )
    .reduce((s, l) => s + Number(l.valor), 0);
}

/** Contrato vigente = ainda gera receita recorrente (não cancelado/finalizado). */
export function assinaturaVigente(a: Assinatura): boolean {
  return a.status !== "cancelado" && a.status !== "finalizado";
}

/**
 * Faturamento = vendas avulsas (data da venda) + faturamento recorrente das
 * assinaturas, ou seja, as competências (parcelas) faturadas no período. Assim o
 * fechamento de um contrato aparece no faturamento assim que gera a 1ª cobrança.
 */
function faturamentoEmpresa(vendas: Venda[], parcelas: ParcelaSituacao[], assinaturas: Assinatura[], empresaId: string, period: Period): number {
  const vendasFat = vendas
    .filter((v) => v.empresa_id === empresaId && inRange(v.data_venda, period))
    .reduce((s, v) => s + Number(v.valor_final), 0);
  const assinaturaIds = new Set(assinaturas.filter((a) => a.empresa_id === empresaId).map((a) => a.id));
  const recorrenteFat = parcelas
    .filter((p) => p.assinatura_id && assinaturaIds.has(p.assinatura_id) && p.situacao_calculada !== "cancelada" && inRange(p.data_vencimento, period))
    .reduce((s, p) => s + Number(p.valor_devido), 0);
  return vendasFat + recorrenteFat;
}

function aReceberEmpresa(
  parcelas: ParcelaSituacao[],
  vendas: Venda[],
  assinaturas: Assinatura[],
  empresaId: string,
): number {
  const vendaIds = new Set(vendas.filter((v) => v.empresa_id === empresaId).map((v) => v.id));
  const assinaturaIds = new Set(assinaturas.filter((a) => a.empresa_id === empresaId).map((a) => a.id));
  return parcelas
    .filter(
      (p) =>
        p.situacao_calculada !== "cancelada" &&
        p.saldo_pendente > 0 &&
        ((p.venda_id && vendaIds.has(p.venda_id)) || (p.assinatura_id && assinaturaIds.has(p.assinatura_id))),
    )
    .reduce((s, p) => s + Number(p.saldo_pendente), 0);
}

export function computeEmpresaMetrics(
  empresa: Empresa,
  data: {
    lancamentos: Lancamento[];
    vendas: Venda[];
    parcelas: ParcelaSituacao[];
    assinaturas: Assinatura[];
  },
  period: Period,
): EmpresaMetrics {
  const { lancamentos, vendas, parcelas, assinaturas } = data;
  const faturamento = faturamentoEmpresa(vendas, parcelas, assinaturas, empresa.id, period);
  const recebido = recebidoEmpresa(lancamentos, empresa.id, period);
  const despesas = despesasEmpresa(lancamentos, empresa.id, period);
  const investimento = investimentoEmpresa(lancamentos, empresa.id, period);
  const lucro = recebido - despesas;
  const vendasNoPeriodo = vendas.filter((v) => v.empresa_id === empresa.id && inRange(v.data_venda, period));
  // Novos contratos incluem assinaturas iniciadas no período (clientes recorrentes da DS).
  const assinaturasNoPeriodo = assinaturas.filter((a) => a.empresa_id === empresa.id && inRange(a.data_inicio, period));
  const nContratos = vendasNoPeriodo.length + assinaturasNoPeriodo.length;
  const clientesNovos = new Set([
    ...vendasNoPeriodo.map((v) => v.cliente_id),
    ...assinaturasNoPeriodo.map((a) => a.cliente_id),
  ].filter(Boolean)).size;
  // MRR e clientes ativos = contratos VIGENTES (inclui onboarding — um contrato
  // recém-fechado já é receita recorrente), excluindo cancelado/finalizado.
  const vigentes = assinaturas.filter((a) => a.empresa_id === empresa.id && assinaturaVigente(a));
  const mrr = vigentes.reduce((s, a) => s + Number(a.valor_mensal), 0);
  const clientesAtivos = vigentes.length;

  return {
    faturamento,
    recebido,
    aReceber: aReceberEmpresa(parcelas, vendas, assinaturas, empresa.id),
    investimento,
    despesas,
    lucro,
    vendas: nContratos,
    ticketMedio: safeRatio(faturamento, vendasNoPeriodo.length),
    clientesNovos,
    cac: safeRatio(investimento, clientesNovos),
    mrr,
    clientesAtivos,
  };
}

export function computeDashboard(
  data: {
    empresas: Empresa[];
    lancamentos: Lancamento[];
    vendas: Venda[];
    parcelas: ParcelaSituacao[];
    assinaturas: Assinatura[];
    saldos: ContaSaldo[];
    compras: CompraCartao[];
  },
  period: Period,
): DashboardMetrics {
  const vision = data.empresas.find((e) => e.slug === "vision");
  const ds = data.empresas.find((e) => e.slug === "digital_smile");

  const empty: EmpresaMetrics = {
    faturamento: 0, recebido: 0, aReceber: 0, investimento: 0, despesas: 0,
    lucro: 0, vendas: 0, ticketMedio: null, clientesNovos: 0, cac: null, mrr: 0, clientesAtivos: 0,
  };
  const vm = vision ? computeEmpresaMetrics(vision, data, period) : empty;
  const dm = ds ? computeEmpresaMetrics(ds, data, period) : empty;

  const receitasExtras = data.lancamentos
    .filter((l) => l.tipo === "entrada" && l.natureza === "receita_extra" && l.status === "recebido" && inRange(l.data_pagamento, period))
    .reduce((s, l) => s + Number(l.valor), 0);

  const despesasPessoais = data.lancamentos
    .filter((l) => l.tipo === "saida" && l.natureza === "despesa_pessoal" && l.status === "pago" && inRange(l.data_pagamento ?? l.data_competencia, period))
    .reduce((s, l) => s + Number(l.valor), 0);

  const ativos = data.saldos.reduce((s, c) => s + Number(c.saldo_calculado), 0);
  const passivos = data.lancamentos
    .filter((l) => l.compra_cartao_id && l.status === "previsto")
    .reduce((s, l) => s + Number(l.valor), 0);

  const inadimplencia = data.parcelas
    .filter((p) => p.situacao_calculada === "atrasada")
    .reduce((s, p) => s + Number(p.saldo_pendente), 0);

  const aReceber = data.parcelas
    .filter((p) => p.situacao_calculada !== "cancelada" && p.saldo_pendente > 0)
    .reduce((s, p) => s + Number(p.saldo_pendente), 0);

  return {
    faturamentoNegocios: vm.faturamento + dm.faturamento,
    totalRecebido: vm.recebido + dm.recebido + receitasExtras,
    investimentoAquisicao: vm.investimento + dm.investimento,
    lucroNegocios: vm.lucro + dm.lucro,
    despesasNegocios: vm.despesas + dm.despesas,
    despesasPessoais,
    aReceber,
    inadimplencia,
    patrimonioLiquido: ativos - passivos,
    receitasExtras,
    vision: vm,
    digitalSmile: dm,
  };
}

export type AttentionItem = { tone: "negative" | "warning" | "neutral"; label: string; detail?: string; href?: string };

export function computeAttention(data: {
  parcelas: ParcelaSituacao[];
  assinaturas: Assinatura[];
  vendas: Venda[];
  oportunidades: { proxima_acao_data: string | null; estagio: string; nome_contato: string | null; cliente?: { nome: string } | null }[];
}): AttentionItem[] {
  const items: AttentionItem[] = [];
  const hoje = new Date().toISOString().slice(0, 10);
  const em7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

  const atrasadas = data.parcelas.filter((p) => p.situacao_calculada === "atrasada");
  if (atrasadas.length) {
    items.push({ tone: "negative", label: `${atrasadas.length} cobrança(s) vencida(s)`, detail: "pagamento atrasado" });
  }

  const vencendo = data.parcelas.filter(
    (p) => (p.situacao_calculada === "prevista" || p.situacao_calculada === "parcial") && p.data_vencimento >= hoje && p.data_vencimento <= em7,
  );
  if (vencendo.length) {
    items.push({ tone: "warning", label: `${vencendo.length} cobrança(s) vencendo em 7 dias` });
  }

  const contratosPendentes = data.assinaturas.filter(
    (a) => a.status !== "cancelado" && a.status !== "finalizado" && a.contrato_necessario && !a.contrato_assinado,
  );
  if (contratosPendentes.length) {
    items.push({ tone: "warning", label: `${contratosPendentes.length} contrato(s) pendente(s) de assinatura` });
  }

  const onboardingIncompleto = data.assinaturas.filter((a) => a.status === "onboarding");
  if (onboardingIncompleto.length) {
    items.push({ tone: "neutral", label: `${onboardingIncompleto.length} onboarding(s) em andamento` });
  }

  const followVencido = data.oportunidades.filter(
    (o) => o.proxima_acao_data && o.proxima_acao_data < hoje && o.estagio !== "fechado" && o.estagio !== "perdido",
  );
  if (followVencido.length) {
    items.push({ tone: "warning", label: `${followVencido.length} follow-up(s) vencido(s)` });
  }

  const entregasAtrasadas = data.vendas.filter(
    (v) => v.status_entrega && v.status_entrega !== "entregue" && v.status_entrega !== "finalizado",
  );
  if (entregasAtrasadas.length) {
    items.push({ tone: "neutral", label: `${entregasAtrasadas.length} entrega(s) em andamento` });
  }

  return items;
}

/** Série mês a mês do ano corrente: faturamento (vendas), despesas e lucro empresarial. */
export function monthlySeries(vendas: Venda[], lancamentos: Lancamento[], year: number) {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return meses.map((label, m) => {
    const fat = vendas
      .filter((v) => v.data_venda.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`))
      .reduce((s, v) => s + Number(v.valor_final), 0);
    const receb = lancamentos
      .filter(
        (l) =>
          l.tipo === "entrada" &&
          l.natureza === "receita_empresarial" &&
          l.status === "recebido" &&
          (l.data_pagamento ?? "").startsWith(`${year}-${String(m + 1).padStart(2, "0")}`),
      )
      .reduce((s, l) => s + Number(l.valor), 0);
    const desp = lancamentos
      .filter(
        (l) =>
          l.tipo === "saida" &&
          l.natureza === "despesa_empresarial" &&
          l.status === "pago" &&
          (l.data_pagamento ?? l.data_competencia).startsWith(`${year}-${String(m + 1).padStart(2, "0")}`),
      )
      .reduce((s, l) => s + Number(l.valor), 0);
    return { label, values: [fat, desp, receb - desp] };
  });
}

export type ProdutoBreakdown = { nome: string; ativo: boolean; vendas: number; valor: number };

export function buildProdutoBreakdown(
  produtos: { id: string; nome: string; ativo: boolean; empresa_id: string }[],
  vendas: Venda[],
  empresaId: string,
  period: Period,
): ProdutoBreakdown[] {
  return produtos
    .filter((p) => p.empresa_id === empresaId && p.ativo)
    .map((p) => {
      const vs = vendas.filter((v) => v.produto_id === p.id && inRange(v.data_venda, period));
      return { nome: p.nome, ativo: p.ativo, vendas: vs.length, valor: vs.reduce((s, v) => s + Number(v.valor_final), 0) };
    });
}

export function buildClienteRows(
  empresaId: string,
  vendas: Venda[],
  parcelas: ParcelaSituacao[],
  assinaturas: Assinatura[],
) {
  const clientesMap = new Map<string, { id: string; nome: string; telefone: string | null; produtos: Set<string>; vendido: number; recebido: number; pendente: number; ultimaVenda: string | null; entrega: string | null; atrasado: boolean }>();

  const parcelasPorVenda = new Map<string, ParcelaSituacao[]>();
  for (const p of parcelas) {
    if (p.venda_id) parcelasPorVenda.set(p.venda_id, [...(parcelasPorVenda.get(p.venda_id) ?? []), p]);
  }

  for (const v of vendas) {
    if (v.empresa_id !== empresaId || !v.cliente_id) continue;
    const key = v.cliente_id;
    const row = clientesMap.get(key) ?? {
      id: key,
      nome: v.cliente?.nome ?? "—",
      telefone: v.cliente?.telefone ?? null,
      produtos: new Set<string>(),
      vendido: 0,
      recebido: 0,
      pendente: 0,
      ultimaVenda: null as string | null,
      entrega: null as string | null,
      atrasado: false,
    };
    if (v.produto?.nome) row.produtos.add(v.produto.nome);
    row.vendido += Number(v.valor_final);
    const ps = parcelasPorVenda.get(v.id) ?? [];
    row.recebido += ps.reduce((s, p) => s + Number(p.recebido_liquido), 0);
    row.pendente += ps.reduce((s, p) => s + Number(p.saldo_pendente), 0);
    if (ps.some((p) => p.situacao_calculada === "atrasada")) row.atrasado = true;
    if (!row.ultimaVenda || v.data_venda > row.ultimaVenda) {
      row.ultimaVenda = v.data_venda;
      row.entrega = v.status_entrega;
    }
    clientesMap.set(key, row);
  }

  return Array.from(clientesMap.values())
    .map((r) => ({ ...r, produtos: Array.from(r.produtos).join(", ") }))
    .sort((a, b) => b.vendido - a.vendido);
}

export type MetodoBreakdown = {
  metodo: string;
  investimento: number;
  vendas: number;
  clientesNovos: number;
  receita: number;
  cac: number | null;
  custoPorVenda: number | null;
  ticket: number | null;
  atividade: ProspeccaoAgregada | null;
};

const METODOS_KEYS = ["prospeccao_ativa", "trafego_pago", "organico", "indicacao", "outros"];

export function buildAquisicaoPorMetodo(
  empresaId: string,
  vendas: Venda[],
  lancamentos: Lancamento[],
  registros: RegistroProspeccao[],
  period: Period,
  assinaturas: Assinatura[] = [],
): MetodoBreakdown[] {
  return METODOS_KEYS.map((metodo) => {
    const vs = vendas.filter((v) => v.empresa_id === empresaId && v.metodo_aquisicao === metodo && inRange(v.data_venda, period));
    const as = assinaturas.filter((a) => a.empresa_id === empresaId && a.metodo_aquisicao === metodo && inRange(a.data_inicio, period));
    const investimento = lancamentos
      .filter((l) => l.entra_no_cac && l.empresa_id === empresaId && l.metodo_aquisicao === metodo && (l.status === "pago") && inRange(l.data_pagamento ?? l.data_competencia, period))
      .reduce((s, l) => s + Number(l.valor), 0);
    const receita = vs.reduce((s, v) => s + Number(v.valor_final), 0) + as.reduce((s, a) => s + Number(a.valor_mensal), 0);
    const contratos = vs.length + as.length;
    const clientesNovos = new Set([...vs.map((v) => v.cliente_id), ...as.map((a) => a.cliente_id)].filter(Boolean)).size;
    const regs = registros.filter((r) => r.empresa_id === empresaId && r.metodo_aquisicao === metodo && inRange(r.data, period));
    const atividade = metodo === "prospeccao_ativa" || regs.length > 0 ? somarProspeccao(regs) : null;
    return {
      metodo,
      investimento,
      vendas: contratos,
      clientesNovos,
      receita,
      cac: calcCac(investimento, clientesNovos),
      custoPorVenda: calcCPV(investimento, contratos),
      ticket: calcTicket(receita, contratos),
      atividade,
    };
  });
}

export function somarRegistrosProspeccao(registros: RegistroProspeccao[], empresaId: string, period: Period): ProspeccaoAgregada {
  return somarProspeccao(registros.filter((r) => r.empresa_id === empresaId && inRange(r.data, period)));
}

/** Ticket médio por produto (empresarial). */
export function ticketPorProduto(breakdown: ProdutoBreakdown[]): { nome: string; ticket: number | null }[] {
  return breakdown.map((b) => ({ nome: b.nome, ticket: ratio(b.valor, b.vendas) }));
}
