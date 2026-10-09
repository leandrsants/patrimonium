import type {
  Assinatura,
  Cliente,
  CompraCartao,
  ContaSaldo,
  Empresa,
  Lancamento,
  Meta,
  ParcelaSituacao,
  RegistroProspeccao,
  Venda,
} from "@/lib/types";
import { inRange, previousPeriod, type Period } from "@/lib/period";
import { contaNaMeta } from "@/lib/extras";
import { safeRatio, formatBRL, formatDateBR } from "@/lib/format";
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

/**
 * Variação percentual de `atual` sobre `anterior`.
 * - anterior 0 e atual 0  -> 0 (estável).
 * - anterior 0 e atual ≠ 0 -> null (não há base: "novo").
 * - caso geral -> (atual − anterior) / |anterior| × 100.
 */
export function pctDelta(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual === 0 ? 0 : null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export type MetaPonto = {
  label: string; // rótulo curto do eixo X (dd/mm)
  full: string; // data completa (tooltip)
  /** Posição no eixo X como fração 0–1 do período da meta, não do índice: os
   *  marcos não são equidistantes (hoje e o último dia entram fora da grade
   *  semanal), então espaçar por índice mentiria sobre o tempo. */
  pos: number;
  /** Recebido acumulado até a data. `null` depois de hoje — a linha real para no presente. */
  acumulado: number | null;
  /** Onde o acumulado precisaria estar nessa data para a meta fechar no prazo. */
  ritmo: number;
};

/**
 * Série semanal do progresso da Meta 10K: quanto já entrou acumulado contra o
 * ritmo necessário para fechar no prazo (reta de 0 ao alvo entre início e fim).
 *
 * O filtro reproduz `meta_10k_progresso` (20261009100006) via `contaNaMeta`:
 * entrada recebida de receita empresarial OU de receita extra de fonte/categoria
 * marcada para a meta (Sonati, Danilo, Jiu-jítsu). Datas são comparadas como
 * string ISO, que ordena corretamente e evita fuso.
 */
export function buildMetaSerie(lancamentos: Lancamento[], meta: Meta, hojeISO?: string): MetaPonto[] {
  const inicio = meta.data_inicio;
  const fim = meta.data_fim;
  const hoje = hojeISO ?? new Date().toISOString().slice(0, 10);
  const alvo = Number(meta.valor_alvo);

  const contam = lancamentos
    .filter(
      (l) =>
        contaNaMeta(l) &&
        l.status === "recebido" &&
        l.data_pagamento !== null &&
        l.data_pagamento >= inicio &&
        l.data_pagamento <= fim,
    )
    .sort((a, b) => (a.data_pagamento! < b.data_pagamento! ? -1 : 1));

  const dia = 86_400_000;
  const t0 = Date.parse(`${inicio}T00:00:00Z`);
  const t1 = Date.parse(`${fim}T00:00:00Z`);
  const totalDias = Math.max(1, Math.round((t1 - t0) / dia));

  // Marcos semanais, mais início, fim e HOJE. Sem o marco de hoje a linha real
  // pararia no último domingo e ignoraria o que entrou na semana corrente.
  const marcos = new Set<string>();
  for (let t = t0; t < t1; t += 7 * dia) marcos.add(new Date(t).toISOString().slice(0, 10));
  marcos.add(fim);
  if (hoje > inicio && hoje < fim) marcos.add(hoje);

  let i = 0;
  let soma = 0;
  return [...marcos]
    .sort()
    .map((data) => {
      while (i < contam.length && contam[i].data_pagamento! <= data) soma += Number(contam[i++].valor);
      const decorridos = Math.round((Date.parse(`${data}T00:00:00Z`) - t0) / dia);
      const [, mes, d] = data.split("-");
      return {
        label: `${d}/${mes}`,
        full: formatDateBR(data),
        pos: decorridos / totalDias,
        acumulado: data <= hoje ? soma : null,
        ritmo: (alvo * decorridos) / totalDias,
      };
    });
}

export type FaturamentoPonto = {
  label: string; // rótulo curto do eixo X
  full: string; // data completa (tooltip) do período atual
  atual: number;
  anterior: number;
  anteriorFull: string; // data completa do bucket correspondente do período anterior
};

type FatBucket = { label: string; full: string; value: number };

/**
 * Faturamento de uma empresa por bucket (dia ≤31d, semana ≤92d, mês acima) dentro
 * do período. Faturamento = vendas (data_venda) + parcelas recorrentes vigentes,
 * a mesma definição da métrica. Buckets vazios ficam zero para a linha não "pular".
 */
function faturamentoBuckets(
  vendas: Venda[],
  parcelas: ParcelaSituacao[],
  assinaturas: Assinatura[],
  empresaId: string,
  period: Period,
): FatBucket[] {
  const DAY = 86400000;
  const pad = (n: number) => String(n).padStart(2, "0");
  const MES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const fromD = new Date(`${period.from}T00:00:00Z`);
  const toD = new Date(`${period.to}T00:00:00Z`);
  const dias = Math.round((toD.getTime() - fromD.getTime()) / DAY) + 1;
  const gran: "day" | "week" | "month" = dias <= 31 ? "day" : dias <= 92 ? "week" : "month";

  const buckets: { label: string; full: string }[] = [];
  const index = new Map<string, number>();

  if (gran === "month") {
    let y = fromD.getUTCFullYear();
    let m = fromD.getUTCMonth();
    const endKey = `${toD.getUTCFullYear()}-${pad(toD.getUTCMonth() + 1)}`;
    for (;;) {
      const key = `${y}-${pad(m + 1)}`;
      index.set(key, buckets.length);
      buckets.push({ label: MES[m], full: `${MES[m]}/${y}` });
      if (key === endKey) break;
      m += 1;
      if (m > 11) { m = 0; y += 1; }
    }
  } else {
    const step = gran === "week" ? 7 : 1;
    for (let t = fromD.getTime(); t <= toD.getTime(); t += step * DAY) {
      const d = new Date(t);
      const key = d.toISOString().slice(0, 10);
      const dd = pad(d.getUTCDate());
      const mm = pad(d.getUTCMonth() + 1);
      index.set(key, buckets.length);
      buckets.push({
        label: gran === "week" ? `${dd}/${mm}` : `${d.getUTCDate()}`,
        full: gran === "week" ? `Semana de ${dd}/${mm}` : `${dd}/${mm}/${d.getUTCFullYear()}`,
      });
    }
  }

  const keyFor = (ymd: string | null | undefined): string | null => {
    if (!ymd) return null;
    const d = new Date(`${ymd.slice(0, 10)}T00:00:00Z`);
    if (d.getTime() < fromD.getTime() || d.getTime() > toD.getTime()) return null;
    if (gran === "month") return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
    if (gran === "day") return d.toISOString().slice(0, 10);
    const offset = Math.floor((d.getTime() - fromD.getTime()) / DAY);
    return new Date(fromD.getTime() + Math.floor(offset / 7) * 7 * DAY).toISOString().slice(0, 10);
  };

  const vals = new Array(buckets.length).fill(0);
  const add = (ymd: string | null | undefined, v: number) => {
    const k = keyFor(ymd);
    if (k === null) return;
    const i = index.get(k);
    if (i !== undefined) vals[i] += v;
  };

  for (const v of vendas) {
    if (v.empresa_id !== empresaId) continue;
    add(v.data_venda, Number(v.valor_final));
  }
  const assinaturaIds = new Set(assinaturas.filter((a) => a.empresa_id === empresaId).map((a) => a.id));
  for (const p of parcelas) {
    if (!p.assinatura_id || !assinaturaIds.has(p.assinatura_id) || p.situacao_calculada === "cancelada") continue;
    add(p.data_vencimento, Number(p.valor_devido));
  }

  return buckets.map((b, i) => ({ label: b.label, full: b.full, value: vals[i] }));
}

/**
 * Série de Faturamento do período atual + do período anterior de mesma duração
 * (alinhados por posição de bucket), para o gráfico da Vision. Usa a mesma
 * `previousPeriod` dos cards do Dashboard.
 */
export function buildVisionFaturamentoSerie(
  vendas: Venda[],
  parcelas: ParcelaSituacao[],
  assinaturas: Assinatura[],
  empresaId: string,
  period: Period,
): FaturamentoPonto[] {
  const atual = faturamentoBuckets(vendas, parcelas, assinaturas, empresaId, period);
  const anterior = faturamentoBuckets(vendas, parcelas, assinaturas, empresaId, previousPeriod(period));
  return atual.map((b, i) => ({
    label: b.label,
    full: b.full,
    atual: b.value,
    anterior: anterior[i]?.value ?? 0,
    anteriorFull: anterior[i]?.full ?? "",
  }));
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
/**
 * Série mensal do gráfico do painel, toda em regime de COMPETÊNCIA: o mês é o
 * da venda e o lucro é faturamento − despesas.
 *
 * Antes o lucro saía de `recebido − despesas`, ou seja, a 1ª barra media venda
 * e a 3ª media caixa. As duas coincidiam enquanto todo cliente pagava à vista e
 * divergiram no primeiro caloteiro (julho: 914,90 − 348,81 = 566,09, mas a
 * barra mostrava 518,09 — os 48,00 que o Leo - Açaí não pagou).
 *
 * O preço dessa escolha: venda não recebida entra no lucro. Quem quiser caixa
 * olha o saldo das contas, que é outra coisa e vive em patrimonio_saldos.
 */
export function monthlySeries(vendas: Venda[], lancamentos: Lancamento[], year: number) {
  const meses = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  return meses.map((label, m) => {
    const fat = vendas
      .filter((v) => v.status === "ativa" && v.data_venda.startsWith(`${year}-${String(m + 1).padStart(2, "0")}`))
      .reduce((s, v) => s + Number(v.valor_final), 0);
    const desp = lancamentos
      .filter(
        (l) =>
          l.tipo === "saida" &&
          l.natureza === "despesa_empresarial" &&
          l.status === "pago" &&
          (l.data_pagamento ?? l.data_competencia).startsWith(`${year}-${String(m + 1).padStart(2, "0")}`),
      )
      .reduce((s, l) => s + Number(l.valor), 0);
    return { label, values: [fat, desp, fat - desp] };
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

/** Dias corridos entre duas datas "YYYY-MM-DD" (UTC, livre de fuso). */
function diasEntre(de: string, ate: string): number {
  const a = Date.parse(`${de.slice(0, 10)}T00:00:00Z`);
  const b = Date.parse(`${ate.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.round((b - a) / 86400000));
}

export type AtencaoItem = { tone: "negative" | "warning" | "neutral"; label: string };

/**
 * Pendências da empresa que pedem ação HOJE: cobranças atrasadas (parcelas de
 * vendas da empresa), follow-ups vencidos e entregas paradas há muito tempo.
 */
export function buildEmpresaAtencao(
  vendas: Venda[],
  parcelas: ParcelaSituacao[],
  oportunidades: { proxima_acao_data: string | null; estagio: string }[],
  hoje: string,
): AtencaoItem[] {
  const items: AtencaoItem[] = [];
  const vendaIds = new Set(vendas.map((v) => v.id));

  const atrasadas = parcelas.filter((p) => p.venda_id && vendaIds.has(p.venda_id) && p.situacao_calculada === "atrasada");
  if (atrasadas.length) {
    const total = atrasadas.reduce((s, p) => s + Number(p.saldo_pendente), 0);
    items.push({ tone: "negative", label: `${atrasadas.length} cobrança(s) atrasada(s) · ${formatBRL(total)}` });
  }

  const follow = oportunidades.filter((o) => o.proxima_acao_data && o.proxima_acao_data < hoje && o.estagio !== "fechado" && o.estagio !== "perdido").length;
  if (follow) items.push({ tone: "warning", label: `${follow} follow-up(s) de lead vencido(s)` });

  const paradas = vendas.filter((v) => v.status_entrega && v.status_entrega !== "entregue" && v.status_entrega !== "finalizado" && diasEntre(v.data_venda, hoje) > 14);
  if (paradas.length) items.push({ tone: "neutral", label: `${paradas.length} entrega(s) parada(s) há +14 dias` });

  return items;
}

/**
 * LTV histórico por canal de aquisição: agrupa cada cliente REAL pelo método da
 * sua PRIMEIRA venda e divide o faturamento vitalício total pelo nº de clientes.
 */
export function ltvPorMetodo(vendas: Venda[], clientes: Cliente[]): Record<string, { ltv: number | null; clientes: number }> {
  const reais = new Set(clientes.filter((c) => c.tipo_registro === "normal").map((c) => c.id));
  const primeiro = new Map<string, { data: string; metodo: string }>();
  const totalCliente = new Map<string, number>();
  for (const v of vendas) {
    if (!v.cliente_id || !reais.has(v.cliente_id)) continue;
    totalCliente.set(v.cliente_id, (totalCliente.get(v.cliente_id) ?? 0) + Number(v.valor_final));
    const cur = primeiro.get(v.cliente_id);
    if (!cur || v.data_venda < cur.data) primeiro.set(v.cliente_id, { data: v.data_venda, metodo: v.metodo_aquisicao ?? "outros" });
  }
  const agg: Record<string, { soma: number; n: number }> = {};
  for (const [id, p] of primeiro) {
    const m = p.metodo || "outros";
    (agg[m] ??= { soma: 0, n: 0 });
    agg[m].soma += totalCliente.get(id) ?? 0;
    agg[m].n += 1;
  }
  const out: Record<string, { ltv: number | null; clientes: number }> = {};
  for (const [m, a] of Object.entries(agg)) out[m] = { ltv: a.n > 0 ? a.soma / a.n : null, clientes: a.n };
  return out;
}

/** Ticket médio por produto (empresarial). */
export function ticketPorProduto(breakdown: ProdutoBreakdown[]): { nome: string; ticket: number | null }[] {
  return breakdown.map((b) => ({ nome: b.nome, ticket: ratio(b.valor, b.vendas) }));
}
