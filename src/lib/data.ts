import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { FormOptions } from "@/components/forms/options";
import type {
  Assinatura,
  Campanha,
  Cartao,
  CategoriaFinanceira,
  CanalAquisicao,
  Cliente,
  CompraCartao,
  Conta,
  ContaSaldo,
  DespesaRecorrente,
  Empresa,
  Lancamento,
  Meta,
  Oportunidade,
  ParcelaSituacao,
  ProdutoServico,
  Reuniao,
  Venda,
} from "@/lib/types";

/**
 * Todas as leituras usam o cliente server-side (service_role) e sao
 * null/empty-safe: se o Supabase local nao estiver acessivel, retornam
 * vazio e a UI mostra empty states -- nunca quebra a pagina.
 */
async function sb() {
  return createServerSupabaseClient();
}

export async function getEmpresas(): Promise<Empresa[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("empresas").select("*").order("nome");
  return (data as Empresa[]) ?? [];
}

export async function getProdutos(opts?: { somenteAtivos?: boolean }): Promise<ProdutoServico[]> {
  const c = await sb();
  if (!c) return [];
  let q = c.from("produtos_servicos").select("*").order("ordem");
  if (opts?.somenteAtivos) q = q.eq("ativo", true);
  const { data } = await q;
  return (data as ProdutoServico[]) ?? [];
}

export async function getCategorias(): Promise<CategoriaFinanceira[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("categorias_financeiras").select("*").order("grupo").order("nome");
  return (data as CategoriaFinanceira[]) ?? [];
}

export async function getCanais(): Promise<CanalAquisicao[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("canais_aquisicao").select("*").eq("ativo", true).order("nome");
  return (data as CanalAquisicao[]) ?? [];
}

export async function getCampanhas(): Promise<Campanha[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("campanhas").select("*").order("data_inicio", { ascending: false });
  return (data as Campanha[]) ?? [];
}

export async function getContas(): Promise<Conta[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("contas").select("*").order("nome");
  return (data as Conta[]) ?? [];
}

export async function getContasSaldos(): Promise<ContaSaldo[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("patrimonio_saldos").select("*");
  return (data as ContaSaldo[]) ?? [];
}

export async function getCartoes(): Promise<Cartao[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("cartoes").select("*").order("nome");
  return (data as Cartao[]) ?? [];
}

export async function getClientes(): Promise<Cliente[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c
    .from("clientes")
    .select("*")
    .is("excluido_em", null)
    .order("nome");
  return (data as Cliente[]) ?? [];
}

export async function getClienteById(id: string): Promise<Cliente | null> {
  const c = await sb();
  if (!c) return null;
  const { data } = await c.from("clientes").select("*").eq("id", id).maybeSingle();
  return (data as Cliente) ?? null;
}

export async function getOportunidades(empresaId?: string): Promise<Oportunidade[]> {
  const c = await sb();
  if (!c) return [];
  let q = c
    .from("oportunidades")
    .select("*, cliente:clientes(nome, telefone), servico:produtos_servicos(nome), canal:canais_aquisicao(nome)")
    .order("criado_em", { ascending: false });
  if (empresaId) q = q.eq("empresa_id", empresaId);
  const { data } = await q;
  return (data as Oportunidade[]) ?? [];
}

export async function getReunioesByOportunidade(oportunidadeId: string): Promise<Reuniao[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("reunioes").select("*").eq("oportunidade_id", oportunidadeId).order("data");
  return (data as Reuniao[]) ?? [];
}

export async function getVendas(empresaId?: string): Promise<Venda[]> {
  const c = await sb();
  if (!c) return [];
  let q = c
    .from("vendas")
    .select("*, cliente:clientes(nome, telefone), produto:produtos_servicos(nome)")
    .eq("status", "ativa")
    .order("data_venda", { ascending: false });
  if (empresaId) q = q.eq("empresa_id", empresaId);
  const { data } = await q;
  return (data as Venda[]) ?? [];
}

export async function getVendaById(id: string): Promise<Venda | null> {
  const c = await sb();
  if (!c) return null;
  const { data } = await c
    .from("vendas")
    .select("*, cliente:clientes(nome, telefone), produto:produtos_servicos(nome)")
    .eq("id", id)
    .maybeSingle();
  return (data as Venda) ?? null;
}

