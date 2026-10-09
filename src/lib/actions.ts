"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { RegraPagamento } from "@/lib/types";

export type ActionResult = { ok: boolean; error?: string; id?: string };

function revalidateAll() {
  revalidatePath("/", "layout");
}

async function client() {
  const c = createServerSupabaseClient();
  if (!c) throw new Error("Supabase local indisponível.");
  return c;
}

function fail(error: unknown): ActionResult {
  const message = error instanceof Error ? error.message : String(error);
  return { ok: false, error: message };
}

// ---------------------------------------------------------------- CLIENTES
export async function criarCliente(input: {
  nome: string;
  telefone?: string;
  email?: string;
  cpf_cnpj?: string;
  empresa_clinica_nome?: string;
  instagram?: string;
  drive_link?: string;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { data, error } = await c
      .from("clientes")
      .insert({
        nome: input.nome.trim(),
        telefone: input.telefone || null,
        email: input.email || null,
        cpf_cnpj: input.cpf_cnpj || null,
        empresa_clinica_nome: input.empresa_clinica_nome || null,
        instagram: input.instagram || null,
        drive_link: input.drive_link || null,
        observacao: input.observacao || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidateAll();
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarCliente(id: string, input: Record<string, string | null>): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("clientes").update(input).eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------ OPORTUNIDADES
export async function criarOportunidade(input: {
  empresa_id: string;
  nome_contato: string;
  telefone_contato?: string;
  cliente_id?: string;
  servico_interesse_id?: string;
  canal_id?: string;
  metodo_aquisicao?: string;
  fonte?: string;
  abordagem?: string;
  valor_potencial?: number;
  cidade?: string;
  email?: string;
  instagram?: string;
  registro_prospeccao_id?: string;
  estagio: string;
  proxima_acao?: string;
  proxima_acao_data?: string;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { data, error } = await c
      .from("oportunidades")
      .insert({
        empresa_id: input.empresa_id,
        nome_contato: input.nome_contato.trim(),
        telefone_contato: input.telefone_contato || null,
        cliente_id: input.cliente_id || null,
        servico_interesse_id: input.servico_interesse_id || null,
        canal_id: input.canal_id || null,
        metodo_aquisicao: input.metodo_aquisicao || null,
        fonte: input.fonte || null,
        abordagem: input.abordagem || null,
        valor_potencial: input.valor_potencial ?? null,
        cidade: input.cidade || null,
        email: input.email || null,
        instagram: input.instagram || null,
        registro_prospeccao_id: input.registro_prospeccao_id || null,
        estagio: input.estagio,
        proxima_acao: input.proxima_acao || null,
        proxima_acao_data: input.proxima_acao_data || null,
        observacao: input.observacao || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidateAll();
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarEstagioOportunidade(id: string, estagio: string, motivoPerda?: string): Promise<ActionResult> {
  try {
    const c = await client();
    const patch: Record<string, string | null> = { estagio };
    if (estagio === "perdido") patch.motivo_perda = motivoPerda || null;
    // Marca o momento do fechamento (para tempo médio até a venda). Só na 1ª vez.
    if (estagio === "fechado") patch.fechado_em = new Date().toISOString();
    const { error } = await c.from("oportunidades").update(patch).eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function definirProximoFollowup(id: string, data: string, acao?: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("oportunidades").update({ proxima_acao_data: data || null, proxima_acao: acao || null }).eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarReuniao(input: {
  oportunidade_id: string;
  data: string;
  horario?: string;
  status: string;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("reunioes").insert({
      oportunidade_id: input.oportunidade_id,
      data: input.data,
      horario: input.horario || null,
      status: input.status,
      observacao: input.observacao || null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------------ CAMPANHAS
export async function criarCampanha(input: {
  empresa_id: string;
  nome: string;
  data_inicio?: string;
  data_fim?: string;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { data, error } = await c
      .from("campanhas")
      .insert({
        empresa_id: input.empresa_id,
        nome: input.nome.trim(),
        data_inicio: input.data_inicio || null,
        data_fim: input.data_fim || null,
        observacao: input.observacao || null,
      })
      .select("id")
      .single();
    if (error) throw error;
    revalidateAll();
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e);
  }
}

// -------------------------------------------------------------------- VENDAS
function parcelasFromRegra(regra: RegraPagamento, valor: number, dataVenda: string): { descricao: string; valor: number; venc: string; numero: number }[] {
  const addDays = (d: string, n: number) => {
    const dt = new Date(d + "T00:00:00");
    dt.setDate(dt.getDate() + n);
    return dt.toISOString().slice(0, 10);
  };
  const round2 = (n: number) => Math.round(n * 100) / 100;

  if (regra.tipo === "100_antes") {
    return [{ descricao: "Pagamento integral", valor: round2(valor), venc: dataVenda, numero: 1 }];
  }
  if (regra.tipo === "50_50") {
    const p1 = round2(valor * 0.5);
    return [
      { descricao: "Entrada (50%)", valor: p1, venc: dataVenda, numero: 1 },
      { descricao: "Entrega (50%)", valor: round2(valor - p1), venc: addDays(dataVenda, 30), numero: 2 },
    ];
  }
  // personalizado
  const antesPct = regra.antes_pct ?? 50;
  const p1 = round2(valor * (antesPct / 100));
  return [
    { descricao: `Entrada (${antesPct}%)`, valor: p1, venc: dataVenda, numero: 1 },
    { descricao: `Entrega (${100 - antesPct}%)`, valor: round2(valor - p1), venc: addDays(dataVenda, 30), numero: 2 },
  ];
}

export async function criarVenda(input: {
  empresa_id: string;
  produto_id: string;
  cliente_id?: string;
  quantidade?: number;
  preco_tabela?: number;
  desconto_valor?: number;
  valor_final: number;
  data_venda: string;
  condicao_pagamento: RegraPagamento;
  canal_id?: string;
  campanha_id?: string;
  fonte?: string;
  registro_prospeccao_id?: string;
  oportunidade_id?: string;
  metodo_aquisicao?: string;
  status_entrega?: string;
  observacao?: string;
  /**
   * "recebido" (padrão): venda já efetuada — parcela única quitada no ato, sem
   * cobrança em aberto nem alerta de atraso. "a_receber": gera as parcelas da
   * condição de pagamento e deixa a cobrança pendente para registrar depois.
   */
  pagamento?: "recebido" | "a_receber";
  /** Conta que recebeu, quando pagamento = "recebido". Default: primeira conta ativa. */
  conta_id?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const recebido = (input.pagamento ?? "recebido") === "recebido";

    // Sem conta não há onde lançar o recebimento — falha ANTES de criar a venda,
    // para não deixar venda meio registrada.
    let contaId = input.conta_id || null;
    if (recebido && input.valor_final > 0 && !contaId) {
      const { data: conta } = await c.from("contas").select("id").eq("ativa", true).order("criado_em").limit(1).maybeSingle();
      if (!conta) return { ok: false, error: "Cadastre uma conta em Financeiro → Contas para registrar a venda como recebida." };
      contaId = conta.id;
    }

    const { data: venda, error } = await c
      .from("vendas")
      .insert({
        empresa_id: input.empresa_id,
        produto_id: input.produto_id,
        cliente_id: input.cliente_id || null,
        metodo_aquisicao: input.metodo_aquisicao || null,
        quantidade: input.quantidade ?? 1,
        preco_tabela: input.preco_tabela ?? null,
        desconto_valor: input.desconto_valor ?? 0,
        valor_final: input.valor_final,
        data_venda: input.data_venda,
        condicao_pagamento: input.condicao_pagamento,
        canal_id: input.canal_id || null,
        campanha_id: input.campanha_id || null,
        fonte: input.fonte || null,
        registro_prospeccao_id: input.registro_prospeccao_id || null,
        oportunidade_id: input.oportunidade_id || null,
        status_entrega: input.status_entrega || (recebido ? "entregue" : "aguardando_pagamento"),
        observacao: input.observacao || null,
      })
      .select("id")
      .single();
    if (error) throw error;

    // Venda já efetuada = uma única parcela integral, quitada no ato. Só quando a
    // cobrança fica em aberto é que a condição de pagamento vira cronograma.
    const parcelas = recebido
      ? [{ descricao: "Pagamento integral", valor: input.valor_final, venc: input.data_venda, numero: 1 }]
      : parcelasFromRegra(input.condicao_pagamento, input.valor_final, input.data_venda);
    const { data: criadas, error: pErr } = await c
      .from("parcelas")
      .insert(
        parcelas.map((p) => ({
          venda_id: venda.id,
          numero: p.numero,
          descricao: p.descricao,
          valor_devido: p.valor,
          data_vencimento: p.venc,
        })),
      )
      .select("id");
    if (pErr) throw pErr;

    // Lançamento do recebimento: o trigger de parcelas marca a parcela como paga,
    // então a venda não aparece como atrasada nem pendente.
    if (recebido && input.valor_final > 0 && contaId && criadas?.[0]) {
      const { error: lErr } = await c.from("lancamentos_financeiros").insert({
        tipo: "entrada",
        natureza: "receita_empresarial",
        empresa_id: input.empresa_id,
        cliente_id: input.cliente_id || null,
        venda_id: venda.id,
        parcela_id: criadas[0].id,
        conta_id: contaId,
        valor: input.valor_final,
        data_competencia: input.data_venda,
        data_pagamento: input.data_venda,
        status: "recebido",
        idempotency_key: randomUUID(),
      });
      if (lErr) throw lErr;
    }

    if (input.oportunidade_id) {
      await c.from("oportunidades").update({ venda_id: venda.id, estagio: "fechado" }).eq("id", input.oportunidade_id);
    }

    revalidateAll();
    return { ok: true, id: venda.id };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Converte uma OPORTUNIDADE existente em venda, reaproveitando toda a origem do
 * lead (método, canal/fonte, campanha, serviço, registro de prospecção, empresa)
 * e garantindo um CLIENTE global vinculado — cria a partir dos dados do lead se
 * ainda não houver, com dedupe por telefone normalizado (não duplica cliente).
 */
export async function converterOportunidadeEmVenda(oportunidadeId: string, input: {
  produto_id: string;
  valor_final: number;
  desconto_valor?: number;
  data_venda: string;
  condicao_pagamento: RegraPagamento;
  metodo_aquisicao?: string; // override opcional; default = do lead
  canal_id?: string;         // override opcional; default = do lead
  fonte?: string;            // override opcional; default = do lead
  observacao?: string;
  pagamento?: "recebido" | "a_receber";
  conta_id?: string;
  status_entrega?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { data: opp, error: oe } = await c.from("oportunidades").select("*").eq("id", oportunidadeId).single();
    if (oe) throw oe;
    if (!opp) return { ok: false, error: "Oportunidade não encontrada." };

    const clienteId = await resolverClienteDaOportunidade(c, opp);

    // Cria a venda preservando a origem; criarVenda cuida das parcelas e de
    // marcar a oportunidade como fechada (venda_id + estagio).
    return await criarVenda({
      empresa_id: opp.empresa_id,
      produto_id: input.produto_id,
      cliente_id: clienteId ?? undefined,
      valor_final: input.valor_final,
      desconto_valor: input.desconto_valor,
      data_venda: input.data_venda,
      condicao_pagamento: input.condicao_pagamento,
      metodo_aquisicao: input.metodo_aquisicao ?? opp.metodo_aquisicao ?? undefined,
      canal_id: input.canal_id ?? opp.canal_id ?? undefined,
      fonte: input.fonte ?? opp.fonte ?? undefined,
      campanha_id: opp.campanha_id ?? undefined,
      registro_prospeccao_id: opp.registro_prospeccao_id ?? undefined,
      oportunidade_id: oportunidadeId,
      observacao: input.observacao,
      pagamento: input.pagamento,
      conta_id: input.conta_id,
      status_entrega: input.status_entrega,
    });
  } catch (e) {
    return fail(e);
  }
}

/** Tipo mínimo de oportunidade usado na resolução de cliente. */
type OportunidadeParaCliente = { id: string; cliente_id: string | null; nome_contato: string | null; telefone_contato: string | null; instagram: string | null };

/**
 * Garante um CLIENTE global para a oportunidade: usa o já vinculado; senão faz
 * dedupe por telefone normalizado; senão cria a partir dos dados do lead. Vincula
 * o cliente ao lead. Compartilhado por conversão em venda e em assinatura.
 */
async function resolverClienteDaOportunidade(c: Awaited<ReturnType<typeof client>>, opp: OportunidadeParaCliente): Promise<string> {
  if (opp.cliente_id) return opp.cliente_id;
  let clienteId: string | null = null;
  const norm = (opp.telefone_contato ?? "").replace(/\D/g, "");
  if (norm) {
    const { data: cli } = await c.from("clientes").select("id").eq("telefone_normalizado", norm).eq("tipo_registro", "normal").is("excluido_em", null).limit(1).maybeSingle();
    if (cli) clienteId = cli.id;
  }
  if (!clienteId) {
    const { data: novo, error: ce } = await c.from("clientes").insert({
      nome: (opp.nome_contato ?? "Sem nome").trim() || "Sem nome",
      telefone: opp.telefone_contato || null,
      instagram: opp.instagram || null,
    }).select("id").single();
    if (ce) throw ce;
    clienteId = novo.id;
  }
  await c.from("oportunidades").update({ cliente_id: clienteId }).eq("id", opp.id);
  return clienteId as string;
}

/**
 * Converte uma OPORTUNIDADE em ASSINATURA (contrato recorrente — modelo da
 * Digital Smile). Reaproveita origem e cliente do lead. É o fechamento correto
 * para serviços recorrentes: alimenta Clientes e Contratos, Operação, MRR e CAC.
 */
export async function converterOportunidadeEmAssinatura(oportunidadeId: string, input: {
  produto_id: string;
  valor_mensal: number;
  preco_referencia?: number;
  desconto_valor?: number;
  dia_vencimento: number;
  data_inicio: string;
  metodo_aquisicao?: string; // override opcional; default = do lead
  canal_id?: string;         // override opcional; default = do lead
  fonte?: string;            // override opcional; default = do lead
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { data: opp, error: oe } = await c.from("oportunidades").select("*").eq("id", oportunidadeId).single();
    if (oe) throw oe;
    if (!opp) return { ok: false, error: "Oportunidade não encontrada." };

    const clienteId = await resolverClienteDaOportunidade(c, opp);

    // criarAssinatura cria a assinatura (status onboarding), gera a próxima
    // cobrança e marca a oportunidade como fechada.
    return await criarAssinatura({
      empresa_id: opp.empresa_id,
      cliente_id: clienteId,
      produto_id: input.produto_id,
      valor_mensal: input.valor_mensal,
      preco_referencia: input.preco_referencia,
      desconto_valor: input.desconto_valor,
      dia_vencimento: input.dia_vencimento,
      data_inicio: input.data_inicio,
      metodo_aquisicao: input.metodo_aquisicao ?? opp.metodo_aquisicao ?? undefined,
      canal_id: input.canal_id ?? opp.canal_id ?? undefined,
      fonte: input.fonte ?? opp.fonte ?? undefined,
      campanha_id: opp.campanha_id ?? undefined,
      registro_prospeccao_id: opp.registro_prospeccao_id ?? undefined,
      oportunidade_id: oportunidadeId,
    });
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarStatusEntrega(vendaId: string, status: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("vendas").update({ status_entrega: status }).eq("id", vendaId);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Edita dados de catálogo de uma venda já registrada: o produto (para reclassificar
 * qual trabalho foi — alimenta o faturamento por produto) e a descrição/observação.
 * Não mexe em valores, parcelas ou pagamentos.
 */
export async function atualizarVenda(
  vendaId: string,
  patch: { produto_id?: string | null; observacao?: string | null },
): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("vendas").update(patch).eq("id", vendaId);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- PAGAMENTOS
export async function registrarPagamentoParcela(input: {
  parcela_id: string;
  valor: number;
  conta_id: string;
  data_pagamento?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    // Descobrir empresa/cliente/natureza a partir da parcela -> venda ou assinatura.
    const { data: parcela, error: perr } = await c
      .from("parcelas")
      .select("id, venda_id, assinatura_id")
      .eq("id", input.parcela_id)
      .single();
    if (perr) throw perr;

    let empresaId: string | null = null;
    let clienteId: string | null = null;
    let vendaId: string | null = null;
    if (parcela.venda_id) {
      const { data: v } = await c.from("vendas").select("empresa_id, cliente_id").eq("id", parcela.venda_id).single();
      empresaId = v?.empresa_id ?? null;
      clienteId = v?.cliente_id ?? null;
      vendaId = parcela.venda_id;
    } else if (parcela.assinatura_id) {
      const { data: a } = await c.from("assinaturas").select("empresa_id, cliente_id").eq("id", parcela.assinatura_id).single();
      empresaId = a?.empresa_id ?? null;
      clienteId = a?.cliente_id ?? null;
    }

    const { error } = await c.from("lancamentos_financeiros").insert({
      tipo: "entrada",
      natureza: "receita_empresarial",
      empresa_id: empresaId,
      cliente_id: clienteId,
      venda_id: vendaId,
      parcela_id: input.parcela_id,
      conta_id: input.conta_id,
      valor: input.valor,
      data_competencia: input.data_pagamento || new Date().toISOString().slice(0, 10),
      data_pagamento: input.data_pagamento || new Date().toISOString().slice(0, 10),
      status: "recebido",
      idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- ASSINATURAS
export async function criarAssinatura(input: {
  empresa_id: string;
  cliente_id: string;
  produto_id: string;
  valor_mensal: number;
  preco_referencia?: number;
  desconto_valor?: number;
  motivo_desconto?: string;
  dia_vencimento: number;
  data_inicio: string;
  metodo_aquisicao?: string;
  canal_id?: string;
  campanha_id?: string;
  fonte?: string;
  registro_prospeccao_id?: string;
  cac_atribuido?: number;
  contrato_necessario?: boolean;
  verba_anuncios_dentista_estimada?: number;
  oportunidade_id?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    // proxima_data_cobranca = mês de início no dia de vencimento.
    const inicio = new Date(input.data_inicio + "T00:00:00");
    const dia = Math.min(input.dia_vencimento, 28);
    const prox = new Date(inicio.getFullYear(), inicio.getMonth(), dia).toISOString().slice(0, 10);

    const { data, error } = await c
      .from("assinaturas")
      .insert({
        empresa_id: input.empresa_id,
        cliente_id: input.cliente_id,
        produto_id: input.produto_id,
        oportunidade_id: input.oportunidade_id || null,
        valor_mensal: input.valor_mensal,
        preco_referencia: input.preco_referencia ?? null,
        desconto_valor: input.desconto_valor ?? 0,
        motivo_desconto: input.motivo_desconto || null,
        dia_vencimento: input.dia_vencimento,
        data_inicio: input.data_inicio,
        proxima_data_cobranca: prox,
        status: "onboarding",
        metodo_aquisicao: input.metodo_aquisicao || null,
        canal_id: input.canal_id || null,
        campanha_id: input.campanha_id || null,
        fonte: input.fonte || null,
        registro_prospeccao_id: input.registro_prospeccao_id || null,
        cac_atribuido: input.cac_atribuido ?? null,
        contrato_necessario: input.contrato_necessario ?? true,
        verba_anuncios_dentista_estimada: input.verba_anuncios_dentista_estimada ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;

    // Gera a 1ª competência (parcela) do mês de início, para o contrato já
    // aparecer em "A receber" e no faturamento recorrente. Só se o início já
    // ocorreu (não fatura contrato com início futuro antes da hora); nesse caso
    // avança a próxima cobrança para o mês seguinte.
    const hojeStr = new Date().toISOString().slice(0, 10);
    if (input.data_inicio <= hojeStr) {
      const y = inicio.getFullYear();
      const m = inicio.getMonth();
      const pad = (n: number) => String(n).padStart(2, "0");
      // A 1ª cobrança NUNCA nasce vencida: se o dia de vencimento do mês de
      // início já passou, vence na data de início (a receber hoje), senão no dia.
      const diaDate = new Date(y, m, dia);
      const firstVenc = (diaDate >= inicio ? diaDate : inicio).toISOString().slice(0, 10);
      const { error: pErr } = await c.from("parcelas").insert({
        assinatura_id: data.id,
        competencia_referencia: `${y}-${pad(m + 1)}-01`,
        descricao: `mensalidade ${pad(m + 1)}/${y}`,
        valor_devido: input.valor_mensal,
        data_vencimento: firstVenc,
      });
      if (pErr) throw pErr;
      const proxNext = new Date(y, m + 1, dia).toISOString().slice(0, 10);
      await c.from("assinaturas").update({ proxima_data_cobranca: proxNext }).eq("id", data.id);
    }

    // Fecha a oportunidade vinculada (contrato só existe com assinatura real).
    if (input.oportunidade_id) {
      await c.from("oportunidades").update({ estagio: "fechado", fechado_em: new Date().toISOString() }).eq("id", input.oportunidade_id);
    }

    revalidateAll();
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e);
  }
}

export async function gerarCompetenciaAssinatura(assinaturaId: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.rpc("gerar_competencia_assinatura", { p_assinatura_id: assinaturaId });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarAssinatura(id: string, patch: Record<string, unknown>): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("assinaturas").update(patch).eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------------ FINANCEIRO
export async function criarReceita(input: {
  natureza: "receita_empresarial" | "receita_extra";
  empresa_id?: string;
  categoria_id?: string;
  conta_id: string;
  valor: number;
  data: string;
  status: "previsto" | "recebido";
  cliente_id?: string;
  observacao?: string;
  fonte_extra_id?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("lancamentos_financeiros").insert({
      tipo: "entrada",
      natureza: input.natureza,
      fonte_extra_id: input.natureza === "receita_extra" ? input.fonte_extra_id || null : null,
      empresa_id: input.natureza === "receita_empresarial" ? input.empresa_id || null : null,
      categoria_id: input.categoria_id || null,
      cliente_id: input.cliente_id || null,
      conta_id: input.conta_id,
      valor: input.valor,
      data_competencia: input.data,
      data_pagamento: input.status === "recebido" ? input.data : null,
      status: input.status,
      idempotency_key: randomUUID(),
      observacao: input.observacao || null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarDespesa(input: {
  natureza: "despesa_empresarial" | "despesa_pessoal";
  empresa_id?: string;
  categoria_id?: string;
  campanha_id?: string;
  metodo_aquisicao?: string;
  conta_id: string;
  valor: number;
  data: string;
  status: "previsto" | "pago";
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("lancamentos_financeiros").insert({
      tipo: "saida",
      natureza: input.natureza,
      empresa_id: input.natureza === "despesa_empresarial" ? input.empresa_id || null : null,
      categoria_id: input.categoria_id || null,
      campanha_id: input.campanha_id || null,
      metodo_aquisicao: input.metodo_aquisicao || null,
      conta_id: input.conta_id,
      valor: input.valor,
      data_competencia: input.data,
      data_pagamento: input.status === "pago" ? input.data : null,
      status: input.status,
      idempotency_key: randomUUID(),
      observacao: input.observacao || null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarTransferencia(input: {
  conta_id: string;
  conta_destino_id: string;
  valor: number;
  data: string;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    if (input.conta_id === input.conta_destino_id) throw new Error("Conta de origem e destino devem ser diferentes.");
    const { error } = await c.from("lancamentos_financeiros").insert({
      tipo: "transferencia",
      natureza: "transferencia",
      conta_id: input.conta_id,
      conta_destino_id: input.conta_destino_id,
      valor: input.valor,
      data_competencia: input.data,
      data_pagamento: input.data,
      status: "pago",
      idempotency_key: randomUUID(),
      observacao: input.observacao || null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Cancela um lancamento: ele continua na tabela, mas sai de todo calculo
 * (metrics.ts so soma status 'pago'/'recebido'). E o caminho normal para um
 * movimento que existiu de verdade e caiu -- devolucao, cobranca perdoada,
 * despesa que nao rolou.
 */
export async function cancelarLancamento(id: string, motivo?: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { data: antes, error: readErr } = await c
      .from("lancamentos_financeiros")
      .select("*")
      .eq("id", id)
      .single();
    if (readErr) throw readErr;
    if (antes.status === "cancelado") return { ok: true, id };

    const observacao = motivo?.trim()
      ? `${antes.observacao ? `${antes.observacao} — ` : ""}cancelado: ${motivo.trim()}`
      : antes.observacao;

    const { data: depois, error } = await c
      .from("lancamentos_financeiros")
      .update({ status: "cancelado", observacao, atualizado_em: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    await c.from("auditoria").insert({
      tabela: "lancamentos_financeiros",
      registro_id: id,
      acao: "delete_logico",
      dados_antes: antes,
      dados_depois: depois,
      origem: "app",
    });

    revalidateAll();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

/** Reverte um cancelamento, devolvendo o lancamento ao status quitado. */
export async function reativarLancamento(id: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { data: antes, error: readErr } = await c
      .from("lancamentos_financeiros")
      .select("*")
      .eq("id", id)
      .single();
    if (readErr) throw readErr;

    const status = antes.data_pagamento
      ? antes.tipo === "entrada"
        ? "recebido"
        : "pago"
      : "previsto";

    const { data: depois, error } = await c
      .from("lancamentos_financeiros")
      .update({ status, atualizado_em: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    await c.from("auditoria").insert({
      tabela: "lancamentos_financeiros",
      registro_id: id,
      acao: "update",
      dados_antes: antes,
      dados_depois: depois,
      origem: "app",
    });

    revalidateAll();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Apaga o lancamento de vez. Use so para linha que nunca deveria ter existido
 * (duplicidade, valor digitado errado) -- para o resto, cancelarLancamento.
 *
 * O registro inteiro vai para public.auditoria antes do delete, entao a linha
 * some da tabela mas nao do historico. Se o lancamento estiver preso a uma
 * parcela, o trigger trg_atualizar_status_parcela recalcula o status dela.
 */
export async function excluirLancamento(id: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { data: antes, error: readErr } = await c
      .from("lancamentos_financeiros")
      .select("*")
      .eq("id", id)
      .single();
    if (readErr) throw readErr;

    // Grava a auditoria ANTES: se o delete falhar (FK de estorno, por exemplo),
    // sobra um registro a mais no log -- prejuizo menor do que apagar sem rastro.
    const { error: audErr } = await c.from("auditoria").insert({
      tabela: "lancamentos_financeiros",
      registro_id: id,
      acao: "delete_fisico",
      dados_antes: antes,
      dados_depois: null,
      origem: "app",
    });
    if (audErr) throw audErr;

    const { error } = await c.from("lancamentos_financeiros").delete().eq("id", id);
    if (error) {
      if (error.code === "23503") {
        throw new Error(
          "Este lançamento tem um estorno vinculado. Exclua o estorno primeiro ou apenas cancele este lançamento.",
        );
      }
      throw error;
    }

    revalidateAll();
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function criarConta(input: {
  nome: string;
  tipo: string;
  moeda_ativo: string;
  saldo_inicial: number;
  data_base: string;
  quantidade_ativo?: number;
  cotacao_manual_brl?: number;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("contas").insert({
      nome: input.nome.trim(),
      tipo: input.tipo,
      moeda_ativo: input.moeda_ativo,
      saldo_inicial: input.saldo_inicial,
      data_base: input.data_base,
      quantidade_ativo: input.tipo === "cripto" ? input.quantidade_ativo ?? null : null,
      cotacao_manual_brl: input.tipo === "cripto" ? input.cotacao_manual_brl ?? null : null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarCartao(input: { nome: string; dia_fechamento?: number; dia_vencimento?: number }): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("cartoes").insert({
      nome: input.nome.trim(),
      dia_fechamento: input.dia_fechamento ?? null,
      dia_vencimento: input.dia_vencimento ?? null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarCompraCartao(input: {
  cartao_id: string;
  descricao: string;
  valor_total: number;
  numero_parcelas: number;
  categoria_id?: string;
  empresa_id?: string;
  conta_id: string;
  mes_primeira_fatura: string;
  data_compra: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    // O trigger compras_cartao_gerar_parcelas cria as N parcelas em lancamentos.
    const { error } = await c.from("compras_cartao").insert({
      cartao_id: input.cartao_id,
      descricao: input.descricao,
      valor_total: input.valor_total,
      numero_parcelas: input.numero_parcelas,
      categoria_id: input.categoria_id || null,
      empresa_id: input.empresa_id || null,
      conta_id: input.conta_id,
      mes_primeira_fatura: input.mes_primeira_fatura,
      data_compra: input.data_compra,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function pagarParcelaCartao(lancamentoId: string): Promise<ActionResult> {
  try {
    const c = await client();
    // Pagar a fatura apenas muda o status da parcela existente -> nunca cria nova despesa.
    const { error } = await c
      .from("lancamentos_financeiros")
      .update({ status: "pago", data_pagamento: new Date().toISOString().slice(0, 10) })
      .eq("id", lancamentoId);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarDespesaRecorrente(input: {
  nome: string;
  valor: number;
  periodicidade: "mensal" | "anual";
  proxima_data_vencimento: string;
  categoria_id?: string;
  empresa_id?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("despesas_recorrentes").insert({
      nome: input.nome.trim(),
      valor: input.valor,
      periodicidade: input.periodicidade,
      proxima_data_vencimento: input.proxima_data_vencimento,
      categoria_id: input.categoria_id || null,
      empresa_id: input.empresa_id || null,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function gerarLancamentoRecorrente(despesaId: string, contaId: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.rpc("gerar_despesa_recorrente", {
      p_despesa_recorrente_id: despesaId,
      p_conta_id: contaId,
      p_idempotency_key: randomUUID(),
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------ FONTES EXTRAS
type FonteExtraInput = {
  nome: string;
  contato?: string;
  tipo: "fixa" | "variavel";
  cor: string;
  status: "ativa" | "pausada" | "encerrada";
  observacao?: string;
  conta_padrao_id?: string;
};

function fonteExtraRow(input: FonteExtraInput) {
  return {
    nome: input.nome.trim(),
    contato: input.contato?.trim() || null,
    tipo: input.tipo,
    cor: input.cor,
    status: input.status,
    observacao: input.observacao?.trim() || null,
    conta_padrao_id: input.conta_padrao_id || null,
  };
}

export async function criarFonteExtra(input: FonteExtraInput): Promise<ActionResult> {
  try {
    const c = await client();
    if (!input.nome.trim()) throw new Error("Informe o nome da fonte.");
    const { data, error } = await c.from("fontes_extras").insert(fonteExtraRow(input)).select("id").single();
    if (error) throw error;
    revalidateAll();
    return { ok: true, id: data.id };
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarFonteExtra(id: string, input: FonteExtraInput): Promise<ActionResult> {
  try {
    const c = await client();
    if (!input.nome.trim()) throw new Error("Informe o nome da fonte.");
    const { error } = await c
      .from("fontes_extras")
      .update({ ...fonteExtraRow(input), atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Cria (sem id) ou atualiza uma recorrência de pagamento de uma fonte extra. */
export async function salvarRecorrenciaExtra(input: {
  id?: string;
  fonte_id: string;
  descricao?: string;
  valor: number;
  dia_mes: number;
  data_inicio: string;
  data_fim?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    if (!Number.isInteger(input.dia_mes) || input.dia_mes < 1 || input.dia_mes > 31) throw new Error("Dia do mês deve estar entre 1 e 31.");
    const row = {
      fonte_id: input.fonte_id,
      descricao: input.descricao?.trim() || null,
      valor: input.valor,
      dia_mes: input.dia_mes,
      data_inicio: input.data_inicio,
      data_fim: input.data_fim || null,
    };
    const { error } = input.id
      ? await c.from("fontes_extras_recorrencias").update({ ...row, atualizado_em: new Date().toISOString() }).eq("id", input.id)
      : await c.from("fontes_extras_recorrencias").insert(row);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Encerra a recorrência (não apaga): deixa de gerar previstos a partir de agora. */
export async function encerrarRecorrenciaExtra(id: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c
      .from("fontes_extras_recorrencias")
      .update({ ativa: false, atualizado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Cria (sem id) ou atualiza um aluno do Jiu-jítsu. Saída = preencher data_saida. */
export async function salvarAlunoJiujitsu(input: {
  id?: string;
  fonte_id: string;
  nome: string;
  mensalidade: number;
  data_entrada: string;
  data_saida?: string;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    if (!input.nome.trim()) throw new Error("Informe o nome do aluno.");
    const row = {
      fonte_id: input.fonte_id,
      nome: input.nome.trim(),
      mensalidade: input.mensalidade,
      data_entrada: input.data_entrada,
      data_saida: input.data_saida || null,
      observacao: input.observacao?.trim() || null,
    };
    const { error } = input.id
      ? await c.from("alunos_jiujitsu").update({ ...row, atualizado_em: new Date().toISOString() }).eq("id", input.id)
      : await c.from("alunos_jiujitsu").insert(row);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Gera os previstos das fontes extras para a competência (YYYY-MM-01).
 * Idempotente no banco (índice único recorrência × competência): chamar de
 * novo nunca duplica. Não revalida — é chamada durante a renderização.
 */
export async function gerarPrevistosExtras(competencia: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.rpc("gerar_previstos_extras", { p_competencia: competencia });
    if (error) throw error;
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Marca um previsto de fonte extra como recebido. Atualiza o próprio
 * lançamento (nunca cria outro), com valor, data e conta editáveis.
 */
export async function marcarExtraRecebido(id: string, input: { valor: number; data: string; conta_id: string }): Promise<ActionResult> {
  try {
    const c = await client();
    if (!(input.valor > 0)) throw new Error("Valor deve ser maior que zero.");
    if (!input.conta_id) throw new Error("Selecione a conta.");
    const { data, error } = await c
      .from("lancamentos_financeiros")
      .update({
        status: "recebido",
        valor: input.valor,
        data_pagamento: input.data,
        conta_id: input.conta_id,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("natureza", "receita_extra")
      .eq("status", "previsto")
      .select("id");
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Lançamento não está mais previsto (já recebido ou cancelado).");
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// --------------------------------------------------------------- CONFIGURAÇÕES
export async function criarProduto(input: {
  empresa_id: string;
  nome: string;
  tipo_cobranca: string;
  preco_tabela?: number;
  preco_referencia?: number;
  ativo: boolean;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("produtos_servicos").insert({
      empresa_id: input.empresa_id,
      nome: input.nome.trim(),
      tipo_cobranca: input.tipo_cobranca,
      preco_tabela: input.preco_tabela ?? null,
      preco_referencia: input.preco_referencia ?? null,
      ativo: input.ativo,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function alternarAtivoProduto(id: string, ativo: boolean): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("produtos_servicos").update({ ativo }).eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarCategoria(input: { nome: string; grupo: string; entra_no_cac: boolean }): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("categorias_financeiras").insert({
      nome: input.nome.trim(),
      grupo: input.grupo,
      entra_no_cac: input.entra_no_cac,
    });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function criarCanal(nome: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("canais_aquisicao").insert({ nome: nome.trim() });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// --------------------------------------------------------- PROSPECÇÃO AGREGADA
export async function criarRegistroProspeccao(input: {
  empresa_id: string;
  data: string;
  metodo_aquisicao: string;
  fonte?: string;
  canal_id?: string;
  novos_prospectados?: number;
  acoes_instagram?: number;
  acoes_whatsapp?: number;
  acoes_ligacao?: number;
  acoes_outras?: number;
  respostas?: number;
  respostas_positivas?: number;
  // Números do funil (Prospecção Ativa por números agregados):
  reunioes_marcadas?: number;
  reunioes_realizadas?: number;
  no_shows?: number;
  propostas_enviadas?: number;
  // Campos legados (não usados no formulário novo, mantidos para o variante Vision):
  leads_encontrados?: number;
  contatos_feitos?: number;
  qualificados?: number;
  orcamentos_enviados?: number;
  observacao?: string;
}): Promise<ActionResult & { pendencias?: PendenciaResumo[] }> {
  try {
    const erro = validarNumerosProspeccao(input);
    if (erro) return { ok: false, error: erro };
    const c = await client();
    // 'contratos' NÃO é digitado aqui — deriva de vendas/assinaturas reais.
    const { data: reg, error } = await c.from("registros_prospeccao").insert({
      empresa_id: input.empresa_id,
      data: input.data,
      metodo_aquisicao: input.metodo_aquisicao,
      fonte: input.fonte || null,
      canal_id: input.canal_id || null,
      leads_encontrados: input.leads_encontrados ?? 0,
      novos_prospectados: input.novos_prospectados ?? 0,
      contatos_feitos: input.contatos_feitos ?? 0,
      acoes_instagram: input.acoes_instagram ?? 0,
      acoes_whatsapp: input.acoes_whatsapp ?? 0,
      acoes_ligacao: input.acoes_ligacao ?? 0,
      acoes_outras: input.acoes_outras ?? 0,
      respostas: input.respostas ?? 0,
      respostas_positivas: input.respostas_positivas ?? 0,
      reunioes_marcadas: input.reunioes_marcadas ?? 0,
      reunioes_realizadas: input.reunioes_realizadas ?? 0,
      no_shows: input.no_shows ?? 0,
      propostas_enviadas: input.propostas_enviadas ?? 0,
      qualificados: input.qualificados ?? 0,
      orcamentos_enviados: input.orcamentos_enviados ?? 0,
      observacao: input.observacao || null,
    }).select("id").single();
    if (error) throw error;

    // Gera PENDÊNCIAS de identificação (placeholders sem nome) para os eventos
    // que merecem acompanhamento: uma por reunião agendada e uma por proposta.
    // Respostas positivas NÃO viram pendência (§6). Contratos vêm do Comercial.
    const agendadas = Math.min(input.reunioes_marcadas ?? 0, 50);
    const propostas = Math.min(input.propostas_enviadas ?? 0, 50);
    const eventos: string[] = [
      ...Array<string>(agendadas).fill("reuniao_agendada"),
      ...Array<string>(propostas).fill("proposta_enviada"),
    ];
    let pendencias: PendenciaResumo[] = [];
    if (eventos.length > 0) {
      const { data: pend, error: pErr } = await c.from("pendencias_lead").insert(
        eventos.map((tipo) => ({
          empresa_id: input.empresa_id, registro_prospeccao_id: reg.id,
          tipo_evento: tipo, canal: input.fonte || null, data_origem: input.data,
        })),
      ).select("id, tipo_evento, canal, data_origem");
      if (pErr) throw pErr;
      pendencias = (pend as PendenciaResumo[]) ?? [];
    }
    revalidateAll();
    return { ok: true, id: reg.id, pendencias };
  } catch (e) {
    return fail(e);
  }
}

export type PendenciaResumo = { id: string; tipo_evento: string; canal: string | null; data_origem: string };

/**
 * Completa uma pendência de identificação: cria a OPORTUNIDADE real (lead),
 * vinculada à origem (prospecção ativa + canal + registro), e — quando informado
 * — cria a reunião real e/ou registra a proposta. Marca a pendência como
 * resolvida. Cliente global só é vinculado se já existir (criação de cliente
 * acontece no fechamento do contrato, no Comercial).
 */
export async function completarPendenciaLead(pendenciaId: string, input: {
  nome_contato: string;
  telefone_contato?: string;
  instagram?: string;
  servico_interesse_id?: string;
  estagio: string;
  proxima_acao?: string;
  proxima_acao_data?: string;
  observacao?: string;
  cliente_id?: string;          // vínculo manual (dedupe: "vincular ao existente")
  reuniao_data?: string;
  reuniao_horario?: string;
  proposta_valor?: number;
  proposta_data?: string;
  proposta_status?: string;
}): Promise<ActionResult> {
  try {
    if (!input.nome_contato.trim()) return { ok: false, error: "Informe o nome do dentista/clínica." };
    const c = await client();
    const { data: pend, error: pe } = await c.from("pendencias_lead").select("*").eq("id", pendenciaId).single();
    if (pe) throw pe;
    if (!pend) return { ok: false, error: "Pendência não encontrada." };
    if (pend.status !== "pendente") return { ok: false, error: "Esta pendência já foi resolvida." };

    // Cliente: usa vínculo escolhido; senão tenta casar por telefone normalizado.
    let clienteId = input.cliente_id || null;
    if (!clienteId && input.telefone_contato) {
      const norm = input.telefone_contato.replace(/\D/g, "");
      if (norm) {
        const { data: cli } = await c.from("clientes").select("id").eq("telefone_normalizado", norm).eq("tipo_registro", "normal").is("excluido_em", null).limit(1).maybeSingle();
        if (cli) clienteId = cli.id;
      }
    }

    const { data: opp, error: oe } = await c.from("oportunidades").insert({
      empresa_id: pend.empresa_id,
      nome_contato: input.nome_contato.trim(),
      telefone_contato: input.telefone_contato || null,
      instagram: input.instagram || null,
      cliente_id: clienteId,
      servico_interesse_id: input.servico_interesse_id || null,
      metodo_aquisicao: "prospeccao_ativa",
      fonte: pend.canal,
      registro_prospeccao_id: pend.registro_prospeccao_id,
      estagio: input.estagio,
      proxima_acao: input.proxima_acao || null,
      proxima_acao_data: input.proxima_acao_data || null,
      observacao: input.observacao || null,
    }).select("id").single();
    if (oe) throw oe;

    // Reunião real (se a data foi informada na identificação).
    if (input.reuniao_data) {
      const { error: re } = await c.from("reunioes").insert({
        oportunidade_id: opp.id, data: input.reuniao_data, horario: input.reuniao_horario || null,
        status: pend.tipo_evento === "reuniao_realizada" ? "realizada" : "agendada",
      });
      if (re) throw re;
    }
    // Proposta detalhada (se valor informado).
    if (typeof input.proposta_valor === "number") {
      const { error: pre } = await c.from("oportunidades").update({
        proposta_valor: input.proposta_valor, proposta_data: input.proposta_data || pend.data_origem, proposta_status: input.proposta_status || "enviada",
      }).eq("id", opp.id);
      if (pre) throw pre;
    }

    const { error: ue } = await c.from("pendencias_lead").update({
      status: "resolvida", oportunidade_id: opp.id, resolvida_em: new Date().toISOString(), atualizado_em: new Date().toISOString(),
    }).eq("id", pendenciaId);
    if (ue) throw ue;
    revalidateAll();
    return { ok: true, id: opp.id };
  } catch (e) {
    return fail(e);
  }
}

/** Vincula a pendência a uma oportunidade já existente (dedupe) sem criar novo lead. */
export async function vincularPendenciaAExistente(pendenciaId: string, oportunidadeId: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("pendencias_lead").update({
      status: "resolvida", oportunidade_id: oportunidadeId, resolvida_em: new Date().toISOString(), atualizado_em: new Date().toISOString(),
    }).eq("id", pendenciaId);
    if (error) throw error;
    revalidateAll();
    return { ok: true, id: oportunidadeId };
  } catch (e) {
    return fail(e);
  }
}

/** Dispensa a pendência (o usuário decidiu não identificar aquele evento). */
export async function dispensarPendencia(pendenciaId: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("pendencias_lead").update({ status: "dispensada", atualizado_em: new Date().toISOString() }).eq("id", pendenciaId);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/**
 * Validações lógicas simples do funil (§9). Deliberadamente frouxas para não
 * impedir correção de dados históricos — só barram inconsistências óbvias.
 */
function validarNumerosProspeccao(i: {
  novos_prospectados?: number; respostas?: number; respostas_positivas?: number;
  reunioes_marcadas?: number; reunioes_realizadas?: number; no_shows?: number;
}): string | null {
  const abordagens = i.novos_prospectados ?? 0;
  const respostas = i.respostas ?? 0;
  const positivas = i.respostas_positivas ?? 0;
  const agendadas = i.reunioes_marcadas ?? 0;
  const realizadas = i.reunioes_realizadas ?? 0;
  const noShows = i.no_shows ?? 0;
  if (respostas > abordagens) return "As primeiras respostas não podem exceder as abordagens.";
  if (positivas > respostas) return "As respostas positivas não podem exceder as primeiras respostas.";
  if (realizadas > agendadas) return "As reuniões realizadas não podem exceder as reuniões agendadas.";
  if (noShows > agendadas) return "Os no-shows não podem exceder as reuniões agendadas.";
  return null;
}

/** Edita um registro de prospecção existente (§10 — corrigir digitação). */
export async function atualizarRegistroProspeccao(id: string, input: {
  data?: string;
  fonte?: string | null;
  novos_prospectados?: number;
  respostas?: number;
  respostas_positivas?: number;
  reunioes_marcadas?: number;
  reunioes_realizadas?: number;
  no_shows?: number;
  propostas_enviadas?: number;
  contratos?: number;
  observacao?: string;
}): Promise<ActionResult> {
  try {
    const erro = validarNumerosProspeccao(input);
    if (erro) return { ok: false, error: erro };
    const c = await client();
    const patch: Record<string, unknown> = { atualizado_em: new Date().toISOString() };
    if (input.data !== undefined) patch.data = input.data;
    if (input.fonte !== undefined) patch.fonte = input.fonte || null;
    if (input.novos_prospectados !== undefined) patch.novos_prospectados = input.novos_prospectados;
    if (input.respostas !== undefined) patch.respostas = input.respostas;
    if (input.respostas_positivas !== undefined) patch.respostas_positivas = input.respostas_positivas;
    if (input.reunioes_marcadas !== undefined) patch.reunioes_marcadas = input.reunioes_marcadas;
    if (input.reunioes_realizadas !== undefined) patch.reunioes_realizadas = input.reunioes_realizadas;
    if (input.no_shows !== undefined) patch.no_shows = input.no_shows;
    if (input.propostas_enviadas !== undefined) patch.propostas_enviadas = input.propostas_enviadas;
    if (input.contratos !== undefined) patch.contratos = input.contratos;
    if (input.observacao !== undefined) patch.observacao = input.observacao || null;
    const { error } = await c.from("registros_prospeccao").update(patch).eq("id", id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function registrarConviteReuniao(oportunidadeId: string, resultado?: string): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("oportunidades").update({
      convite_reuniao_em: new Date().toISOString(),
      convite_reuniao_resultado: resultado || "aguardando",
      estagio: "convite_reuniao",
    }).eq("id", oportunidadeId);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function atualizarStatusReuniao(reuniaoId: string, status: string, diagnostico?: boolean): Promise<ActionResult> {
  try {
    const c = await client();
    const patch: Record<string, unknown> = { status };
    if (typeof diagnostico === "boolean") patch.diagnostico_realizado = diagnostico;
    const { error } = await c.from("reunioes").update(patch).eq("id", reuniaoId);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function registrarProposta(input: {
  oportunidade_id: string;
  proposta_valor: number;
  proposta_data: string;
  proposta_status: string;
}): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("oportunidades").update({
      proposta_valor: input.proposta_valor,
      proposta_data: input.proposta_data,
      proposta_status: input.proposta_status,
      estagio: "proposta_enviada",
    }).eq("id", input.oportunidade_id);
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function configurarMetaProspeccao(empresaId: string, chave: string, metaDiaria: number): Promise<ActionResult> {
  try {
    const c = await client();
    const { error } = await c.from("metas_prospeccao").upsert({ empresa_id: empresaId, chave, meta_diaria: metaDiaria }, { onConflict: "empresa_id,chave" });
    if (error) throw error;
    revalidateAll();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