export async function getParcelasSituacao(): Promise<ParcelaSituacao[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("parcelas_situacao").select("*");
  return (data as ParcelaSituacao[]) ?? [];
}

export async function getAssinaturas(empresaId?: string): Promise<Assinatura[]> {
  const c = await sb();
  if (!c) return [];
  let q = c
    .from("assinaturas")
    .select("*, cliente:clientes(nome, telefone), produto:produtos_servicos(nome)")
    .order("criado_em", { ascending: false });
  if (empresaId) q = q.eq("empresa_id", empresaId);
  const { data } = await q;
  return (data as Assinatura[]) ?? [];
}

export async function getAssinaturaById(id: string): Promise<Assinatura | null> {
  const c = await sb();
  if (!c) return null;
  const { data } = await c
    .from("assinaturas")
    .select("*, cliente:clientes(nome, telefone), produto:produtos_servicos(nome)")
    .eq("id", id)
    .maybeSingle();
  return (data as Assinatura) ?? null;
}

export async function getLancamentos(): Promise<Lancamento[]> {
  const c = await sb();
  if (!c) return [];
  // conta_id e conta_destino_id são ambas FK para contas -> desambiguar o embed pela coluna.
  const { data } = await c
    .from("lancamentos_financeiros")
    .select("*, categoria:categorias_financeiras(nome), cliente:clientes(nome), conta:conta_id(nome)")
    .order("data_competencia", { ascending: false });
  return (data as Lancamento[]) ?? [];
}

export async function getComprasCartao(): Promise<CompraCartao[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("compras_cartao").select("*").order("data_compra", { ascending: false });
  return (data as CompraCartao[]) ?? [];
}

export async function getDespesasRecorrentes(): Promise<DespesaRecorrente[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("despesas_recorrentes").select("*").order("proxima_data_vencimento");
  return (data as DespesaRecorrente[]) ?? [];
}

export async function getMetaAtiva(): Promise<Meta | null> {
  const c = await sb();
  if (!c) return null;
  const { data } = await c.from("metas").select("*").eq("ativa", true).maybeSingle();
  return (data as Meta) ?? null;
}

export async function getMetaConfirmado(): Promise<number> {
  const c = await sb();
  if (!c) return 0;
  const { data } = await c.from("meta_10k_progresso").select("valor_confirmado").maybeSingle();
  return (data?.valor_confirmado as number) ?? 0;
}

// ---------------------------------------------------- OPÇÕES PARA FORMULÁRIOS
export async function getFormOptions(): Promise<FormOptions> {
  const [empresas, contas, categorias, canais, produtos, clientes] = await Promise.all([
    getEmpresas(),
    getContas(),
    getCategorias(),
    getCanais(),
    getProdutos(),
    getClientes(),
  ]);
  return {
    empresas,
    contas,
    categorias,
    canais,
    produtos,
    clientes: clientes.map((c) => ({ id: c.id, nome: c.nome })),
  };
}

export async function getValorEmRevisao(): Promise<number> {
  const c = await sb();
  if (!c) return 0;
  const { data } = await c.from("revisoes_migracao").select("valor_afetado").eq("status", "pendente");
  return (data ?? []).reduce((s, r) => s + Number(r.valor_afetado ?? 0), 0);
}

export async function getRegistrosProspeccao(empresaId?: string): Promise<import("@/lib/types").RegistroProspeccao[]> {
  const c = await sb();
  if (!c) return [];
  let q = c.from("registros_prospeccao").select("*").order("data", { ascending: false });
  if (empresaId) q = q.eq("empresa_id", empresaId);
  const { data } = await q;
  return (data as import("@/lib/types").RegistroProspeccao[]) ?? [];
}

export async function getPendenciasLead(empresaId: string): Promise<import("@/lib/types").PendenciaLead[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("pendencias_lead").select("*").eq("empresa_id", empresaId).eq("status", "pendente").order("data_origem", { ascending: false });
  return (data as import("@/lib/types").PendenciaLead[]) ?? [];
}

export async function getMetasProspeccao(empresaId: string): Promise<import("@/lib/types").MetaProspeccao[]> {
  const c = await sb();
  if (!c) return [];
  const { data } = await c.from("metas_prospeccao").select("*").eq("empresa_id", empresaId).eq("ativo", true);
  return (data as import("@/lib/types").MetaProspeccao[]) ?? [];
}
